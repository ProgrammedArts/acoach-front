import useUser from "../hooks/useUser";
import HeaderLogo from "./HeaderLogo";
import styles from "./HeaderNavigation.module.css";
import Link from "next/link";
import { useRouter } from "next/router";

export default function HeaderNavigation() {
  const { me, logout } = useUser();
  const { push } = useRouter();

  const logoutAndRedirect = () => {
    logout().then(() => {
      push("/");
    });
  };

  return (
    <div className={styles.container}>
      <HeaderLogo />
      <div className={styles.account}>
        {me ? (
          <span className={styles.buttons}>
            <span>{me.realname}</span>
            <a href="" onClick={logoutAndRedirect}>
              Déconnexion
            </a>
          </span>
        ) : (
          <span className={styles.buttons}>
            <Link href="/signup">Inscription</Link>
            <Link href="/login">Connexion</Link>
          </span>
        )}
      </div>
    </div>
  );
}
