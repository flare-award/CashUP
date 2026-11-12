import React, { useRef, useState } from 'react';
import { Upload, Wallet } from 'lucide-react';
import { STARTER_BALANCE } from '../../core/balance';
import {
  CURRENCY_LIST,
  formatCurrency,
  formatExchangeRateHint,
} from '../../core/currency';
import { useCashUp } from '../../state/CashUpContext';
import { AvatarId, CurrencyCode } from '../../types';
import { AVATAR_CATALOG, AvatarIcon } from '../ui/AvatarIcon';
import { Modal } from '../ui/Modal';
import styles from './OnboardingModal.module.css';

export const OnboardingModal: React.FC = () => {
  const {
    state,
    settings,
    createProfile,
    validateImportText,
    applyImportedSave,
    playSound,
  } = useCashUp();

  const [nickname, setNickname] = useState('');
  const [avatarId, setAvatarId] = useState<AvatarId>('emerald-diamond');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(
    settings.currency ?? 'USD'
  );
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isOpen = state.profiles.length === 0;
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nickname.trim() || 'Игрок';
    createProfile(clean, avatarId, selectedCurrency);
    setNickname('');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      const res = validateImportText(text);
      if (!res.ok) {
        setImportError(res.error);
        return;
      }
      applyImportedSave(res.data);
    } catch {
      setImportError('Не удалось прочитать выбранный файл.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <Modal
      open={isOpen}
      title="Добро пожаловать в CashUP"
      subtitle="Настройте игровой профиль, выберите удобную валюту счёта и получите стартовый баланс."
      hideClose
      wide
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label
            htmlFor="onboarding-nickname"
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: 6,
              color: 'var(--text-secondary)',
            }}
          >
            Ваш никнейм
          </label>
          <input
            id="onboarding-nickname"
            type="text"
            className="inputField"
            placeholder="Например: LuckyPlayer"
            maxLength={28}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <span
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
            }}
          >
            Выберите аватар профиля
          </span>
          <div
            className={styles.avatarGrid}
            role="radiogroup"
            aria-label="Аватар профиля"
          >
            {AVATAR_CATALOG.map((item) => {
              const selected = item.id === avatarId;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={item.label}
                  className={`${styles.avatarOption} ${
                    selected ? styles.avatarSelected : ''
                  }`}
                  onClick={() => {
                    playSound('click');
                    setAvatarId(item.id);
                  }}
                >
                  <AvatarIcon avatarId={item.id} size={40} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Currency Selector + Live Starting Balance Preview */}
        <div className={styles.currencySection}>
          <span
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
            }}
          >
            Валюта счёта и стартовый баланс
          </span>

          <div className={styles.currencyLayout}>
            <div
              className={styles.currencyGrid}
              role="radiogroup"
              aria-label="Валюта счёта"
            >
              {CURRENCY_LIST.map((cur) => {
                const active = cur.code === selectedCurrency;
                return (
                  <button
                    key={cur.code}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`${styles.currencyOption} ${
                      active ? styles.currencySelected : ''
                    }`}
                    onClick={() => {
                      playSound('click');
                      setSelectedCurrency(cur.code);
                    }}
                  >
                    <span className={styles.currTop}>
                      {cur.code} ({cur.symbol})
                    </span>
                    <span className={styles.currSub}>{cur.nameRu}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.starterPreviewCard} aria-live="polite">
              <div className={styles.previewCaption}>
                <Wallet
                  size={13}
                  style={{ verticalAlign: '-2px', marginRight: 5 }}
                />
                Стартовый баланс
              </div>
              <div className={`${styles.previewValue} tabular`}>
                {formatCurrency(STARTER_BALANCE, selectedCurrency)}
              </div>
              <div className={styles.previewRate}>
                {formatExchangeRateHint(selectedCurrency)}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btnPrimary btnLg"
          style={{ width: '100%', marginTop: 18 }}
        >
          Создать профиль и начать ({formatCurrency(STARTER_BALANCE, selectedCurrency)})
        </button>
      </form>

      <div className={styles.divider}>
        <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
          Уже играли ранее на другом устройстве?
        </span>
        <button
          type="button"
          className="btn btnSecondary btnSm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={14} /> Загрузить сохранение
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
      </div>

      {importError && <div className={styles.errorBox}>{importError}</div>}
    </Modal>
  );
};
