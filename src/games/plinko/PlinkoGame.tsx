import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownCircle } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { useCashUp } from '../../state/CashUpContext';
import {
  computePlinkoDrop,
  PLINKO_MULTIPLIERS,
  PlinkoRisk,
  PlinkoRowCount,
} from './plinkoLogic';

const ROW_OPTIONS: PlinkoRowCount[] = [8, 10, 12, 14, 16];

function getBucketColor(mult: number): { bg: string; text: string } {
  if (mult >= 20) return { bg: '#e11d48', text: '#ffffff' };
  if (mult >= 5) return { bg: '#f59e0b', text: '#0b0e14' };
  if (mult >= 1.5) return { bg: '#10b981', text: '#04130d' };
  if (mult >= 1) return { bg: '#0284c7', text: '#ffffff' };
  return { bg: '#334155', text: '#cbd5e1' };
}

export const PlinkoGame: React.FC = () => {
  const {
    activeProfile,
    startPrecomputedRound,
    finishRound,
    formatAmount,
    playSound,
    scaleDuration,
  } = useCashUp();

  const [wager, setWager] = useState<number>(0.25);
  const [rows, setRows] = useState<PlinkoRowCount>(12);
  const [risk, setRisk] = useState<PlinkoRisk>('medium');
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const lockRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const [ballPos, setBallPos] = useState<{ x: number; y: number } | null>(null);
  const [hitPegKey, setHitPegKey] = useState<string | null>(null);
  const [activeBucket, setActiveBucket] = useState<number | null>(null);
  const [recentHits, setRecentHits] = useState<number[]>([]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const balance = activeProfile?.balance ?? 0;
  const multipliers = PLINKO_MULTIPLIERS[risk][rows];

  // SVG Coordinate System: width 640, height 460
  const boardGeom = useMemo(() => {
    const width = 640;
    const topY = 44;
    const bottomPegY = 368;
    const rowGapY = (bottomPegY - topY) / (rows - 1);
    const maxCols = rows + 2; // bottom row has rows + 2 pegs
    const spacingX = Math.min(44, 540 / (maxCols - 1));

    const pegs: Array<{ row: number; col: number; x: number; y: number; key: string }> = [];
    for (let r = 0; r < rows; r += 1) {
      const count = r + 3; // row 0 has 3 pegs, row R-1 has R+2 pegs -> R+1 gaps!
      const startX = width / 2 - ((count - 1) * spacingX) / 2;
      const y = topY + r * rowGapY;
      for (let c = 0; c < count; c += 1) {
        pegs.push({
          row: r,
          col: c,
          x: startX + c * spacingX,
          y,
          key: `${r}-${c}`,
        });
      }
    }

    const bucketCount = rows + 1;
    const bucketStartX = width / 2 - ((bucketCount - 1) * spacingX) / 2;
    const buckets = Array.from({ length: bucketCount }, (_, bIdx) => ({
      index: bIdx,
      x: bucketStartX + bIdx * spacingX,
      y: bottomPegY + 34,
      width: Math.max(24, spacingX - 4),
    }));

    return { width, topY, rowGapY, spacingX, pegs, buckets };
  }, [rows]);

  const handleDrop = () => {
    if (lockRef.current || isDropping) return;

    const drop = computePlinkoDrop(rows, risk, wager);
    const outcome =
      drop.payout > wager
        ? 'win'
        : drop.payout === wager
          ? 'push'
          : 'loss';
    const summary = `Plinko (${rows} рядов) · Ячейка x${drop.multiplier}`;

    const started = startPrecomputedRound({
      gameId: 'plinko',
      gameName: 'Plinko',
      wager,
      precomputed: {
        payout: drop.payout,
        multiplier: drop.multiplier,
        outcome,
        summary,
      },
    });

    if (!started.ok) return;

    lockRef.current = true;
    setIsDropping(true);
    setActiveBucket(null);

    const totalMs = scaleDuration(140 * rows);
    const targetBucketGeom = boardGeom.buckets[drop.bucketIndex]!;

    if (totalMs === 0) {
      setBallPos({ x: targetBucketGeom.x, y: targetBucketGeom.y });
      setActiveBucket(drop.bucketIndex);
      finishRound({
        roundId: started.roundId,
        payout: drop.payout,
        multiplier: drop.multiplier,
        outcome,
        summary,
      });
      setRecentHits((prev) => [drop.multiplier, ...prev].slice(0, 10));
      setIsDropping(false);
      lockRef.current = false;
      return;
    }

    // Build exact waypoint coordinates along the pyramid
    // Start above center peg of row 0 (col 1)
    const waypoints: Array<{ x: number; y: number; pegKey?: string }> = [
      { x: 320, y: 14 },
    ];
    let offsetSteps = 0; // Each left = -0.5 * spacingX, right = +0.5 * spacingX
    for (let r = 0; r < rows; r += 1) {
      const pegCol = 1 + drop.directions.slice(0, r).reduce<number>((s, b) => s + b, 0);
      const pegY = boardGeom.topY + r * boardGeom.rowGapY;
      const pegX = 320 + offsetSteps * (boardGeom.spacingX / 2);
      waypoints.push({ x: pegX, y: pegY - 7, pegKey: `${r}-${pegCol}` });

      const dir = drop.directions[r]!;
      offsetSteps += dir === 1 ? 1 : -1;
    }
    waypoints.push({ x: targetBucketGeom.x, y: targetBucketGeom.y });

    const segments = waypoints.length - 1;
    const startTime = performance.now();
    let lastSoundSeg = -1;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const tGlobal = Math.min(1, elapsed / totalMs);
      const exactSeg = tGlobal * segments;
      const segIdx = Math.min(segments - 1, Math.floor(exactSeg));
      const localT = exactSeg - segIdx;

      const pA = waypoints[segIdx]!;
      const pB = waypoints[segIdx + 1]!;

      if (segIdx !== lastSoundSeg && pA.pegKey) {
        lastSoundSeg = segIdx;
        setHitPegKey(pA.pegKey);
        if (segIdx % 2 === 0) {
          playSound('plinkoPeg');
        }
      }

      // Smooth X + parabolic gravity bounce arc on Y
      const x = pA.x + (pB.x - pA.x) * localT;
      const bounceLift = segIdx > 0 ? Math.sin(localT * Math.PI) * -9 : 0;
      const y = pA.y + (pB.y - pA.y) * (localT * localT) + bounceLift;

      setBallPos({ x, y });

      if (tGlobal < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setHitPegKey(null);
        setActiveBucket(drop.bucketIndex);
        finishRound({
          roundId: started.roundId,
          payout: drop.payout,
          multiplier: drop.multiplier,
          outcome,
          summary,
        });
        setRecentHits((prev) => [drop.multiplier, ...prev].slice(0, 10));
        setIsDropping(false);
        lockRef.current = false;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 330px',
        gap: 20,
        alignItems: 'start',
      }}
    >
      <style>{`
        @media (max-width: 980px) {
          .plinko-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div
        className="plinko-grid"
        style={{
          gridColumn: '1 / -1',
          display: 'grid',
          gridTemplateColumns: '1fr 330px',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* Plinko Pyramid Stage */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <svg
            viewBox="0 0 640 432"
            style={{ width: '100%', maxWidth: 660, height: 'auto', display: 'block' }}
            role="img"
            aria-label={`Поле Plinko на ${rows} рядов`}
          >
            {/* Pegs */}
            {boardGeom.pegs.map((peg) => {
              const isHit = hitPegKey === peg.key;
              return (
                <g key={peg.key}>
                  {isHit && (
                    <circle
                      cx={peg.x}
                      cy={peg.y}
                      r="10"
                      fill="#10b981"
                      opacity="0.35"
                    />
                  )}
                  <circle
                    cx={peg.x}
                    cy={peg.y}
                    r={rows >= 14 ? 3.5 : 4.2}
                    fill={isHit ? '#34d399' : '#94a3b8'}
                  />
                </g>
              );
            })}

            {/* Multiplier Buckets */}
            {boardGeom.buckets.map((b) => {
              const mult = multipliers[b.index] ?? 1;
              const col = getBucketColor(mult);
              const isHitBucket = activeBucket === b.index;
              return (
                <g
                  key={b.index}
                  transform={`translate(${b.x - b.width / 2}, ${
                    b.y - 12 + (isHitBucket ? 4 : 0)
                  })`}
                >
                  <rect
                    width={b.width}
                    height="24"
                    rx="5"
                    fill={col.bg}
                    stroke={isHitBucket ? '#ffffff' : 'none'}
                    strokeWidth="2"
                  />
                  <text
                    x={b.width / 2}
                    y="15.5"
                    textAnchor="middle"
                    fill={col.text}
                    fontSize={rows >= 14 ? '8.5' : '9.8'}
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    {mult}x
                  </text>
                </g>
              );
            })}

            {/* Falling Virtual Chip/Ball */}
            {ballPos && (
              <circle
                cx={ballPos.x}
                cy={ballPos.y}
                r="7.5"
                fill="#f59e0b"
                stroke="#fef3c7"
                strokeWidth="2"
              />
            )}
          </svg>

          {activeBucket !== null && multipliers[activeBucket] !== undefined && (
            <div
              role="status"
              className="mono"
              style={{
                marginTop: 8,
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--accent-primary)',
              }}
            >
              Ячейка x{multipliers[activeBucket]} · Выплата{' '}
              {formatAmount(wager * (multipliers[activeBucket] ?? 0))}
            </div>
          )}

          {recentHits.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {recentHits.map((m, i) => {
                const c = getBucketColor(m);
                return (
                  <span
                    key={i}
                    className="mono"
                    style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      backgroundColor: c.bg,
                      color: c.text,
                      fontWeight: 800,
                      fontSize: '0.78rem',
                    }}
                  >
                    x{m}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Settings & Launch Panel */}
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
          <BetControls wager={wager} onChange={setWager} disabled={isDropping} />

          <div>
            <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              Уровень риска
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(
                [
                  { id: 'low', label: 'Низкий' },
                  { id: 'medium', label: 'Средний' },
                  { id: 'high', label: 'Высокий' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isDropping}
                  onClick={() => {
                    playSound('click');
                    setRisk(opt.id);
                    setActiveBucket(null);
                  }}
                  style={{
                    padding: '9px 6px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '0.83rem',
                    backgroundColor:
                      risk === opt.id ? 'var(--accent-primary)' : 'var(--bg-surface-subtle)',
                    color: risk === opt.id ? '#04130d' : 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              Количество рядов препятствий
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {ROW_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={isDropping}
                  onClick={() => {
                    playSound('click');
                    setRows(r);
                    setActiveBucket(null);
                    setBallPos(null);
                  }}
                  className="mono"
                  style={{
                    padding: '8px 4px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '0.83rem',
                    backgroundColor:
                      rows === r ? 'var(--accent-primary-soft)' : 'var(--bg-surface-subtle)',
                    color: rows === r ? 'var(--accent-primary)' : 'var(--text-primary)',
                    border: `1.5px solid ${
                      rows === r ? 'var(--accent-primary)' : 'var(--border-subtle)'
                    }`,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn btnPrimary btnLg"
            disabled={isDropping || wager <= 0 || wager > balance}
            onClick={handleDrop}
          >
            <ArrowDownCircle size={18} />{' '}
            {isDropping ? 'Фишка падает…' : 'Запустить фишку'}
          </button>
        </div>
      </div>
    </div>
  );
};
