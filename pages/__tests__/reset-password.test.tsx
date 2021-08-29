import { render, screen, waitFor } from '@testing-library/react'
import user from '@testing-library/user-event'
import faker from 'faker/locale/fr'
import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import { NextRouter } from 'next/router'
import React, { ReactNode } from 'react'
import { v4 as uuid } from 'uuid'
import ACUser from '../../models/ACUser'
import TestApolloProvider from '../../providers/TestApolloProvider'
import UserProvider from '../../providers/UserProvider'
import userBuilder from '../../testUtils/userBuilder'
import ResetPassword from '../reset-password'

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

function mockResetPassword(jwt?: string) {
  const spy = jest.fn()
  server.use(
    graphql.mutation('ResetPassword', (req, res, ctx) => {
      spy(req)
      return res(
        ctx.data({
          resetPassword: {
            jwt: jwt || uuid(),
          },
        })
      )
    })
  )
  return spy
}

function mockResetPasswordError() {
  const spy = jest.fn()
  server.use(
    graphql.mutation('ResetPassword', (req, res, ctx) => {
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

describe('Reset password page', () => {
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

  it('Successfully resets password as a logged out user', async () => {
    const password = 'AV4l1dP4ssw0rd'
    const jwt = uuid()
    mockUserQuery()
    const resetPasswordSpy = mockResetPassword(jwt)
    const resetCode = faker.random.alphaNumeric(20)
    mockUseRouter.query = { code: resetCode }
    render(<ResetPassword />, { wrapper: Providers })

    const passwordInput = screen.getByPlaceholderText(/^mot de passe/i)
    user.type(passwordInput, password)
    const passwordConfirmationInput = screen.getByPlaceholderText(/confirmez votre mot de passe/i)
    user.type(passwordConfirmationInput, password)
    const submitButton = screen.getByRole('button')

    user.click(submitButton)

    // reset me query
    const userAccount = userBuilder()
    mockUserQuery(userAccount)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledTimes(1)
    })

    expect(resetPasswordSpy).toHaveBeenCalledTimes(1)
    expect(resetPasswordSpy.mock.calls[0][0].variables.code).toEqual(resetCode)
    expect(resetPasswordSpy.mock.calls[0][0].variables.password).toEqual(password)
    expect(resetPasswordSpy.mock.calls[0][0].variables.passwordConfirmation).toEqual(password)
    expect(mockReplace).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith('/pricing')
  })

  it('Successfully resets password as a logged in user', async () => {
    const password = 'AV4l1dP4ssw0rd'
    const jwt = uuid()
    const userAccount = userBuilder()
    mockUserQuery(userAccount)
    const resetPasswordSpy = mockResetPassword(jwt)
    const resetCode = faker.random.alphaNumeric(20)
    mockUseRouter.query = { code: resetCode }
    render(<ResetPassword />, { wrapper: Providers })

    const passwordInput = screen.getByPlaceholderText(/^mot de passe/i)
    user.type(passwordInput, password)
    const passwordConfirmationInput = screen.getByPlaceholderText(/confirmez votre mot de passe/i)
    user.type(passwordConfirmationInput, password)
    const submitButton = screen.getByRole('button')

    user.click(submitButton)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledTimes(1)
    })

    expect(resetPasswordSpy).toHaveBeenCalledTimes(1)
    expect(resetPasswordSpy.mock.calls[0][0].variables.code).toEqual(resetCode)
    expect(resetPasswordSpy.mock.calls[0][0].variables.password).toEqual(password)
    expect(resetPasswordSpy.mock.calls[0][0].variables.passwordConfirmation).toEqual(password)
    expect(mockReplace).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith('/pricing')
  })

  it('Shows a server error if the code is not a string', async () => {
    const password = 'AV4l1dP4ssw0rd'
    mockUserQuery()
    const resetPasswordSpy = mockResetPasswordError()
    const resetCode = faker.random.alphaNumeric(20)
    mockUseRouter.query = { code: [resetCode] }
    render(<ResetPassword />, { wrapper: Providers })

    const passwordInput = screen.getByPlaceholderText(/^mot de passe/i)
    user.type(passwordInput, password)
    const passwordConfirmationInput = screen.getByPlaceholderText(/confirmez votre mot de passe/i)
    user.type(passwordConfirmationInput, password)
    const submitButton = screen.getByRole('button')

    user.click(submitButton)

    const errorMessage = await screen.findByText(/une erreur serveur est survenue/i)
    expect(errorMessage).toBeInTheDocument()
    expect(resetPasswordSpy).not.toHaveBeenCalled()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('Shows a server error if it failed to reset the password', async () => {
    const password = 'AV4l1dP4ssw0rd'
    mockUserQuery()
    const resetPasswordSpy = mockResetPasswordError()
    const resetCode = faker.random.alphaNumeric(20)
    mockUseRouter.query = { code: resetCode }
    render(<ResetPassword />, { wrapper: Providers })

    const passwordInput = screen.getByPlaceholderText(/^mot de passe/i)
    user.type(passwordInput, password)
    const passwordConfirmationInput = screen.getByPlaceholderText(/confirmez votre mot de passe/i)
    user.type(passwordConfirmationInput, password)
    const submitButton = screen.getByRole('button')

    user.click(submitButton)

    const errorMessage = await screen.findByText(/une erreur serveur est survenue/i)
    expect(errorMessage).toBeInTheDocument()
    expect(resetPasswordSpy).toHaveBeenCalledTimes(1)
    expect(resetPasswordSpy.mock.calls[0][0].variables.code).toEqual(resetCode)
    expect(resetPasswordSpy.mock.calls[0][0].variables.password).toEqual(password)
    expect(resetPasswordSpy.mock.calls[0][0].variables.passwordConfirmation).toEqual(password)
    expect(mockReplace).not.toHaveBeenCalled()
  })

  describe('Form validation', () => {
    it('Shows an error message if the password is not valid', async () => {
      const password = 'ANotSoValidPassword'
      mockUserQuery()
      const resetPasswordSpy = mockResetPassword()
      const resetCode = faker.random.alphaNumeric(20)
      mockUseRouter.query = { code: resetCode }
      render(<ResetPassword />, { wrapper: Providers })

      const passwordInput = screen.getByPlaceholderText(/^mot de passe/i)
      user.type(passwordInput, password)
      const passwordConfirmationInput = screen.getByPlaceholderText(/confirmez votre mot de passe/i)
      user.type(passwordConfirmationInput, password)
      const submitButton = screen.getByRole('button')

      user.click(submitButton)

      const errorMessage = await screen.findByText(
        /le mot de passe doit avoir au moins 8 caractères et au moins 1 chiffre/i
      )
      expect(errorMessage).toBeInTheDocument()
      expect(resetPasswordSpy).not.toHaveBeenCalled()
      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('Shows an error message if the password confirmation does not match', async () => {
      const password = 'AV4l1dP4ssw0rd'
      const passwordConfirmation = 'ANotSoValidPassword'
      mockUserQuery()
      const resetPasswordSpy = mockResetPassword()
      const resetCode = faker.random.alphaNumeric(20)
      mockUseRouter.query = { code: resetCode }
      render(<ResetPassword />, { wrapper: Providers })

      const passwordInput = screen.getByPlaceholderText(/^mot de passe/i)
      user.type(passwordInput, password)
      const passwordConfirmationInput = screen.getByPlaceholderText(/confirmez votre mot de passe/i)
      user.type(passwordConfirmationInput, passwordConfirmation)
      const submitButton = screen.getByRole('button')

      user.click(submitButton)

      const errorMessage = await screen.findByText(
        /le mot de passe et la confirmation du mot de passe/i
      )
      expect(errorMessage).toBeInTheDocument()
      expect(resetPasswordSpy).not.toHaveBeenCalled()
      expect(mockReplace).not.toHaveBeenCalled()
    })
  })
})
