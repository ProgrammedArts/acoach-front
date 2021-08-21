import Link from 'next/link'
import styles from './canceled.module.scss'

export default function PaymentCanceled() {
  return (
    <div className={styles.PaymentCanceled}>
      <p>
        La souscription n&apos;a pas été aboutie.{' '}
        <Link href="/">Veuillez cliquez ici pour revenir sur le site.</Link>
      </p>
      <p>
        <Link href="/pricing">Souscrire à un abonnement</Link>
      </p>
    </div>
  )
}
