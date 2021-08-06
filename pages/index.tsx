import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import styles from "./index.module.scss";

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>A.Coaching</title>
        <meta name="description" content="A.Coaching" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Bienvenue sur A.Coaching</h1>

        <div className={styles.grid}>
          <span className={styles.card}>
            <Link href="/pricing" passHref>
              <a>
                <h2>Abonnement</h2>
                <p>Souscrire à un abonnement</p>
              </a>
            </Link>
          </span>

          <span className={styles.card}>
            <Link href="/watch" passHref>
              <a>
                <h2>Entrainement</h2>
                <p>Accès à la plateforme vidéo</p>
              </a>
            </Link>
          </span>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
}
