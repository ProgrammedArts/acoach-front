import Head from 'next/head'
import Link from 'next/link'
import styles from './index.module.scss'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>A.Coach</title>
        <meta name="description" content="A.Coach" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>A Coach</h1>

        <div className={styles.grid}>
          <div className={[styles.card, styles.arysOne].join(' ')}>
            <div className={styles.cardOverlay}>
              <Link href="/pricing" passHref>
                <a>
                  <h2>Abonnement</h2>
                  <p>Souscrire à un abonnement</p>
                </a>
              </Link>
            </div>
          </div>

          <div className={[styles.card, styles.arysTwo].join(' ')}>
            <div className={styles.cardOverlay}>
              <Link href="/watch" passHref>
                <a>
                  <h2>Entrainement</h2>
                  <p>Accès à la plateforme vidéo</p>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}></footer>
    </div>
  )
}
