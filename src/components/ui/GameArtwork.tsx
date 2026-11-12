import React from 'react';
import { GameId } from '../../types';

interface GameArtworkProps {
  gameId: GameId;
  className?: string;
}

export const GameArtwork: React.FC<GameArtworkProps> = ({ gameId, className }) => {
  const renderScene = () => {
    switch (gameId) {
      case 'roulette':
        return (
          <>
            <circle cx="140" cy="78" r="52" fill="#0f1722" stroke="#334155" strokeWidth="3" />
            <circle cx="140" cy="78" r="42" fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray="8 256" />
            <circle cx="140" cy="78" r="42" fill="none" stroke="#ef4444" strokeWidth="10" strokeDasharray="14 14" strokeDashoffset="12" />
            <circle cx="140" cy="78" r="24" fill="#162030" stroke="#f59e0b" strokeWidth="2" />
            <line x1="126" y1="78" x2="154" y2="78" stroke="#f59e0b" strokeWidth="2" />
            <line x1="140" y1="64" x2="140" y2="92" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="166" cy="54" r="4.5" fill="#f8fafc" />
          </>
        );
      case 'slots':
        return (
          <>
            <rect x="68" y="28" width="136" height="98" rx="14" fill="#131c29" stroke="#334155" strokeWidth="2.5" />
            <rect x="80" y="46" width="32" height="58" rx="6" fill="#0b1018" stroke="#1e293b" />
            <rect x="120" y="46" width="32" height="58" rx="6" fill="#0b1018" stroke="#10b981" strokeWidth="1.5" />
            <rect x="160" y="46" width="32" height="58" rx="6" fill="#0b1018" stroke="#1e293b" />
            <text x="96" y="83" textAnchor="middle" fill="#ef4444" fontWeight="800" fontSize="24" fontFamily="monospace">7</text>
            <text x="136" y="83" textAnchor="middle" fill="#10b981" fontWeight="800" fontSize="24" fontFamily="monospace">7</text>
            <text x="176" y="83" textAnchor="middle" fill="#f59e0b" fontWeight="800" fontSize="24" fontFamily="monospace">7</text>
            <line x1="212" y1="90" x2="218" y2="44" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
            <circle cx="218" cy="40" r="8" fill="#ef4444" />
          </>
        );
      case 'red-black':
        return (
          <>
            <g transform="translate(88, 28) rotate(-10)">
              <rect width="58" height="84" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
              <path d="M29 28C22 36 17 40 17 46C17 50 20 52 24 52C26 52 28 51 29 49C30 51 32 52 34 52C38 52 41 50 41 46C41 40 36 36 29 28Z" fill="#f8fafc" />
            </g>
            <g transform="translate(136, 34) rotate(9)">
              <rect width="58" height="84" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
              <polygon points="29,25 43,42 29,59 15,42" fill="#ef4444" />
            </g>
          </>
        );
      case 'dice':
        return (
          <>
            <g transform="translate(82, 42) rotate(-12)">
              <rect width="52" height="52" rx="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
              <circle cx="16" cy="16" r="4" fill="#0f172a" />
              <circle cx="36" cy="16" r="4" fill="#0f172a" />
              <circle cx="26" cy="26" r="4" fill="#10b981" />
              <circle cx="16" cy="36" r="4" fill="#0f172a" />
              <circle cx="36" cy="36" r="4" fill="#0f172a" />
            </g>
            <g transform="translate(148, 52) rotate(14)">
              <rect width="52" height="52" rx="11" fill="#162131" stroke="#10b981" strokeWidth="2" />
              <circle cx="16" cy="16" r="4" fill="#10b981" />
              <circle cx="36" cy="36" r="4" fill="#10b981" />
              <circle cx="26" cy="26" r="4" fill="#f59e0b" />
            </g>
          </>
        );
      case 'shells':
        return (
          <>
            <path d="M58 106L68 62H98L108 106Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <path d="M115 86L125 42H155L165 86Z" fill="#132b22" stroke="#10b981" strokeWidth="2.2" />
            <circle cx="140" cy="102" r="9" fill="#f59e0b" />
            <path d="M172 106L182 62H212L222 106Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          </>
        );
      case 'upgrade':
        return (
          <>
            <circle cx="140" cy="78" r="48" fill="none" stroke="#1e293b" strokeWidth="8" />
            <path
              d="M140 30 A48 48 0 0 1 188 78"
              fill="none"
              stroke="#10b981"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <polygon points="140,48 162,78 140,108 118,78" fill="#10b981" opacity="0.25" />
            <path d="M140 56L154 76H145V98H135V76H126L140 56Z" fill="#10b981" />
          </>
        );
      case 'poker':
        return (
          <>
            <ellipse cx="140" cy="84" rx="82" ry="42" fill="#0d291f" stroke="#10b981" strokeWidth="2" />
            <rect x="92" y="54" width="28" height="40" rx="4" fill="#f8fafc" />
            <rect x="126" y="54" width="28" height="40" rx="4" fill="#f8fafc" />
            <rect x="160" y="54" width="28" height="40" rx="4" fill="#f8fafc" />
            <text x="106" y="79" textAnchor="middle" fill="#dc2626" fontWeight="800" fontSize="14">A</text>
            <text x="140" y="79" textAnchor="middle" fill="#0f172a" fontWeight="800" fontSize="14">K</text>
            <text x="174" y="79" textAnchor="middle" fill="#dc2626" fontWeight="800" fontSize="14">Q</text>
            <circle cx="140" cy="112" r="10" fill="#f59e0b" stroke="#fef3c7" strokeWidth="2" strokeDasharray="3 3" />
          </>
        );
      case 'blackjack':
        return (
          <>
            <g transform="translate(96, 30) rotate(-8)">
              <rect width="56" height="82" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
              <text x="14" y="22" fill="#0f172a" fontWeight="800" fontSize="15">A</text>
              <circle cx="28" cy="46" r="10" fill="#0f172a" />
            </g>
            <g transform="translate(132, 36) rotate(10)">
              <rect width="56" height="82" rx="8" fill="#111926" stroke="#10b981" strokeWidth="2" />
              <text x="28" y="50" textAnchor="middle" fill="#10b981" fontWeight="800" fontSize="22" fontFamily="monospace">21</text>
            </g>
          </>
        );
      case 'baccarat':
        return (
          <>
            <rect x="58" y="38" width="74" height="78" rx="10" fill="#0f2034" stroke="#3b82f6" strokeWidth="2" />
            <text x="95" y="68" textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="700">PLAYER</text>
            <text x="95" y="96" textAnchor="middle" fill="#f8fafc" fontSize="22" fontWeight="800" fontFamily="monospace">9</text>
            <rect x="148" y="38" width="74" height="78" rx="10" fill="#2b171b" stroke="#f59e0b" strokeWidth="2" />
            <text x="185" y="68" textAnchor="middle" fill="#fcd34d" fontSize="11" fontWeight="700">BANKER</text>
            <text x="185" y="96" textAnchor="middle" fill="#f8fafc" fontSize="22" fontWeight="800" fontFamily="monospace">8</text>
          </>
        );
      case 'plinko':
        return (
          <>
            {[0, 1, 2, 3].map((row) =>
              Array.from({ length: row + 2 }).map((_, col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={140 - (row + 1) * 14 + col * 28}
                  cy={36 + row * 19}
                  r="3.2"
                  fill="#94a3b8"
                />
              ))
            )}
            <circle cx="147" cy="64" r="6.5" fill="#f59e0b" />
            <rect x="78" y="114" width="28" height="14" rx="4" fill="#ef4444" />
            <rect x="111" y="114" width="28" height="14" rx="4" fill="#f59e0b" />
            <rect x="144" y="114" width="28" height="14" rx="4" fill="#10b981" />
            <rect x="177" y="114" width="28" height="14" rx="4" fill="#ef4444" />
          </>
        );
      case 'mines':
        return (
          <>
            {[0, 1, 2].map((r) =>
              [0, 1, 2].map((c) => {
                const isGem = (r === 0 && c === 1) || (r === 1 && c === 1);
                const isMine = r === 2 && c === 2;
                return (
                  <g key={`${r}-${c}`} transform={`translate(${92 + c * 34}, ${30 + r * 34})`}>
                    <rect
                      width="28"
                      height="28"
                      rx="6"
                      fill={isGem ? '#0f2d22' : isMine ? '#2f1418' : '#182232'}
                      stroke={isGem ? '#10b981' : isMine ? '#ef4444' : '#334155'}
                      strokeWidth="1.6"
                    />
                    {isGem && <polygon points="14,5 22,14 14,23 6,14" fill="#10b981" />}
                    {isMine && <circle cx="14" cy="14" r="6" fill="#ef4444" />}
                  </g>
                );
              })
            )}
          </>
        );
      case 'higher-lower':
        return (
          <>
            <rect x="108" y="32" width="64" height="92" rx="9" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
            <text x="140" y="86" textAnchor="middle" fill="#0f172a" fontWeight="800" fontSize="26" fontFamily="monospace">8</text>
            <polygon points="74,56 88,38 102,56" fill="#10b981" />
            <polygon points="178,98 192,116 206,98" fill="#f59e0b" />
          </>
        );
      case 'risk-roulette':
        return (
          <>
            <circle cx="140" cy="78" r="48" fill="#121a26" stroke="#334155" strokeWidth="2.5" />
            <path d="M140 78 L140 30 A48 48 0 0 1 182 54 Z" fill="#10b981" opacity="0.85" />
            <path d="M140 78 L182 102 A48 48 0 0 1 140 126 Z" fill="#f59e0b" opacity="0.85" />
            <path d="M140 78 L98 102 A48 48 0 0 1 98 54 Z" fill="#ef4444" opacity="0.7" />
            <circle cx="140" cy="78" r="14" fill="#0b0e14" stroke="#f59e0b" strokeWidth="2" />
            <polygon points="140,22 134,32 146,32" fill="#f8fafc" />
          </>
        );
      case 'keno':
        return (
          <>
            {[0, 1, 2].map((r) =>
              [0, 1, 2, 3].map((c) => {
                const n = r * 4 + c + 1;
                const hit = n === 3 || n === 6 || n === 10 || n === 11;
                return (
                  <g key={n} transform={`translate(${76 + c * 34}, ${34 + r * 30})`}>
                    <rect
                      width="28"
                      height="24"
                      rx="6"
                      fill={hit ? '#10b981' : '#182232'}
                      stroke={hit ? '#34d399' : '#334155'}
                    />
                    <text
                      x="14"
                      y="16"
                      textAnchor="middle"
                      fill={hit ? '#04130d' : '#94a3b8'}
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      {n}
                    </text>
                  </g>
                );
              })
            )}
          </>
        );
      case 'crash':
      default:
        return (
          <>
            <line x1="68" y1="116" x2="212" y2="116" stroke="#334155" strokeWidth="2" />
            <line x1="68" y1="36" x2="68" y2="116" stroke="#334155" strokeWidth="2" />
            <path
              d="M68 114 Q 134 110 196 42"
              fill="none"
              stroke="#10b981"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="196" cy="42" r="6" fill="#f59e0b" />
            <text x="132" y="64" fill="#10b981" fontWeight="800" fontSize="18" fontFamily="monospace">x3.84</text>
          </>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 280 152"
      className={className}
      role="img"
      aria-hidden="true"
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <radialGradient id={`glow-${gameId}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#0b0e14" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="280" height="152" fill="#0d131d" />
      <rect width="280" height="152" fill={`url(#glow-${gameId})`} />
      {renderScene()}
    </svg>
  );
};
