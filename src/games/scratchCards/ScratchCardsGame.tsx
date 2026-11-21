import React, { useEffect, useState } from 'react';
import { Eye, Sparkles, Ticket } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { roundCurrency } from '../../core/currency';
import { useCashUp } from '../../state/CashUpContext';
import {
  GeneratedScratchTicket,
  generateScratchTicket,
  SCRATCH_THEMES,
  ScratchThemeId,
} from './scratchCardsLogic';

interface SavedScratchState {
  wager: number;
  ticket: GeneratedScratchTicket;
  scratched: boolean[]; // length 9
  settled: boolean;
}

export const ScratchCardsGame: React.FC = () => {
  const {
    activeProfile,
    startInteractiveRound,
    saveInteractiveRoundState,
    getInteractiveRound,
    finishRound,
    formatAmount,
    playSound,
  } = useCashUp();

  const [wager, setWager] = useState<number>(0.5);
  const [themeId, setThemeId] = useState<ScratchThemeId>('clover');
  const [roundId, setRoundId] = useState<string | null>(null);
  const [cardState, setCardState] = useState<SavedScratchState | null>(null);

  const balance = activeProfile?.balance ?? 0;

  useEffect(() => {
    if (roundId) return;
    const saved = getInteractiveRound('scratch-cards');
    if (saved && saved.interactiveState) {
      const st = saved.interactiveState as SavedScratchState;
      setRoundId(saved.roundId);
      setCardState(st);
      setThemeId(st.ticket.themeId);
      setWager(st.wager);
    }
  }, [roundId, getInteractiveRound]);

  const isPlaying = Boolean(roundId && cardState && !cardState.settled);
  const activeTheme = SCRATCH_THEMES[cardState ? cardState.ticket.themeId : themeId];

  const settleTicket = (rid: string, st: SavedScratchState) => {
    const mult = st.ticket.multiplier;
    const payout = roundCurrency(st.wager * mult);
    const outcome = mult > 0 ? 'win' : 'loss';

    finishRound({
      roundId: rid,
      payout,
      multiplier: mult > 0 ? mult : null,
      outcome,
      summary: `Золотой Скретч (${SCRATCH_THEMES[st.ticket.themeId].title}) · ${
        mult > 0 ? `Три символа ${st.ticket.winningSymbol?.label}` : 'Без совпадения 3 символов'
      }`,
    });

    setCardState({
      ...st,
      scratched: Array(9).fill(true),
      settled: true,
    });
    setRoundId(null);
  };

  const handleBuyTicket = () => {
    if (isPlaying) return;
    const ticket = generateScratchTicket(themeId);
    const fresh: SavedScratchState = {
      wager,
      ticket,
      scratched: Array(9).fill(false),
      settled: false,
    };

    const started = startInteractiveRound({
      gameId: 'scratch-cards',
      gameName: 'Золотой Скретч',
      wager,
      interactiveState: fresh,
    });

    if (!started.ok) return;

    playSound('select');
    setRoundId(started.roundId);
    setCardState(fresh);
  };

  const handleScratchCell = (idx: number) => {
    if (!roundId || !cardState || cardState.settled) return;
    if (cardState.scratched[idx]) return;

    playSound('scratch');
    const nextScratched = cardState.scratched.map((s, i) => (i === idx ? true : s));
    const updated: SavedScratchState = {
      ...cardState,
      scratched: nextScratched,
    };

    if (nextScratched.every(Boolean)) {
      settleTicket(roundId, updated);
      return;
    }

    setCardState(updated);
    saveInteractiveRoundState(roundId, updated);
  };

  const handleRevealAll = () => {
    if (!roundId || !cardState || cardState.settled) return;
    playSound('scratch');
    settleTicket(roundId, cardState);
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
      {/* 3x3 Scratch Ticket Card */}
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
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '1.08rem' }}>{activeTheme.title}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Соберите 3 одинаковых множителя на поле 3×3
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            width: '100%',
            maxWidth: 340,
            padding: 14,
            borderRadius: 16,
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '2px solid var(--border-strong)',
          }}
        >
          {Array.from({ length: 9 }, (_, idx) => {
            const revealed = cardState?.scratched[idx] ?? false;
            const cell = cardState?.ticket.cells[idx];
            const isWinMatch =
              cardState?.settled &&
              cardState.ticket.winningSymbol !== null &&
              cell?.id === cardState.ticket.winningSymbol.id;

            return (
              <button
                key={idx}
                type="button"
                disabled={!isPlaying || revealed}
                onClick={() => handleScratchCell(idx)}
                onMouseEnter={(e) => {
                  if (e.buttons === 1 && isPlaying && !revealed) {
                    handleScratchCell(idx);
                  }
                }}
                aria-label={`Защитная ячейка ${idx + 1}`}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  background: revealed
                    ? isWinMatch
                      ? 'rgba(16, 185, 129, 0.24)'
                      : 'var(--bg-elevated)'
                    : activeTheme.foilGradient,
                  border: `2px solid ${
                    isWinMatch
                      ? '#10b981'
                      : revealed
                        ? 'var(--border-subtle)'
                        : 'rgba(255,255,255,0.28)'
                  }`,
                  color: '#f8fafc',
                  boxShadow: revealed ? 'none' : 'inset 0 2px 8px rgba(255,255,255,0.2)',
                  transition: 'transform 140ms ease',
                }}
              >
                {revealed && cell ? (
                  <>
                    <Sparkles size={18} color={cell.color} />
                    <span
                      className="mono"
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 900,
                        color: cell.color,
                      }}
                    >
                      {cell.label}
                    </span>
                  </>
                ) : (
                  <span
                    className="mono"
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      opacity: isPlaying ? 0.95 : 0.55,
                    }}
                  >
                    СТЕРЕТЬ
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {cardState?.settled && (
          <div
            role="status"
            style={{
              fontWeight: 800,
              color:
                cardState.ticket.multiplier > 0
                  ? 'var(--accent-primary)'
                  : 'var(--text-secondary)',
            }}
          >
            {cardState.ticket.multiplier > 0
              ? `Совпали 3 символа ${cardState.ticket.winningSymbol?.label}! Выигрыш +${formatAmount(
                  roundCurrency(cardState.wager * cardState.ticket.multiplier)
                )}`
              : 'В этом билете нет трёх одинаковых символов'}
          </div>
        )}
      </div>

      {/* Controls */}
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
            Серия лотерейного билета
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['clover', 'vault', 'royal'] as ScratchThemeId[]).map((tId) => {
              const cfg = SCRATCH_THEMES[tId];
              const active = (cardState ? cardState.ticket.themeId : themeId) === tId;
              return (
                <button
                  key={tId}
                  type="button"
                  disabled={isPlaying}
                  onClick={() => {
                    playSound('click');
                    setThemeId(tId);
                    setCardState(null);
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    textAlign: 'left',
                    backgroundColor: active
                      ? 'var(--accent-primary-soft)'
                      : 'var(--bg-surface-subtle)',
                    border: `1.5px solid ${
                      active ? 'var(--accent-primary)' : 'var(--border-subtle)'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '0.86rem' }}>{cfg.title}</strong>
                    <span className="badge badgeGold mono">до x{cfg.maxMult}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {cfg.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <BetControls
          wager={wager}
          onChange={setWager}
          disabled={isPlaying}
          label="Стоимость билета"
        />

        {!isPlaying ? (
          <button
            type="button"
            className="btn btnPrimary btnLg"
            disabled={wager <= 0 || wager > balance}
            onClick={handleBuyTicket}
          >
            <Ticket size={18} /> Купить скретч-билет
          </button>
        ) : (
          <button
            type="button"
            className="btn btnGold btnLg"
            onClick={handleRevealAll}
          >
            <Eye size={18} /> Стереть всё сразу
          </button>
        )}
      </div>
    </div>
  );
};
