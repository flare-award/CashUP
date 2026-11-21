import React, { useEffect, useRef, useState } from 'react';
import { Check, Download, Play } from 'lucide-react';
import { AvatarIcon } from '../../components/ui/AvatarIcon';
import { BetControls } from '../../components/ui/BetControls';
import { PlayingCard, SuitSvg } from '../../components/ui/PlayingCard';
import { suitNameRu } from '../../core/cards';
import { roundCurrency } from '../../core/currency';
import { useCashUp } from '../../state/CashUpContext';
import {
  canAttackWithCard,
  canBeatDurakCard,
  createDurakMatch,
  declareBito,
  defenderTakeTable,
  DURAK_PAYOUT_MULTIPLIERS,
  DurakPlayerCount,
  DurakState,
  getActiveDurakRole,
  playAttackCard,
  playDefenseCard,
  stepDurakBotTurn,
} from './durakLogic';
import styles from './DurakGame.module.css';

export const DurakGame: React.FC = () => {
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
  const [playerCount, setPlayerCount] = useState<DurakPlayerCount>(2);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [game, setGame] = useState<DurakState | null>(null);
  const [botBusy, setBotBusy] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const balance = activeProfile?.balance ?? 0;

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (roundId) return;
    const saved = getInteractiveRound('durak');
    if (saved && saved.interactiveState) {
      const st = saved.interactiveState as DurakState;
      setRoundId(saved.roundId);
      setGame(st);
      setPlayerCount(st.playerCount);
      setWager(st.wager);
    }
  }, [roundId, getInteractiveRound]);

  const settleIfFinished = (rid: string, nextState: DurakState) => {
    if (nextState.phase !== 'finished') {
      saveInteractiveRoundState(rid, nextState);
      return;
    }

    const mult = DURAK_PAYOUT_MULTIPLIERS[nextState.playerCount];
    const isPush = nextState.winnerSeat === -1;
    const isWin = nextState.winnerSeat === 0;
    const payout = isWin
      ? roundCurrency(nextState.wager * mult)
      : isPush
        ? nextState.wager
        : 0;

    finishRound({
      roundId: rid,
      payout,
      multiplier: isWin ? mult : isPush ? 1 : null,
      outcome: isWin ? 'win' : isPush ? 'push' : 'loss',
      summary: `Подкидной Дурак (${nextState.playerCount} игр.) · ${
        isWin ? `Победа (x${mult})` : isPush ? 'Ничья' : 'Победа соперника'
      }`,
    });

    setRoundId(null);
  };

  // Run bot step whenever active actor is a bot
  useEffect(() => {
    if (!roundId || !game || game.phase !== 'playing' || botBusy) return;
    const active = getActiveDurakRole(game);
    const actor = game.seats[active.seatIndex];
    if (!actor || actor.isHuman) return;

    setBotBusy(true);
    const delay = scaleDuration(580);
    timerRef.current = window.setTimeout(() => {
      const next = stepDurakBotTurn(game);
      playSound('cardDeal');
      setGame(next);
      setBotBusy(false);
      settleIfFinished(roundId, next);
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId, game, botBusy]);

  const handleStart = () => {
    if (roundId && game && game.phase === 'playing') return;
    const fresh = createDurakMatch(
      playerCount,
      wager,
      activeProfile?.nickname ?? 'Игрок',
      activeProfile?.avatarId ?? 'emerald-diamond'
    );

    const started = startInteractiveRound({
      gameId: 'durak',
      gameName: 'Подкидной Дурак',
      wager,
      interactiveState: fresh,
    });

    if (!started.ok) return;

    playSound('cardDeal');
    setRoundId(started.roundId);
    setGame(fresh);
  };

  const isPlaying = Boolean(roundId && game && game.phase === 'playing');
  const activeRole = game && game.phase === 'playing' ? getActiveDurakRole(game) : null;
  const isHumanTurn = Boolean(
    isPlaying && activeRole && activeRole.seatIndex === 0 && !botBusy
  );

  const firstUncoveredIdx = game
    ? game.tablePairs.findIndex((p) => p.defense === null)
    : -1;

  const handleCardClick = (cardId: string) => {
    if (!roundId || !game || !isHumanTurn || !activeRole) return;

    if (activeRole.role === 'attacker') {
      const next = playAttackCard(game, 0, cardId);
      if (next === game) return;
      playSound('cardDeal');
      setGame(next);
      settleIfFinished(roundId, next);
      return;
    }

    if (activeRole.role === 'defender' && firstUncoveredIdx >= 0) {
      const next = playDefenseCard(game, firstUncoveredIdx, cardId);
      if (next === game) return;
      playSound('cardFlip');
      setGame(next);
      settleIfFinished(roundId, next);
    }
  };

  const handleBito = () => {
    if (!roundId || !game || !isHumanTurn || activeRole?.role !== 'attacker') return;
    const next = declareBito(game);
    if (next === game) return;
    playSound('select');
    setGame(next);
    settleIfFinished(roundId, next);
  };

  const handleTake = () => {
    if (!roundId || !game || !isHumanTurn || activeRole?.role !== 'defender') return;
    const next = defenderTakeTable(game);
    playSound('click');
    setGame(next);
    settleIfFinished(roundId, next);
  };

  const humanSeat = game?.seats[0];
  const defenderSeatObj = game ? game.seats[game.defenderSeat] : null;
  const mult = DURAK_PAYOUT_MULTIPLIERS[game ? game.playerCount : playerCount];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className={styles.feltArena}>
        {/* Top Row: Opponents */}
        {game ? (
          <div className={styles.opponentsRow}>
            {game.seats.slice(1).map((bot) => {
              const isBotAttacker = game.attackerSeat === bot.seatIndex;
              const isBotDefender = game.defenderSeat === bot.seatIndex;
              const isActing = activeRole?.seatIndex === bot.seatIndex;
              return (
                <div
                  key={bot.seatIndex}
                  className={`${styles.botBox} ${isActing ? styles.botActive : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AvatarIcon avatarId={bot.avatarId} size={34} />
                    <div>
                      <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.88rem' }}>
                        {bot.nickname}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                        {isBotAttacker
                          ? 'Атакует'
                          : isBotDefender
                            ? 'Защищается'
                            : 'Подбрасывает'}
                      </div>
                    </div>
                  </div>
                  <span className="badge badgeNeutral mono">
                    Карт: {bot.hand.length}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '8px 0',
              color: '#cbd5e1',
              fontSize: '0.9rem',
            }}
          >
            Классический Подкидной Дурак (колода 36 карт). Выберите стол на 2, 3 или 4 игроков и начните раздачу!
          </div>
        )}

        {/* Center Zone: Talon + Trump Card & Battle Pairs */}
        <div className={styles.centerZone}>
          <div className={styles.talonBox}>
            {game ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    borderRadius: 999,
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                  }}
                >
                  <SuitSvg suit={game.trumpSuit} size={15} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                    Козырь: {suitNameRu(game.trumpSuit)}
                  </span>
                </div>

                {game.deck.length > 0 ? (
                  <div
                    style={{
                      position: 'relative',
                      width: 96,
                      height: 92,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ transform: 'rotate(90deg) translateY(-12px)' }}>
                      <PlayingCard card={game.trumpCard} size="sm" />
                    </div>
                    {game.deck.length > 1 && (
                      <div style={{ position: 'absolute', left: 8 }}>
                        <PlayingCard faceDown size="sm" />
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="badge badgeNeutral">Колода пуста</span>
                )}

                <div className="mono" style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                  В колоде: {game.deck.length} · Отбой: {game.discardCount}
                </div>
              </>
            ) : (
              <div style={{ padding: '12px 16px', textAlign: 'center', color: '#94a3b8' }}>
                <PlayingCard faceDown size="sm" />
                <div style={{ fontSize: '0.75rem', marginTop: 6 }}>36 карт (6–A)</div>
              </div>
            )}
          </div>

          {/* Battle Pairs on Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className={styles.battleGrid}>
              {game && game.tablePairs.length > 0 ? (
                game.tablePairs.map((pair, idx) => (
                  <div key={pair.attack.id} className={styles.pairSlot}>
                    <PlayingCard
                      card={pair.attack}
                      size="sm"
                      highlighted={idx === firstUncoveredIdx}
                    />
                    {pair.defense && (
                      <div className={styles.defenseOverlay}>
                        <PlayingCard card={pair.defense} size="sm" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.86rem' }}>
                  {game ? 'Стол чист — ожидание захода карты' : 'Игровое сукно готово'}
                </div>
              )}
            </div>

            {game && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  padding: '9px 14px',
                  borderRadius: 10,
                  backgroundColor:
                    game.phase === 'finished' && game.winnerSeat === 0
                      ? 'rgba(16, 185, 129, 0.24)'
                      : 'rgba(15, 23, 42, 0.78)',
                  border: `1px solid ${
                    game.phase === 'finished' && game.winnerSeat === 0
                      ? '#10b981'
                      : 'rgba(148, 163, 184, 0.28)'
                  }`,
                  color: '#f8fafc',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                {game.statusText}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Area: Human Hand OR Pre-match Setup */}
        <div className={styles.playerArea}>
          {isPlaying && game && humanSeat ? (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div>
                  <strong style={{ color: '#f8fafc' }}>
                    {humanSeat.nickname} (Вы) · Карт на руках: {humanSeat.hand.length}
                  </strong>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {game.attackerSeat === 0
                      ? 'Ваша роль в этом розыгрыше: Атака / Подбрасывание'
                      : game.defenderSeat === 0
                        ? 'Ваша роль в этом розыгрыше: Защита'
                        : 'Ожидание хода соперников'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {isHumanTurn &&
                    activeRole?.role === 'attacker' &&
                    game.tablePairs.length > 0 &&
                    game.tablePairs.every((p) => p.defense !== null) && (
                      <button
                        type="button"
                        className="btn btnGold"
                        onClick={handleBito}
                      >
                        <Check size={16} /> Бито (завершить ход)
                      </button>
                    )}

                  {isHumanTurn &&
                    activeRole?.role === 'defender' &&
                    firstUncoveredIdx >= 0 && (
                      <button
                        type="button"
                        className="btn btnDanger"
                        onClick={handleTake}
                      >
                        <Download size={16} /> Взять карты со стола
                      </button>
                    )}
                </div>
              </div>

              <div className={styles.handScroll}>
                {humanSeat.hand.map((card) => {
                  let playable = false;
                  if (isHumanTurn && activeRole?.role === 'attacker' && defenderSeatObj) {
                    playable = canAttackWithCard(
                      card,
                      game.tablePairs,
                      defenderSeatObj.hand.length
                    );
                  } else if (
                    isHumanTurn &&
                    activeRole?.role === 'defender' &&
                    firstUncoveredIdx >= 0
                  ) {
                    const targetAttack = game.tablePairs[firstUncoveredIdx]!.attack;
                    playable = canBeatDurakCard(targetAttack, card, game.trumpSuit);
                  }

                  return (
                    <button
                      key={card.id}
                      type="button"
                      disabled={!playable}
                      onClick={() => handleCardClick(card.id)}
                      className={`${styles.cardBtn} ${
                        playable ? styles.cardBtnPlayable : styles.cardBtnDimmed
                      }`}
                      aria-label={`Сыграть карту ${card.rank} ${suitNameRu(card.suit)}`}
                    >
                      <PlayingCard card={card} size="sm" highlighted={playable} />
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16,
                alignItems: 'end',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: '#cbd5e1',
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  Количество игроков за столом
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {([2, 3, 4] as DurakPlayerCount[]).map((cnt) => {
                    const active = playerCount === cnt;
                    return (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          playSound('click');
                          setPlayerCount(cnt);
                        }}
                        style={{
                          padding: '9px 8px',
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          color: '#f8fafc',
                          backgroundColor: active
                            ? 'rgba(16, 185, 129, 0.25)'
                            : 'rgba(30, 41, 59, 0.85)',
                          border: `1.5px solid ${active ? '#10b981' : '#475569'}`,
                        }}
                      >
                        {cnt} игр. (x{DURAK_PAYOUT_MULTIPLIERS[cnt]})
                      </button>
                    );
                  })}
                </div>
              </div>

              <BetControls
                wager={wager}
                onChange={setWager}
                label={`Ставка за партию (приз x${mult})`}
              />

              <button
                type="button"
                className="btn btnPrimary btnLg"
                disabled={wager <= 0 || wager > balance}
                onClick={handleStart}
              >
                <Play size={17} /> Раздать 36 карт (банк {formatAmount(roundCurrency(wager * mult))})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
