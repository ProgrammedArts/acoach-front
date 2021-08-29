import { render, screen, waitFor } from '@testing-library/react'
import user from '@testing-library/user-event'
import faker from 'faker/locale/fr'
import { axe } from 'jest-axe'
import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import { NextRouter } from 'next/router'
import { ReactNode } from 'react'
import { v4 as uuid } from 'uuid'
import ACUser from '../../models/ACUser'
import TestApolloProvider from '../../providers/TestApolloProvider'
import UserProvider from '../../providers/UserProvider'
import userBuilder from '../../testUtils/userBuilder'
import Pricing from '../pricing'

const mockUseRouter: Partial<NextRouter> = {
  replace: jest.fn(),
  push: jest.fn(),
}
jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter,
}))

const server = setupServer(
  graphql.query('GetPricing', (_, res, ctx) => {
    return res(
      ctx.data({
        subscriptions: [
          {
            id: 1,
            name: 'Starter',
            description: 'Starter item 1\nStarter item 2',
            price: 5000,
          },
          {
            id: 2,
            name: 'Premium',
            description: 'Premium item 1\nPremium item 2',
            price: 50000,
          },
        ],
      })
    )
  })
)

function mockUserQuery(user?: ACUser) {
  const spy = jest.fn()
  if (user) {
    localStorage.setItem('token', uuid())
  } else {
    localStorage.removeItem('token')
  }
  server.use(
    graphql.query('Me', (req, res, ctx) => {
      spy(req)
      return res(
        ctx.data({
          me: user || null,
        })
      )
    })
  )
  return spy
}

function mockGetPricingError() {
  server.use(graphql.query('GetPricing', (req, res, ctx) => res(ctx.errors([{}]))))
}

function mockCreateCheckout(url?: string) {
  const spy = jest.fn()
  server.use(
    graphql.mutation('Checkout', (req, res, ctx) => {
      spy(req)
      return res(
        ctx.data({
          createCheckout: {
            url: url || faker.internet.url(),
          },
        })
      )
    })
  )
  return spy
}

function mockCreateCheckoutError() {
  const spy = jest.fn()
  server.use(
    graphql.mutation('Checkout', (req, res, ctx) => {
      spy(req)
      return res(ctx.errors([{}]))
    })
  )
  return spy
}

function Providers({ children }: { children?: ReactNode | undefined }) {
  return (
    <TestApolloProvider>
      <UserProvider>{children}</UserProvider>
    </TestApolloProvider>
  )
}

