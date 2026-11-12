import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Download,
  Gamepad2,
  Radio,
  Settings,
  ShieldCheck,
  TrendingUp,
  User,
} from 'lucide-react';
import { PromoShowcase } from '../components/ads/PromoShowcase';
import { GameCard } from '../components/cards/GameCard';
import { AvatarIcon } from '../components/ui/AvatarIcon';
import { formatExchangeRateHint } from '../core/currency';
import { formatNpcEventText } from '../core/npc';
import { GAME_CATALOG } from '../games/registry';
import { useCashUp } from '../state/CashUpContext';
import styles from './HomePage.module.css';

export const HomePage: React.FC = () => {
  const {
    state,
    activeProfile,
    settings,
    formatAmount,
    exportSave,
    playSound,
  } = useCashUp();

  const popularGames = useMemo(
    () => GAME_CATALOG.filter((g) => g.featured).slice(0, 6),
    []
  );

  const recentPlayedGames = useMemo(() => {
    if (!activeProfile || activeProfile.recentGames.length === 0) return [];
    return activeProfile.recentGames
      .map((id) => GAME_CATALOG.find((g) => g.id === id))
      .filter((g): g is (typeof GAME_CATALOG)[number] => Boolean(g))
      .slice(0, 4);
  }, [activeProfile]);

  const recommendedGames = useMemo(
    () =>
      GAME_CATALOG.filter((g) => g.recommended && !g.featured)
        .concat(GAME_CATALOG.filter((g) => !g.featured && !g.recommended).slice(0, 2))
        .slice(0, 4),
    []
  );

  const stats = activeProfile?.stats;
  const winRate =
    stats && stats.totalRounds > 0
      ? ((stats.wins / stats.totalRounds) * 100).toFixed(1)
      : '0.0';

  return (
    <div className={`${styles.page} pageEnter`}>
      {/* Greeting, CashUP branding, User Balance & Quick Profile/Settings Access */}
      <section className={styles.hero} aria-label="Приветствие и сводка баланса">
        <div>
          <span className="badge badgeEmerald">
            <ShieldCheck size={13} /> Игровой клуб CashUP · Честный Web Crypto RNG
          </span>
          <h1 className={styles.heroTitle}>
            Привет, {activeProfile?.nickname ?? 'Игрок'}!
          </h1>
          <p className={styles.heroDesc}>
            Исследуйте 15 фирменных игровых залов с единым мультивалютным счётом, мгновенной конвертацией по курсу и сохранением истории в JSON.
          </p>

          <div className={styles.heroActions}>
            <Link
              to="/catalog"
              onClick={() => playSound('select')}
              className="btn btnPrimary btnLg"
            >
              <Gamepad2 size={18} /> Открыть каталог игр
            </Link>
            <Link
              to="/profile"
              onClick={() => playSound('click')}
              className="btn btnSecondary btnLg"
            >
              <User size={17} /> Профиль
            </Link>
            <Link
              to="/settings"
              onClick={() => playSound('click')}
              className="btn btnSecondary btnLg"
            >
              <Settings size={17} /> Настройки
            </Link>
          </div>
        </div>

        <div className={styles.heroBalanceCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Текущий баланс счёта
            </span>
            <span className="badge badgeGold">{settings.currency}</span>
          </div>

          <div className={`${styles.heroBalanceAmount} tabular`}>
            {formatAmount(activeProfile?.balance ?? 0)}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} className="mono">
            {formatExchangeRateHint(settings.currency)}
          </div>

          <div className={styles.quickLinksRow}>
            <button
              type="button"
              className="btn btnSecondary btnSm"
              onClick={() => exportSave()}
            >
              <Download size={14} /> Экспорт сохранения
            </button>
            <Link
              to="/history"
              onClick={() => playSound('click')}
              className="btn btnGhost btnSm"
            >
              История операций →
            </Link>
          </div>
        </div>
      </section>

      {/* Последние сыгранные игры */}
      {recentPlayedGames.length > 0 && (
        <section aria-label="Последние сыгранные игры">
          <div className={styles.sectionHeader}>
            <h2>Последние сыгранные игры</h2>
            <Link to="/history" className={styles.sectionLink}>
              История раундов →
            </Link>
          </div>
          <div className={styles.gamesGrid}>
            {recentPlayedGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Популярные игры */}
      <section aria-label="Популярные игры">
        <div className={styles.sectionHeader}>
          <h2>Популярные игры</h2>
          <Link to="/catalog" className={styles.sectionLink}>
            Все 15 игр →
          </Link>
        </div>
        <div className={styles.gamesGrid}>
          {popularGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* Editorial Luxury Ad Showcase */}
      <PromoShowcase variant="banner" initialIndex={1} />

      {/* Рекомендуемые игры */}
      <section aria-label="Рекомендуемые игры">
        <div className={styles.sectionHeader}>
          <h2>Рекомендуемые механики</h2>
          <Link to="/catalog" className={styles.sectionLink}>
            Каталог →
          </Link>
        </div>
        <div className={styles.gamesGrid}>
          {recommendedGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* Игровая статистика & Активность зала */}
      <div className={styles.bottomSplit}>
        <section className={styles.panelCard} aria-label="Игровая статистика">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} style={{ color: 'var(--accent-primary)' }} />
              Ваша статистика
            </h2>
            <Link to="/statistics" className={styles.sectionLink}>
              Подробные графики →
            </Link>
          </div>

          <div className={styles.kpiGrid}>
            <div className={styles.kpiItem}>
              <div className={styles.kpiLabel}>Сыграно раундов</div>
              <div className={styles.kpiVal}>{stats?.totalRounds ?? 0}</div>
            </div>
            <div className={styles.kpiItem}>
              <div className={styles.kpiLabel}>Процент побед</div>
              <div className={styles.kpiVal} style={{ color: 'var(--accent-primary)' }}>
                {winRate}%
              </div>
            </div>
            <div className={styles.kpiItem}>
              <div className={styles.kpiLabel}>Крупнейший выигрыш</div>
              <div className={styles.kpiVal} style={{ color: 'var(--accent-gold)' }}>
                {formatAmount(stats?.biggestWin ?? 0)}
              </div>
            </div>
            <div className={styles.kpiItem}>
              <div className={styles.kpiLabel}>Лучшая серия побед</div>
              <div className={styles.kpiVal}>{stats?.longestWinStreak ?? 0}</div>
            </div>
          </div>

          {recentPlayedGames.length === 0 && (
            <div
              style={{
                marginTop: 14,
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-surface-subtle)',
                fontSize: '0.83rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Activity size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>
                Сыграйте первый раунд в любой игре — статистика и недавние сессии обновятся автоматически.
              </span>
            </div>
          )}
        </section>

        <section className={styles.panelCard} aria-label="Прямой эфир зала">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Radio size={19} style={{ color: 'var(--accent-gold)' }} />
              Прямой эфир зала
            </h2>
            <span className="badge badgeEmerald">LIVE</span>
          </div>

          <div className={styles.npcList}>
            {state.npcHistory.slice(0, 6).map((ev) => (
              <div key={ev.id} className={styles.npcRow}>
                <div className={styles.npcLeft}>
                  <AvatarIcon avatarId={ev.avatarId} size={30} />
                  <div style={{ minWidth: 0 }}>
                    <div>
                      <strong>{ev.nickname}</strong>{' '}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        · {ev.styleLabel}
                      </span>
                    </div>
                    <div
                      style={{
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatNpcEventText(ev, settings.currency)}
                    </div>
                  </div>
                </div>
                <Link
                  to={`/games/${ev.gameId}`}
                  className="btn btnSecondary btnSm"
                  style={{ flexShrink: 0 }}
                >
                  К игре
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
