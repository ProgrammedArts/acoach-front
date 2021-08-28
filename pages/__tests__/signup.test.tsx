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
import SignUp from '../signup'

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

function mockSignUp() {
  const spy = jest.fn()
  server.use(
    graphql.mutation('SignUp', (req, res, ctx) => {
      spy(req)
      return res(
        ctx.data({
          // there's no jwt when using signup with email
          registerWithRealName: {
            jwt: null,
          },
        })
      )
    })
  )
  return spy
}

function mockSignUpError() {
  const spy = jest.fn()
  server.use(
    graphql.mutation('SignUp', (req, res, ctx) => {
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

describe('Signup page', () => {
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

  it('Redirects user to the homepage if user is authenticated', async () => {
    // authenticated
    mockUserQuery(userBuilder())
    render(<SignUp />, { wrapper: Providers })

    // subscriber
    mockUserQuery(userBuilder({ traits: 'withActiveSubscription' }))
    render(<SignUp />, { wrapper: Providers })

    // suspended
    mockUserQuery(userBuilder({ traits: 'withSuspendedSubscription' }))
    render(<SignUp />, { wrapper: Providers })

    // blocked
    mockUserQuery(userBuilder({ traits: 'blocked' }))
    render(<SignUp />, { wrapper: Providers })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledTimes(4)
    })

    expect(mockReplace.mock.calls.every(([path]: [string]) => path.startsWith('/'))).toBeTruthy()
  })

  it('Shows a successful message after signing up', async () => {
    const name = faker.name.firstName()
    const email = faker.internet.email()
    const password = 'AV4l1dP4ssw0rd'
    mockUserQuery()
    const signUpSpy = mockSignUp()
    const { container } = render(<SignUp />, { wrapper: Providers })

    const nameInput = screen.getByPlaceholderText(/nom/i)
    user.type(nameInput, name)
    const emailInput = screen.getByPlaceholderText(/e-mail/i)
    user.type(emailInput, email)
    const passwordInput = screen.getByPlaceholderText(/^mot de passe/i)
    user.type(passwordInput, password)
    const passwordConfirmationInput = screen.getByPlaceholderText(/confirmez votre mot de passe/i)
    user.type(passwordConfirmationInput, password)
    const submitButton = screen.getByText(/s'enregistrer/i)
    user.click(submitButton)

    const successMessage = await screen.findByText(
      /le compte a été créé avec succès. veuillez valider votre e-mail en cliquant sur lien que vous allez recevoir dans votre boîte de réception./i
    )
    expect(successMessage).toBeInTheDocument()
    expect(signUpSpy).toHaveBeenCalledTimes(1)
    expect(signUpSpy.mock.calls[0][0].variables.username).toEqual(email)
    expect(signUpSpy.mock.calls[0][0].variables.email).toEqual(email)
    expect(signUpSpy.mock.calls[0][0].variables.realname).toEqual(name)
    expect(signUpSpy.mock.calls[0][0].variables.password).toEqual(password)

    // accessibility test
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Shows an error message when sign up fails', async () => {
    const name = faker.name.firstName()
    const email = faker.internet.email()
    const password = 'AV4l1dP4ssw0rd'
    mockUserQuery()
    const signUpSpy = mockSignUpError()
    const { container } = render(<SignUp />, { wrapper: Providers })

    const nameInput = screen.getByPlaceholderText(/nom/i)
    user.type(nameInput, name)
    const emailInput = screen.getByPlaceholderText(/e-mail/i)
    user.type(emailInput, email)
    const passwordInput = screen.getByPlaceholderText(/^mot de passe/i)
    user.type(passwordInput, password)
    const passwordConfirmationInput = screen.getByPlaceholderText(/confirmez votre mot de passe/i)
    user.type(passwordConfirmationInput, password)
    const submitButton = screen.getByText(/s'enregistrer/i)
    user.click(submitButton)

    const errorMessage = await screen.findByText(/une erreur serveur est survenue/i)
    expect(errorMessage).toBeInTheDocument()
    const successMessage = await screen.queryByText(
      /le compte a été créé avec succès. veuillez valider votre e-mail en cliquant sur lien que vous allez recevoir dans votre boîte de réception./i
    )
    expect(successMessage).not.toBeInTheDocument()

    expect(signUpSpy).toHaveBeenCalledTimes(1)
    expect(signUpSpy.mock.calls[0][0].variables.username).toEqual(email)
    expect(signUpSpy.mock.calls[0][0].variables.email).toEqual(email)
    expect(signUpSpy.mock.calls[0][0].variables.realname).toEqual(name)
    expect(signUpSpy.mock.calls[0][0].variables.password).toEqual(password)

    // accessibility test
    expect(await axe(container)).toHaveNoViolations()
  })

  describe('Form validation', () => {
    it('Requires a realname', async () => {
      const email = faker.internet.email()
      const password = 'AV4l1dP4ssw0rd'
      mockUserQuery()
      const signUpSpy = mockSignUpError()
      render(<SignUp />, { wrapper: Providers })

      const emailInput = screen.getByPlaceholderText(/e-mail/i)
      user.type(emailInput, email)
      const passwordInput = screen.getByPlaceholderText(/^mot de passe/i)
      user.type(passwordInput, password)
      const passwordConfirmationInput = screen.getByPlaceholderText(/confirmez votre mot de passe/i)
      user.type(passwordConfirmationInput, password)
      const submitButton = screen.getByText(/s'enregistrer/i)
      user.click(submitButton)

      const errorMessage = await screen.findByText(/veuillez entrer un nom/i)
      expect(errorMessage).toBeInTheDocument()
      expect(signUpSpy).not.toHaveBeenCalled()
    })

    it('Requires a valid email address', async () => {
      const name = faker.name.firstName()
      const email = faker.internet.url()
      const password = 'AV4l1dP4ssw0rd'
      mockUserQuery()
      const signUpSpy = mockSignUpError()
      render(<SignUp />, { wrapper: Providers })

      const nameInput = screen.getByPlaceholderText(/nom/i)
      user.type(nameInput, name)
      const emailInput = screen.getByPlaceholderText(/e-mail/i)
      user.type(emailInput, email)
      const passwordInput = screen.getByPlaceholderText(/^mot de passe/i)
      user.type(passwordInput, password)
      const passwordConfirmationInput = screen.getByPlaceholderText(/confirmez votre mot de passe/i)
      user.type(passwordConfirmationInput, password)
      const submitButton = screen.getByText(/s'enregistrer/i)
      user.click(submitButton)

      const errorMessage = await screen.findByText(/veuillez entrer une adresse e-mail valide/i)
      expect(errorMessage).toBeInTheDocument()
      expect(signUpSpy).not.toHaveBeenCalled()
    })

    it('Requires a valid password', async () => {
      const name = faker.name.firstName()
      const email = faker.internet.email()
      const password = 'NotAValidPassword'
      mockUserQuery()
      const signUpSpy = mockSignUpError()
      render(<SignUp />, { wrapper: Providers })

      const nameInput = screen.getByPlaceholderText(/nom/i)
      user.type(nameInput, name)
      const emailInput = screen.getByPlaceholderText(/e-mail/i)
      user.type(emailInput, email)
      const passwordInput = screen.getByPlaceholderText(/^mot de passe/i)
      user.type(passwordInput, password)
      const passwordConfirmationInput = screen.getByPlaceholderText(/confirmez votre mot de passe/i)
      user.type(passwordConfirmationInput, password)
      const submitButton = screen.getByText(/s'enregistrer/i)
      user.click(submitButton)

      const errorMessage = await screen.findByText(
        /le mot de passe doit avoir au moins 8 caractères et au moins 1 chiffre/i
      )
      expect(errorMessage).toBeInTheDocument()
      expect(signUpSpy).not.toHaveBeenCalled()
    })

    it('Requires that the password confirmation matches the password', async () => {
      const name = faker.name.firstName()
      const email = faker.internet.email()
      const password = 'AV4l1dP4ssw0rd'
      const passwordConfirmation = 'AV4l1dP455w0rd'
      mockUserQuery()
      const signUpSpy = mockSignUpError()
      render(<SignUp />, { wrapper: Providers })

      const nameInput = screen.getByPlaceholderText(/nom/i)
      user.type(nameInput, name)
      const emailInput = screen.getByPlaceholderText(/e-mail/i)
      user.type(emailInput, email)
      const passwordInput = screen.getByPlaceholderText(/^mot de passe/i)
      user.type(passwordInput, password)
      const passwordConfirmationInput = screen.getByPlaceholderText(/confirmez votre mot de passe/i)
      user.type(passwordConfirmationInput, passwordConfirmation)
      const submitButton = screen.getByText(/s'enregistrer/i)
      user.click(submitButton)

      const errorMessage = await screen.findByText(
        /le mot de passe et la confirmation du mot de passe doivent être les mêmes/i
      )
      expect(errorMessage).toBeInTheDocument()
      expect(signUpSpy).not.toHaveBeenCalled()
    })
  })
})
