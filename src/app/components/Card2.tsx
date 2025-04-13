import styles from './Card2.module.css';
import StagePost from './StagePost';

export default function Card2() {
  return (
    <div className={styles.card}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Most Significant GETs</h2>
      <div className={styles.content}>
        <StagePost position="top" cardType="gets" />
        <StagePost position="middle" cardType="gets" />
        <StagePost position="bottom" cardType="gets" />
      </div>
    </div>
  );
} 