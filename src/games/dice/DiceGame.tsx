import React, { useRef, useState } from 'react';
import { Dices } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { useCashUp } from '../../state/CashUpContext';
import {
  DiceBetType,
  getDiceBetInfo,
  rollDiceRound,
} from './diceLogic';
import styles from './DiceGame.module.css';

const PIP_POSITIONS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const FACE_TRANSFORMS: Record<number, string> = {
  1: 'rotateY(0deg) translateZ(44px)',
  6: 'rotateY(180deg) translateZ(44px)',
  2: 'rotateY(90deg) translateZ(44px)',
  5: 'rotateY(-90deg) translateZ(44px)',
  3: 'rotateX(90deg) translateZ(44px)',
  4: 'rotateX(-90deg) translateZ(44px)',
};

const TARGET_ROTATION: Record<number, { rx: number; ry: number }> = {
  1: { rx: 0, ry: 0 },
  6: { rx: 0, ry: 180 },
  2: { rx: 0, ry: -90 },
  5: { rx: 0, ry: 90 },
  3: { rx: -90, ry: 0 },
  4: { rx: 90, ry: 0 },
};

const CubeDie: React.FC<{
  value: number;
  spinTurn: number;
  durationMs: number;
  label: string;
}> = ({ value, spinTurn, durationMs, label }) => {
  const base = TARGET_ROTATION[value] ?? { rx: 0, ry: 0 };
  const rx = base.rx + spinTurn * 360;
  const ry = base.ry + spinTurn * 360;

  return (
    <div
      className={styles.cubeWrap}
      role="img"
      aria-label={`${label}: выпало ${value}`}
      style={{
        transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
        transition:
          durationMs > 0
            ? `transform ${durationMs}ms cubic-bezier(0.18, 0.88, 0.26, 1)`
            : 'none',
      }}
    >
      {[1, 2, 3, 4, 5, 6].map((faceVal) => {
        const pips = PIP_POSITIONS[faceVal]!;
        return (
          <div
            key={faceVal}
            className={styles.face}
            style={{ transform: FACE_TRANSFORMS[faceVal] }}
          >
            {Array.from({ length: 9 }, (_, cellIdx) => (
              <span key={cellIdx} style={{ display: 'flex' }}>
                {pips.includes(cellIdx) && (
                  <span
                    className={`${styles.pip} ${
                      faceVal === 1 && cellIdx === 4 ? styles.pipCenterAce : ''
                    }`}
                  />
                )}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
};

const RANGE_BETS: DiceBetType[] = [
  'under7',
  'exact7',
  'over7',
  'even',
  'odd',
  'doubles',
];

export const DiceGame: React.FC = () => {
  const {
    activeProfile,
    startPrecomputedRound,
    finishRound,
    formatAmount,
    playSound,
    scaleDuration,
  } = useCashUp();

  const [wager, setWager] = useState<number>(0.5);
  const [selectedBet, setSelectedBet] = useState<DiceBetType>('over7');
  const [die1, setDie1] = useState<number>(4);
  const [die2, setDie2] = useState<number>(5);
  const [spinTurn1, setSpinTurn1] = useState<number>(0);
  const [spinTurn2, setSpinTurn2] = useState<number>(0);
  const [animDuration, setAnimDuration] = useState<number>(0);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const lockRef = useRef(false);

  const [lastRoll, setLastRoll] = useState<{
    sum: number;
    won: boolean;
    payout: number;
  } | null>(null);

  const balance = activeProfile?.balance ?? 0;
  const currentInfo = getDiceBetInfo(selectedBet);

  const handleRoll = () => {
    if (lockRef.current || isRolling) return;

    const result = rollDiceRound(selectedBet, wager);
    const outcome = result.won ? 'win' : 'loss';

    const started = startPrecomputedRound({
      gameId: 'dice',
      gameName: 'Кости',
      wager,
      precomputed: {
        payout: result.payout,
        multiplier: result.won ? result.multiplier : null,
        outcome,
        summary: result.summary,
      },
    });

    if (!started.ok) return;

    lockRef.current = true;
    setIsRolling(true);
    setLastRoll(null);
    playSound('diceRoll');

    const dur = scaleDuration(1050);
    setAnimDuration(dur);
    setDie1(result.die1);
    setDie2(result.die2);
    setSpinTurn1((prev) => prev + 3);
    setSpinTurn2((prev) => prev + 4);

    window.setTimeout(() => {
      finishRound({
        roundId: started.roundId,
        payout: result.payout,
        multiplier: result.won ? result.multiplier : null,
        outcome,
        summary: result.summary,
      });
      setLastRoll({
        sum: result.sum,
        won: result.won,
        payout: result.payout,
      });
      setIsRolling(false);
      lockRef.current = false;
    }, dur);
  };

  return (
    <div className={styles.layout}>
      <div className={styles.arena}>
        <div className={styles.diceStage}>
          <CubeDie
            value={die1}
            spinTurn={spinTurn1}
            durationMs={animDuration}
            label="Первый кубик"
          />
          <CubeDie
            value={die2}
            spinTurn={spinTurn2}
            durationMs={animDuration}
            label="Второй кубик"
          />
        </div>

        <div className={styles.sumBadge} aria-live="polite">
          {isRolling ? (
            'Бросаем кубики…'
          ) : lastRoll ? (
            <span>
              Сумма: {die1} + {die2} = {lastRoll.sum} ·{' '}
              <span
                style={{
                  color: lastRoll.won ? '#34d399' : '#f87171',
                }}
              >
                {lastRoll.won
                  ? `Выигрыш +${formatAmount(lastRoll.payout)}`
                  : 'Мимо'}
              </span>
            </span>
          ) : (
            `Текущие грани: ${die1} + ${die2} = ${die1 + die2}`
          )}
        </div>

        <div className={styles.betSection}>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>
            Диапазоны и комбинации
          </div>
          <div className={styles.rangeGrid}>
            {RANGE_BETS.map((key) => {
              const info = getDiceBetInfo(key);
              const active = selectedBet === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={isRolling}
                  className={`${styles.betBtn} ${active ? styles.betBtnActive : ''}`}
                  onClick={() => {
                    playSound('click');
                    setSelectedBet(key);
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>{info.label}</span>
                  <span
                    className="mono"
                    style={{ fontSize: '0.76rem', color: '#34d399' }}
                  >
                    x{info.multiplier} · {info.probabilityPct}%
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600, marginTop: 4 }}>
            Точная сумма двух кубиков (2–12)
          </div>
          <div className={styles.sumGrid}>
            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => {
              const key: DiceBetType = `sum-${s}`;
              const info = getDiceBetInfo(key);
              const active = selectedBet === key;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={isRolling}
                  className={`${styles.sumCell} ${active ? styles.sumCellActive : ''}`}
                  onClick={() => {
                    playSound('click');
                    setSelectedBet(key);
                  }}
                >
                  <span className="mono" style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                    {s}
                  </span>
                  <span className="mono" style={{ fontSize: '0.68rem', color: '#fbbf24' }}>
                    x{info.multiplier}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.sideCard}>
        <BetControls wager={wager} onChange={setWager} disabled={isRolling} />

        <div
          style={{
            padding: 12,
            borderRadius: 10,
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Выбранный прогноз:</span>
            <strong>{currentInfo.label}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Вероятность:</span>
            <strong className="mono">
              {currentInfo.waysOutOf36}/36 ({currentInfo.probabilityPct}%)
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Множитель выплаты:</span>
            <strong className="mono" style={{ color: 'var(--accent-primary)' }}>
              x{currentInfo.multiplier}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Возможный выигрыш:</span>
            <strong className="mono" style={{ color: 'var(--accent-gold)' }}>
              {formatAmount(wager * currentInfo.multiplier)}
            </strong>
          </div>
        </div>

        <button
          type="button"
          className="btn btnPrimary btnLg"
          style={{ width: '100%' }}
          disabled={isRolling || wager <= 0 || wager > balance}
          onClick={handleRoll}
        >
          <Dices size={18} /> {isRolling ? 'Кубики в полёте…' : 'Бросить кости'}
        </button>
      </div>
    </div>
  );
};
