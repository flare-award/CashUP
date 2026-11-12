import React, { useEffect, useState } from 'react';
import { Bomb, CheckCircle2, Gem, Play } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { roundCurrency } from '../../core/currency';
import { useCashUp } from '../../state/CashUpContext';
import {
  computeMinesMultiplier,
  generateMinePositions,
  MinesGridSize,
} from './minesLogic';

interface SavedMinesState {
  gridSize: MinesGridSize;
  mineCount: number;
  mineIndices: number[];
  revealedSafe: number[];
  explodedIndex: number | null;
  finished: boolean;
  wager: number;
}

export const MinesGame: React.FC = () => {
  const {
    activeProfile,
    startInteractiveRound,
    saveInteractiveRoundState,
    getInteractiveRound,
    finishRound,
    formatAmount,
    playSound,
  } = useCashUp();

  const [wager, setWager] = useState<number>(30);
  const [gridSize, setGridSize] = useState<MinesGridSize>(5);
  const [mineCount, setMineCount] = useState<number>(3);

  const [roundId, setRoundId] = useState<string | null>(null);
  const [board, setBoard] = useState<SavedMinesState | null>(null);

  const balance = activeProfile?.balance ?? 0;

  useEffect(() => {
    if (roundId) return;
    const saved = getInteractiveRound('mines');
    if (saved && saved.interactiveState) {
      const st = saved.interactiveState as SavedMinesState;
      setRoundId(saved.roundId);
      setBoard(st);
      setGridSize(st.gridSize);
      setMineCount(st.mineCount);
      setWager(st.wager);
    }
  }, [roundId, getInteractiveRound]);

  const isPlaying = Boolean(roundId && board && !board.finished);
  const totalCells = gridSize * gridSize;
  const safeTotal = totalCells - mineCount;

  const handleStart = () => {
    if (isPlaying) return;
    const clampedMines = Math.max(1, Math.min(totalCells - 1, mineCount));
    const mineIndices = generateMinePositions(gridSize, clampedMines);

    const nextBoard: SavedMinesState = {
      gridSize,
      mineCount: clampedMines,
      mineIndices,
      revealedSafe: [],
      explodedIndex: null,
      finished: false,
      wager,
    };

    const started = startInteractiveRound({
      gameId: 'mines',
      gameName: 'Мины',
      wager,
      interactiveState: nextBoard,
    });

    if (!started.ok) return;

    playSound('select');
    setRoundId(started.roundId);
    setBoard(nextBoard);
  };

  const handleCashout = (stateOverride?: SavedMinesState) => {
    const cur = stateOverride ?? board;
    if (!roundId || !cur || cur.finished || cur.revealedSafe.length === 0) return;

    const mult = computeMinesMultiplier(
      cur.gridSize,
      cur.mineCount,
      cur.revealedSafe.length
    );
    const payout = roundCurrency(cur.wager * mult);

    finishRound({
      roundId,
      payout,
      multiplier: mult,
      outcome: 'win',
      summary: `Поле ${cur.gridSize}×${cur.gridSize} (${cur.mineCount} мин) · Открыто ${cur.revealedSafe.length} кристаллов (x${mult})`,
    });

    setBoard({ ...cur, finished: true });
    setRoundId(null);
  };

  const handleCellClick = (idx: number) => {
    if (!roundId || !board || board.finished) return;
    if (board.revealedSafe.includes(idx)) return;

    if (board.mineIndices.includes(idx)) {
      // Hit a pre-determined mine
      const lostBoard: SavedMinesState = {
        ...board,
        explodedIndex: idx,
        finished: true,
      };
      finishRound({
        roundId,
        payout: 0,
        multiplier: null,
        outcome: 'loss',
        summary: `Поле ${board.gridSize}×${board.gridSize} (${board.mineCount} мин) · Попадание на мину`,
      });
      setBoard(lostBoard);
      setRoundId(null);
      return;
    }

    playSound('plinkoPeg');
    const nextSafe = [...board.revealedSafe, idx];
    const updated: SavedMinesState = {
      ...board,
      revealedSafe: nextSafe,
    };

    // Auto-cashout if player cleared ALL safe cells on the board!
    const maxSafe = board.gridSize * board.gridSize - board.mineCount;
    if (nextSafe.length >= maxSafe) {
      handleCashout(updated);
      return;
    }

    setBoard(updated);
    saveInteractiveRoundState(roundId, updated);
  };

  const currentSafeCount = board?.revealedSafe.length ?? 0;
  const currentMult =
    isPlaying && board && currentSafeCount > 0
      ? computeMinesMultiplier(board.gridSize, board.mineCount, currentSafeCount)
      : 1;
  const nextMult = computeMinesMultiplier(
    board ? board.gridSize : gridSize,
    board ? board.mineCount : mineCount,
    currentSafeCount + 1
  );
  const potentialWin = roundCurrency((board?.wager ?? wager) * currentMult);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}
    >
      {/* Minefield Grid */}
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: 440,
            fontSize: '0.84rem',
          }}
        >
          <span className="badge badgeEmerald mono">
            Текущий: x{currentMult.toFixed(2)}
          </span>
          <span className="badge badgeGold mono">
            След. шаг: x{nextMult.toFixed(2)}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${board?.gridSize ?? gridSize}, 1fr)`,
            gap: (board?.gridSize ?? gridSize) === 6 ? 7 : 10,
            width: '100%',
            maxWidth: 440,
          }}
        >
          {Array.from(
            { length: (board?.gridSize ?? gridSize) ** 2 },
            (_, idx) => {
              const isSafeRevealed = board?.revealedSafe.includes(idx) ?? false;
              const isMine = board?.mineIndices.includes(idx) ?? false;
              const isExploded = board?.explodedIndex === idx;
              const showAll = board?.finished ?? false;

              let bg = 'var(--bg-surface-subtle)';
              let border = 'var(--border-strong)';
              if (isSafeRevealed) {
                bg = 'rgba(16, 185, 129, 0.2)';
                border = '#10b981';
              } else if (isExploded) {
                bg = 'rgba(239, 68, 68, 0.3)';
                border = '#ef4444';
              } else if (showAll && isMine) {
                bg = 'rgba(239, 68, 68, 0.14)';
                border = 'rgba(239, 68, 68, 0.45)';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!isPlaying || isSafeRevealed}
                  onClick={() => handleCellClick(idx)}
                  aria-label={`Ячейка ${idx + 1}`}
                  style={{
                    aspectRatio: '1 / 1',
                    borderRadius: 10,
                    backgroundColor: bg,
                    border: `2px solid ${border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: showAll && !isSafeRevealed && !isExploded ? 0.65 : 1,
                    transition:
                      'transform 140ms var(--ease-out), background-color 160ms ease',
                  }}
                >
                  {(isSafeRevealed || (showAll && !isMine)) && (
                    <Gem
                      size={(board?.gridSize ?? gridSize) === 6 ? 20 : 26}
                      color="#10b981"
                    />
                  )}
                  {showAll && isMine && (
                    <Bomb
                      size={(board?.gridSize ?? gridSize) === 6 ? 20 : 26}
                      color="#ef4444"
                    />
                  )}
                </button>
              );
            }
          )}
        </div>

        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          {isPlaying
            ? `Открыто безопасных ячеек: ${currentSafeCount} из ${
                board!.gridSize ** 2 - board!.mineCount
              }`
            : `Безопасных кристаллов: ${safeTotal} · Мин: ${mineCount}`}
        </div>
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
        <BetControls wager={wager} onChange={setWager} disabled={isPlaying} />

        <div>
          <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Размер минного поля
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {([4, 5, 6] as MinesGridSize[]).map((sz) => (
              <button
                key={sz}
                type="button"
                disabled={isPlaying}
                onClick={() => {
                  playSound('click');
                  setGridSize(sz);
                  setMineCount((m) => Math.min(m, sz * sz - 1));
                  setBoard(null);
                }}
                className="mono"
                style={{
                  padding: '9px 8px',
                  borderRadius: 8,
                  fontWeight: 700,
                  backgroundColor:
                    gridSize === sz
                      ? 'var(--accent-primary-soft)'
                      : 'var(--bg-surface-subtle)',
                  border: `1.5px solid ${
                    gridSize === sz ? 'var(--accent-primary)' : 'var(--border-subtle)'
                  }`,
                }}
              >
                {sz}×{sz}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.83rem',
              marginBottom: 8,
            }}
          >
            <label htmlFor="mines-count-range" style={{ color: 'var(--text-secondary)' }}>
              Количество мин
            </label>
            <strong className="mono" style={{ color: 'var(--color-danger)' }}>
              {mineCount} из {totalCells - 1}
            </strong>
          </div>
          <input
            id="mines-count-range"
            type="range"
            min={1}
            max={totalCells - 1}
            disabled={isPlaying}
            value={mineCount}
            onChange={(e) => setMineCount(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {[1, 3, 5, 10, Math.min(15, totalCells - 1)].map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={isPlaying}
                className="btn btnSecondary btnSm mono"
                style={{ flex: 1 }}
                onClick={() => setMineCount(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {!isPlaying ? (
          <button
            type="button"
            className="btn btnPrimary btnLg"
            disabled={wager <= 0 || wager > balance}
            onClick={handleStart}
          >
            <Play size={17} /> Начать игру
          </button>
        ) : (
          <button
            type="button"
            className="btn btnGold btnLg"
            disabled={currentSafeCount === 0}
            onClick={() => handleCashout()}
          >
            <CheckCircle2 size={18} />{' '}
            {currentSafeCount === 0
              ? 'Откройте хотя бы 1 ячейку'
              : `Забрать ${formatAmount(potentialWin)} (x${currentMult})`}
          </button>
        )}
      </div>
    </div>
  );
};
