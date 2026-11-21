import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Flame, Play, Star, TrendingUp, Users } from 'lucide-react';
import { GameMetadata } from '../../games/types';
import { useCashUp } from '../../state/CashUpContext';
import { GameArtwork } from '../ui/GameArtwork';
import styles from './GameCard.module.css';

interface GameCardProps {
  game: GameMetadata;
}

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const { activeProfile, clubPopularity, toggleFavoriteGame, playSound } =
    useCashUp();
  const isFav = activeProfile?.favoriteGames.includes(game.id) ?? false;
  const playedRounds = activeProfile?.stats.perGame[game.id]?.rounds ?? 0;
  const pop = clubPopularity.byGameId[game.id];

  const cardTierClass =
    pop?.tier === 'top3'
      ? styles.cardTopGold
      : pop?.tier === 'top5'
        ? styles.cardTopEmerald
        : '';

  return (
    <article className={`${styles.card} ${cardTierClass}`}>
      <div className={styles.artWrap}>
        <Link
          to={`/games/${game.id}`}
          onClick={() => playSound('select')}
          aria-label={`Открыть игру ${game.title}`}
        >
          <GameArtwork gameId={game.id} />
        </Link>

        {/* Top Games Daily Highlight Badge */}
        {pop?.tier === 'top3' && (
          <span className={`${styles.topRankBadge} ${styles.badgeGoldGlow}`}>
            <Crown size={12} /> ТОП-{pop.rank} ДНЯ
          </span>
        )}
        {pop?.tier === 'top5' && (
          <span className={`${styles.topRankBadge} ${styles.badgeEmeraldGlow}`}>
            <Flame size={12} /> ТОП-{pop.rank} В ЗАЛЕ
          </span>
        )}
        {pop?.tier === 'rising' && (
          <span className={`${styles.topRankBadge} ${styles.badgeRising}`}>
            <TrendingUp size={12} /> +{pop.rankDelta} В ТРЕНДЕ
          </span>
        )}

        <span className={styles.multTag}>до {game.maxMultiplierLabel}</span>

        {pop && (
          <span className={`${styles.onlinePill} tabular`} title="Сейчас играют в клубе">
            <span className={styles.onlineDot} aria-hidden="true" />
            <Users size={11} />
            {pop.onlinePlayers}
          </span>
        )}

        <button
          type="button"
          className={`${styles.favBtn} ${isFav ? styles.favActive : ''}`}
          onClick={() => toggleFavoriteGame(game.id)}
          aria-label={
            isFav
              ? `Убрать ${game.title} из избранного`
              : `Добавить ${game.title} в избранное`
          }
          title={isFav ? 'В избранном' : 'В избранное'}
        >
          <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.metaRow}>
          <span className={styles.catLabel}>{game.categoryLabel}</span>
          {pop ? (
            <span className={`${styles.rankHint} tabular`}>
              #{pop.rank} сегодня
              {pop.rankDelta > 0 && (
                <span className={styles.deltaUp}>+{pop.rankDelta}</span>
              )}
              {pop.rankDelta < 0 && (
                <span className={styles.deltaDown}>{pop.rankDelta}</span>
              )}
              {playedRounds > 0 ? ` · вы: ${playedRounds}` : ''}
            </span>
          ) : null}
        </div>

        <h3 className={styles.title}>{game.title}</h3>
        <p className={styles.desc}>{game.shortDescription}</p>

        <div className={styles.footer}>
          <Link
            to={`/games/${game.id}`}
            onClick={() => playSound('select')}
            className={`btn ${
              pop?.tier === 'top3' ? 'btnGold' : 'btnPrimary'
            } btnSm ${styles.playLink}`}
          >
            <Play size={14} /> Играть
          </Link>
        </div>
      </div>
    </article>
  );
};
