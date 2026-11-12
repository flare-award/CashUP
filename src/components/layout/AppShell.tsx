import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Clock,
  Download,
  Gamepad2,
  Home,
  Menu,
  Moon,
  Settings,
  Sun,
  User,
  Volume2,
  VolumeX,
  Wallet,
  X,
} from 'lucide-react';
import {
  CURRENCY_LIST,
  formatExchangeRateHint,
  formatSignedCurrency,
} from '../../core/currency';
import { useCashUp } from '../../state/CashUpContext';
import { CurrencyCode, GameId } from '../../types';
import { PromoShowcase } from '../ads/PromoShowcase';
import { AvatarIcon } from '../ui/AvatarIcon';
import { ToastContainer } from '../ui/ToastContainer';
import { OnboardingModal } from './OnboardingModal';
import styles from './AppShell.module.css';

const SHORT_GAME_NAMES: Record<GameId, string> = {
  roulette: 'Рулетка',
  slots: 'Однорукий бандит',
  'red-black': 'Красное или чёрное',
  dice: 'Кости',
  shells: 'Напёрстки',
  upgrade: 'Апгрейд',
  poker: 'Покер Hold’em',
  blackjack: 'Блэкджек',
  baccarat: 'Баккара',
  plinko: 'Plinko',
  mines: 'Мины',
  'higher-lower': 'Higher or Lower',
  'risk-roulette': 'Риск-рулетка',
  keno: 'Кено',
  crash: 'Crash: Орбита',
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    state,
    activeProfile,
    settings,
    lastBalanceSignal,
    updateSettings,
    updateUiState,
    switchProfile,
    exportSave,
    formatAmount,
    playSound,
  } = useCashUp();

  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const walletRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMobileNavOpen(false);
    setWalletOpen(false);
    setProfileMenuOpen(false);
    updateUiState({ lastRoute: location.pathname });
  }, [location.pathname, updateUiState]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (walletRef.current && !walletRef.current.contains(e.target as Node)) {
        setWalletOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`;

  return (
    <div className={styles.shell}>
      {mobileNavOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${mobileNavOpen ? styles.sidebarOpen : ''}`}
        aria-label="Основная навигация"
      >
        <div className={styles.sidebarBrand}>
          <Link
            to="/"
            className={styles.logoLink}
            onClick={() => playSound('click')}
          >
            <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
              <rect width="64" height="64" rx="15" fill="#102920" />
              <rect
                x="3"
                y="3"
                width="58"
                height="58"
                rx="13"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
              />
              <polygon points="32,13 48,32 32,51 16,32" fill="#10b981" />
              <circle cx="32" cy="32" r="6" fill="#f59e0b" />
            </svg>
            <span className={styles.logoText}>
              Cash<span className={styles.logoAccent}>UP</span>
            </span>
          </Link>

          {mobileNavOpen && (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setMobileNavOpen(false)}
              aria-label="Закрыть меню"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className={styles.navScroll}>
          <nav className={styles.navGroup}>
            <div className={styles.navSectionLabel}>Навигация</div>
            <NavLink to="/" end className={navClass} onClick={() => playSound('click')}>
              <span className={styles.navItemLeft}>
                <Home size={18} /> Главная
              </span>
            </NavLink>
            <NavLink to="/catalog" className={navClass} onClick={() => playSound('click')}>
              <span className={styles.navItemLeft}>
                <Gamepad2 size={18} /> Каталог игр
              </span>
              <span className="badge badgeEmerald">15</span>
            </NavLink>
            <NavLink to="/statistics" className={navClass} onClick={() => playSound('click')}>
              <span className={styles.navItemLeft}>
                <BarChart3 size={18} /> Статистика
              </span>
            </NavLink>
            <NavLink to="/history" className={navClass} onClick={() => playSound('click')}>
              <span className={styles.navItemLeft}>
                <Clock size={18} /> История игр
              </span>
            </NavLink>
            <NavLink to="/profile" className={navClass} onClick={() => playSound('click')}>
              <span className={styles.navItemLeft}>
                <User size={18} /> Профиль
              </span>
            </NavLink>
            <NavLink to="/settings" className={navClass} onClick={() => playSound('click')}>
              <span className={styles.navItemLeft}>
                <Settings size={18} /> Настройки
              </span>
            </NavLink>
          </nav>

          {activeProfile && activeProfile.favoriteGames.length > 0 && (
            <div className={styles.navGroup}>
              <div className={styles.navSectionLabel}>Избранные игры</div>
              {activeProfile.favoriteGames.slice(0, 5).map((gid) => (
                <NavLink
                  key={gid}
                  to={`/games/${gid}`}
                  className={navClass}
                  onClick={() => playSound('select')}
                >
                  <span className={styles.navItemLeft}>{SHORT_GAME_NAMES[gid]}</span>
                </NavLink>
              ))}
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <PromoShowcase variant="sidebar" initialIndex={0} />
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <button
            type="button"
            className="btn btnSecondary btnSm"
            style={{ width: '100%' }}
            onClick={() => exportSave()}
          >
            <Download size={15} /> Экспорт сохранения
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className={styles.mainColumn}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={() => setMobileNavOpen(true)}
              aria-label="Открыть меню навигации"
            >
              <Menu size={20} />
            </button>

            <div className={styles.virtualBadge}>
              <span className={styles.virtualDot} />
              <span className="mono">{formatExchangeRateHint(settings.currency)}</span>
            </div>
          </div>

          <div className={styles.headerRight}>
            {/* Balance & Ledger Popover */}
            <div ref={walletRef} style={{ position: 'relative' }}>
              <div className={styles.balanceBox}>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setWalletOpen((v) => !v);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    textAlign: 'left',
                  }}
                  aria-label="Баланс счёта и последние операции"
                >
                  <Wallet size={17} style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <span className={styles.balanceLabel}>Баланс</span>
                    <span className={`${styles.balanceValue} tabular`}>
                      {formatAmount(activeProfile?.balance ?? 0)}
                    </span>
                  </div>
                </button>

                <select
                  aria-label="Валюта счёта"
                  className={styles.currencySelect}
                  value={settings.currency}
                  onChange={(e) => {
                    playSound('click');
                    updateSettings({ currency: e.target.value as CurrencyCode }, true);
                  }}
                >
                  {CURRENCY_LIST.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>

                {lastBalanceSignal && settings.animationsEnabled && (
                  <span
                    key={lastBalanceSignal.id}
                    className={`${styles.deltaFloat} ${
                      lastBalanceSignal.delta > 0 ? styles.deltaPlus : styles.deltaMinus
                    }`}
                  >
                    {formatSignedCurrency(lastBalanceSignal.delta, settings.currency)}
                  </span>
                )}
              </div>

              {walletOpen && activeProfile && (
                <div className={styles.popover} role="dialog" aria-label="Последние операции баланса">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <strong style={{ fontSize: '0.9rem' }}>Последние операции</strong>
                    <span className="badge badgeEmerald">{settings.currency}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 240, overflowY: 'auto' }}>
                    {activeProfile.ledger.slice(0, 6).map((op) => (
                      <div
                        key={op.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 8,
                          fontSize: '0.8rem',
                          padding: '6px 8px',
                          borderRadius: 6,
                          backgroundColor: 'var(--bg-surface)',
                        }}
                      >
                        <span
                          style={{
                            color: 'var(--text-secondary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {op.description}
                        </span>
                        <span
                          className="mono"
                          style={{
                            fontWeight: 700,
                            color:
                              op.amount >= 0
                                ? 'var(--accent-primary)'
                                : 'var(--color-danger)',
                            flexShrink: 0,
                          }}
                        >
                          {formatSignedCurrency(op.amount, settings.currency)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <Link
                      to="/history"
                      style={{ color: 'var(--accent-primary)', fontWeight: 600 }}
                    >
                      Все операции →
                    </Link>
                    <Link
                      to="/settings"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Валюта: {settings.currency}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Sound Quick Toggle */}
            <button
              type="button"
              className={`${styles.iconBtn} ${styles.iconBtnHideMobile}`}
              onClick={() =>
                updateSettings({ soundEnabled: !settings.soundEnabled }, true)
              }
              aria-label={settings.soundEnabled ? 'Выключить звук' : 'Включить звук'}
              title={settings.soundEnabled ? 'Звук включён' : 'Звук выключен'}
            >
              {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {/* Theme Quick Toggle */}
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => {
                playSound('click');
                updateSettings(
                  { theme: settings.theme === 'dark' ? 'light' : 'dark' },
                  true
                );
              }}
              aria-label={
                settings.theme === 'dark'
                  ? 'Включить светлую тему'
                  : 'Включить тёмную тему'
              }
              title={settings.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            >
              {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Profile Switcher Pill */}
            {activeProfile && (
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className={styles.profilePill}
                  onClick={() => {
                    playSound('click');
                    setProfileMenuOpen((v) => !v);
                  }}
                  aria-label={`Профиль ${activeProfile.nickname}`}
                >
                  <AvatarIcon avatarId={activeProfile.avatarId} size={28} />
                  <span className={styles.profileName}>{activeProfile.nickname}</span>
                </button>

                {profileMenuOpen && (
                  <div className={styles.popover} role="dialog" aria-label="Выбор профиля">
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                      Профили ({state.profiles.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                      {state.profiles.map((p) => {
                        const isCurrent = p.id === activeProfile.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              switchProfile(p.id);
                              setProfileMenuOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                              padding: '7px 9px',
                              borderRadius: 8,
                              backgroundColor: isCurrent
                                ? 'var(--accent-primary-soft)'
                                : 'var(--bg-surface)',
                              border: `1px solid ${
                                isCurrent ? 'var(--border-accent)' : 'var(--border-subtle)'
                              }`,
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <AvatarIcon avatarId={p.avatarId} size={24} />
                              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                {p.nickname}
                              </span>
                            </span>
                            <span className="mono" style={{ fontSize: '0.8rem' }}>
                              {formatAmount(p.balance)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link
                        to="/profile"
                        className="btn btnSecondary btnSm"
                        style={{ flex: 1 }}
                      >
                        Управление
                      </Link>
                      <Link
                        to="/settings"
                        className="btn btnGhost btnSm"
                        style={{ flex: 1 }}
                      >
                        Настройки
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main className={styles.contentArea}>{children}</main>
      </div>

      <OnboardingModal />
      <ToastContainer />
    </div>
  );
};
