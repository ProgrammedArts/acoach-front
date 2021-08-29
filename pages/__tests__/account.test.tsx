import { render, screen, waitFor } from '@testing-library/react'
import user from '@testing-library/user-event'
import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import { NextRouter } from 'next/router'
import { ReactNode } from 'react'
import { v4 as uuid } from 'uuid'
import ACUser from '../../models/ACUser'
import TestApolloProvider from '../../providers/TestApolloProvider'
import UserProvider from '../../providers/UserProvider'
import userBuilder from '../../testUtils/userBuilder'
import Account from '../account'
import faker from 'faker/locale/fr'
import { axe } from 'jest-axe'

const mockUseRouter: Partial<NextRouter> = {
  replace: jest.fn(),
}
jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter,
}))

const server = setupServer()

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

function mockGetCustomerPortal(customerPortalUrl?: string) {
  const spy = jest.fn()
  server.use(
    graphql.query('GetCustomerPortal', (req, res, ctx) => {
      spy(req)
      if (customerPortalUrl) {
        return res(ctx.data({ getCustomerPortal: { url: customerPortalUrl } }))
      } else {
        return res(ctx.status(200), ctx.errors([{}]))
      }
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

describe('Account page', () => {
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

  it('Redirects to login if user is not authenticated', async () => {
    mockUserQuery()
    mockGetCustomerPortal()
    render(<Account />, { wrapper: Providers })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled()
    })

    expect(mockReplace).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('Shows an account menu without customer portal', async () => {
    const userQuery = mockUserQuery(userBuilder())
    mockGetCustomerPortal()
    const { container } = render(<Account />, { wrapper: Providers })

    await waitFor(() => {
      expect(userQuery).toHaveBeenCalled()
    })

    const passwordModificationLink = screen.getByText(/modifier mon mot de passe/i)
    const customerPortalLink = screen.queryByText(/gestion et annulation de l'abonnement/i)
    const logoutLink = screen.getByText(/me déconnecter/i)

    expect(passwordModificationLink).toBeInTheDocument()
    expect(customerPortalLink).not.toBeInTheDocument()
    expect(logoutLink).toBeInTheDocument()
    expect(passwordModificationLink).toHaveAttribute('href', '/account/password')

    // accessibility test
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Shows an account menu with customer portal', async () => {
    const customerPortalUrl = faker.internet.url()
    mockUserQuery(userBuilder())
    mockGetCustomerPortal(customerPortalUrl)
    const { container } = render(<Account />, { wrapper: Providers })

    const passwordModificationLink = screen.getByText(/modifier mon mot de passe/i)
    const customerPortalLink = await screen.findByText(/gestion et annulation de l'abonnement/i)
    const logoutLink = screen.getByText(/me déconnecter/i)

    expect(passwordModificationLink).toBeInTheDocument()
    expect(customerPortalLink).toBeInTheDocument()
    expect(logoutLink).toBeInTheDocument()
    expect(customerPortalLink).toHaveAttribute('href', customerPortalUrl)
    expect(passwordModificationLink).toHaveAttribute('href', '/account/password')

    // accessibility test
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Logout button logs the user out and redirects to home', async () => {
    const userQuery = mockUserQuery(userBuilder())
    mockGetCustomerPortal()
    render(<Account />, { wrapper: Providers })

    await waitFor(() => {
      expect(userQuery).toHaveBeenCalled()
    })

    // should have jwt token
    const jwt = localStorage.getItem('token')
    expect(jwt).toBeDefined()

    // attempt logout
    const logoutLink = screen.getByText(/me déconnecter/i)
    user.click(logoutLink)

    // user is now logged out
    const loggedOutUserQuery = mockUserQuery()
    await waitFor(() => {
      expect(loggedOutUserQuery).toHaveBeenCalled()
    })

    expect(localStorage.getItem('token')).toBeNull()
    expect(mockReplace).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith('/')
  })
})
