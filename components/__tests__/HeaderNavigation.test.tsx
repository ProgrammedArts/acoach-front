import { render, screen, waitFor } from '@testing-library/react'
import faker from 'faker'
import { axe } from 'jest-axe'
import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import React, { ReactNode } from 'react'
import { v4 as uuid } from 'uuid'
import ACUser from '../../models/ACUser'
import TestApolloProvider from '../../providers/TestApolloProvider'
import UserProvider from '../../providers/UserProvider'
import userBuilder from '../../testUtils/userBuilder'
import HeaderNavigation from '../HeaderNavigation'

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

describe('HeaderNavigation component', () => {
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

  it('Shows the header navigation with a signup and a login button', async () => {
    const userQuerySpy = mockUserQuery()
    mockGetCustomerPortal()
    const { container } = render(<HeaderNavigation />, { wrapper: Providers })

    await waitFor(() => {
      expect(userQuerySpy).toHaveBeenCalled()
    })

    const signUpButton = screen.getByText(/inscription/i)
    const loginButton = screen.getByText(/connexion/i)
    const restrictionMessage = screen.queryByText(/l'accès à votre abonnement a été restreint/i)

    expect(signUpButton).toHaveAttribute('href', '/signup')
    expect(loginButton).toHaveAttribute('href', '/login')
    expect(restrictionMessage).not.toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('Shows the header navigation with an account settings button', async () => {
    const customerPortalUrl = faker.internet.url()
    const userAccount = userBuilder()
    const userQuerySpy = mockUserQuery(userAccount)
    mockGetCustomerPortal(customerPortalUrl)
    const { container } = render(<HeaderNavigation />, { wrapper: Providers })

    await waitFor(() => {
      expect(userQuerySpy).toHaveBeenCalled()
    })

    const signUpButton = screen.queryByText(/inscription/i)
    const loginButton = screen.queryByText(/connexion/i)
    const restrictionMessage = screen.queryByText(/l'accès à votre abonnement a été restreint/i)
    const accountSettingsButton = screen.getByText(userAccount.realname)

    expect(signUpButton).not.toBeInTheDocument()
    expect(loginButton).not.toBeInTheDocument()
    expect(restrictionMessage).not.toBeInTheDocument()
    expect(accountSettingsButton).toHaveAttribute('href', '/account')

    expect(await axe(container)).toHaveNoViolations()
  })

  it('Shows the header navigation with a warning about the restricted subscription', async () => {
    const userAccount = userBuilder({ traits: 'withSuspendedSubscription' })
    const userQuerySpy = mockUserQuery(userAccount)
    mockGetCustomerPortal()
    const { container } = render(<HeaderNavigation />, { wrapper: Providers })

    await waitFor(() => {
      expect(userQuerySpy).toHaveBeenCalled()
    })

    const signUpButton = screen.queryByText(/inscription/i)
    const loginButton = screen.queryByText(/connexion/i)
    const restrictionMessage = screen.getByText(/l'accès à votre abonnement a été restreint/i)
    const customerPortalMessage = screen.queryByText(/cliquez ici pour plus de détails/i)
    const accountSettingsButton = screen.getByText(userAccount.realname)

    expect(signUpButton).not.toBeInTheDocument()
    expect(loginButton).not.toBeInTheDocument()
    expect(restrictionMessage).toBeInTheDocument()
    expect(customerPortalMessage).not.toBeInTheDocument()
    expect(accountSettingsButton).toHaveAttribute('href', '/account')

    expect(await axe(container)).toHaveNoViolations()
  })

  it('Shows the header navigation with a link to the customer portal', async () => {
    const customerPortalUrl = faker.internet.url()
    const userAccount = userBuilder({ traits: 'withSuspendedSubscription' })
    const userQuerySpy = mockUserQuery(userAccount)
    mockGetCustomerPortal(customerPortalUrl)
    const { container } = render(<HeaderNavigation />, { wrapper: Providers })

    await waitFor(() => {
      expect(userQuerySpy).toHaveBeenCalled()
    })

    const signUpButton = screen.queryByText(/inscription/i)
    const loginButton = screen.queryByText(/connexion/i)
    const restrictionMessage = screen.getByText(/l'accès à votre abonnement a été restreint/i)
    const customerPortalMessage = screen.queryByText(/cliquez ici/i)
    const accountSettingsButton = screen.getByText(userAccount.realname)

    expect(signUpButton).not.toBeInTheDocument()
    expect(loginButton).not.toBeInTheDocument()
    expect(restrictionMessage).toBeInTheDocument()
    expect(customerPortalMessage).toHaveAttribute('href', customerPortalUrl)
    expect(accountSettingsButton).toHaveAttribute('href', '/account')

    expect(await axe(container)).toHaveNoViolations()
  })
})
