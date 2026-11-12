import React from 'react';
import { GameCategory, GameId } from '../types';

export interface PayoutRow {
  label: string;
  payout: string;
  probability?: string;
}

export interface GameMetadata {
  id: GameId;
  title: string;
  shortDescription: string;
  category: GameCategory;
  categoryLabel: string;
  maxMultiplierLabel: string;
  maxMultiplierValue: number;
  popularityRank: number;
  featured: boolean;
  recommended: boolean;
  minBet: number;
  rules: string[];
  payoutTable: PayoutRow[];
  Component: React.ComponentType;
}

export const CATEGORY_LABELS: Record<GameCategory | 'all', string> = {
  all: 'Все категории',
  'roulette-wheels': 'Рулетка и колёса',
  slots: 'Слоты',
  cards: 'Карточные игры',
  'arcade-risk': 'Аркады и риск',
  'dice-numbers': 'Кости и числа',
};
