import React from 'react';
import { RefreshCw } from 'lucide-react';
import { CURRENCIES, roundCurrency } from '../../core/currency';
import { useCashUp } from '../../state/CashUpContext';
import styles from './BetControls.module.css';

interface BetControlsProps {
  wager: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
}

export const BetControls: React.FC<BetControlsProps> = ({
  wager,
  onChange,
  min = 10,
  max = 100000,
  disabled = false,
  label = 'Виртуальная ставка',
}) => {
  const { activeProfile, settings, formatAmount, claimEmergencyRefill, playSound } =
    useCashUp();
  const balance = activeProfile?.balance ?? 0;
  const currencyCfg = CURRENCIES[settings.currency];

  const effectiveMax = Math.max(min, Math.min(max, balance > 0 ? balance : max));
  const isInvalid = wager <= 0 || wager > balance || !Number.isFinite(wager);

  const apply = (nextVal: number) => {
    playSound('click');
    const clamped = Math.max(1, Math.min(effectiveMax, roundCurrency(nextVal)));
    onChange(clamped);
  };

  const canRefill =
    activeProfile &&
    activeProfile.balance < 1 &&
    Object.keys(activeProfile.pendingRounds).length === 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.labelRow}>
        <label htmlFor="bet-amount-input">{label}</label>
        <span>
          Доступно:{' '}
          <strong className={`${styles.balanceHint} tabular`}>
            {formatAmount(balance)}
          </strong>
        </span>
      </div>

      <div className={`${styles.inputGroup} ${isInvalid && !disabled ? styles.inputError : ''}`}>
        <span className={styles.currencyTag}>{currencyCfg.symbol}</span>
        <input
          id="bet-amount-input"
          type="number"
          min={1}
          step={5}
          disabled={disabled}
          value={Number.isFinite(wager) ? wager : ''}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value);
            onChange(Number.isFinite(parsed) ? Math.max(0, roundCurrency(parsed)) : 0);
          }}
          className={styles.numberInput}
          aria-label={label}
        />
      </div>

      <div className={styles.quickRow}>
        <button
          type="button"
          className={styles.quickBtn}
          disabled={disabled}
          onClick={() => apply(min)}
        >
          Мин
        </button>
        <button
          type="button"
          className={styles.quickBtn}
          disabled={disabled}
          onClick={() => apply(Math.max(1, Math.floor(wager / 2)))}
        >
          1/2
        </button>
        <button
          type="button"
          className={styles.quickBtn}
          disabled={disabled}
          onClick={() => apply(wager * 2)}
        >
          2×
        </button>
        <button
          type="button"
          className={styles.quickBtn}
          disabled={disabled}
          onClick={() => apply(wager + 50)}
        >
          +50
        </button>
        <button
          type="button"
          className={styles.quickBtn}
          disabled={disabled || balance <= 0}
          onClick={() => apply(balance)}
        >
          Макс
        </button>
      </div>

      {!disabled && wager > balance && balance >= 1 && (
        <div className={styles.errorNote}>Сумма превышает доступный виртуальный баланс.</div>
      )}

      {canRefill && !disabled && (
        <div className={styles.refillBox}>
          <span>Виртуальный баланс исчерпан.</span>
          <button
            type="button"
            className="btn btnSm btnGold"
            onClick={() => {
              const r = claimEmergencyRefill();
              if (r.ok) onChange(25);
            }}
          >
            <RefreshCw size={13} /> +250 ед.
          </button>
        </div>
      )}
    </div>
  );
};
