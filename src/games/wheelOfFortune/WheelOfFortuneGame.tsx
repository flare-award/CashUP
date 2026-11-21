import React, { useRef, useState } from 'react';
import { Disc } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { useCashUp } from '../../state/CashUpContext';
import {
  FORTUNE_SYMBOLS,
  FORTUNE_WHEEL_RING,
  FortuneSymbol,
  spinWheelOfFortune,
} from './wheelOfFortuneLogic';

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  startDeg: number,
  endDeg: number
): string {
  const p1 = polar(cx, cy, rOut, startDeg);
  const p2 = polar(cx, cy, rOut, endDeg);
  const p3 = polar(cx, cy, rIn, endDeg);
  const p4 = polar(cx, cy, rIn, startDeg);
  return `M ${p1.x} ${p1.y} A ${rOut} ${rOut} 0 0 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rIn} ${rIn} 0 0 0 ${p4.x} ${p4.y} Z`;
}

const ALL_SYMBOLS: FortuneSymbol[] = [1, 2, 5, 10, 20, 40];

export const WheelOfFortuneGame: React.FC = () => {
  const {
    activeProfile,
    startPrecomputedRound,
    finishRound,
    formatAmount,
    playSound,
    scaleDuration,
  } = useCashUp();

  const [wager, setWager] = useState<number>(0.5);
  const [selected, setSelected] = useState<FortuneSymbol[]>([1, 5]);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [wheelAngle, setWheelAngle] = useState<number>(0);
  const [animMs, setAnimMs] = useState<number>(0);
  const [lastWin, setLastWin] = useState<{
    symbol: FortuneSymbol;
    payout: number;
  } | null>(null);

  const lockRef = useRef(false);
  const balance = activeProfile?.balance ?? 0;
  const sliceDeg = 360 / FORTUNE_WHEEL_RING.length;

  const toggleSymbol = (sym: FortuneSymbol) => {
    if (spinning) return;
    playSound('click');
    setSelected((prev) => {
      if (prev.includes(sym)) {
        return prev.length > 1 ? prev.filter((s) => s !== sym) : prev;
      }
      return [...prev, sym];
    });
  };

  const handleSpin = () => {
    if (lockRef.current || spinning || selected.length === 0) return;
    const result = spinWheelOfFortune(selected, wager);
    const outcome =
      result.payout > wager
        ? 'win'
        : result.payout === wager && result.payout > 0
          ? 'push'
          : result.payout > 0
            ? 'win'
            : 'loss';

    const started = startPrecomputedRound({
      gameId: 'wheel-of-fortune',
      gameName: 'Колесо Фортуны',
      wager,
      precomputed: {
        payout: result.payout,
        multiplier: result.effectiveMultiplier,
        outcome,
        summary: result.summary,
      },
    });

    if (!started.ok) return;

    lockRef.current = true;
    setSpinning(true);
    setLastWin(null);

    const dur = scaleDuration(3200);
    setAnimMs(dur);
    const turns = Math.floor(wheelAngle / 360) + 6;
    setWheelAngle(turns * 360 + result.targetWheelDeg);

    if (dur > 0) {
      playSound('rouletteTick');
      window.setTimeout(() => playSound('rouletteTick'), Math.round(dur * 0.3));
      window.setTimeout(() => playSound('rouletteTick'), Math.round(dur * 0.65));
    }

    window.setTimeout(() => {
      finishRound({
        roundId: started.roundId,
        payout: result.payout,
        multiplier: result.effectiveMultiplier,
        outcome,
        summary: result.summary,
      });
      setLastWin({ symbol: result.winningSymbol, payout: result.payout });
      setSpinning(false);
      lockRef.current = false;
    }, dur);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}
    >
      {/* 45-Sector Money Wheel */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <svg
          viewBox="0 0 320 320"
          width="304"
          height="304"
          role="img"
          aria-label="Колесо Фортуны на 45 секторов"
        >
          <circle cx="160" cy="160" r="152" fill="#0f172a" stroke="#f59e0b" strokeWidth="3.5" />
          <g
            style={{
              transform: `rotate(${wheelAngle}deg)`,
              transformOrigin: '160px 160px',
              transition:
                animMs > 0
                  ? `transform ${animMs}ms cubic-bezier(0.12, 0.88, 0.18, 1)`
                  : 'none',
            }}
          >
            {FORTUNE_WHEEL_RING.map((sym, idx) => {
              const info = FORTUNE_SYMBOLS[sym];
              const start = idx * sliceDeg - sliceDeg / 2;
              const end = start + sliceDeg;
              const labelPt = polar(160, 160, 126, idx * sliceDeg);
              return (
                <g key={idx}>
                  <path
                    d={sectorPath(160, 160, 146, 52, start, end)}
                    fill={info.color}
                    stroke="#0f172a"
                    strokeWidth="1.2"
                  />
                  <text
                    x={labelPt.x}
                    y={labelPt.y}
                    fill={info.textColor}
                    fontSize="8.5"
                    fontWeight="900"
                    fontFamily="monospace"
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${idx * sliceDeg}, ${labelPt.x}, ${labelPt.y})`}
                  >
                    {sym}
                  </text>
                </g>
              );
            })}
            <circle cx="160" cy="160" r="50" fill="#111827" stroke="#f59e0b" strokeWidth="3" />
            <text
              x="160"
              y="164"
              textAnchor="middle"
              fill="#fde047"
              fontWeight="900"
              fontSize="13"
            >
              FORTUNE
            </text>
          </g>

          {/* Clapper Pointer */}
          <polygon
            points="160,26 149,4 171,4"
            fill="#fef08a"
            stroke="#0f172a"
            strokeWidth="2"
          />
        </svg>

        <div
          aria-live="polite"
          style={{
            width: '100%',
            padding: '11px 14px',
            borderRadius: 10,
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontWeight: 700,
          }}
        >
          {spinning ? (
            <span style={{ color: 'var(--accent-gold)' }}>Колесо Фортуны вращается…</span>
          ) : lastWin ? (
            <span
              style={{
                color: lastWin.payout > 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              Выпал сектор «{lastWin.symbol}» ·{' '}
              {lastWin.payout > 0 ? `+${formatAmount(lastWin.payout)}` : 'Ставка не сыграла'}
            </span>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
              Отметьте один или несколько секторов и запустите колесо
            </span>
          )}
        </div>
      </div>

      {/* Betting Board & Controls */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Выберите сектора (ставка делится поровну между выбранными)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {ALL_SYMBOLS.map((sym) => {
              const info = FORTUNE_SYMBOLS[sym];
              const isSel = selected.includes(sym);
              return (
                <button
                  key={sym}
                  type="button"
                  disabled={spinning}
                  onClick={() => toggleSymbol(sym)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    backgroundColor: isSel
                      ? 'var(--accent-primary-soft)'
                      : 'var(--bg-surface-subtle)',
                    border: `2px solid ${isSel ? info.color : 'var(--border-subtle)'}`,
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 900,
                      color: info.color,
                    }}
                  >
                    {sym}
                  </span>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700 }}>
                    Выплата x{info.payoutMult}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {info.count}/45 сект.
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <BetControls wager={wager} onChange={setWager} disabled={spinning} />

        <button
          type="button"
          className="btn btnPrimary btnLg"
          disabled={spinning || wager <= 0 || wager > balance || selected.length === 0}
          onClick={handleSpin}
        >
          <Disc size={18} /> {spinning ? 'Вращается…' : 'Крутить Колесо Фортуны'}
        </button>
      </div>
    </div>
  );
};
