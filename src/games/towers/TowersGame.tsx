import React, { useEffect, useState } from 'react';
import { CheckCircle2, Flame, Gem, Play, Skull } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { roundCurrency } from '../../core/currency';
import { useCashUp } from '../../state/CashUpContext';
import {
  computeTowerMultiplier,
  generateTowerMap,
  TOWER_DIFFICULTIES,
  TOWER_FLOORS,
  TowerDifficulty,
} from './towersLogic';

interface SavedTowerState {
  difficulty: TowerDifficulty;
  wager: number;
  safeMap: number[][]; // length = TOWER_FLOORS, each row contains safe col indices
  picks: number[]; // chosen col index for each completed/attempted floor
  failedAtFloor: number | null;
  finished: boolean;
}

export const TowersGame: React.FC = () => {
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
  const [difficulty, setDifficulty] = useState<TowerDifficulty>('medium');
  const [roundId, setRoundId] = useState<string | null>(null);
  const [tower, setTower] = useState<SavedTowerState | null>(null);

  const balance = activeProfile?.balance ?? 0;

  useEffect(() => {
    if (roundId) return;
    const saved = getInteractiveRound('towers');
    if (saved && saved.interactiveState) {
      const st = saved.interactiveState as SavedTowerState;
      setRoundId(saved.roundId);
      setTower(st);
      setDifficulty(st.difficulty);
      setWager(st.wager);
    }
  }, [roundId, getInteractiveRound]);

  const isPlaying = Boolean(roundId && tower && !tower.finished);
  const activeDiff = tower ? tower.difficulty : difficulty;
  const cfg = TOWER_DIFFICULTIES[activeDiff];

  const clearedCount =
    tower && tower.failedAtFloor === null ? tower.picks.length : (tower?.failedAtFloor ?? 0);

  const handleStart = () => {
    if (isPlaying) return;
    const safeMap = generateTowerMap(difficulty);
    const nextState: SavedTowerState = {
      difficulty,
      wager,
      safeMap,
      picks: [],
      failedAtFloor: null,
      finished: false,
    };

    const started = startInteractiveRound({
      gameId: 'towers',
      gameName: 'Башня',
      wager,
      interactiveState: nextState,
    });

    if (!started.ok) return;

    playSound('select');
    setRoundId(started.roundId);
    setTower(nextState);
  };

  const handleCashout = (overrideState?: SavedTowerState) => {
    const cur = overrideState ?? tower;
    if (!roundId || !cur || cur.finished || cur.picks.length === 0) return;

    const floorsCleared = cur.picks.length;
    const mult = computeTowerMultiplier(cur.difficulty, floorsCleared);
    const payout = roundCurrency(cur.wager * mult);

    finishRound({
      roundId,
      payout,
      multiplier: mult,
      outcome: 'win',
      summary: `Башня (${TOWER_DIFFICULTIES[cur.difficulty].label}) · Этаж ${floorsCleared}/${TOWER_FLOORS} (x${mult})`,
    });

    setTower({ ...cur, finished: true });
    setRoundId(null);
  };

  const handleTileClick = (floorIdx: number, colIdx: number) => {
    if (!roundId || !tower || tower.finished) return;
    if (floorIdx !== tower.picks.length) return;

    const safeCols = tower.safeMap[floorIdx]!;
    const isSafe = safeCols.includes(colIdx);

    if (!isSafe) {
      const lostState: SavedTowerState = {
        ...tower,
        picks: [...tower.picks, colIdx],
        failedAtFloor: floorIdx,
        finished: true,
      };
      finishRound({
        roundId,
        payout: 0,
        multiplier: null,
        outcome: 'loss',
        summary: `Башня (${TOWER_DIFFICULTIES[tower.difficulty].label}) · Ловушка на этаже ${floorIdx + 1}`,
      });
      setTower(lostState);
      setRoundId(null);
      return;
    }

    playSound('plinkoPeg');
    const nextState: SavedTowerState = {
      ...tower,
      picks: [...tower.picks, colIdx],
    };

    if (nextState.picks.length >= TOWER_FLOORS) {
      handleCashout(nextState);
      return;
    }

    setTower(nextState);
    saveInteractiveRoundState(roundId, nextState);
  };

  const currentMult =
    isPlaying && clearedCount > 0
      ? computeTowerMultiplier(activeDiff, clearedCount)
      : 1;
  const potentialPayout = roundCurrency((tower?.wager ?? wager) * currentMult);

  // Render from top floor (7) down to ground floor (0)
  const floorIndicesDesc = Array.from(
    { length: TOWER_FLOORS },
    (_, i) => TOWER_FLOORS - 1 - i
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}
    >
      {/* Tower Floors Stage */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 9,
        }}
      >
        {floorIndicesDesc.map((floorIdx) => {
          const floorMult = computeTowerMultiplier(activeDiff, floorIdx + 1);
          const isCurrentActiveFloor =
            isPlaying && tower && floorIdx === tower.picks.length;
          const pickedCol =
            tower && floorIdx < tower.picks.length ? tower.picks[floorIdx] : null;
          const revealRow = tower?.finished ?? false;

          return (
            <div
              key={floorIdx}
              style={{
                display: 'grid',
                gridTemplateColumns: '74px 1fr',
                gap: 10,
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: 10,
                backgroundColor: isCurrentActiveFloor
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'var(--bg-surface-subtle)',
                border: `1.5px solid ${
                  isCurrentActiveFloor ? '#10b981' : 'var(--border-subtle)'
                }`,
              }}
            >
              <div className="mono" style={{ fontSize: '0.77rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--text-muted)' }}>Эт.{floorIdx + 1}</span>{' '}
                <span style={{ color: 'var(--accent-gold)' }}>x{floorMult}</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cfg.cols}, 1fr)`,
                  gap: 8,
                }}
              >
                {Array.from({ length: cfg.cols }, (_, colIdx) => {
                  const isSafe = tower?.safeMap[floorIdx]?.includes(colIdx) ?? false;
                  const wasPicked = pickedCol === colIdx;
                  const showSafe = (wasPicked && isSafe) || (revealRow && isSafe);
                  const showTrap =
                    (wasPicked && !isSafe) || (revealRow && !isSafe);

                  return (
                    <button
                      key={colIdx}
                      type="button"
                      disabled={!isCurrentActiveFloor}
                      onClick={() => handleTileClick(floorIdx, colIdx)}
                      aria-label={`Этаж ${floorIdx + 1}, ступень ${colIdx + 1}`}
                      style={{
                        height: 40,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          wasPicked && isSafe
                            ? 'rgba(16, 185, 129, 0.25)'
                            : wasPicked && !isSafe
                              ? 'rgba(239, 68, 68, 0.32)'
                              : isCurrentActiveFloor
                                ? 'var(--bg-elevated)'
                                : 'var(--bg-surface)',
                        border: `1.5px solid ${
                          wasPicked && isSafe
                            ? '#10b981'
                            : wasPicked && !isSafe
                              ? '#ef4444'
                              : isCurrentActiveFloor
                                ? 'var(--border-accent)'
                                : 'var(--border-subtle)'
                        }`,
                        opacity: revealRow && !wasPicked ? 0.65 : 1,
                      }}
                    >
                      {showSafe && <Gem size={18} color="#10b981" />}
                      {showTrap && <Skull size={18} color="#ef4444" />}
                      {!showSafe && !showTrap && isCurrentActiveFloor && (
                        <Flame size={15} color="#f59e0b" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
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
            Сложность башни
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {(['easy', 'medium', 'hard', 'extreme'] as TowerDifficulty[]).map((dId) => {
              const dCfg = TOWER_DIFFICULTIES[dId];
              const active = activeDiff === dId;
              return (
                <button
                  key={dId}
                  type="button"
                  disabled={isPlaying}
                  onClick={() => {
                    playSound('click');
                    setDifficulty(dId);
                    setTower(null);
                  }}
                  style={{
                    padding: '10px',
                    borderRadius: 9,
                    fontWeight: 700,
                    fontSize: '0.81rem',
                    backgroundColor: active
                      ? 'var(--accent-primary-soft)'
                      : 'var(--bg-surface-subtle)',
                    border: `1.5px solid ${
                      active ? 'var(--accent-primary)' : 'var(--border-subtle)'
                    }`,
                  }}
                >
                  {dCfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {!isPlaying ? (
          <button
            type="button"
            className="btn btnPrimary btnLg"
            disabled={wager <= 0 || wager > balance}
            onClick={handleStart}
          >
            <Play size={17} /> Начать подъём
          </button>
        ) : (
          <button
            type="button"
            className="btn btnGold btnLg"
            disabled={clearedCount === 0}
            onClick={() => handleCashout()}
          >
            <CheckCircle2 size={18} />{' '}
            {clearedCount === 0
              ? 'Выберите ступень 1-го этажа'
              : `Забрать ${formatAmount(potentialPayout)} (x${currentMult})`}
          </button>
        )}
      </div>
    </div>
  );
};
