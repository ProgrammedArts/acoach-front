import Link from 'next/link'
import styles from './success.module.scss'

export default function PaymentSuccess() {
  return (
    <div className={styles.PaymentSuccess}>
      <p>
        Votre abonnement est maintenant actif.{' '}
        <Link href="/watch">Cliquez-ici pour commencer votre entraînement.</Link>
      </p>
      <p>Merci, A Coach.</p>
    </div>
  )
}
