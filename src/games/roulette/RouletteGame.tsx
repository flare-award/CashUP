import React, { useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Trash2, Undo2 } from 'lucide-react';
import { roundCurrency } from '../../core/currency';
import { useCashUp } from '../../state/CashUpContext';
import {
  computePotentialMaxPayout,
  computeTotalRouletteWager,
  EUROPEAN_WHEEL_ORDER,
  evaluateRouletteBets,
  getPocketColor,
  getPocketColorRu,
  RouletteBetKey,
  RouletteBetMap,
  spinRouletteWheel,
} from './rouletteLogic';
import styles from './RouletteGame.module.css';

const CHIP_VALUES = [10, 25, 50, 100, 250, 500] as const;
const SLICE_DEG = 360 / 37;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeSector(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number
): string {
  const p1 = polarToCartesian(cx, cy, rOuter, startDeg);
  const p2 = polarToCartesian(cx, cy, rOuter, endDeg);
  const p3 = polarToCartesian(cx, cy, rInner, endDeg);
  const p4 = polarToCartesian(cx, cy, rInner, startDeg);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 0 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 0 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

export const RouletteGame: React.FC = () => {
  const {
    activeProfile,
    startPrecomputedRound,
    finishRound,
    formatAmount,
    playSound,
    scaleDuration,
    notify,
  } = useCashUp();

  const [selectedChip, setSelectedChip] = useState<number>(25);
  const [bets, setBets] = useState<RouletteBetMap>({});
  const [betStack, setBetStack] = useState<Array<{ key: RouletteBetKey; amount: number }>>([]);
  const [previousBets, setPreviousBets] = useState<RouletteBetMap | null>(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const spinningLockRef = useRef(false);

  const [wheelDeg, setWheelDeg] = useState(0);
  const [ballDeg, setBallDeg] = useState(0);
  const [ballRadius, setBallRadius] = useState(100);
  const [spinTransitionMs, setSpinTransitionMs] = useState(0);

  const [lastResult, setLastResult] = useState<{
    number: number;
    payout: number;
    net: number;
  } | null>(null);
  const [recentNumbers, setRecentNumbers] = useState<number[]>([17, 0, 32, 8, 21, 14]);

  const balance = activeProfile?.balance ?? 0;
  const totalWager = useMemo(() => computeTotalRouletteWager(bets), [bets]);
  const potentialMax = useMemo(() => computePotentialMaxPayout(bets), [bets]);

  const placeChip = (key: RouletteBetKey) => {
    if (isSpinning) return;
    if (totalWager + selectedChip > balance) {
      notify({
        type: 'warning',
        title: 'Недостаточно виртуальных средств',
        description: 'Уменьшите номинал фишки или очистите часть ставок.',
      });
      return;
    }
    playSound('click');
    setBets((prev) => ({
      ...prev,
      [key]: roundCurrency((prev[key] ?? 0) + selectedChip),
    }));
    setBetStack((prev) => [...prev, { key, amount: selectedChip }]);
  };

  const handleUndo = () => {
    if (isSpinning || betStack.length === 0) return;
    playSound('click');
    const last = betStack[betStack.length - 1]!;
    setBetStack((prev) => prev.slice(0, -1));
    setBets((prev) => {
      const next = { ...prev };
      const rem = roundCurrency((next[last.key] ?? 0) - last.amount);
      if (rem <= 0) {
        delete next[last.key];
      } else {
        next[last.key] = rem;
      }
      return next;
    });
  };

  const handleClear = () => {
    if (isSpinning) return;
    playSound('click');
    setBets({});
    setBetStack([]);
  };

  const handleRepeat = () => {
    if (isSpinning || !previousBets) return;
    const prevSum = computeTotalRouletteWager(previousBets);
    if (prevSum > balance) {
      notify({
        type: 'warning',
        title: 'Недостаточно средств для повтора ставки',
      });
      return;
    }
    playSound('click');
    setBets({ ...previousBets });
    setBetStack([]);
  };

  const handleSpin = () => {
    if (spinningLockRef.current || isSpinning) return;
    if (totalWager <= 0) {
      notify({
        type: 'info',
        title: 'Разместите ставку на поле',
        description: 'Выберите фишку и нажмите на числа, цвет или сектора.',
      });
      return;
    }

    const winningNumber = spinRouletteWheel();
    const res = evaluateRouletteBets(bets, winningNumber);
    const outcome =
      res.totalPayout > res.totalWager
        ? 'win'
        : res.totalPayout === res.totalWager && res.totalPayout > 0
          ? 'push'
          : 'loss';
    const mult =
      res.totalWager > 0 && res.totalPayout > 0
        ? roundCurrency(res.totalPayout / res.totalWager)
        : null;
    const summary = `Выпало ${winningNumber} (${getPocketColorRu(winningNumber)})${
      res.winningBets.length > 0 ? ` · Сыграли: ${res.winningBets.slice(0, 2).join(', ')}` : ''
    }`;

    const started = startPrecomputedRound({
      gameId: 'roulette',
      gameName: 'Европейская рулетка',
      wager: res.totalWager,
      precomputed: {
        payout: res.totalPayout,
        multiplier: mult,
        outcome,
        summary,
      },
    });

    if (!started.ok) return;

    spinningLockRef.current = true;
    setIsSpinning(true);
    setLastResult(null);
    setPreviousBets({ ...bets });

    const pocketIdx = EUROPEAN_WHEEL_ORDER.indexOf(winningNumber);
    const pocketLocalAngle = pocketIdx * SLICE_DEG;

    const animMs = scaleDuration(3200);
    const nextWheel = wheelDeg + 1440 + ((winningNumber * 29) % 360);
    const screenPocketAngle = ((nextWheel + pocketLocalAngle) % 360 + 360) % 360;

    let targetBall = ballDeg - 1800;
    const ballMod = ((targetBall % 360) + 360) % 360;
    const diff = ((screenPocketAngle - ballMod) - 360) % 360;
    targetBall += diff;

    if (animMs > 0) {
      setBallRadius(128);
      setSpinTransitionMs(animMs);
      setWheelDeg(nextWheel);
      setBallDeg(targetBall);

      playSound('rouletteTick');
      window.setTimeout(() => playSound('rouletteTick'), Math.round(animMs * 0.35));
      window.setTimeout(() => {
        playSound('rouletteTick');
        setBallRadius(100);
      }, Math.round(animMs * 0.68));
    } else {
      setSpinTransitionMs(0);
      setWheelDeg(nextWheel);
      setBallDeg(targetBall);
      setBallRadius(100);
    }

    window.setTimeout(() => {
      finishRound({
        roundId: started.roundId,
        payout: res.totalPayout,
        multiplier: mult,
        outcome,
        summary,
      });
      setLastResult({
        number: winningNumber,
        payout: res.totalPayout,
        net: roundCurrency(res.totalPayout - res.totalWager),
      });
      setRecentNumbers((prev) => [winningNumber, ...prev].slice(0, 12));
      setIsSpinning(false);
      spinningLockRef.current = false;
    }, animMs);
  };

  // Standard 3-row European board layout:
  // Row 0 (top): 3, 6, 9, ..., 36 (col-3)
  // Row 1 (mid): 2, 5, 8, ..., 35 (col-2)
  // Row 2 (bot): 1, 4, 7, ..., 34 (col-1)
  const tableRows = [3, 2, 1];

  const renderChipBadge = (key: RouletteBetKey) => {
    const val = bets[key];
    if (!val || val <= 0) return null;
    return <span className={styles.betChipBadge}>{val}</span>;
  };

  return (
    <div className={styles.container}>
      {/* Left: Animated Wheel & Results */}
      <div className={styles.wheelCard}>
        <div className={styles.wheelStage}>
          <svg
            viewBox="0 0 300 300"
            width="100%"
            height="100%"
            role="img"
            aria-label="Колесо европейской рулетки"
          >
            {/* Outer mahogany/graphite rim */}
            <circle cx="150" cy="150" r="144" fill="#0d131d" stroke="#334155" strokeWidth="4" />
            <circle cx="150" cy="150" r="133" fill="none" stroke="#1e293b" strokeWidth="2" />

            {/* Rotating Rotor */}
            <g
              style={{
                transform: `rotate(${wheelDeg}deg)`,
                transformOrigin: '150px 150px',
                transition:
                  spinTransitionMs > 0
                    ? `transform ${spinTransitionMs}ms cubic-bezier(0.14, 0.86, 0.24, 1)`
                    : 'none',
              }}
            >
              {EUROPEAN_WHEEL_ORDER.map((num, idx) => {
                const start = idx * SLICE_DEG - SLICE_DEG / 2;
                const end = start + SLICE_DEG;
                const col = getPocketColor(num);
                const fill =
                  col === 'green' ? '#0d8a60' : col === 'red' ? '#b91c1c' : '#151d2b';
                const labelPos = polarToCartesian(150, 150, 111, idx * SLICE_DEG);

                return (
                  <g key={num}>
                    <path
                      d={describeSector(150, 150, 122, 74, start, end)}
                      fill={fill}
                      stroke="#475569"
                      strokeWidth="0.8"
                    />
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      fill="#f8fafc"
                      fontSize="7.4"
                      fontWeight="700"
                      fontFamily="monospace"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${idx * SLICE_DEG}, ${labelPos.x}, ${labelPos.y})`}
                    >
                      {num}
                    </text>
                  </g>
                );
              })}

              {/* Center Turret */}
              <circle cx="150" cy="150" r="73" fill="#111926" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="150" cy="150" r="46" fill="#172234" stroke="#334155" strokeWidth="1.5" />
              <line x1="112" y1="150" x2="188" y2="150" stroke="#f59e0b" strokeWidth="2.5" />
              <line x1="150" y1="112" x2="150" y2="188" stroke="#f59e0b" strokeWidth="2.5" />
              <circle cx="150" cy="150" r="10" fill="#f59e0b" />
            </g>

            {/* Counter-rotating Ivory Ball */}
            <g
              style={{
                transform: `rotate(${ballDeg}deg)`,
                transformOrigin: '150px 150px',
                transition:
                  spinTransitionMs > 0
                    ? `transform ${spinTransitionMs}ms cubic-bezier(0.12, 0.82, 0.22, 1)`
                    : 'none',
              }}
            >
              <circle
                cx="150"
                cy={150 - ballRadius}
                r="5.5"
                fill="#f8fafc"
                stroke="#0f172a"
                strokeWidth="1"
                style={{
                  transition:
                    spinTransitionMs > 0
                      ? `cy ${Math.round(spinTransitionMs * 0.35)}ms ease-out`
                      : 'none',
                }}
              />
            </g>
          </svg>
        </div>

        <div className={styles.resultBanner} aria-live="polite">
          {isSpinning ? (
            <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
              Колесо вращается…
            </span>
          ) : lastResult ? (
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Выигрышный сектор
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2 }}>
                {lastResult.number} · {getPocketColorRu(lastResult.number)}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: '0.9rem',
                  marginTop: 4,
                  color:
                    lastResult.payout > 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontWeight: 700,
                }}
              >
                Выплата: {formatAmount(lastResult.payout)}
              </div>
            </div>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Выберите номинал фишки и сделайте виртуальную ставку
            </span>
          )}
        </div>

        <div>
          <div
            style={{
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
              marginBottom: 8,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Последние числа
          </div>
          <div className={styles.historyStrip}>
            {recentNumbers.map((num, idx) => {
              const col = getPocketColor(num);
              return (
                <span
                  key={`${num}-${idx}`}
                  className={`${styles.pocketPill} ${
                    col === 'green'
                      ? styles.pocketGreen
                      : col === 'red'
                        ? styles.pocketRed
                        : styles.pocketBlack
                  }`}
                >
                  {num}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Betting Board */}
      <div className={styles.boardCard}>
        <div className={styles.chipToolbar}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              Номинал виртуальной фишки
            </div>
            <div className={styles.chipRow} role="radiogroup" aria-label="Номинал фишки">
              {CHIP_VALUES.map((val) => (
                <button
                  key={val}
                  type="button"
                  role="radio"
                  aria-checked={selectedChip === val}
                  disabled={isSpinning}
                  className={`${styles.chipBtn} ${
                    selectedChip === val ? styles.chipSelected : ''
                  }`}
                  onClick={() => {
                    playSound('click');
                    setSelectedChip(val);
                  }}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btnSecondary btnSm"
              disabled={isSpinning || betStack.length === 0}
              onClick={handleUndo}
            >
              <Undo2 size={14} /> Отменить шаг
            </button>
            {previousBets && totalWager === 0 && (
              <button
                type="button"
                className="btn btnSecondary btnSm"
                disabled={isSpinning}
                onClick={handleRepeat}
              >
                <RotateCcw size={14} /> Повторить
              </button>
            )}
            <button
              type="button"
              className="btn btnSecondary btnSm"
              disabled={isSpinning || totalWager === 0}
              onClick={handleClear}
            >
              <Trash2 size={14} /> Очистить
            </button>
          </div>
        </div>

        <div className={styles.tableCloth}>
          {/* 0 + 1..36 + 3 Columns */}
          <div className={styles.numbersLayout}>
            <button
              type="button"
              disabled={isSpinning}
              className={`${styles.zeroCell} ${
                !isSpinning && lastResult?.number === 0 ? styles.winningHighlight : ''
              }`}
              onClick={() => placeChip('num-0')}
              aria-label="Ставка на Зеро 0"
            >
              0{renderChipBadge('num-0')}
            </button>

            {tableRows.map((base, rowIndex) => (
              <React.Fragment key={base}>
                {Array.from({ length: 12 }, (_, colIdx) => {
                  const num = colIdx * 3 + base;
                  const key: RouletteBetKey = `num-${num}`;
                  const col = getPocketColor(num);
                  const isWinNum = !isSpinning && lastResult?.number === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={isSpinning}
                      style={{ gridRow: rowIndex + 1, gridColumn: colIdx + 2 }}
                      className={`${styles.numCell} ${
                        col === 'red' ? styles.cellRed : styles.cellBlack
                      } ${isWinNum ? styles.winningHighlight : ''}`}
                      onClick={() => placeChip(key)}
                      aria-label={`Ставка на число ${num}`}
                    >
                      {num}
                      {renderChipBadge(key)}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={isSpinning}
                  style={{ gridRow: rowIndex + 1, gridColumn: 14 }}
                  className={styles.colCell}
                  onClick={() =>
                    placeChip(
                      base === 3 ? 'col-3' : base === 2 ? 'col-2' : 'col-1'
                    )
                  }
                  aria-label={`Колонна 2 к 1 ряд ${rowIndex + 1}`}
                >
                  2:1
                  {renderChipBadge(
                    base === 3 ? 'col-3' : base === 2 ? 'col-2' : 'col-1'
                  )}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Dozens */}
          <div className={styles.dozensRow}>
            <button
              type="button"
              disabled={isSpinning}
              className={styles.outsideCell}
              onClick={() => placeChip('dozen-1')}
            >
              1-я 12 (1–12) {renderChipBadge('dozen-1')}
            </button>
            <button
              type="button"
              disabled={isSpinning}
              className={styles.outsideCell}
              onClick={() => placeChip('dozen-2')}
            >
              2-я 12 (13–24) {renderChipBadge('dozen-2')}
            </button>
            <button
              type="button"
              disabled={isSpinning}
              className={styles.outsideCell}
              onClick={() => placeChip('dozen-3')}
            >
              3-я 12 (25–36) {renderChipBadge('dozen-3')}
            </button>
          </div>

          {/* Even-money outside bets */}
          <div className={styles.evenMoneyRow}>
            <button
              type="button"
              disabled={isSpinning}
              className={styles.outsideCell}
              onClick={() => placeChip('low')}
            >
              1–18 {renderChipBadge('low')}
            </button>
            <button
              type="button"
              disabled={isSpinning}
              className={styles.outsideCell}
              onClick={() => placeChip('even')}
            >
              Чётное {renderChipBadge('even')}
            </button>
            <button
              type="button"
              disabled={isSpinning}
              className={`${styles.outsideCell} ${styles.outsideRed}`}
              onClick={() => placeChip('red')}
            >
              Красное {renderChipBadge('red')}
            </button>
            <button
              type="button"
              disabled={isSpinning}
              className={`${styles.outsideCell} ${styles.outsideBlack}`}
              onClick={() => placeChip('black')}
            >
              Чёрное {renderChipBadge('black')}
            </button>
            <button
              type="button"
              disabled={isSpinning}
              className={styles.outsideCell}
              onClick={() => placeChip('odd')}
            >
              Нечётное {renderChipBadge('odd')}
            </button>
            <button
              type="button"
              disabled={isSpinning}
              className={styles.outsideCell}
              onClick={() => placeChip('high')}
            >
              19–36 {renderChipBadge('high')}
            </button>
          </div>
        </div>

        {/* Summary & Spin CTA */}
        <div className={styles.summaryBar}>
          <div className={styles.metrics}>
            <div className={styles.metricItem}>
              <span>Сумма ставок</span>
              <strong>{formatAmount(totalWager)}</strong>
            </div>
            <div className={styles.metricItem}>
              <span>Макс. потенциальная выплата</span>
              <strong style={{ color: 'var(--accent-primary)' }}>
                {formatAmount(potentialMax)}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="btn btnPrimary btnLg"
            disabled={isSpinning || totalWager <= 0 || totalWager > balance}
            onClick={handleSpin}
          >
            <Play size={17} /> {isSpinning ? 'Вращение…' : 'Крутить рулетку'}
          </button>
        </div>
      </div>
    </div>
  );
};
