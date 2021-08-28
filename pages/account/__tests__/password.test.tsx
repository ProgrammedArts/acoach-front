import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import { NextRouter } from 'next/router'
import React, { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import user from '@testing-library/user-event'
import { v4 as uuid } from 'uuid'
import ACUser from '../../../models/ACUser'
import TestApolloProvider from '../../../providers/TestApolloProvider'
import UserProvider from '../../../providers/UserProvider'

import ChangePassword from '../password'
import userBuilder from '../../../testUtils/userBuilder'

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

function mockChangePassword(email: string) {
  const spy = jest.fn()
  server.use(
    graphql.mutation('ChangePassword', (req, res, ctx) => {
      spy(req)
      return res(ctx.data({ changePassword: { email } }))
    })
  )
  return spy
}

function mockChangePasswordCurrentEmailError() {
  const spy = jest.fn()
  server.use(
    graphql.mutation('ChangePassword', (req, res, ctx) => {
      spy(req)
      return res(
        ctx.errors([
          {
            extensions: {
              exception: {
                data: {
                  message: [
                    {
                      messages: [
                        {
                          id: 'current.password.invalid',
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

function mockChangePasswordError() {
  const spy = jest.fn()
  server.use(
    graphql.mutation('ChangePassword', (req, res, ctx) => {
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
    render(<ChangePassword />, { wrapper: Providers })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled()
    })

    expect(mockReplace).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('Successfully changes password', async () => {
    const password = 'AV4l1dP4ssw0rd'
    const newPassword = 'AN3wP4ssw0rd'
    const userAccount = userBuilder()
    mockUserQuery(userAccount)
    const changePasswordSpy = mockChangePassword(userAccount.email)
    render(<ChangePassword />, { wrapper: Providers })

    const current = screen.getByPlaceholderText(/^mot de passe actuel/i)
    user.type(current, password)
    const newPw = screen.getByPlaceholderText(/^nouveau mot de passe/i)
    user.type(newPw, newPassword)
    const confirmation = screen.getByPlaceholderText(/^confirmez le nouveau mot de passe/i)
    user.type(confirmation, newPassword)
    const submitButton = screen.getByRole('button')
    user.click(submitButton)

    const successMessage = await screen.findByText(/mot de passe modifié avec succès/i)
    expect(successMessage).toBeInTheDocument()

    expect(changePasswordSpy).toHaveBeenCalledTimes(1)
    expect(changePasswordSpy.mock.calls[0][0].variables.password).toEqual(password)
    expect(changePasswordSpy.mock.calls[0][0].variables.newPassword).toEqual(newPassword)
  })

  it('Shows error message if the current password is not valid', async () => {
    const password = 'AV4l1dP4ssw0rd'
    const newPassword = 'AN3wP4ssw0rd'
    mockUserQuery(userBuilder())
    const changePasswordSpy = mockChangePasswordCurrentEmailError()
    render(<ChangePassword />, { wrapper: Providers })

    const current = screen.getByPlaceholderText(/^mot de passe actuel/i)
    user.type(current, password)
    const newPw = screen.getByPlaceholderText(/^nouveau mot de passe/i)
    user.type(newPw, newPassword)
    const confirmation = screen.getByPlaceholderText(/^confirmez le nouveau mot de passe/i)
    user.type(confirmation, newPassword)
    const submitButton = screen.getByRole('button')
    user.click(submitButton)

    const errorMessage = await screen.findByText(/le mot de passe actuel n'est pas valide/i)
    expect(errorMessage).toBeInTheDocument()

    expect(changePasswordSpy).toHaveBeenCalledTimes(1)
    expect(changePasswordSpy.mock.calls[0][0].variables.password).toEqual(password)
    expect(changePasswordSpy.mock.calls[0][0].variables.newPassword).toEqual(newPassword)
  })

  it('Shows error message if the change password mutation fails', async () => {
    const password = 'AV4l1dP4ssw0rd'
    const newPassword = 'AN3wP4ssw0rd'
    mockUserQuery(userBuilder())
    const changePasswordSpy = mockChangePasswordError()
    render(<ChangePassword />, { wrapper: Providers })

    const current = screen.getByPlaceholderText(/^mot de passe actuel/i)
    user.type(current, password)
    const newPw = screen.getByPlaceholderText(/^nouveau mot de passe/i)
    user.type(newPw, newPassword)
    const confirmation = screen.getByPlaceholderText(/^confirmez le nouveau mot de passe/i)
    user.type(confirmation, newPassword)
    const submitButton = screen.getByRole('button')
    user.click(submitButton)

    const errorMessage = await screen.findByText(/une erreur serveur est survenue/i)
    expect(errorMessage).toBeInTheDocument()

    expect(changePasswordSpy).toHaveBeenCalledTimes(1)
    expect(changePasswordSpy.mock.calls[0][0].variables.password).toEqual(password)
    expect(changePasswordSpy.mock.calls[0][0].variables.newPassword).toEqual(newPassword)
  })

  describe('Form validation', () => {
    it('Shows an error if the current password is not valid', async () => {
      const password = 'NotAValidPassword'
      const newPassword = 'AN3wP4ssw0rd'
      const userAccount = userBuilder()
      mockUserQuery(userAccount)
      const changePasswordSpy = mockChangePassword(userAccount.email)
      render(<ChangePassword />, { wrapper: Providers })

      const current = screen.getByPlaceholderText(/^mot de passe actuel/i)
      user.type(current, password)
      const newPw = screen.getByPlaceholderText(/^nouveau mot de passe/i)
      user.type(newPw, newPassword)
      const confirmation = screen.getByPlaceholderText(/^confirmez le nouveau mot de passe/i)
      user.type(confirmation, newPassword)
      const submitButton = screen.getByRole('button')
      user.click(submitButton)

      const errorMessage = await screen.findByText(/le mot de passe actuel n'est pas valide/i)
      expect(errorMessage).toBeInTheDocument()

      expect(changePasswordSpy).toHaveBeenCalledTimes(0)
    })

    it('Shows an error if the new password is not valid', async () => {
      const password = 'AV4l1dP4ssw0rd'
      const newPassword = 'NotAValidPassword'
      const userAccount = userBuilder()
      mockUserQuery(userAccount)
      const changePasswordSpy = mockChangePassword(userAccount.email)
      render(<ChangePassword />, { wrapper: Providers })

      const current = screen.getByPlaceholderText(/^mot de passe actuel/i)
      user.type(current, password)
      const newPw = screen.getByPlaceholderText(/^nouveau mot de passe/i)
      user.type(newPw, newPassword)
      const confirmation = screen.getByPlaceholderText(/^confirmez le nouveau mot de passe/i)
      user.type(confirmation, newPassword)
      const submitButton = screen.getByRole('button')
      user.click(submitButton)

      const errorMessage = await screen.findByText(
        /le nouveau mot de passe doit avoir au moins 8 caractères et au moins 1 chiffre/i
      )
      expect(errorMessage).toBeInTheDocument()

      expect(changePasswordSpy).toHaveBeenCalledTimes(0)
    })

    it('Shows an error if the new password is the same as the current one', async () => {
      const password = 'AV4l1dP4ssw0rd'
      const newPassword = 'AV4l1dP4ssw0rd'
      const userAccount = userBuilder()
      mockUserQuery(userAccount)
      const changePasswordSpy = mockChangePassword(userAccount.email)
      render(<ChangePassword />, { wrapper: Providers })

      const current = screen.getByPlaceholderText(/^mot de passe actuel/i)
      user.type(current, password)
      const newPw = screen.getByPlaceholderText(/^nouveau mot de passe/i)
      user.type(newPw, newPassword)
      const confirmation = screen.getByPlaceholderText(/^confirmez le nouveau mot de passe/i)
      user.type(confirmation, newPassword)
      const submitButton = screen.getByRole('button')
      user.click(submitButton)

      const errorMessage = await screen.findByText(
        /le nouveau mot de passe ne peut pas être le même que l'ancien/i
      )
      expect(errorMessage).toBeInTheDocument()

      expect(changePasswordSpy).toHaveBeenCalledTimes(0)
    })

    it('Shows an error if the password confirmation does not match', async () => {
      const password = 'AV4l1dP4ssw0rd'
      const newPassword = 'AN3wP4ssw0rd'
      const passwordConfirmation = 'c0nf1rm4t1On'
      const userAccount = userBuilder()
      mockUserQuery(userAccount)
      const changePasswordSpy = mockChangePassword(userAccount.email)
      render(<ChangePassword />, { wrapper: Providers })

      const current = screen.getByPlaceholderText(/^mot de passe actuel/i)
      user.type(current, password)
      const newPw = screen.getByPlaceholderText(/^nouveau mot de passe/i)
      user.type(newPw, newPassword)
      const confirmation = screen.getByPlaceholderText(/^confirmez le nouveau mot de passe/i)
      user.type(confirmation, passwordConfirmation)
      const submitButton = screen.getByRole('button')
      user.click(submitButton)

      const errorMessage = await screen.findByText(
        /le nouveau mot de passe et la confirmation du mot de passe doivent être les mêmes/i
      )
      expect(errorMessage).toBeInTheDocument()

      expect(changePasswordSpy).toHaveBeenCalledTimes(0)
    })
  })
})
