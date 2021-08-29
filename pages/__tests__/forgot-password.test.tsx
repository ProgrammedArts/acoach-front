import { render, screen, waitFor } from '@testing-library/react'
import user from '@testing-library/user-event'
import faker from 'faker/locale/fr'
import { axe } from 'jest-axe'
import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import React, { ReactNode } from 'react'
import { v4 as uuid } from 'uuid'
import ACUser from '../../models/ACUser'
import TestApolloProvider from '../../providers/TestApolloProvider'
import UserProvider from '../../providers/UserProvider'
import userBuilder from '../../testUtils/userBuilder'
import ForgotPassword from '../forgot-password'

const mockUseRouter = {
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

function mockResetPassword() {
  const spy = jest.fn()
  server.use(
    graphql.mutation('ForgotPassword', (req, res, ctx) => {
      spy(req)
      return res(
        ctx.data({
          forgotPassword: {
            ok: true,
          },
        })
      )
    })
  )
  return spy
}

function mockEmailNotFound() {
  const spy = jest.fn()
  server.use(
    graphql.mutation('ForgotPassword', (req, res, ctx) => {
      spy(req)
      return res(
        ctx.status(200),
        ctx.errors([
          {
            extensions: {
              exception: {
                data: {
                  message: [
                    {
                      messages: [
                        {
                          id: 'Auth.form.error.user.not-exist',
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        ])
      )
    })
  )
  return spy
}

function mockResetPasswordError() {
  const spy = jest.fn()
  server.use(
    graphql.mutation('ForgotPassword', (req, res, ctx) => {
      spy(req)
      return res(ctx.status(200), ctx.errors([{}]))
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

describe('Forgot password page', () => {
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

  it('Sends reset password email for a valid email', async () => {
    const email = faker.internet.email()
    const meQuerySpy = mockUserQuery()
    const resetSpy = mockResetPassword()
    const { container } = render(<ForgotPassword />, { wrapper: Providers })

    await waitFor(() => {
      expect(meQuerySpy).toHaveBeenCalled()
    })

    const emailInput = screen.getByPlaceholderText(/adresse e-mail/i)
    user.type(emailInput, email)
    const submitButton = screen.getByRole('button')
    user.click(submitButton)

    const successMessage = await screen.findByText(/veuillez cliquer sur le lien/i)
    expect(successMessage).toBeInTheDocument()
    expect(resetSpy).toHaveBeenCalledTimes(1)
    expect(resetSpy.mock.calls[0][0].variables.email).toEqual(email)

    // accessibility check
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Shows an error message if the email is not valid', async () => {
    const notAnEmail = faker.internet.url()
    const meQuerySpy = mockUserQuery()
    const resetSpy = mockResetPassword()
    const { container } = render(<ForgotPassword />, { wrapper: Providers })

    await waitFor(() => {
      expect(meQuerySpy).toHaveBeenCalled()
    })

    const emailInput = screen.getByPlaceholderText(/adresse e-mail/i)
    user.type(emailInput, notAnEmail)
    const submitButton = screen.getByRole('button')
    user.click(submitButton)

    const errorMessage = await screen.findByText(/veuillez entrer une adresse e-mail valide/i)
    expect(errorMessage).toBeInTheDocument()
    expect(resetSpy).not.toHaveBeenCalled()

    // accessibility check
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Clears the error when successfully sending the reset password request', async () => {
    const email = faker.internet.email()
    const notAnEmail = faker.internet.url()
    const meQuerySpy = mockUserQuery()
    const resetSpy = mockResetPassword()
    render(<ForgotPassword />, { wrapper: Providers })

    await waitFor(() => {
      expect(meQuerySpy).toHaveBeenCalled()
    })

    // get error message
    const emailInput = screen.getByPlaceholderText(/adresse e-mail/i)
    user.type(emailInput, notAnEmail)
    const submitButton = screen.getByRole('button')
    user.click(submitButton)

    const errorMessage = await screen.findByText(/veuillez entrer une adresse e-mail valide/i)
    expect(errorMessage).toBeInTheDocument()
    expect(resetSpy).not.toHaveBeenCalled()

    // get success message
    user.clear(emailInput)
    user.type(emailInput, email)
    user.click(submitButton)

    const successMessage = await screen.findByText(/veuillez cliquer sur le lien/i)
    expect(successMessage).toBeInTheDocument()
    expect(errorMessage).not.toBeInTheDocument()
    expect(resetSpy).toHaveBeenCalledTimes(1)
    expect(resetSpy.mock.calls[0][0].variables.email).toEqual(email)
  })

  it('Shows the success message if the email does not exist (safer method required)', async () => {
    const email = faker.internet.email()
    const meQuerySpy = mockUserQuery()
    const resetSpy = mockEmailNotFound()
    render(<ForgotPassword />, { wrapper: Providers })

    await waitFor(() => {
      expect(meQuerySpy).toHaveBeenCalled()
    })

    // get error message
    const emailInput = screen.getByPlaceholderText(/adresse e-mail/i)
    user.type(emailInput, email)
    const submitButton = screen.getByRole('button')
    user.click(submitButton)

    const successMessage = await screen.findByText(/veuillez cliquer sur le lien/i)
    expect(successMessage).toBeInTheDocument()
    expect(resetSpy).toHaveBeenCalledTimes(1)
    expect(resetSpy.mock.calls[0][0].variables.email).toEqual(email)
  })

  it('Shows generic error message if error occurs', async () => {
    const email = faker.internet.email()
    const meQuerySpy = mockUserQuery()
    const resetSpy = mockResetPasswordError()
    render(<ForgotPassword />, { wrapper: Providers })

    await waitFor(() => {
      expect(meQuerySpy).toHaveBeenCalled()
    })

    // get error message
    const emailInput = screen.getByPlaceholderText(/adresse e-mail/i)
    user.type(emailInput, email)
    const submitButton = screen.getByRole('button')
    user.click(submitButton)

    const errorMessage = await screen.findByText(/une erreur serveur est survenue/i)
    expect(errorMessage).toBeInTheDocument()
    expect(resetSpy).toHaveBeenCalledTimes(1)
    expect(resetSpy.mock.calls[0][0].variables.email).toEqual(email)
  })

  describe('User redirection', () => {
    const mockReplace = mockUseRouter.replace

    it('Does not redirect user if user is unauthenticated', async () => {
      const meQuerySpy = mockUserQuery()

      render(<ForgotPassword />, { wrapper: Providers })

      await waitFor(() => {
        expect(meQuerySpy).toHaveBeenCalled()
      })

      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('Redirects to pricing for authenticated users without active subscription', async () => {
      const meQuerySpy = mockUserQuery(userBuilder())

      render(<ForgotPassword />, { wrapper: Providers })

      await waitFor(() => {
        expect(meQuerySpy).toHaveBeenCalled()
      })

      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith('/pricing')
    })

    it('Redirects to pricing for authenticated users with an expired subscription', async () => {
      const meQuerySpy = mockUserQuery(userBuilder({ traits: 'withExpiredSubscription' }))

      render(<ForgotPassword />, { wrapper: Providers })

      await waitFor(() => {
        expect(meQuerySpy).toHaveBeenCalled()
      })

      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith('/pricing')
    })

    it('Redirects to home for authenticated users with active subscription', async () => {
      const meQuerySpy = mockUserQuery(userBuilder({ traits: 'withActiveSubscription' }))

      render(<ForgotPassword />, { wrapper: Providers })

      await waitFor(() => {
        expect(meQuerySpy).toHaveBeenCalled()
      })

      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith('/')
    })

    it('Redirects to home if user is blocked', async () => {
      const meQuerySpy = mockUserQuery(userBuilder({ traits: 'blocked' }))

      render(<ForgotPassword />, { wrapper: Providers })

      await waitFor(() => {
        expect(meQuerySpy).toHaveBeenCalled()
      })

      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith('/')
    })

    it('Redirects to home if user has its subscription suspended', async () => {
      const meQuerySpy = mockUserQuery(userBuilder({ traits: 'withSuspendedSubscription' }))

      render(<ForgotPassword />, { wrapper: Providers })

      await waitFor(() => {
        expect(meQuerySpy).toHaveBeenCalled()
      })

      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith('/')
    })
  })
})
