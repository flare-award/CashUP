import React from 'react';
import { Card, CardSuit, isRedSuit, suitNameRu } from '../../core/cards';
import styles from './PlayingCard.module.css';

interface SuitSvgProps {
  suit: CardSuit;
  size: number;
}

export const SuitSvg: React.FC<SuitSvgProps> = ({ suit, size }) => {
  const color = isRedSuit(suit) ? '#dc2626' : '#0f172a';
  switch (suit) {
    case 'hearts':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill={color}
          />
        </svg>
      );
    case 'diamonds':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="12,2 21,12 12,22 3,12" fill={color} />
        </svg>
      );
    case 'spades':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2C7.5 8 3.5 11 3.5 15c0 2.6 2.1 4.4 4.5 4.4 1.5 0 2.7-.7 3.4-1.8L9.8 22h4.4l-1.6-4.4c.7 1.1 1.9 1.8 3.4 1.8 2.4 0 4.5-1.8 4.5-4.4C20.5 11 16.5 8 12 2z"
            fill={color}
          />
        </svg>
      );
    case 'clubs':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="7.5" r="4.3" fill={color} />
          <circle cx="7.3" cy="13.5" r="4.3" fill={color} />
          <circle cx="16.7" cy="13.5" r="4.3" fill={color} />
          <path d="M10.8 14.5L9.5 22h5l-1.3-7.5z" fill={color} />
        </svg>
      );
  }
};

interface PlayingCardProps {
  card?: Card | null;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  highlighted?: boolean;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  faceDown = false,
  size = 'md',
  highlighted = false,
}) => {
  const showBack = faceDown || !card;
  const red = card ? isRedSuit(card.suit) : false;

  const cornerIconSize = size === 'sm' ? 10 : size === 'lg' ? 16 : 12;
  const centerIconSize = size === 'sm' ? 22 : size === 'lg' ? 44 : 30;

  return (
    <div
      className={`${styles.scene} ${styles[size]} ${highlighted ? styles.highlighted : ''}`}
      role="img"
      aria-label={
        showBack || !card
          ? 'Закрытая игральная карта'
          : `Карта ${card.rank} ${suitNameRu(card.suit)}`
      }
    >
      <div className={`${styles.inner} ${showBack ? styles.flipped : ''}`}>
        <div className={`${styles.face} ${red ? styles.red : styles.black}`}>
          {card && (
            <>
              <div className={styles.corner}>
                <span className={styles.rank}>{card.rank}</span>
                <SuitSvg suit={card.suit} size={cornerIconSize} />
              </div>
              <div className={styles.centerSuit}>
                <SuitSvg suit={card.suit} size={centerIconSize} />
              </div>
              <div className={`${styles.corner} ${styles.cornerBottom}`}>
                <span className={styles.rank}>{card.rank}</span>
                <SuitSvg suit={card.suit} size={cornerIconSize} />
              </div>
            </>
          )}
        </div>

        <div className={styles.back}>
          <div className={styles.backPattern}>
            <svg width={size === 'sm' ? 18 : 26} height={size === 'sm' ? 18 : 26} viewBox="0 0 32 32" aria-hidden="true">
              <polygon points="16,3 27,16 16,29 5,16" fill="#10b981" opacity="0.88" />
              <circle cx="16" cy="16" r="4" fill="#f59e0b" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