describe('Pricing page', () => {
  const mockReplace = mockUseRouter.replace as jest.Mock

  beforeAll(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
    jest.clearAllMocks()
  })

  afterAll(() => {
    server.close()
  })

  it('Does not redirect the user when visiting the page', async () => {
    mockUserQuery(userBuilder({ traits: 'withActiveSubscription' }))
    render(<Pricing />, { wrapper: Providers })
    mockUserQuery(userBuilder({ traits: 'withSuspendedSubscription' }))
    render(<Pricing />, { wrapper: Providers })
    mockUserQuery(userBuilder({ traits: 'blocked' }))
    render(<Pricing />, { wrapper: Providers })
    mockUserQuery(userBuilder())
    render(<Pricing />, { wrapper: Providers })
    mockUserQuery()
    render(<Pricing />, { wrapper: Providers })

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('Redirects to checkout session for a Starter subscription', async () => {
    const checkoutUrl = faker.internet.url()
    const checkoutSpy = mockCreateCheckout(checkoutUrl)
    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation()
    mockUserQuery(userBuilder())
    const { container } = render(<Pricing />, { wrapper: Providers })

    // check Starter data
    const starter = await screen.findByText('Starter')
    screen.getByText('50.00€')
    screen.getByText('Starter item 1')
    screen.getByText('Starter item 2')

    // create checkout
    user.click(starter)

    await waitFor(() => {
      expect(windowOpenSpy).toHaveBeenCalled()
    })
    expect(windowOpenSpy).toHaveBeenCalledWith(checkoutUrl, '_self')
    expect(checkoutSpy).toHaveBeenCalledTimes(1)
    expect(checkoutSpy.mock.calls[0][0].variables.subscriptionId).toEqual(1)

    windowOpenSpy.mockRestore()

    // accessibility check
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Redirects to checkout session for a Premium subscription', async () => {
    const checkoutUrl = faker.internet.url()
    const checkoutSpy = mockCreateCheckout(checkoutUrl)
    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation()
    mockUserQuery(userBuilder())
    render(<Pricing />, { wrapper: Providers })

    // check Premium data
    const premium = await screen.findByText('Premium')
    screen.getByText('500.00€')
    screen.getByText('Premium item 1')
    screen.getByText('Premium item 2')

    // create checkout
    user.click(premium)

    await waitFor(() => {
      expect(windowOpenSpy).toHaveBeenCalled()
    })
    expect(windowOpenSpy).toHaveBeenCalledWith(checkoutUrl, '_self')
    expect(checkoutSpy).toHaveBeenCalledTimes(1)
    expect(checkoutSpy.mock.calls[0][0].variables.subscriptionId).toEqual(2)

    windowOpenSpy.mockRestore()
  })

  it('Shows an error message if the subscription fetch failed', async () => {
    mockUserQuery(userBuilder())
    mockGetPricingError()
    render(<Pricing />, { wrapper: Providers })

    const errorMessage = await screen.findByText(/une erreur serveur est survenue/i)
    expect(errorMessage).toBeInTheDocument()
  })

  it('Shows an error message if the checkout creation failed', async () => {
    const checkoutSpy = mockCreateCheckoutError()
    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation()
    mockUserQuery(userBuilder())
    render(<Pricing />, { wrapper: Providers })

    const premium = await screen.findByText('Premium')
    user.click(premium)

    const errorMessage = await screen.findByText(/une erreur serveur est survenue/i)
    expect(errorMessage).toBeInTheDocument()
    expect(checkoutSpy).toHaveBeenCalledTimes(1)
    expect(checkoutSpy.mock.calls[0][0].variables.subscriptionId).toEqual(2)
    expect(windowOpenSpy).not.toHaveBeenCalled()

    windowOpenSpy.mockRestore()
  })

  it('Redirects to login if the user attempts to purchase a subscription as an unauthenticated user', async () => {
    const checkoutSpy = mockCreateCheckoutError()
    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation()
    const mockPush = mockUseRouter.push
    mockUserQuery()
    render(<Pricing />, { wrapper: Providers })

    const premium = await screen.findByText('Premium')
    user.click(premium)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled()
    })
    expect(mockPush).toHaveBeenCalledWith('/login')

    expect(checkoutSpy).not.toHaveBeenCalled()
    expect(windowOpenSpy).not.toHaveBeenCalled()

    windowOpenSpy.mockRestore()
  })

  it('Shows an error message if the user attempts to purchase a subscription as a blocked user', async () => {
    const checkoutSpy = mockCreateCheckoutError()
    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation()
    mockUserQuery(userBuilder({ traits: 'blocked' }))
    render(<Pricing />, { wrapper: Providers })

    const premium = await screen.findByText('Premium')
    user.click(premium)

    const errorMessage = await screen.findByText(
      /vous n'êtes pas autorisé à prendre un abonnement. veuillez nous contacter pour plus d'informations/i
    )
    expect(errorMessage).toBeInTheDocument()
    expect(checkoutSpy).not.toHaveBeenCalled()
    expect(windowOpenSpy).not.toHaveBeenCalled()

    windowOpenSpy.mockRestore()
  })

  it('Shows an error message if the user attempts to purchase a subscription as a suspended user', async () => {
    const checkoutSpy = mockCreateCheckoutError()
    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation()
    mockUserQuery(userBuilder({ traits: 'withSuspendedSubscription' }))
    render(<Pricing />, { wrapper: Providers })

    const premium = await screen.findByText('Premium')
    user.click(premium)

    const errorMessage = await screen.findByText(
      /vous n'êtes pas autorisé à prendre un abonnement. veuillez nous contacter pour plus d'informations/i
    )
    expect(errorMessage).toBeInTheDocument()
    expect(checkoutSpy).not.toHaveBeenCalled()
    expect(windowOpenSpy).not.toHaveBeenCalled()

    windowOpenSpy.mockRestore()
  })

  it('Shows an error message if the user attempts to purchase a subscription as a subscribed user', async () => {
    const checkoutSpy = mockCreateCheckoutError()
    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation()
    mockUserQuery(userBuilder({ traits: 'withActiveSubscription' }))
    render(<Pricing />, { wrapper: Providers })

    const premium = await screen.findByText('Premium')
    user.click(premium)

    const errorMessage = await screen.findByText(/vous êtes déjà abonné/i)
    expect(errorMessage).toBeInTheDocument()
    expect(checkoutSpy).not.toHaveBeenCalled()
    expect(windowOpenSpy).not.toHaveBeenCalled()

    windowOpenSpy.mockRestore()
  })
})
