import { useContext, useCallback } from "react";
import { gql, useMutation } from "@apollo/client";
import { UserContext } from "../providers/UserProvider";

export const SIGN_UP = gql`
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

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { identifier: $email, password: $password }) {
      jwt
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

export default function useUser() {
  const { me, fetchMe } = useContext(UserContext);
  const [signUpMutation] = useMutation(SIGN_UP);
  const [loginMutation] = useMutation(LOGIN);

  const login = useCallback(
    ({ email, password }: LoginOptions) => {
      return loginMutation({
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
      );
    },
    [fetchMe, loginMutation]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    return fetchMe();
  }, [fetchMe]);

  const signUp = useCallback(
    ({ realname, email, password }: SignUpOptions) => {
      return signUpMutation({
        variables: {
          realname,
          username: email,
          email,
          password,
        },
      }).then(
        ({
          data: {
            registerWithRealName: { jwt },
          },
        }) => {
          localStorage.setItem("token", jwt);
          return fetchMe();
        }
      );
    },
    [fetchMe, signUpMutation]
  );

  return { me, fetchMe, login, logout, signUp };
}
