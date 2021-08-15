import {
  gql,
  useMutation,
  OperationVariables,
  ApolloQueryResult,
  ApolloError,
  FetchResult,
} from '@apollo/client'
import { useCallback, useContext } from 'react'
import { UserContext, UserState } from '../providers/UserProvider'

export const SIGN_UP_MUTATION = gql`
  mutation SignUp($username: String!, $email: String!, $password: String!, $realname: String!) {
    registerWithRealName(
      input: { username: $username, email: $email, password: $password, realname: $realname }
    ) {
      jwt
    }
  }
`

export interface SignUpMutation {
  registerWithRealName: {
    jwt?: string
  }
}

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { identifier: $email, password: $password }) {
      jwt
    }
  }
`

export interface LoginMutation {
  login: {
    jwt?: string
  }
}

const FORGOT_PASSWORD_MUTATION = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email) {
      ok
    }
  }
`

export interface ForgotPasswordMutation {
  forgotPassword: {
    ok: boolean
  }
}

const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($password: String!, $passwordConfirmation: String!, $code: String!) {
    resetPassword(password: $password, passwordConfirmation: $passwordConfirmation, code: $code) {
      jwt
    }
  }
`

export interface ResetPasswordMutation {
  resetPassword: {
    jwt?: string
  }
}

const SEND_EMAIL_CONFIRMATION_MUTATION = gql`
  mutation SendEmailConfirmation($email: String!) {
    sendEmailConfirmation(input: { email: $email }) {
      email
      sent
    }
  }
`

export interface SendEmailConfirmationMutation {
  sendEmailConfirmation: {
    email: string
    sent: boolean
  }
}

export interface LoginOptions {
  email: string
  password: string
}

export interface SignUpOptions {
  realname: string
  email: string
  password: string
}

export interface ForgotPasswordOptions {
  email: string
}

export interface SendEmailConfirmation {
  email: string
}

export interface ResetPasswordOptions {
  password: string
  passwordConfirmation: string
  code: string
}

export interface UseUser {
  me: UserState | null | undefined
  fetchMe: (variables?: Partial<OperationVariables> | undefined) => Promise<
    ApolloQueryResult<{
      me: UserState
    }>
  >
  isLoggedIn: () => boolean
  login: ({ email, password }: LoginOptions) => Promise<
    ApolloQueryResult<{
      me: UserState
    }>
  >
  logout: () => Promise<
    ApolloQueryResult<{
      me: UserState
    }>
  >
  signUp: ({
    realname,
    email,
    password,
  }: SignUpOptions) => Promise<
    FetchResult<SignUpMutation, Record<string, any>, Record<string, any>>
  >
  forgotPassword: ({
    email,
  }: ForgotPasswordOptions) => Promise<
    FetchResult<ForgotPasswordMutation, Record<string, any>, Record<string, any>>
  >
  resetPassword: ({ password, passwordConfirmation, code }: ResetPasswordOptions) => Promise<
    ApolloQueryResult<{
      me: UserState
    }>
  >
  sendEmailConfirmation: ({
    email,
  }: SendEmailConfirmation) => Promise<
    FetchResult<SendEmailConfirmation, Record<string, any>, Record<string, any>>
  >
}

export default function useUser(): UseUser {
  const { me, fetchMe } = useContext(UserContext)
  const [signUpMutation] = useMutation<SignUpMutation>(SIGN_UP_MUTATION)
  const [loginMutation] = useMutation<LoginMutation>(LOGIN_MUTATION)
  const [forgotPasswordMutation] = useMutation<ForgotPasswordMutation>(FORGOT_PASSWORD_MUTATION)
  const [resetPasswordMutation] = useMutation<ResetPasswordMutation>(RESET_PASSWORD_MUTATION)
  const [sendEmailConfirmationMutation] = useMutation<SendEmailConfirmation>(
    SEND_EMAIL_CONFIRMATION_MUTATION
  )

  const login = useCallback(
    ({ email, password }: LoginOptions) =>
      loginMutation({
        variables: {
          email,
          password,
        },
      }).then(({ data }) => {
        if (data?.login.jwt) {
          localStorage.setItem('token', data.login.jwt)
        }
        return fetchMe()
      }),
    [fetchMe, loginMutation]
  )

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    return fetchMe()
  }, [fetchMe])

  const signUp = useCallback(
    ({ realname, email, password }: SignUpOptions) =>
      signUpMutation({
        variables: {
          realname,
          username: email,
          email,
          password,
        },
      }),
    [signUpMutation]
  )

  const forgotPassword = useCallback(
    ({ email }: ForgotPasswordOptions) =>
      forgotPasswordMutation({
        variables: {
          email,
        },
      }),
    [forgotPasswordMutation]
  )

  const resetPassword = useCallback(
    ({ password, passwordConfirmation, code }: ResetPasswordOptions) =>
      resetPasswordMutation({
        variables: {
          password,
          passwordConfirmation,
          code,
        },
      }).then(({ data }) => {
        if (data?.resetPassword.jwt) {
          localStorage.setItem('token', data?.resetPassword.jwt)
        }
        return fetchMe()
      }),
    [fetchMe, resetPasswordMutation]
  )

  const sendEmailConfirmation = useCallback(
    ({ email }: SendEmailConfirmation) =>
      sendEmailConfirmationMutation({
        variables: {
          email,
        },
      }),
    [sendEmailConfirmationMutation]
  )

  const isLoggedIn = useCallback(() => !!localStorage.getItem('token'), [])

  return {
    me,
    isLoggedIn,
    fetchMe,
    login,
    logout,
    signUp,
    forgotPassword,
    resetPassword,
    sendEmailConfirmation,
  }
}
