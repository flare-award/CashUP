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
      case 'russian-roulette':
        return (
          <>
            <circle cx="94" cy="78" r="38" fill="#1c141a" stroke="#ef4444" strokeWidth="2.2" />
            {[0, 60, 120, 180, 240, 300].map((deg, idx) => {
              const rad = (deg * Math.PI) / 180;
              const cx = 94 + 21 * Math.cos(rad);
              const cy = 78 + 21 * Math.sin(rad);
              return (
                <circle
                  key={deg}
                  cx={cx}
                  cy={cy}
                  r="7"
                  fill={idx === 0 ? '#f59e0b' : '#0b0f17'}
                  stroke={idx === 0 ? '#fef08a' : '#475569'}
                  strokeWidth="1.5"
                />
              );
            })}
            <circle cx="94" cy="78" r="5" fill="#64748b" />
            <g transform="translate(142, 46)">
              <path d="M12 42 L2 66 Q1 72 9 72 L22 70 L28 48 Z" fill="#7c3f1d" stroke="#f59e0b" strokeWidth="1.5" />
              <rect x="20" y="28" width="32" height="18" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="52" y="30" width="44" height="9" rx="2.5" fill="#64748b" stroke="#e2e8f0" strokeWidth="1.4" />
              <polygon points="90,30 95,25 96,30" fill="#ef4444" />
            </g>
          </>
        );
      case 'durak':
        return (
          <>
            <g transform="translate(70, 42) rotate(-18)">
              <rect width="50" height="74" rx="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
              <text x="12" y="20" fill="#dc2626" fontWeight="900" fontSize="14">A</text>
              <polygon points="25,28 36,41 25,54 14,41" fill="#dc2626" />
            </g>
            <g transform="translate(114, 34)">
              <rect width="52" height="76" rx="7" fill="#f8fafc" stroke="#10b981" strokeWidth="2.2" />
              <text x="12" y="20" fill="#0f172a" fontWeight="900" fontSize="13">6</text>
              <circle cx="26" cy="42" r="9" fill="#0f172a" />
            </g>
            <g transform="translate(156, 42) rotate(16)">
              <rect width="50" height="74" rx="7" fill="#162234" stroke="#f59e0b" strokeWidth="2" />
              <text x="25" y="43" textAnchor="middle" fill="#f59e0b" fontWeight="900" fontSize="13" fontFamily="monospace">36</text>
            </g>
          </>
        );
      case 'towers':
        return (
          <>
            {[0, 1, 2, 3].map((row) =>
              [0, 1, 2].map((col) => {
                const active = (row === 3 && col === 1) || (row === 2 && col === 0) || (row === 1 && col === 2);
                return (
                  <rect
                    key={`${row}-${col}`}
                    x={86 + col * 38}
                    y={26 + row * 26}
                    width="32"
                    height="20"
                    rx="5"
                    fill={active ? '#0f2d22' : '#182232'}
                    stroke={active ? '#10b981' : '#334155'}
                    strokeWidth="1.6"
                  />
                );
              })
            )}
            <polygon points="140,14 148,24 132,24" fill="#f59e0b" />
          </>
        );
      case 'coin-flip':
        return (
          <>
            <circle cx="116" cy="78" r="38" fill="#f59e0b" stroke="#fef08a" strokeWidth="3" />
            <path d="M98 90L103 68L112 78L116 64L120 78L129 68L134 90Z" fill="#451a03" />
            <circle cx="168" cy="78" r="34" fill="#10b981" stroke="#a7f3d0" strokeWidth="2.5" opacity="0.92" />
            <polygon points="168,58 182,78 168,98 154,78" fill="#022c22" />
          </>
        );
      case 'wheel-of-fortune':
        return (
          <>
            <circle cx="140" cy="78" r="50" fill="#111827" stroke="#f59e0b" strokeWidth="3" />
            <path d="M140 78 L140 28 A50 50 0 0 1 183 53 Z" fill="#ef4444" />
            <path d="M140 78 L183 53 A50 50 0 0 1 183 103 Z" fill="#eab308" />
            <path d="M140 78 L183 103 A50 50 0 0 1 140 128 Z" fill="#3b82f6" />
            <path d="M140 78 L140 128 A50 50 0 0 1 97 103 Z" fill="#a855f7" />
            <path d="M140 78 L97 103 A50 50 0 0 1 97 53 Z" fill="#10b981" />
            <path d="M140 78 L97 53 A50 50 0 0 1 140 28 Z" fill="#f97316" />
            <circle cx="140" cy="78" r="16" fill="#0f172a" stroke="#fde047" strokeWidth="2" />
            <text x="140" y="82" textAnchor="middle" fill="#fde047" fontSize="10" fontWeight="900" fontFamily="monospace">40x</text>
          </>
        );
      case 'sic-bo':
        return (
          <>
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${66 + i * 52}, ${52 + (i === 1 ? -10 : 4)})`}>
                <rect width="44" height="44" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                <circle cx="14" cy="14" r="3.8" fill="#dc2626" />
                <circle cx="22" cy="22" r="3.8" fill="#0f172a" />
                <circle cx="30" cy="30" r="3.8" fill="#dc2626" />
              </g>
            ))}
          </>
        );
      case 'video-poker':
        return (
          <>
            {['10', 'J', 'Q', 'K', 'A'].map((rk, i) => (
              <g key={rk} transform={`translate(${54 + i * 35}, 42)`}>
                <rect width="32" height="58" rx="5" fill="#f8fafc" stroke="#f59e0b" strokeWidth="1.6" />
                <text x="16" y="26" textAnchor="middle" fill="#dc2626" fontSize="11" fontWeight="900">{rk}</text>
                <polygon points="16,33 22,41 16,49 10,41" fill="#dc2626" />
              </g>
            ))}
          </>
        );
      case 'scratch-cards':
      default:
        return (
          <>
            <rect x="78" y="28" width="124" height="96" rx="12" fill="#182232" stroke="#f59e0b" strokeWidth="2" />
            {[0, 1, 2].map((r) =>
              [0, 1, 2].map((c) => {
                const open = (r === 0 && c === 0) || (r === 1 && c === 1) || (r === 2 && c === 2);
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={92 + c * 34}
                    y={38 + r * 26}
                    width="28"
                    height="20"
                    rx="4"
                    fill={open ? '#0f2d22' : '#f59e0b'}
                    opacity={open ? 1 : 0.78}
                  />
                );
              })
            )}
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
