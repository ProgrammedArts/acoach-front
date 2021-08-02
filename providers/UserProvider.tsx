import {
  createContext,
  ReactNode,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import { gql, useQuery } from "@apollo/client";

export interface UserContextValue {
  me: UserState | undefined | null;
  fetchMe: () => Promise<any>;
}

export const UserContext = createContext<UserContextValue>(
  {} as UserContextValue
);

export interface UserState {
  realname: string;
  email: string;
}

export function userReducer(
  state: UserState | null | undefined,
  action: UserState | null | undefined
) {
  return action || state;
}

export const ME = gql`
  {
    me {
      realname
      email
    }
  }
`;

export default function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer<typeof userReducer>(userReducer, null);
  const { data, refetch } = useQuery<{ me: UserState }>(ME, {
    fetchPolicy: "no-cache",
  });

  useEffect(() => {
    dispatch(data?.me);
  }, [data]);

  return (
    <UserContext.Provider value={{ me: state, fetchMe: refetch }}>
      {children}
    </UserContext.Provider>
  );
}
