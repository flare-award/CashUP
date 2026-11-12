import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ShieldCheck, Star } from 'lucide-react';
import { formatSignedCurrency } from '../../core/currency';
import { GameMetadata } from '../../games/types';
import { useCashUp } from '../../state/CashUpContext';
import { Modal } from './Modal';
import styles from './GameLayout.module.css';

interface GameLayoutProps {
  game: GameMetadata;
  children: React.ReactNode;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ game, children }) => {
  const { activeProfile, settings, toggleFavoriteGame, playSound } = useCashUp();
  const [rulesOpen, setRulesOpen] = useState(false);

  const isFav = activeProfile?.favoriteGames.includes(game.id) ?? false;
  const gameHistory =
    activeProfile?.history.filter((h) => h.gameId === game.id).slice(0, 6) ?? [];

  return (
    <div className={`${styles.wrapper} pageEnter`}>
      <div className={styles.topBar}>
        <div className={styles.leftGroup}>
          <Link
            to="/catalog"
            onClick={() => playSound('click')}
            className={styles.backLink}
          >
            <ArrowLeft size={15} /> Каталог
          </Link>
          <div className={styles.titleBlock}>
            <div className={styles.titleRow}>
              <h1>{game.title}</h1>
              <span className="badge badgeNeutral">{game.categoryLabel}</span>
              <span className="badge badgeEmerald">
                <ShieldCheck size={13} /> Честный RNG · Web Crypto
              </span>
            </div>
          </div>
        </div>

        <div className={styles.actionsGroup}>
          <button
            type="button"
            className="btn btnSecondary btnSm"
            onClick={() => {
              playSound('click');
              setRulesOpen(true);
            }}
          >
            <BookOpen size={15} /> Правила и выплаты
          </button>
          <button
            type="button"
            className={`btn btnSecondary btnSm`}
            onClick={() => toggleFavoriteGame(game.id)}
            aria-label={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
          >
            <Star
              size={15}
              fill={isFav ? '#f59e0b' : 'none'}
              color={isFav ? '#f59e0b' : 'currentColor'}
            />
            {isFav ? 'В избранном' : 'В избранное'}
          </button>
        </div>
      </div>

      {/* Always-visible Payout & Rules Summary before playing */}
      <div className={styles.rulesStrip} aria-label="Сводка выплат">
        <div className={styles.payoutPills}>
          {game.payoutTable.slice(0, 5).map((row) => (
            <span key={row.label} className={styles.payoutPill}>
              <span>{row.label}:</span>
              <span className={styles.payoutMult}>{row.payout}</span>
              {row.probability && (
                <span style={{ color: 'var(--text-muted)' }}>({row.probability})</span>
              )}
            </span>
          ))}
        </div>
        <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Макс. множитель: {game.maxMultiplierLabel}
        </span>
      </div>

      {/* Main Game Workspace */}
      <div>{children}</div>

      {/* Recent Results in This Game */}
      {gameHistory.length > 0 && (
        <section className={styles.recentSection} aria-label="Последние раунды в этой игре">
          <div className={styles.recentHeader}>
            <h3>Последние раунды · {game.title}</h3>
            <Link
              to="/history"
              style={{ fontSize: '0.83rem', color: 'var(--accent-primary)', fontWeight: 600 }}
            >
              Вся история →
            </Link>
          </div>
          <div className={styles.recentList}>
            {gameHistory.map((item) => (
              <div key={item.id} className={styles.recentItem}>
                <span className={styles.recentSummary} title={item.summary}>
                  {item.summary}
                </span>
                <span
                  className={`mono ${
                    item.outcome === 'win'
                      ? styles.winVal
                      : item.outcome === 'loss'
                        ? styles.lossVal
                        : styles.pushVal
                  }`}
                >
                  {formatSignedCurrency(item.netChange, settings.currency)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Detailed Rules & Payout Modal */}
      <Modal
        open={rulesOpen}
        title={`Правила игры «${game.title}»`}
        subtitle="Все вероятности определяются прозрачно с помощью браузерного Web Crypto API до запуска анимации."
        onClose={() => setRulesOpen(false)}
        wide
      >
        <h3 style={{ marginBottom: 8 }}>Как играть</h3>
        <ul className={styles.rulesList}>
          {game.rules.map((rule, idx) => (
            <li key={idx}>{rule}</li>
          ))}
        </ul>

        <h3 style={{ marginBottom: 8 }}>Таблица выплат и вероятностей</h3>
        <table className={styles.payoutTable}>
          <thead>
            <tr>
              <th>Исход / Комбинация</th>
              <th>Выплата</th>
              <th>Вероятность / Примечание</th>
            </tr>
          </thead>
          <tbody>
            {game.payoutTable.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td className="mono" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                  {row.payout}
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{row.probability ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </div>
  );
};
