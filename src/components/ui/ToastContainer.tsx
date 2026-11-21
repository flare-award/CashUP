import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useCashUp } from '../../state/CashUpContext';
import styles from './ToastContainer.module.css';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useCashUp();

  if (toasts.length === 0) return null;

  const renderIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      case 'error':
        return <XCircle size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  return (
    <div className={styles.viewport} role="region" aria-label="Уведомления">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${styles[t.type] ?? styles.info}`}
          role="status"
        >
          <span className={styles.iconWrap}>{renderIcon(t.type)}</span>
          <div className={styles.body}>
            <div className={styles.title}>{t.title}</div>
            {t.description && <div className={styles.desc}>{t.description}</div>}
          </div>
          <button
            type="button"
            className={styles.dismiss}
            onClick={() => dismissToast(t.id)}
            aria-label="Скрыть уведомление"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
};
