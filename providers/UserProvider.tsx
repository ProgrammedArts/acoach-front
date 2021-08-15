import { createContext, ReactNode, useReducer, useEffect, useCallback } from 'react'
import { gql, useQuery, ApolloError } from '@apollo/client'

export interface UserContextValue {
  me: UserState | undefined | null
  fetchMe: () => Promise<any>
  meError: ApolloError | undefined
}

export const UserContext = createContext<UserContextValue>({} as UserContextValue)

export interface UserState {
  realname: string
  email: string
  blocked: boolean
  subscription?: {
    id: string
    name: string
  }
  subscriptionEnd?: string
  subscriptionActive?: boolean
}

export function userReducer(
  state: UserState | null | undefined,
  action: UserState | null | undefined
) {
  return action || state
}

export const ME = gql`
  {
    me {
      realname
      email
      blocked
      subscriptionEnd
      subscriptionActive
      subscription {
        id
        name
      }
    }
  }
`

export default function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer<typeof userReducer>(userReducer, null)
  const { data, refetch, error } = useQuery<{ me: UserState }>(ME, {
    fetchPolicy: 'no-cache',
  })

  useEffect(() => {
    dispatch(data?.me)
  }, [data])

  useEffect(() => {
    if (error) {
      localStorage.removeItem('token')
    }
  }, [error])

  return (
    <UserContext.Provider value={{ me: state, fetchMe: refetch, meError: error }}>
      {children}
    </UserContext.Provider>
  )
}
