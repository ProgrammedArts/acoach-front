import { useQuery } from '@apollo/client'
import cx from 'classnames'
import truncate from 'lodash/truncate'
import Link from 'next/link'
import { FaBars } from 'react-icons/fa'
import useUser from '../hooks/useUser'
import { CustomerPortal, GET_CUSTOMER_PORTAL } from '../pages/account'
import HeaderLogo from './HeaderLogo'
import styles from './HeaderNavigation.module.scss'

export default function HeaderNavigation() {
  const { me } = useUser()
  const { data } = useQuery<{ getCustomerPortal: CustomerPortal }>(GET_CUSTOMER_PORTAL)

  return (
    <>
      <div className={cx(styles.HeaderNavigation, styles.subscriptionInactive)}>
        <HeaderLogo />
        <div className={styles.account}>
          {me ? (
            <span className={styles.accountButtons}>
              <Link href="/account" passHref>
                <a className="button-black">
                  <FaBars />
                  {truncate(me.realname, {
                    length: 24,
                  })}
                </a>
              </Link>
            </span>
          ) : (
            <span className={styles.accountButtons}>
              <Link href="/signup">
                <a className="button-white">Inscription</a>
              </Link>
              <Link href="/login">
                <a className="button-black">Connexion</a>
              </Link>
            </span>
          )}
        </div>
      </div>
      {me && me.subscriptionActive === false && (
        <div className={styles.subscriptionInactiveMessage}>
          L&apos;accès à votre abonnement a été restreint probablement due à un paiement non abouti.
          {data?.getCustomerPortal.url && (
            <span>
              {' '}
              <a href={data.getCustomerPortal.url}>Cliquez ici</a> pour plus de détails.
            </span>
          )}
        </div>
      )}
    </>
  )
}
