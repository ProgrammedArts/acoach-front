import { gql, useMutation } from "@apollo/client";
import { useCallback, useContext } from "react";
import { UserContext } from "../providers/UserProvider";

export const SIGN_UP_MUTATION = gql`
  mutation SignUp(
    $username: String!
    $email: String!
    $password: String!
    $realname: String!
  ) {
    registerWithRealName(
      input: {
        username: $username
        email: $email
        password: $password
        realname: $realname
      }
    ) {
      jwt
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { identifier: $email, password: $password }) {
      jwt
    }
  }
`;

const FORGOT_PASSWORD_MUTATION = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email) {
      ok
    }
  }
`;

const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword(
    $password: String!
    $passwordConfirmation: String!
    $code: String!
  ) {
    resetPassword(
      password: $password
      passwordConfirmation: $passwordConfirmation
      code: $code
    ) {
      jwt
    }
  }
`;

const SEND_EMAIL_CONFIRMATION_MUTATION = gql`
  mutation SendEmailConfirmation($email: String!) {
    sendEmailConfirmation(input: { email: $email }) {
      email
      sent
    }
  }
`;

export interface LoginOptions {
  email: string;
  password: string;
}

export interface SignUpOptions {
  realname: string;
  email: string;
  password: string;
}

export interface ForgotPasswordOptions {
  email: string;
}

export interface SendEmailConfirmation {
  email: string;
}

export interface ResetPasswordOptions {
  password: string;
  passwordConfirmation: string;
  code: string;
}

export default function useUser() {
  const { me, fetchMe } = useContext(UserContext);
  const [signUpMutation] = useMutation(SIGN_UP_MUTATION);
  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [forgotPasswordMutation] = useMutation(FORGOT_PASSWORD_MUTATION);
  const [resetPasswordMutation] = useMutation(RESET_PASSWORD_MUTATION);
  const [sendEmailConfirmationMutation] = useMutation(
    SEND_EMAIL_CONFIRMATION_MUTATION
  );

  const login = useCallback(
    ({ email, password }: LoginOptions) =>
      loginMutation({
        variables: {
          email,
          password,
        },
      }).then(
        ({
          data: {
            login: { jwt },
          },
        }) => {
          localStorage.setItem("token", jwt);
          return fetchMe();
        }
      ),
    [fetchMe, loginMutation]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    return fetchMe();
  }, [fetchMe]);

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
  );

  const forgotPassword = useCallback(
    ({ email }: ForgotPasswordOptions) =>
      forgotPasswordMutation({
        variables: {
          email,
        },
      }),
    [forgotPasswordMutation]
  );

  const resetPassword = useCallback(
    ({ password, passwordConfirmation, code }: ResetPasswordOptions) =>
      resetPasswordMutation({
        variables: {
          password,
          passwordConfirmation,
          code,
        },
      }).then(
        ({
          data: {
            resetPassword: { jwt },
          },
        }) => {
          localStorage.setItem("token", jwt);
          return fetchMe();
        }
      ),
    [fetchMe, resetPasswordMutation]
  );

  const sendEmailConfirmation = useCallback(
    ({ email }: SendEmailConfirmation) =>
      sendEmailConfirmationMutation({
        variables: {
          email,
        },
      }),
    [sendEmailConfirmationMutation]
  );

  return {
    me,
    fetchMe,
    login,
    logout,
    signUp,
    forgotPassword,
    resetPassword,
    sendEmailConfirmation,
  };
}
