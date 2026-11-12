import React from 'react';
import { AvatarId } from '../../types';

export interface AvatarDefinition {
  id: AvatarId;
  label: string;
  bg: string;
  accent: string;
  secondary: string;
}

export const AVATAR_CATALOG: readonly AvatarDefinition[] = [
  {
    id: 'emerald-diamond',
    label: 'Изумрудный кристалл',
    bg: '#0c2920',
    accent: '#10b981',
    secondary: '#6ee7b7',
  },
  {
    id: 'royal-crown',
    label: 'Золотая корона',
    bg: '#2a1f0b',
    accent: '#f59e0b',
    secondary: '#fde68a',
  },
  {
    id: 'crimson-spade',
    label: 'Рубиновая пика',
    bg: '#2b1116',
    accent: '#f43f5e',
    secondary: '#fda4af',
  },
  {
    id: 'cyber-fox',
    label: 'Кибер-лис',
    bg: '#29170d',
    accent: '#fb923c',
    secondary: '#fed7aa',
  },
  {
    id: 'golden-dice',
    label: 'Золотой куб',
    bg: '#231e10',
    accent: '#eab308',
    secondary: '#fef08a',
  },
  {
    id: 'sapphire-shield',
    label: 'Сапфировый щит',
    bg: '#0e1d36',
    accent: '#3b82f6',
    secondary: '#93c5fd',
  },
  {
    id: 'violet-prism',
    label: 'Аметистовая призма',
    bg: '#211336',
    accent: '#a855f7',
    secondary: '#d8b4fe',
  },
  {
    id: 'onyx-knight',
    label: 'Ониксовый страж',
    bg: '#171c26',
    accent: '#94a3b8',
    secondary: '#e2e8f0',
  },
  {
    id: 'amber-phoenix',
    label: 'Янтарный импульс',
    bg: '#2b160c',
    accent: '#f97316',
    secondary: '#fdba74',
  },
  {
    id: 'mint-clover',
    label: 'Клевер удачи',
    bg: '#0d281c',
    accent: '#22c55e',
    secondary: '#86efac',
  },
  {
    id: 'arctic-wolf',
    label: 'Арктический север',
    bg: '#0c2430',
    accent: '#06b6d4',
    secondary: '#67e8f9',
  },
  {
    id: 'solar-star',
    label: 'Солнечная звезда',
    bg: '#29210c',
    accent: '#fbbf24',
    secondary: '#fef3c7',
  },
];

interface AvatarIconProps {
  avatarId: AvatarId;
  size?: number;
  className?: string;
}

export const AvatarIcon: React.FC<AvatarIconProps> = ({
  avatarId,
  size = 40,
  className,
}) => {
  const def =
    AVATAR_CATALOG.find((a) => a.id === avatarId) ?? AVATAR_CATALOG[0]!;

  const renderSymbol = () => {
    switch (def.id) {
      case 'emerald-diamond':
        return (
          <>
            <polygon points="32,12 48,32 32,52 16,32" fill={def.accent} />
            <polygon points="32,18 41,32 32,46 23,32" fill={def.secondary} opacity="0.65" />
          </>
        );
      case 'royal-crown':
        return (
          <>
            <path
              d="M14 44L18 22L27 31L32 18L37 31L46 22L50 44H14Z"
              fill={def.accent}
            />
            <rect x="15" y="46" width="34" height="4" rx="2" fill={def.secondary} />
          </>
        );
      case 'crimson-spade':
        return (
          <path
            d="M32 13C24 23 16 28 16 36C16 41 20 44 24.5 44C27.5 44 29.8 42.5 31 40.5L28 50H36L33 40.5C34.2 42.5 36.5 44 39.5 44C44 44 48 41 48 36C48 28 40 23 32 13Z"
            fill={def.accent}
          />
        );
      case 'cyber-fox':
        return (
          <>
            <polygon points="16,15 26,28 19,44" fill={def.accent} />
            <polygon points="48,15 38,28 45,44" fill={def.accent} />
            <polygon points="19,44 32,50 45,44 38,28 26,28" fill={def.secondary} />
            <polygon points="28,36 32,46 36,36" fill={def.bg} />
          </>
        );
      case 'golden-dice':
        return (
          <>
            <rect x="16" y="16" width="32" height="32" rx="7" fill={def.accent} />
            <circle cx="24" cy="24" r="3" fill={def.bg} />
            <circle cx="40" cy="24" r="3" fill={def.bg} />
            <circle cx="32" cy="32" r="3" fill={def.bg} />
            <circle cx="24" cy="40" r="3" fill={def.bg} />
            <circle cx="40" cy="40" r="3" fill={def.bg} />
          </>
        );
      case 'sapphire-shield':
        return (
          <>
            <path
              d="M32 13L48 19V31C48 41.5 41 48.5 32 52C23 48.5 16 41.5 16 31V19L32 13Z"
              fill={def.accent}
            />
            <path
              d="M32 19L42 23V31C42 38 37.5 43 32 45.8V19Z"
              fill={def.secondary}
              opacity="0.55"
            />
          </>
        );
      case 'violet-prism':
        return (
          <>
            <polygon points="32,13 50,46 14,46" fill={def.accent} />
            <polygon points="32,13 50,46 32,38" fill={def.secondary} opacity="0.55" />
          </>
        );
      case 'onyx-knight':
        return (
          <>
            <polygon
              points="32,12 47,20 47,44 32,52 17,44 17,20"
              fill="none"
              stroke={def.accent}
              strokeWidth="3.5"
            />
            <circle cx="32" cy="32" r="8" fill={def.secondary} />
          </>
        );
      case 'amber-phoenix':
        return (
          <>
            <path
              d="M32 12C40 20 46 28 42 39C39 46 32 50 32 50C32 50 25 46 22 39C18 28 24 20 32 12Z"
              fill={def.accent}
            />
            <circle cx="32" cy="36" r="6" fill={def.secondary} />
          </>
        );
      case 'mint-clover':
        return (
          <>
            <circle cx="26" cy="26" r="8" fill={def.accent} />
            <circle cx="38" cy="26" r="8" fill={def.accent} />
            <circle cx="26" cy="38" r="8" fill={def.accent} />
            <circle cx="38" cy="38" r="8" fill={def.accent} />
            <circle cx="32" cy="32" r="4" fill={def.secondary} />
          </>
        );
      case 'arctic-wolf':
        return (
          <>
            <polygon points="32,12 46,32 32,52 18,32" fill="none" stroke={def.accent} strokeWidth="3.5" />
            <polygon points="32,21 39,32 32,43 25,32" fill={def.secondary} />
          </>
        );
      case 'solar-star':
      default:
        return (
          <polygon
            points="32,12 37,25 51,25 40,34 44,48 32,39 20,48 24,34 13,25 27,25"
            fill={def.accent}
          />
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={def.label}
      className={className}
      style={{ borderRadius: '14px', flexShrink: 0, display: 'block' }}
    >
      <rect width="64" height="64" rx="16" fill={def.bg} />
      <rect
        x="1.5"
        y="1.5"
        width="61"
        height="61"
        rx="14.5"
        fill="none"
        stroke={def.accent}
        strokeOpacity="0.4"
        strokeWidth="2"
      />
      {renderSymbol()}
    </svg>
  );
};
