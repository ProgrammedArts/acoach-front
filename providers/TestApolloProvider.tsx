import {
  ApolloClient,
  ApolloProvider as BaseApolloProvider,
  createHttpLink,
  InMemoryCache,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { ReactNode } from 'react'

export default function TestApolloProvider({ children }: { children?: ReactNode | undefined }) {
  const httpLink = createHttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_END_POINT || 'http://localhost:3001',
    fetch: window.fetch,
  })

  const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists
    const token = localStorage.getItem('token')
    // return the headers to the context so httpLink can read them

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    }
  })

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: authLink.concat(httpLink),
  })

  return <BaseApolloProvider client={client}>{children}</BaseApolloProvider>
}
