import { findByText, render, screen, waitFor } from '@testing-library/react'
import user from '@testing-library/user-event'
import faker from 'faker/locale/fr'
import { axe } from 'jest-axe'
import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import { ReactNode } from 'react'
import { v4 as uuid } from 'uuid'
import ACUser from '../../models/ACUser'
import TestApolloProvider from '../../providers/TestApolloProvider'
import UserProvider from '../../providers/UserProvider'
import userBuilder from '../../testUtils/userBuilder'
import Login from '../login'

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

function mockLogin(jwt?: string) {
  const spy = jest.fn()
  server.use(
    graphql.mutation('Login', (req, res, ctx) => {
      spy(req)
      return res(
        ctx.data({
          login: {
            jwt: jwt || uuid(),
          },
        })
      )
    })
  )
  return spy
}

function mockEmailRequiresConfirmation() {
  const spy = jest.fn()
  server.use(
    graphql.mutation('Login', (req, res, ctx) => {
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
                          id: 'Auth.form.error.confirmed',
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

function mockWrongCredentials() {
  const spy = jest.fn()
  server.use(
    graphql.mutation('Login', (req, res, ctx) => {
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
                          id: 'Auth.form.error.invalid',
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

function mockServerError() {
  const spy = jest.fn()
  server.use(
    graphql.mutation('Login', (req, res, ctx) => {
      spy(req)
      return res(ctx.status(200), ctx.errors([{}]))
    })
  )
  return spy
}

function mockSendEmailConfirmation() {
  const spy = jest.fn()
  server.use(
    graphql.mutation('SendEmailConfirmation', (req, res, ctx) => {
      spy(req)
      return res(
        ctx.data({
          sendEmailConfirmation: {
            email: req.variables.email,
            sent: true,
          },
        })
      )
    })
  )
  return spy
}

function mockSendEmailConfirmationError() {
  const spy = jest.fn()
  server.use(
    graphql.mutation('SendEmailConfirmation', (req, res, ctx) => {
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

describe('Login page', () => {
  const mockReplace = mockUseRouter.replace

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

  it('Logs user in and redirects', async () => {
    const email = faker.internet.email()
    const password = 'AV4l1dP4ssw0rd'
    const jwt = uuid()
    const meQuery = mockUserQuery()
    const loginSpy = mockLogin(jwt)
    const { container } = render(<Login />, { wrapper: Providers })

    await waitFor(() => {
      expect(meQuery).toHaveBeenCalled()
    })

    const emailInput = screen.getByPlaceholderText(/adresse e-mail/i)
    user.type(emailInput, email)
    const passwordInput = screen.getByPlaceholderText(/mot de passe/i)
    user.type(passwordInput, password)
    const submitButton = screen.getByRole('button')

    expect(mockReplace).not.toHaveBeenCalled()

    user.click(submitButton)

    // user is logged in
    const loggedMeQuery = mockUserQuery(
      userBuilder({
        overrides: {
          email,
        },
      })
    )
    await waitFor(() => {
      expect(loggedMeQuery).toHaveBeenCalled()
    })

    expect(loginSpy).toHaveBeenCalledTimes(1)
    expect(loginSpy.mock.calls[0][0].variables.email).toEqual(email)
    expect(loginSpy.mock.calls[0][0].variables.password).toEqual(password)
    expect(mockReplace).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith('/pricing')
    expect(localStorage.getItem('token')).toEqual(jwt)

    // accessibility check
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Shows an error message if credentials are wrong', async () => {
    const email = faker.internet.email()
    const password = 'AV4l1dP4ssw0rd'
    const meQuery = mockUserQuery()
    const loginSpy = mockWrongCredentials()
    const { container } = render(<Login />, { wrapper: Providers })

    await waitFor(() => {
      expect(meQuery).toHaveBeenCalled()
    })

    const emailInput = screen.getByPlaceholderText(/adresse e-mail/i)
    user.type(emailInput, email)
    const passwordInput = screen.getByPlaceholderText(/mot de passe/i)
    user.type(passwordInput, password)
    const submitButton = screen.getByRole('button')

    expect(mockReplace).not.toHaveBeenCalled()

    user.click(submitButton)

    const errorMessage = await screen.findByText(/mot de passe n'est pas valide/i)

    expect(loginSpy).toHaveBeenCalledTimes(1)
    expect(loginSpy.mock.calls[0][0].variables.email).toEqual(email)
    expect(loginSpy.mock.calls[0][0].variables.password).toEqual(password)
    expect(errorMessage).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()

    // accessibility check
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Shows a generic error message from the server', async () => {
    const email = faker.internet.email()
    const password = 'AV4l1dP4ssw0rd'
    const meQuery = mockUserQuery()
    const loginSpy = mockServerError()
    const { container } = render(<Login />, { wrapper: Providers })

    await waitFor(() => {
      expect(meQuery).toHaveBeenCalled()
    })

    const emailInput = screen.getByPlaceholderText(/adresse e-mail/i)
    user.type(emailInput, email)
    const passwordInput = screen.getByPlaceholderText(/mot de passe/i)
    user.type(passwordInput, password)
    const submitButton = screen.getByRole('button')

    expect(mockReplace).not.toHaveBeenCalled()

    user.click(submitButton)

    const errorMessage = await screen.findByText(/une erreur serveur est survenue/i)

    expect(loginSpy).toHaveBeenCalledTimes(1)
    expect(loginSpy.mock.calls[0][0].variables.email).toEqual(email)
    expect(loginSpy.mock.calls[0][0].variables.password).toEqual(password)
    expect(errorMessage).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()

    // accessibility check
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Redirects to pricing when browsing the page as authenticated user', async () => {
    const user = userBuilder()
    const loggedMeQuery = mockUserQuery(user)
    const loginSpy = mockLogin()
    render(<Login />, { wrapper: Providers })

    await waitFor(() => {
      expect(loggedMeQuery).toHaveBeenCalled()
    })

    expect(loginSpy).not.toHaveBeenCalled()
    expect(mockReplace).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith('/pricing')
  })

  it('Redirects to home when browsing the page as blocked user', async () => {
    const user = userBuilder({ traits: 'blocked' })
    const loggedMeQuery = mockUserQuery(user)
    const loginSpy = mockLogin()
    render(<Login />, { wrapper: Providers })

    await waitFor(() => {
      expect(loggedMeQuery).toHaveBeenCalled()
    })

    expect(loginSpy).not.toHaveBeenCalled()
    expect(mockReplace).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith('/?blocked=true')
  })

  it('Redirects to home when browsing the page as suspended user', async () => {
    const user = userBuilder({ traits: 'withSuspendedSubscription' })
    const loggedMeQuery = mockUserQuery(user)
    const loginSpy = mockLogin()
    render(<Login />, { wrapper: Providers })

    await waitFor(() => {
      expect(loggedMeQuery).toHaveBeenCalled()
    })

    expect(loginSpy).not.toHaveBeenCalled()
    expect(mockReplace).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith('/?suspended=true')
  })

  it('Redirects to home when browsing the page as subscribed user', async () => {
    const user = userBuilder({ traits: 'withActiveSubscription' })
    const loggedMeQuery = mockUserQuery(user)
    const loginSpy = mockLogin()
    render(<Login />, { wrapper: Providers })

    await waitFor(() => {
      expect(loggedMeQuery).toHaveBeenCalled()
    })

    expect(loginSpy).not.toHaveBeenCalled()
    expect(mockReplace).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith('/')
  })

  it('Sends an email confirmation if a user has not yet confirmed his account', async () => {
    const email = faker.internet.email()
    const password = 'AV4l1dP4ssw0rd'
    const meQuery = mockUserQuery()
    const loginSpy = mockEmailRequiresConfirmation()
    const sendEmailConfirmationSpy = mockSendEmailConfirmation()
    const { container } = render(<Login />, { wrapper: Providers })

    await waitFor(() => {
      expect(meQuery).toHaveBeenCalled()
    })

    // attempt login
    const emailInput = screen.getByPlaceholderText(/adresse e-mail/i)
    user.type(emailInput, email)
    const passwordInput = screen.getByPlaceholderText(/mot de passe/i)
    user.type(passwordInput, password)
    const submitButton = screen.getByRole('button')

    user.click(submitButton)

    const emailConfirmationMessage = await screen.findByText(/confirmer votre adresse e-mail/i)
    expect(emailConfirmationMessage).toBeInTheDocument()

    expect(loginSpy).toHaveBeenCalledTimes(1)
    expect(loginSpy.mock.calls[0][0].variables.email).toEqual(email)
    expect(loginSpy.mock.calls[0][0].variables.password).toEqual(password)

    // send email confirmation
    const sendEmailConfirmationLink = await screen.getByText(/cliquant ici/i)
    user.click(sendEmailConfirmationLink)

    const emailSentMessage = await screen.findByText(/vous allez recevoir/i)
    expect(sendEmailConfirmationSpy).toHaveBeenCalledTimes(1)
    expect(sendEmailConfirmationSpy.mock.calls[0][0].variables.email).toEqual(email)
    expect(emailSentMessage).toBeInTheDocument()
    expect(emailConfirmationMessage).not.toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()

    // accessibility check
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Shows error message if the confirmation email sending has failed', async () => {
    const email = faker.internet.email()
    const password = 'AV4l1dP4ssw0rd'
    const meQuery = mockUserQuery()
    const loginSpy = mockEmailRequiresConfirmation()
    const sendEmailConfirmationSpy = mockSendEmailConfirmationError()
    const { container } = render(<Login />, { wrapper: Providers })

    await waitFor(() => {
      expect(meQuery).toHaveBeenCalled()
    })

    // attempt login
    const emailInput = screen.getByPlaceholderText(/adresse e-mail/i)
    user.type(emailInput, email)
    const passwordInput = screen.getByPlaceholderText(/mot de passe/i)
    user.type(passwordInput, password)
    const submitButton = screen.getByRole('button')

    user.click(submitButton)

    const emailConfirmationMessage = await screen.findByText(/confirmer votre adresse e-mail/i)
    expect(emailConfirmationMessage).toBeInTheDocument()

    expect(loginSpy).toHaveBeenCalledTimes(1)
    expect(loginSpy.mock.calls[0][0].variables.email).toEqual(email)
    expect(loginSpy.mock.calls[0][0].variables.password).toEqual(password)

    // send email confirmation
    const sendEmailConfirmationLink = await screen.getByText(/cliquant ici/i)
    user.click(sendEmailConfirmationLink)

    const errorMessage = await screen.findByText(/une erreur serveur est survenue/i)
    expect(sendEmailConfirmationSpy).toHaveBeenCalledTimes(1)
    expect(sendEmailConfirmationSpy.mock.calls[0][0].variables.email).toEqual(email)
    expect(errorMessage).toBeInTheDocument()
    expect(emailConfirmationMessage).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()

    // accessibility check
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Clears the error if the email has been successfully sent afterwards', async () => {
    const email = faker.internet.email()
    const password = 'AV4l1dP4ssw0rd'
    const meQuery = mockUserQuery()
    const loginSpy = mockEmailRequiresConfirmation()
    const sendEmailConfirmationErrorSpy = mockSendEmailConfirmationError()
    render(<Login />, { wrapper: Providers })

    await waitFor(() => {
      expect(meQuery).toHaveBeenCalled()
    })

    // attempt login
    const emailInput = screen.getByPlaceholderText(/adresse e-mail/i)
    user.type(emailInput, email)
    const passwordInput = screen.getByPlaceholderText(/mot de passe/i)
    user.type(passwordInput, password)
    const submitButton = screen.getByRole('button')

    user.click(submitButton)

    const emailConfirmationMessage = await screen.findByText(/confirmer votre adresse e-mail/i)
    expect(emailConfirmationMessage).toBeInTheDocument()

    expect(loginSpy).toHaveBeenCalledTimes(1)
    expect(loginSpy.mock.calls[0][0].variables.email).toEqual(email)
    expect(loginSpy.mock.calls[0][0].variables.password).toEqual(password)

    // send email confirmation
    const sendEmailConfirmationLink = await screen.getByText(/cliquant ici/i)
    user.click(sendEmailConfirmationLink)

    const errorMessage = await screen.findByText(/une erreur serveur est survenue/i)
    expect(sendEmailConfirmationErrorSpy).toHaveBeenCalledTimes(1)
    expect(sendEmailConfirmationErrorSpy.mock.calls[0][0].variables.email).toEqual(email)
    expect(errorMessage).toBeInTheDocument()
    expect(emailConfirmationMessage).toBeInTheDocument()

    // 2nd attempt
    const sendEmailConfirmationSpy = mockSendEmailConfirmation()
    user.click(sendEmailConfirmationLink)

    const emailSentMessage = await screen.findByText(/vous allez recevoir/i)
    expect(sendEmailConfirmationSpy).toHaveBeenCalledTimes(1)
    expect(sendEmailConfirmationSpy.mock.calls[0][0].variables.email).toEqual(email)
    expect(emailSentMessage).toBeInTheDocument()
    expect(emailConfirmationMessage).not.toBeInTheDocument()
    expect(errorMessage).not.toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  describe('Form validation', () => {
    it('Shows an error if the email is not valid', async () => {
      const email = faker.internet.url()
      const password = 'AV4l1dP4ssw0rd'
      const meQuery = mockUserQuery()
      const loginSpy = mockLogin()
      render(<Login />, { wrapper: Providers })

      await waitFor(() => {
        expect(meQuery).toHaveBeenCalled()
      })

      const emailInput = screen.getByPlaceholderText(/adresse e-mail/i)
      user.type(emailInput, email)
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i)
      user.type(passwordInput, password)
      const submitButton = screen.getByRole('button')
      user.click(submitButton)

      const errorMessage = await screen.findByText(/veuillez entrer une adresse e-mail valide/i)
      expect(errorMessage).toBeInTheDocument()
      expect(loginSpy).not.toHaveBeenCalled()
    })

    it('Shows an error if the password is not valid', async () => {
      const email = faker.internet.email()
      const password = 'ANotSoValidPassword'
      const meQuery = mockUserQuery()
      const loginSpy = mockLogin()
      render(<Login />, { wrapper: Providers })

      await waitFor(() => {
        expect(meQuery).toHaveBeenCalled()
      })

      const emailInput = screen.getByPlaceholderText(/adresse e-mail/i)
      user.type(emailInput, email)
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i)
      user.type(passwordInput, password)
      const submitButton = screen.getByRole('button')
      user.click(submitButton)

      const errorMessage = await screen.findByText(/veuillez entrer un mot de passe valide/i)
      expect(errorMessage).toBeInTheDocument()
      expect(loginSpy).not.toHaveBeenCalled()
    })
  })
})
