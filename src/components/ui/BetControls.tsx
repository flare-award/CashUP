import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  DEFAULT_BET_USD,
  EMERGENCY_REFILL_AMOUNT,
  EMERGENCY_REFILL_THRESHOLD,
  MIN_BET_USD,
} from '../../core/balance';
import {
  convertFromUsd,
  convertToUsd,
  CURRENCIES,
  formatNumber,
  roundCurrency,
} from '../../core/currency';
import { useCashUp } from '../../state/CashUpContext';
import styles from './BetControls.module.css';

interface BetControlsProps {
  /** Wager stored in internal base USD */
  wager: number;
  onChange: (nextUsd: number) => void;
  /** Minimum wager in base USD (default $0.10) */
  min?: number;
  /** Maximum wager in base USD */
  max?: number;
  disabled?: boolean;
  label?: string;
}

export const BetControls: React.FC<BetControlsProps> = ({
  wager,
  onChange,
  min = MIN_BET_USD,
  max = 100000,
  disabled = false,
  label = 'Сумма ставки',
}) => {
  const { activeProfile, settings, formatAmount, claimEmergencyRefill, playSound } =
    useCashUp();
  const balance = activeProfile?.balance ?? 0;
  const currencyCfg = CURRENCIES[settings.currency];

  const displayValue = convertFromUsd(wager, settings.currency);
  const [inputText, setInputText] = useState<string>(() =>
    Number.isFinite(displayValue) ? String(displayValue) : ''
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputText(Number.isFinite(displayValue) ? String(displayValue) : '');
    }
  }, [displayValue, settings.currency, isFocused]);

  const effectiveMax = Math.max(min, Math.min(max, balance > 0 ? balance : max));
  const isInvalid =
    wager <= 0 || wager - balance > 0.00001 || !Number.isFinite(wager);

  const applyUsd = (nextUsd: number) => {
    playSound('click');
    const clamped = Math.max(
      min,
      Math.min(effectiveMax, roundCurrency(nextUsd))
    );
    onChange(clamped);
    setInputText(String(convertFromUsd(clamped, settings.currency)));
  };

  const stepUsd = convertToUsd(currencyCfg.quickStepDisplay, settings.currency);
  const quickStepLabel =
    currencyCfg.position === 'prefix'
      ? `+${currencyCfg.symbol}${formatNumber(currencyCfg.quickStepDisplay)}`
      : `+${formatNumber(currencyCfg.quickStepDisplay)} ${currencyCfg.symbol}`;

  const canRefill =
    activeProfile &&
    activeProfile.balance < EMERGENCY_REFILL_THRESHOLD &&
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

      <div
        className={`${styles.inputGroup} ${
          isInvalid && !disabled ? styles.inputError : ''
        }`}
      >
        <span className={styles.currencyTag}>{currencyCfg.symbol}</span>
        <input
          id="bet-amount-input"
          type="number"
          min={convertFromUsd(min, settings.currency)}
          step="any"
          disabled={disabled}
          value={inputText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setInputText(Number.isFinite(displayValue) ? String(displayValue) : '');
          }}
          onChange={(e) => {
            const raw = e.target.value;
            setInputText(raw);
            const parsed = parseFloat(raw);
            if (Number.isFinite(parsed) && parsed >= 0) {
              onChange(convertToUsd(parsed, settings.currency));
            } else {
              onChange(0);
            }
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
          onClick={() => applyUsd(min)}
        >
          Мин
        </button>
        <button
          type="button"
          className={styles.quickBtn}
          disabled={disabled}
          onClick={() => applyUsd(Math.max(min, wager / 2))}
        >
          1/2
        </button>
        <button
          type="button"
          className={styles.quickBtn}
          disabled={disabled}
          onClick={() => applyUsd(wager * 2)}
        >
          2×
        </button>
        <button
          type="button"
          className={styles.quickBtn}
          disabled={disabled}
          onClick={() => applyUsd(wager + stepUsd)}
        >
          {quickStepLabel}
        </button>
        <button
          type="button"
          className={styles.quickBtn}
          disabled={disabled || balance <= 0}
          onClick={() => applyUsd(balance)}
        >
          Макс
        </button>
      </div>

      {!disabled &&
        wager - balance > 0.00001 &&
        balance >= EMERGENCY_REFILL_THRESHOLD && (
          <div className={styles.errorNote}>Сумма превышает доступный баланс.</div>
        )}

      {canRefill && !disabled && (
        <div className={styles.refillBox}>
          <span>Недостаточно средств на балансе.</span>
          <button
            type="button"
            className="btn btnSm btnGold"
            onClick={() => {
              const r = claimEmergencyRefill();
              if (r.ok) onChange(DEFAULT_BET_USD);
            }}
          >
            <RefreshCw size={13} /> +{formatAmount(EMERGENCY_REFILL_AMOUNT)}
          </button>
        </div>
      )}
    </div>
  );
};
