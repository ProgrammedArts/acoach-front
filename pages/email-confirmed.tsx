import SuccessMessage from '../components/SuccessMessage'
import Login from './login'
import styles from './email-confirmed.module.scss'

export default function EmailConfirmed() {
  return (
    <div className={styles.EmailConfirmed}>
      <Login>
        <SuccessMessage className={styles.message}>
          Votre email a été validé. Veuillez vous connecter pour continuer.
        </SuccessMessage>
      </Login>
    </div>
  )
}
