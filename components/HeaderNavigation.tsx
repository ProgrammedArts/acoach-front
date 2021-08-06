import useUser from "../hooks/useUser";
import HeaderLogo from "./HeaderLogo";
import styles from "./HeaderNavigation.module.scss";
import Link from "next/link";
import { useRouter } from "next/router";
import { gql, useQuery } from "@apollo/client";

const GET_CUSTOMER_PORTAL = gql`
  query GetCustomerPortal {
    getCustomerPortal {
      url
    }
  }
`;

export interface CustomerPortal {
  url: string;
}

export default function HeaderNavigation() {
  const { me, logout } = useUser();
  const { push } = useRouter();
  const { data, refetch } =
    useQuery<{ getCustomerPortal: CustomerPortal }>(GET_CUSTOMER_PORTAL);

  function logoutAndRedirect() {
    logout().then(() => {
      push("/");
    });
  }

  function redirectToCustomerPortal() {
    if (data?.getCustomerPortal) {
      if (data.getCustomerPortal.url) {
        window.open(data.getCustomerPortal.url);
      }
    } else {
      refetch().then(redirectToCustomerPortal);
    }
  }

  return (
    <div className={styles.container}>
      <HeaderLogo />
      <div className={styles.account}>
        {me ? (
          <span className={styles.accountButtons}>
            <span>{me.realname}</span>
            <a href="" onClick={redirectToCustomerPortal}>
              Abonnement
            </a>
            <a href="" className="button-black" onClick={logoutAndRedirect}>
              Déconnexion
            </a>
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
  );
}
