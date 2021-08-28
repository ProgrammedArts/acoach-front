import { gql, useQuery } from '@apollo/client'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useRef } from 'react'
import { FaFileInvoice, FaSignOutAlt, FaUnlockAlt } from 'react-icons/fa'
import { CustomerPortal } from '../components/HeaderNavigation'
import useUser from '../hooks/useUser'
import useUserRedirection from '../hooks/useUserRedirection'
import styles from './account.module.scss'

const GET_CUSTOMER_PORTAL = gql`
  query GetCustomerPortal {
    getCustomerPortal {
      url
    }
  }
`

export default function Account() {
  const { logout } = useUser()
  const isLoggedOutRef = useRef(false)
  const { data, error } = useQuery<{ getCustomerPortal: CustomerPortal }>(GET_CUSTOMER_PORTAL)

  useUserRedirection({
    onUnauthenticated: ({ replace }) => {
      if (isLoggedOutRef.current) {
        replace('/')
      } else {
        replace('/login')
      }
    },
    onAuthenticated: null,
    onBlocked: null,
    onSubscribedUser: null,
    onSuspended: null,
  })

  function logoutAndRedirect() {
    logout().then(() => {
      isLoggedOutRef.current = true
    })
  }

  const hasSubscription = data?.getCustomerPortal.url && !error

  return (
    <div className={styles.Account}>
      <h1>Paramètres du compte</h1>
      <div className={styles.linkRow}>
        <Link href="/account/password" passHref>
          <a className={styles.button}>
            <FaUnlockAlt />
            Modifier mon mot de passe
          </a>
        </Link>
      </div>
      {hasSubscription && (
        <div className={styles.linkRow}>
          <a href={data?.getCustomerPortal.url} className={styles.button}>
            <FaFileInvoice />
            Gestion et annulation de l&apos;abonnement
          </a>
        </div>
      )}
      <div className={styles.linkRow}>
        <a href="" className={styles.button} onClick={logoutAndRedirect}>
          <FaSignOutAlt />
          Me déconnecter
        </a>
      </div>
    </div>
  )
}
