import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, Play, RotateCw, ShieldAlert, User } from 'lucide-react';
import { AvatarIcon } from '../../components/ui/AvatarIcon';
import { BetControls } from '../../components/ui/BetControls';
import { roundCurrency } from '../../core/currency';
import { useCashUp } from '../../state/CashUpContext';
import {
  chooseRussianRouletteBotTarget,
  createRussianRouletteMatch,
  getSeatAngleDeg,
  resolveRevolverTriggerPull,
  RR_MODES,
  RRGameState,
  RussianRouletteMode,
  spinRevolverForFirstTurn,
} from './russianRouletteLogic';
import styles from './RussianRouletteGame.module.css';

export const RussianRouletteGame: React.FC = () => {
  const {
    activeProfile,
    startInteractiveRound,
    saveInteractiveRoundState,
    getInteractiveRound,
    finishRound,
    formatAmount,
    playSound,
    scaleDuration,
  } = useCashUp();

  const [wager, setWager] = useState<number>(0.5);
  const [mode, setMode] = useState<RussianRouletteMode>('duel');
  const [roundId, setRoundId] = useState<string | null>(null);
  const [match, setMatch] = useState<RRGameState | null>(null);

  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [spinTransitionMs, setSpinTransitionMs] = useState<number>(0);
  const [muzzleFlash, setMuzzleFlash] = useState<boolean>(false);

  const botTimerRef = useRef<number | null>(null);
  const balance = activeProfile?.balance ?? 0;

  useEffect(() => {
    return () => {
      if (botTimerRef.current) window.clearTimeout(botTimerRef.current);
    };
  }, []);

  // Restore unfinished interactive round
  useEffect(() => {
    if (roundId) return;
    const saved = getInteractiveRound('russian-roulette');
    if (saved && saved.interactiveState) {
      const st = saved.interactiveState as RRGameState;
      setRoundId(saved.roundId);
      setMatch(st);
      setMode(st.mode);
      setWager(st.wager);
    }
  }, [roundId, getInteractiveRound]);

  const isPlaying = Boolean(roundId && match && match.phase !== 'finished');
  const modeCfg = RR_MODES[match ? match.mode : mode];

  const settleIfFinished = (rid: string, nextState: RRGameState) => {
    if (nextState.phase !== 'finished') {
      saveInteractiveRoundState(rid, nextState);
      return;
    }

    const humanWon = nextState.winnerSeat === 0;
    const mult = RR_MODES[nextState.mode].winMultiplier;
    const payout = humanWon ? roundCurrency(nextState.wager * mult) : 0;

    finishRound({
      roundId: rid,
      payout,
      multiplier: humanWon ? mult : null,
      outcome: humanWon ? 'win' : 'loss',
      summary: `Русская рулетка (${RR_MODES[nextState.mode].title}) · ${
        humanWon ? `Победа (банк x${mult})` : 'Выбывание из-за стола'
      }`,
    });

    setRoundId(null);
  };

  // Automatic bot turn execution when it's a bot's turn
  useEffect(() => {
    if (!roundId || !match || match.phase !== 'turn' || isBusy) return;
    const activeSeat = match.seats[match.currentTurnSeat];
    if (!activeSeat || activeSeat.isHuman) return;

    const thinkMs = scaleDuration(850);
    setIsBusy(true);

    botTimerRef.current = window.setTimeout(() => {
      const targetSeat = chooseRussianRouletteBotTarget(match);
      const step = resolveRevolverTriggerPull(match, targetSeat);
      const aimDur = scaleDuration(420);
      setSpinTransitionMs(aimDur);

      // Rotate barrel toward chosen target first, then pull trigger
      setMatch((prev) =>
        prev ? { ...prev, revolverAngleDeg: step.targetAngleDeg } : prev
      );

      botTimerRef.current = window.setTimeout(() => {
        if (step.firedLive) {
          playSound('gunshot');
          setMuzzleFlash(true);
          window.setTimeout(() => setMuzzleFlash(false), 320);
        } else {
          playSound('dryClick');
        }

        setMatch(step.nextState);
        setIsBusy(false);
        settleIfFinished(roundId, step.nextState);
      }, aimDur);
    }, thinkMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId, match, isBusy]);

  const handleStartMatch = () => {
    if (isPlaying || isBusy) return;
    const initial = createRussianRouletteMatch(
      mode,
      wager,
      activeProfile?.nickname ?? 'Игрок',
      activeProfile?.avatarId ?? 'emerald-diamond'
    );

    const started = startInteractiveRound({
      gameId: 'russian-roulette',
      gameName: 'Русская рулетка',
      wager,
      interactiveState: initial,
    });

    if (!started.ok) return;

    playSound('select');
    setSpinTransitionMs(0);
    setRoundId(started.roundId);
    setMatch(initial);
  };

  const handleSpinRevolver = () => {
    if (!roundId || !match || match.phase !== 'need_spin' || isBusy) return;

    const spun = spinRevolverForFirstTurn(match);
    const dur = scaleDuration(1650);
    setIsBusy(true);
    setSpinTransitionMs(dur);
    playSound('revolverSpin');

    setMatch((prev) =>
      prev ? { ...prev, revolverAngleDeg: spun.targetAngleDeg } : prev
    );

    window.setTimeout(() => {
      setMatch(spun.nextState);
      saveInteractiveRoundState(roundId, spun.nextState);
      setIsBusy(false);
    }, dur);
  };

  const handleHumanShoot = (targetSeat: number) => {
    if (!roundId || !match || match.phase !== 'turn' || isBusy) return;
    const activeSeat = match.seats[match.currentTurnSeat];
    if (!activeSeat || !activeSeat.isHuman) return;

    setIsBusy(true);
    const step = resolveRevolverTriggerPull(match, targetSeat);
    const aimDur = scaleDuration(360);
    setSpinTransitionMs(aimDur);

    setMatch((prev) =>
      prev ? { ...prev, revolverAngleDeg: step.targetAngleDeg } : prev
    );

    window.setTimeout(() => {
      if (step.firedLive) {
        playSound('gunshot');
        setMuzzleFlash(true);
        window.setTimeout(() => setMuzzleFlash(false), 320);
      } else {
        playSound('dryClick');
      }

      setMatch(step.nextState);
      setIsBusy(false);
      settleIfFinished(roundId, step.nextState);
    }, aimDur);
  };

  const previewSeats =
    match?.seats ??
    createRussianRouletteMatch(
      mode,
      wager,
      activeProfile?.nickname ?? 'Игрок',
      activeProfile?.avatarId ?? 'emerald-diamond'
    ).seats;

  const totalPot = roundCurrency((match?.wager ?? wager) * modeCfg.winMultiplier);
  const humanTurn = Boolean(
    isPlaying &&
      match?.phase === 'turn' &&
      match.seats[match.currentTurnSeat]?.isHuman &&
      !isBusy
  );

  return (
    <div className={styles.layout}>
      {/* Tabletop Revolver Arena */}
      <div className={styles.arenaCard}>
        <div className={styles.topHud}>
          <span className="badge badgeGold mono">
            Банк стола: {formatAmount(totalPot)} (x{modeCfg.winMultiplier})
          </span>
          <div className={styles.cylinderRow} title="Барабан на 6 камор (1 патрон)">
            <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>
              Каморы:
            </span>
            <svg width="86" height="20" viewBox="0 0 86 20" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const used = match ? idx < match.chamberIndex : false;
                const firedHere =
                  match?.phase === 'finished' && idx === match.bulletChamber;
                return (
                  <circle
                    key={idx}
                    cx={9 + idx * 13.5}
                    cy="10"
                    r="5"
                    fill={
                      firedHere
                        ? '#ef4444'
                        : used
                          ? '#334155'
                          : '#f59e0b'
                    }
                    opacity={used && !firedHere ? 0.45 : 0.95}
                    stroke="#0f172a"
                    strokeWidth="1.2"
                  />
                );
              })}
            </svg>
            <span className="mono" style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              {match ? `${6 - match.chamberIndex}/6` : '6/6'}
            </span>
          </div>
        </div>

        {/* Circular Table with Seats & Spinning Revolver */}
        <div className={styles.tableStage}>
          <div className={styles.feltCircle}>
            {/* Decorative inner brass ring */}
            <div
              style={{
                width: '72%',
                height: '72%',
                borderRadius: '50%',
                border: '1.5px dashed rgba(245, 158, 11, 0.32)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Spinning Revolver SVG (0 deg = barrel points RIGHT along +X axis) */}
              <svg
                viewBox="0 0 220 220"
                width="186"
                height="186"
                role="img"
                aria-label="Револьвер на игровом столе"
                style={{
                  transform: `rotate(${match?.revolverAngleDeg ?? -90}deg)`,
                  transition:
                    spinTransitionMs > 0
                      ? `transform ${spinTransitionMs}ms cubic-bezier(0.16, 0.88, 0.24, 1)`
                      : 'none',
                  filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.65))',
                }}
              >
                {/* Grip (left side) */}
                <path
                  d="M46 112 L28 148 Q26 156 35 158 L54 156 Q62 154 64 144 L74 118 Z"
                  fill="#7c3f1d"
                  stroke="#f59e0b"
                  strokeWidth="1.8"
                />
                <circle cx="45" cy="144" r="3.5" fill="#fbbf24" />
                {/* Frame & Trigger guard */}
                <path
                  d="M62 96 H122 V120 H84 L72 126 Z"
                  fill="#475569"
                  stroke="#94a3b8"
                  strokeWidth="1.6"
                />
                <path
                  d="M78 120 Q86 136 98 120"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                />
                <path d="M87 120 Q88 127 84 129" fill="none" stroke="#f8fafc" strokeWidth="2" />
                {/* Hammer */}
                <path d="M62 96 L52 86 L58 83 L68 96 Z" fill="#cbd5e1" />
                {/* 6-chamber Cylinder */}
                <rect
                  x="84"
                  y="92"
                  width="34"
                  height="28"
                  rx="5"
                  fill="#1e293b"
                  stroke="#cbd5e1"
                  strokeWidth="1.8"
                />
                <line x1="90" y1="99" x2="112" y2="99" stroke="#64748b" strokeWidth="2" />
                <line x1="90" y1="106" x2="112" y2="106" stroke="#64748b" strokeWidth="2" />
                <line x1="90" y1="113" x2="112" y2="113" stroke="#64748b" strokeWidth="2" />
                {/* Barrel pointing RIGHT (+X = 0 deg) */}
                <rect
                  x="118"
                  y="96"
                  width="64"
                  height="13"
                  rx="3"
                  fill="#64748b"
                  stroke="#e2e8f0"
                  strokeWidth="1.6"
                />
                <rect x="120" y="109" width="44" height="5" rx="2" fill="#334155" />
                {/* Front sight & Muzzle tip */}
                <polygon points="175,96 181,90 182,96" fill="#f59e0b" />
                <circle cx="184" cy="102.5" r="2.8" fill="#0f172a" />

                {/* Muzzle Flash on live shot */}
                {muzzleFlash && (
                  <g>
                    <polygon
                      points="186,102 216,84 204,102 218,120"
                      fill="#ef4444"
                      opacity="0.92"
                    />
                    <polygon
                      points="186,102 208,92 200,102 208,112"
                      fill="#fde047"
                    />
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Player & Bot Seats positioned radially around the table */}
          {previewSeats.map((seat) => {
            const deg = getSeatAngleDeg(seat.seatIndex, previewSeats.length);
            const rad = (deg * Math.PI) / 180;
            const radiusPct = previewSeats.length === 2 ? 42 : 43;
            const leftPct = 50 + radiusPct * Math.cos(rad);
            const topPct = 50 + radiusPct * Math.sin(rad);

            const isTurn =
              match?.phase === 'turn' && match.currentTurnSeat === seat.seatIndex;
            const isWinner =
              match?.phase === 'finished' && match.winnerSeat === seat.seatIndex;

            return (
              <div
                key={seat.seatIndex}
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                className={`${styles.seatNode} ${isTurn ? styles.seatActive : ''} ${
                  isWinner ? styles.seatWinner : ''
                } ${!seat.alive ? styles.seatEliminated : ''}`}
              >
                <AvatarIcon avatarId={seat.avatarId} size={30} />
                <div className={styles.seatName}>
                  {seat.isHuman ? `${seat.nickname} (Вы)` : seat.nickname}
                </div>
                <span
                  className={styles.seatBadge}
                  style={{
                    backgroundColor: !seat.alive
                      ? 'rgba(239, 68, 68, 0.25)'
                      : isWinner
                        ? 'rgba(16, 185, 129, 0.25)'
                        : isTurn
                          ? 'rgba(245, 158, 11, 0.25)'
                          : 'rgba(148, 163, 184, 0.15)',
                    color: !seat.alive
                      ? '#fca5a5'
                      : isWinner
                        ? '#34d399'
                        : isTurn
                          ? '#fcd34d'
                          : '#94a3b8',
                  }}
                >
                  {!seat.alive
                    ? 'Выбыл'
                    : isWinner
                      ? 'Победитель'
                      : isTurn
                        ? 'Стреляет'
                        : 'За столом'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Live Status Banner */}
        <div className={styles.statusBanner} role="status" aria-live="polite">
          {match
            ? match.lastShotSummary
            : `Выберите режим (${modeCfg.title}), сделайте ставку и крутите револьвер на столе.`}
        </div>

        {/* Interactive Action Buttons inside Arena */}
        {isPlaying && match?.phase === 'need_spin' && (
          <div className={styles.actionRow}>
            <button
              type="button"
              className="btn btnGold btnLg"
              disabled={isBusy}
              onClick={handleSpinRevolver}
            >
              <RotateCw size={18} /> Крутить пистолет (кто первый)
            </button>
          </div>
        )}

        {humanTurn && match && (
          <div className={styles.actionRow}>
            {match.mode === 'alternating' ? (
              <button
                type="button"
                className="btn btnDanger btnLg"
                onClick={() => handleHumanShoot(0)}
              >
                <ShieldAlert size={18} /> Выстрелить в себя (по очереди)
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btnGold"
                  onClick={() => handleHumanShoot(0)}
                >
                  <User size={16} /> В себя (при холостом ход остаётся)
                </button>
                {match.seats
                  .filter((s) => !s.isHuman && s.alive)
                  .map((opp) => (
                    <button
                      key={opp.seatIndex}
                      type="button"
                      className="btn btnDanger"
                      onClick={() => handleHumanShoot(opp.seatIndex)}
                    >
                      <Crosshair size={16} /> В {opp.nickname}
                    </button>
                  ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Mode Selector, Stake & Round Log */}
      <div className={styles.controlsCard}>
        <div>
          <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Режим Русской рулетки
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['duel', 'alternating', 'circle5'] as RussianRouletteMode[]).map((mId) => {
              const cfg = RR_MODES[mId];
              const active = (match ? match.mode : mode) === mId;
              return (
                <button
                  key={mId}
                  type="button"
                  disabled={isPlaying || isBusy}
                  onClick={() => {
                    playSound('click');
                    setMode(mId);
                    setMatch(null);
                  }}
                  className={`${styles.modeBtn} ${active ? styles.modeBtnActive : ''}`}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {cfg.title}
                    </strong>
                    <span className="badge badgeGold mono">x{cfg.winMultiplier}</span>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    {cfg.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <BetControls
          wager={wager}
          onChange={setWager}
          disabled={isPlaying || isBusy}
          label="Ваша ставка в банк стола"
        />

        <button
          type="button"
          className="btn btnPrimary btnLg"
          disabled={isPlaying || isBusy || wager <= 0 || wager > balance}
          onClick={handleStartMatch}
        >
          <Play size={17} />{' '}
          {isPlaying ? 'Партия в процессе…' : `Сесть за стол (${formatAmount(wager)})`}
        </button>

        {match && match.log.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: 6,
              }}
            >
              Хроника раунда
            </div>
            <div className={styles.logBox}>
              {match.log.map((line, i) => (
                <div
                  key={i}
                  style={{
                    color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: i === 0 ? 600 : 400,
                  }}
                >
                  • {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
