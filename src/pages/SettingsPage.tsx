import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Download,
  FileJson,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  Upload,
  Volume2,
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { STARTER_BALANCE } from '../core/balance';
import {
  CURRENCY_LIST,
  formatCurrency,
  formatExchangeRateHint,
} from '../core/currency';
import { SavePreviewInfo } from '../core/saveSchema';
import { useCashUp } from '../state/CashUpContext';
import { AnimationIntensity, CashUpSaveData, CurrencyCode } from '../types';

export const SettingsPage: React.FC = () => {
  const {
    activeProfile,
    settings,
    prefersReducedMotion,
    updateSettings,
    exportSave,
    validateImportText,
    applyImportedSave,
    resetAllProgress,
    notify,
    playSound,
  } = useCashUp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    data: CashUpSaveData;
    preview: SavePreviewInfo;
    filename: string;
  } | null>(null);

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleSelectSaveFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    try {
      const text = await file.text();
      const validation = validateImportText(text);
      if (!validation.ok) {
        setImportError(validation.error);
        notify(
          {
            type: 'error',
            title: 'Возникла ошибка загрузки файла',
            description: validation.error,
          },
          true
        );
        return;
      }

      setPendingImport({
        data: validation.data,
        preview: validation.preview,
        filename: file.name,
      });
    } catch {
      const msg = 'Не удалось прочитать выбранный JSON-файл.';
      setImportError(msg);
      notify(
        {
          type: 'error',
          title: 'Возникла ошибка загрузки файла',
          description: msg,
        },
        true
      );
    } finally {
      e.target.value = '';
    }
  };

  const sampleAmount = activeProfile?.balance ?? STARTER_BALANCE;

  return (
    <div className="pageEnter" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h1>Настройки и сохранения</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
          Персонализируйте интерфейс CashUP и управляйте переносимыми JSON-сохранениями.
        </p>
      </div>

      {/* Section 1: Theme & Currency */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}
      >
        {/* Theme */}
        <section
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <h2>Цветовая тема</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Выберите графитовую тёмную палитру или сбалансированную дневную тему.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              onClick={() => {
                playSound('click');
                updateSettings({ theme: 'dark' });
              }}
              style={{
                padding: '14px 12px',
                borderRadius: 12,
                backgroundColor: '#111620',
                color: '#f3f6fb',
                border: `2px solid ${
                  settings.theme === 'dark' ? '#10b981' : '#334155'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontWeight: 700,
              }}
            >
              <Moon size={17} /> Тёмная тема
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click');
                updateSettings({ theme: 'light' });
              }}
              style={{
                padding: '14px 12px',
                borderRadius: 12,
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                border: `2px solid ${
                  settings.theme === 'light' ? '#059669' : '#cbd5e1'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontWeight: 700,
              }}
            >
              <Sun size={17} /> Светлая тема
            </button>
          </div>
        </section>

        {/* Currency Display */}
        <section
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <h2>Валюта счёта и конвертация</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            При смене валюты баланс, ставки, номиналы фишек и вся история автоматически пересчитываются по сбалансированному курсу.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {CURRENCY_LIST.map((cur) => {
              const active = settings.currency === cur.code;
              return (
                <button
                  key={cur.code}
                  type="button"
                  onClick={() => {
                    playSound('click');
                    updateSettings({ currency: cur.code as CurrencyCode });
                  }}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 10,
                    backgroundColor: active
                      ? 'var(--accent-primary-soft)'
                      : 'var(--bg-surface-subtle)',
                    border: `1.5px solid ${
                      active ? 'var(--accent-primary)' : 'var(--border-subtle)'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    {cur.code} ({cur.symbol})
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {cur.nameRu}
                  </span>
                  <span className="mono" style={{ fontSize: '0.66rem', color: 'var(--accent-primary)' }}>
                    {formatCurrency(sampleAmount, cur.code)}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              padding: '9px 12px',
              borderRadius: 8,
              backgroundColor: 'var(--bg-surface-subtle)',
              fontSize: '0.84rem',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>
              Текущий баланс ({formatExchangeRateHint(settings.currency)}):
            </span>
            <strong className="mono">
              {formatCurrency(sampleAmount, settings.currency)}
            </strong>
          </div>
        </section>
      </div>

      {/* Section 2: Audio, Animations & Notifications */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}
      >
        {/* Sound */}
        <section
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Volume2 size={19} style={{ color: 'var(--accent-primary)' }} />
            Звуковые эффекты
          </h2>

          <label
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <span>Включить звуки интерфейса и игр</span>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }}
            />
          </label>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: 6 }}>
              <label htmlFor="volume-range" style={{ color: 'var(--text-secondary)' }}>
                Громкость эффектов
              </label>
              <strong className="mono">{Math.round(settings.soundVolume * 100)}%</strong>
            </div>
            <input
              id="volume-range"
              type="range"
              min={0}
              max={1}
              step={0.05}
              disabled={!settings.soundEnabled}
              value={settings.soundVolume}
              onChange={(e) =>
                updateSettings({ soundVolume: parseFloat(e.target.value) }, true)
              }
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
          </div>

          <button
            type="button"
            className="btn btnSecondary btnSm"
            disabled={!settings.soundEnabled}
            onClick={() => playSound('win')}
          >
            Проверить звук
          </button>
        </section>

        {/* Animations */}
        <section
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={19} style={{ color: 'var(--accent-gold)' }} />
            Анимации и плавность
          </h2>

          <label
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <span>Игровые анимации</span>
            <input
              type="checkbox"
              checked={settings.animationsEnabled}
              onChange={(e) => updateSettings({ animationsEnabled: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }}
            />
          </label>

          <div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              Интенсивность анимаций
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {(
                [
                  { id: 'full', label: 'Полная' },
                  { id: 'balanced', label: 'Средняя' },
                  { id: 'minimal', label: 'Быстрая' },
                ] as const
              ).map((opt) => {
                const active = settings.animationIntensity === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!settings.animationsEnabled}
                    onClick={() =>
                      updateSettings({
                        animationIntensity: opt.id as AnimationIntensity,
                      })
                    }
                    className={`btn btnSm ${active ? 'btnPrimary' : 'btnSecondary'}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {prefersReducedMotion && (
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold)' }}>
              В вашей системе активна настройка prefers-reduced-motion — анимации автоматически упрощены.
            </div>
          )}
        </section>

        {/* Notifications */}
        <section
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Bell size={19} style={{ color: 'var(--accent-primary)' }} />
            Уведомления и эфир
          </h2>

          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span>Всплывающие уведомления (Toast)</span>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) =>
                updateSettings({ notificationsEnabled: e.target.checked })
              }
              style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }}
            />
          </label>

          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span>Уведомления о выигрышах раунда</span>
            <input
              type="checkbox"
              checked={settings.roundNotifications}
              disabled={!settings.notificationsEnabled}
              onChange={(e) =>
                updateSettings({ roundNotifications: e.target.checked })
              }
              style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }}
            />
          </label>

          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span>Прямой эфир активности зала</span>
            <input
              type="checkbox"
              checked={settings.npcFeedEnabled}
              onChange={(e) => updateSettings({ npcFeedEnabled: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }}
            />
          </label>
        </section>
      </div>

      {/* Section 3: JSON Save System */}
      <section
        aria-label="Управление JSON-сохранениями"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-xl)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileJson size={22} style={{ color: 'var(--accent-primary)' }} />
          <h2>Управление JSON-сохранениями</h2>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 780 }}>
          Весь ваш прогресс — профили, балансы, настройки, избранное, статистика и история раундов — автоматически сохраняется в браузере и может быть экспортирован в независимый JSON-файл для переноса между устройствами.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <button
            type="button"
            className="btn btnPrimary btnLg"
            onClick={() => exportSave('CashUP_Save')}
          >
            <Download size={18} /> Экспорт сохранения
          </button>

          <button
            type="button"
            className="btn btnSecondary btnLg"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} /> Загрузить сохранение
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleSelectSaveFile}
            data-testid="save-file-input"
          />

          <button
            type="button"
            className="btn btnDanger btnLg"
            style={{ marginLeft: 'auto' }}
            onClick={() => setResetConfirmOpen(true)}
          >
            <RotateCcw size={17} /> Сбросить прогресс
          </button>
        </div>

        {importError && (
          <div
            role="alert"
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              backgroundColor: 'var(--color-danger-soft)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: 'var(--color-danger)',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{importError}</span>
          </div>
        )}
      </section>

      {/* Import Preview & Backup Confirmation Modal */}
      <Modal
        open={Boolean(pendingImport)}
        title="Подтверждение загрузки сохранения"
        subtitle="Проверьте данные файла перед заменой текущего сохранения."
        onClose={() => setPendingImport(null)}
        wide
      >
        {pendingImport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 10,
                fontSize: '0.85rem',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Файл:</div>
                <strong>{pendingImport.filename}</strong>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Версия формата:</div>
                <strong className="mono">
                  v{pendingImport.preview.saveVersion}
                  {pendingImport.preview.migratedFromVersion
                    ? ` (миграция с v${pendingImport.preview.migratedFromVersion})`
                    : ''}
                </strong>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Дата сохранения:</div>
                <strong>
                  {new Date(pendingImport.preview.exportedAt).toLocaleString('ru-RU')}
                </strong>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Всего раундов:</div>
                <strong className="mono">{pendingImport.preview.totalRounds}</strong>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, marginBottom: 8 }}>
                Профили в файле ({pendingImport.preview.profileCount}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pendingImport.preview.profilesSummary.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 8,
                      backgroundColor: 'var(--bg-surface-subtle)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span>
                      <strong>{p.nickname}</strong>{' '}
                      <span className="mono" style={{ color: 'var(--text-muted)' }}>
                        ({p.id})
                      </span>
                    </span>
                    <span className="mono">
                      Баланс: {formatCurrency(p.balance, settings.currency)} · Раундов: {p.rounds}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                backgroundColor: 'var(--accent-gold-soft)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                fontSize: '0.84rem',
              }}
            >
              <span>Рекомендуем создать резервную копию вашего текущего сохранения перед заменой.</span>
              <button
                type="button"
                className="btn btnSecondary btnSm"
                onClick={() => exportSave('CashUP_Backup')}
              >
                <Download size={14} /> Скачать резервную копию
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btnSecondary"
                onClick={() => setPendingImport(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn btnPrimary"
                onClick={() => {
                  applyImportedSave(pendingImport.data);
                  setPendingImport(null);
                }}
              >
                Подтвердить и восстановить
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reset All Progress Confirmation Modal */}
      <Modal
        open={resetConfirmOpen}
        title="Сбросить весь прогресс?"
        subtitle="Все профили, балансы счетов, история и статистика будут очищены."
        onClose={() => setResetConfirmOpen(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.85rem',
            }}
          >
            <span>Сохранить резервную копию перед очисткой?</span>
            <button
              type="button"
              className="btn btnSecondary btnSm"
              onClick={() => exportSave('CashUP_Backup')}
            >
              <Download size={14} /> Резервная копия
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="btn btnSecondary"
              onClick={() => setResetConfirmOpen(false)}
            >
              Отмена
            </button>
            <button
              type="button"
              className="btn btnDanger"
              onClick={() => {
                resetAllProgress();
                setResetConfirmOpen(false);
              }}
            >
              Подтвердить полный сброс
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
