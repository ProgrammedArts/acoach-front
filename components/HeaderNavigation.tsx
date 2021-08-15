import truncate from 'lodash/truncate'
import Link from 'next/link'
import { FaBars } from 'react-icons/fa'
import useUser from '../hooks/useUser'
import HeaderLogo from './HeaderLogo'
import styles from './HeaderNavigation.module.scss'

export interface CustomerPortal {
  url: string
}

export default function HeaderNavigation() {
  const { me } = useUser()

  return (
    <div className={styles.HeaderNavigation}>
      <HeaderLogo />
      <div className={styles.account}>
        {me ? (
          <span className={styles.accountButtons}>
            <Link href="/settings" passHref>
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
  )
}
