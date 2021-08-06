import styles from "./HeaderLogo.module.scss";

export default function HeaderLogo() {
  return (
    <div role="banner" className={styles.aCoachLogo}>
      <span className={styles.redA}>A.</span>Coach
    </div>
  );
}
