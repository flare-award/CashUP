import React, { useRef, useState } from 'react';
import { Sparkles, Upload } from 'lucide-react';
import { STARTER_BALANCE } from '../../core/balance';
import { useCashUp } from '../../state/CashUpContext';
import { AvatarId } from '../../types';
import { AVATAR_CATALOG, AvatarIcon } from '../ui/AvatarIcon';
import { Modal } from '../ui/Modal';
import styles from './OnboardingModal.module.css';

export const OnboardingModal: React.FC = () => {
  const {
    state,
    createProfile,
    formatAmount,
    validateImportText,
    applyImportedSave,
    playSound,
  } = useCashUp();

  const [nickname, setNickname] = useState('');
  const [avatarId, setAvatarId] = useState<AvatarId>('emerald-diamond');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isOpen = state.profiles.length === 0;
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nickname.trim() || 'Игрок';
    createProfile(clean, avatarId);
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
      subtitle="Создайте локальный игровой профиль на вашем устройстве. Вся валюта полностью виртуальная и не имеет денежной стоимости."
      hideClose
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
          <div className={styles.avatarGrid} role="radiogroup" aria-label="Аватар профиля">
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
                  <AvatarIcon avatarId={item.id} size={42} />
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.bonusNotice}>
          <Sparkles size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
          <div>
            При создании нового профиля единоразово начисляется стартовый виртуальный баланс{' '}
            <strong className="mono">{formatAmount(STARTER_BALANCE)}</strong>.
          </div>
        </div>

        <button
          type="submit"
          className="btn btnPrimary btnLg"
          style={{ width: '100%', marginTop: 18 }}
        >
          Создать профиль и начать
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
