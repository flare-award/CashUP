import React, { useRef, useState } from 'react';
import { Dices } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { useCashUp } from '../../state/CashUpContext';
import { rollSicBoRound, SicBoBetKind, SicBoRollOutcome } from './sicBoLogic';

const PIP_COORDS: Record<number, Array<[number, number]>> = {
  1: [[32, 32]],
  2: [
    [18, 18],
    [46, 46],
  ],
  3: [
    [18, 18],
    [32, 32],
    [46, 46],
  ],
  4: [
    [18, 18],
    [46, 18],
    [18, 46],
    [46, 46],
  ],
  5: [
    [18, 18],
    [46, 18],
    [32, 32],
    [18, 46],
    [46, 46],
  ],
  6: [
    [18, 16],
    [46, 16],
    [18, 32],
    [46, 32],
    [18, 48],
    [46, 48],
  ],
};

const DieSvg: React.FC<{ value: number; shaking: boolean }> = ({ value, shaking }) => {
  const pips = PIP_COORDS[value] ?? PIP_COORDS[1]!;
  return (
    <svg
      width="74"
      height="74"
      viewBox="0 0 64 64"
      style={{
        transform: shaking ? 'rotate(14deg) scale(1.06)' : 'none',
        transition: 'transform 160ms ease',
      }}
      aria-label={`Кубик ${value}`}
    >
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="12"
        fill="#f8fafc"
        stroke="#cbd5e1"
        strokeWidth="2.5"
      />
      {pips.map(([cx, cy], idx) => (
        <circle
          key={idx}
          cx={cx}
          cy={cy}
          r="5"
          fill={value === 1 || value === 4 ? '#dc2626' : '#0f172a'}
        />
      ))}
    </svg>
  );
};

