import type { AppProps } from 'next/app'
import HeaderNavigation from '../components/HeaderNavigation'
import ApolloProvider from '../providers/ApolloProvider'
import UserProvider from '../providers/UserProvider'
import '../styles/common.scss'
import '../styles/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider>
      <UserProvider>
        <HeaderNavigation />
        <Component {...pageProps} />
      </UserProvider>
    </ApolloProvider>
  )
}

export default MyApp
