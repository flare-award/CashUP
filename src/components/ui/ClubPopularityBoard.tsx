import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Crown, Flame, Minus, Users } from 'lucide-react';
import { formatNumber } from '../../core/currency';
import { getGameById } from '../../games/registry';
import { useCashUp } from '../../state/CashUpContext';
import styles from './ClubPopularityBoard.module.css';

interface ClubPopularityBoardProps {
  limit?: number;
}

export const ClubPopularityBoard: React.FC<ClubPopularityBoardProps> = ({
  limit = 8,
}) => {
  const { clubPopularity, playSound } = useCashUp();
  const topList = clubPopularity.rankings.slice(0, limit);

  return (
    <section
      className={styles.boardCard}
      aria-label="Рейтинг популярных игр среди пользователей"
    >
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Flame size={20} style={{ color: 'var(--accent-gold)' }} />
            Популярные игры у игроков сегодня
          </h2>
          <span className={styles.subtitle}>
            Актуальный рейтинг зала за сутки и динамика позиций относительно вчерашнего дня
          </span>
        </div>

        <div className={styles.summaryBadges}>
          <span className="badge badgeEmerald mono">
            <Users size={13} /> В игре сейчас: {formatNumber(clubPopularity.totalOnline)}
          </span>
          <span className="badge badgeGold mono">
            Партий за день: {formatNumber(clubPopularity.totalRoundsToday)}
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        {topList.map((entry) => {
          const game = getGameById(entry.gameId);
          if (!game) return null;

          const isTop3 = entry.tier === 'top3';
          const isTop5 = entry.tier === 'top5';

          return (
            <Link
              key={entry.gameId}
              to={`/games/${entry.gameId}`}
              onClick={() => playSound('select')}
              className={`${styles.row} ${
                isTop3 ? styles.rowTopGold : isTop5 ? styles.rowTopEmerald : ''
              }`}
            >
              <div className={styles.left}>
                <span
                  className={`${styles.rankCircle} ${
                    isTop3
                      ? styles.rankGold
                      : isTop5
                        ? styles.rankEmerald
                        : ''
                  }`}
                >
                  {entry.rank === 1 ? <Crown size={15} /> : `#${entry.rank}`}
                </span>

                <div className={styles.info}>
                  <div className={styles.nameLine}>
                    <span className={styles.gameTitle}>{game.title}</span>
                    {entry.rankDelta > 0 ? (
                      <span className={`${styles.deltaTag} ${styles.deltaPositive}`}>
                        <ArrowUpRight size={11} style={{ verticalAlign: 'middle' }} />+
                        {entry.rankDelta}
                      </span>
                    ) : entry.rankDelta < 0 ? (
                      <span className={`${styles.deltaTag} ${styles.deltaNegative}`}>
                        <ArrowDownRight size={11} style={{ verticalAlign: 'middle' }} />
                        {entry.rankDelta}
                      </span>
                    ) : (
                      <span className={`${styles.deltaTag} ${styles.deltaSame}`}>
                        <Minus size={11} style={{ verticalAlign: 'middle' }} />
                      </span>
                    )}
                  </div>

                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${entry.popularityPercent}%`,
                        background: isTop3
                          ? 'linear-gradient(90deg, #f59e0b, #fde047)'
                          : 'linear-gradient(90deg, #10b981, #34d399)',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.right}>
                <span className={styles.onlineText}>
                  <Users size={12} style={{ color: 'var(--accent-primary)' }} />
                  {entry.onlinePlayers} онлайн
                </span>
                <span className={styles.roundsText}>
                  {formatNumber(entry.roundsToday)} раунд.
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
