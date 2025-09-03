// components/SearchForm/StatusBar.jsx
import CircularProgress from '@mui/material/CircularProgress';
import styles from './SearchForm.module.sass';

const StatusBar = ({
  retriesForThisCountry,
  isLoading,
  triedDuringWait,
  isWaiting,
  remainingSeconds,
  info,
  error,
}) => {
  return (
    <div className={styles.statusBar}>
      {typeof retriesForThisCountry === 'number' && retriesForThisCountry <= 0 && !isLoading && (
        <div className={styles.error}>Ліміт спроб оновлення вичерпано.</div>
      )}

      {isLoading && (
        <div className={styles.loaderInline}>
          <CircularProgress size={20} />
          <span className={styles.loaderText}>Завантаження...</span>
        </div>
      )}

      {triedDuringWait && isWaiting && (
        <div className={styles.info}>Зачекайте {remainingSeconds} сек...</div>
      )}

      {info && <div className={styles.info}>{info}</div>}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default StatusBar;