export const SicBoGame: React.FC = () => {
  const {
    activeProfile,
    startPrecomputedRound,
    finishRound,
    formatAmount,
    playSound,
    scaleDuration,
  } = useCashUp();

  const [wager, setWager] = useState<number>(0.5);
  const [bet, setBet] = useState<SicBoBetKind>({ type: 'big' });
  const [dice, setDice] = useState<[number, number, number]>([4, 5, 6]);
  const [rolling, setRolling] = useState<boolean>(false);
  const [lastOutcome, setLastOutcome] = useState<SicBoRollOutcome | null>(null);

  const lockRef = useRef(false);
  const balance = activeProfile?.balance ?? 0;

  const isSameBet = (a: SicBoBetKind, b: SicBoBetKind) =>
    JSON.stringify(a) === JSON.stringify(b);

  const handleRoll = () => {
    if (lockRef.current || rolling) return;

    const result = rollSicBoRound(bet, wager);
    const outcomeType = result.won ? 'win' : 'loss';

    const started = startPrecomputedRound({
      gameId: 'sic-bo',
      gameName: 'Сик Бо: Три кости',
      wager,
      precomputed: {
        payout: result.payout,
        multiplier: result.won ? result.multiplier : null,
        outcome: outcomeType,
        summary: result.summary,
      },
    });

    if (!started.ok) return;

    lockRef.current = true;
    setRolling(true);
    setLastOutcome(null);
    playSound('diceRoll');

    const dur = scaleDuration(820);
    window.setTimeout(() => {
      setDice(result.dice);
      finishRound({
        roundId: started.roundId,
        payout: result.payout,
        multiplier: result.won ? result.multiplier : null,
        outcome: outcomeType,
        summary: result.summary,
      });
      setLastOutcome(result);
      setRolling(false);
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
      {/* Glass Dome 3-Dice Stage & Sic Bo Felt */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div
          style={{
            padding: '24px 16px',
            borderRadius: 14,
            background: 'radial-gradient(circle, #182638 0%, #0d1520 100%)',
            border: '1.5px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <DieSvg value={dice[0]} shaking={rolling} />
            <DieSvg value={dice[1]} shaking={rolling} />
            <DieSvg value={dice[2]} shaking={rolling} />
          </div>

          <div className="mono" style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.96rem' }}>
            Сумма трёх костей: {dice[0] + dice[1] + dice[2]}
            {dice[0] === dice[1] && dice[1] === dice[2] ? ' · ТРОЙНЯ!' : ''}
          </div>
        </div>

        {/* Main Betting Zones */}
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Основные диапазоны и тройни
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
            {(
              [
                { kind: { type: 'small' } as SicBoBetKind, title: 'Малые (4–10)', mult: 'x2.0' },
                { kind: { type: 'big' } as SicBoBetKind, title: 'Большие (11–17)', mult: 'x2.0' },
                { kind: { type: 'even' } as SicBoBetKind, title: 'Чётная сумма', mult: 'x2.0' },
                { kind: { type: 'odd' } as SicBoBetKind, title: 'Нечётная сумма', mult: 'x2.0' },
                { kind: { type: 'any-triple' } as SicBoBetKind, title: 'Любая тройня', mult: 'x31' },
              ]
            ).map((opt, idx) => {
              const active = isSameBet(bet, opt.kind);
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={rolling}
                  onClick={() => {
                    playSound('click');
                    setBet(opt.kind);
                  }}
                  style={{
                    padding: '10px',
                    borderRadius: 9,
                    textAlign: 'center',
                    backgroundColor: active
                      ? 'var(--accent-primary-soft)'
                      : 'var(--bg-surface-subtle)',
                    border: `1.5px solid ${
                      active ? 'var(--accent-primary)' : 'var(--border-subtle)'
                    }`,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{opt.title}</div>
                  <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 800 }}>
                    {opt.mult}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exact Triple (x180) */}
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Точная тройня (выплата x180)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {[1, 2, 3, 4, 5, 6].map((f) => {
              const kind: SicBoBetKind = { type: 'exact-triple', face: f };
              const active = isSameBet(bet, kind);
              return (
                <button
                  key={f}
                  type="button"
                  disabled={rolling}
                  onClick={() => {
                    playSound('click');
                    setBet(kind);
                  }}
                  className="mono"
                  style={{
                    padding: '9px 4px',
                    borderRadius: 8,
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    backgroundColor: active
                      ? 'var(--accent-gold-soft)'
                      : 'var(--bg-surface-subtle)',
                    border: `1.5px solid ${
                      active ? 'var(--accent-gold)' : 'var(--border-subtle)'
                    }`,
                  }}
                >
                  {f}·{f}·{f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Number Match (1/2/3 dice -> x2/x3/x12) */}
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Совпадение грани на 1 / 2 / 3 кубиках (x2 / x3 / x12)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {[1, 2, 3, 4, 5, 6].map((f) => {
              const kind: SicBoBetKind = { type: 'single-number', face: f };
              const active = isSameBet(bet, kind);
              return (
                <button
                  key={f}
                  type="button"
                  disabled={rolling}
                  onClick={() => {
                    playSound('click');
                    setBet(kind);
                  }}
                  className="mono"
                  style={{
                    padding: '9px 4px',
                    borderRadius: 8,
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    backgroundColor: active
                      ? 'var(--accent-primary-soft)'
                      : 'var(--bg-surface-subtle)',
                    border: `1.5px solid ${
                      active ? 'var(--accent-primary)' : 'var(--border-subtle)'
                    }`,
                  }}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column Controls */}
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
        <BetControls wager={wager} onChange={setWager} disabled={rolling} />

        <button
          type="button"
          className="btn btnPrimary btnLg"
          disabled={rolling || wager <= 0 || wager > balance}
          onClick={handleRoll}
        >
          <Dices size={18} /> {rolling ? 'Трясём купол…' : 'Бросить три кости'}
        </button>

        {lastOutcome && (
          <div
            role="status"
            style={{
              padding: 12,
              borderRadius: 10,
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
              fontWeight: 700,
              color: lastOutcome.won ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
          >
            {lastOutcome.won
              ? `Победа! +${formatAmount(lastOutcome.payout)} (x${lastOutcome.multiplier})`
              : `Выпало [${lastOutcome.dice.join(', ')}] (${lastOutcome.sum}) — без выплаты`}
          </div>
        )}
      </div>
    </div>
  );
};
