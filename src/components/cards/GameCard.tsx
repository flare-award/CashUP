import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Star } from 'lucide-react';
import { GameMetadata } from '../../games/types';
import { useCashUp } from '../../state/CashUpContext';
import { GameArtwork } from '../ui/GameArtwork';
import styles from './GameCard.module.css';

interface GameCardProps {
  game: GameMetadata;
}

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const { activeProfile, toggleFavoriteGame, playSound } = useCashUp();
  const isFav = activeProfile?.favoriteGames.includes(game.id) ?? false;
  const playedRounds = activeProfile?.stats.perGame[game.id]?.rounds ?? 0;

  return (
    <article className={styles.card}>
      <div className={styles.artWrap}>
        <Link
          to={`/games/${game.id}`}
          onClick={() => playSound('select')}
          aria-label={`Открыть игру ${game.title}`}
        >
          <GameArtwork gameId={game.id} />
        </Link>

        <span className={styles.multTag}>до {game.maxMultiplierLabel}</span>

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
          {playedRounds > 0 && (
            <span className={`${styles.playedCount} tabular`}>
              Раундов: {playedRounds}
            </span>
          )}
        </div>

        <h3 className={styles.title}>{game.title}</h3>
        <p className={styles.desc}>{game.shortDescription}</p>

        <div className={styles.footer}>
          <Link
            to={`/games/${game.id}`}
            onClick={() => playSound('select')}
            className={`btn btnPrimary btnSm ${styles.playLink}`}
          >
            <Play size={14} /> Играть
          </Link>
        </div>
      </div>
    </article>
  );
};
