import styles from './EnrollmentOffer.module.css';

export function EnrollmentOffer({ dark = false }: { dark?: boolean }) {
  return <aside className={`${styles.offer} ${dark ? styles.dark : ''}`} aria-label="참가비">
    <span className={styles.label}>참가비</span>
    <strong className={styles.price}>10만 원</strong>
    <span className={styles.detail}>4주 Foundation Education 전체 · 1인 기준</span>
  </aside>;
}
