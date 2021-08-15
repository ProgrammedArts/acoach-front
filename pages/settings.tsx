import { gql, useQuery } from '@apollo/client'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { FaFileInvoice, FaSignOutAlt, FaUnlockAlt } from 'react-icons/fa'
import { CustomerPortal } from '../components/HeaderNavigation'
import useUser from '../hooks/useUser'
import styles from './settings.module.scss'

const GET_CUSTOMER_PORTAL = gql`
  query GetCustomerPortal {
    getCustomerPortal {
      url
    }
  }
`

export default function Settings() {
  const { logout, isLoggedIn } = useUser()
  const { push } = useRouter()
  const { data, error } = useQuery<{ getCustomerPortal: CustomerPortal }>(GET_CUSTOMER_PORTAL)

  // redirect to home if not logged
  useEffect(() => {
    if (!isLoggedIn()) {
      push('/')
    }
  }, [isLoggedIn, push])

  function logoutAndRedirect() {
    logout().then(() => {
      push('/')
    })
  }

  function redirectToCustomerPortal() {
    if (data?.getCustomerPortal) {
      if (data.getCustomerPortal.url) {
        window.open(data.getCustomerPortal.url)
      }
    }
  }

  const hasSubscription = data && !error

  return (
    <div className={styles.Settings}>
      <h1>Paramètres du compte</h1>
      <div className={styles.linkRow}>
        <Link href="/settings/password" passHref>
          <a className={styles.button}>
            <FaUnlockAlt />
            Modifier mon mot de passe
          </a>
        </Link>
      </div>
      {hasSubscription && (
        <div className={styles.linkRow}>
          <a href="" className={styles.button} onClick={redirectToCustomerPortal}>
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
