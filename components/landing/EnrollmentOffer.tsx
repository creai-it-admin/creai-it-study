import styles from './EnrollmentOffer.module.css';

export function EnrollmentOffer({ dark = false }: { dark?: boolean }) {
  return <aside className={`${styles.offer} ${dark ? styles.dark : ''}`} aria-label="9월 모집 참가비 혜택">
    <span className={styles.deadline}>9월 30일까지 신청 시</span>
    <div className={styles.price}>
      <span className={styles.original}>정가 <s>30만 원</s></span>
      <span className={styles.arrow} aria-hidden="true">→</span>
      <strong>10만 원</strong>
    </div>
    <span className={styles.detail}>4주 Foundation Education 전체 참가비 · 1인 기준</span>
    <small className={styles.terms}>2026년 9월 30일까지 접수된 신청에 적용됩니다.</small>
  </aside>;
}
