import React, { useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { BetControls } from '../../components/ui/BetControls';
import { PlayingCard } from '../../components/ui/PlayingCard';
import { Card } from '../../core/cards';
import { useCashUp } from '../../state/CashUpContext';
import {
  BaccaratDealOutcome,
  BaccaratSide,
  baccaratHandScore,
  dealBaccaratRound,
} from './baccaratLogic';

export const BaccaratGame: React.FC = () => {
  const {
    activeProfile,
    startPrecomputedRound,
    finishRound,
    formatAmount,
    playSound,
    scaleDuration,
  } = useCashUp();

  const [wager, setWager] = useState<number>(0.5);
  const [side, setSide] = useState<BaccaratSide>('player');
  const [isDealing, setIsDealing] = useState<boolean>(false);
  const lockRef = useRef(false);

  const [visiblePlayer, setVisiblePlayer] = useState<Card[]>([]);
  const [visibleBanker, setVisibleBanker] = useState<Card[]>([]);
  const [lastResult, setLastResult] = useState<BaccaratDealOutcome | null>(null);
  const [beadRoad, setBeadRoad] = useState<BaccaratSide[]>([
    'banker',
    'player',
    'player',
    'banker',
    'tie',
    'banker',
  ]);

  const balance = activeProfile?.balance ?? 0;

  const handlePlay = () => {
    if (lockRef.current || isDealing) return;

    const deal = dealBaccaratRound(side, wager);
    const started = startPrecomputedRound({
      gameId: 'baccarat',
      gameName: 'Баккара',
      wager,
      precomputed: {
        payout: deal.payout,
        multiplier: deal.multiplier,
        outcome: deal.roundOutcome,
        summary: deal.summary,
      },
    });

    if (!started.ok) return;

    lockRef.current = true;
    setIsDealing(true);
    setLastResult(null);
    setVisiblePlayer([]);
    setVisibleBanker([]);

    const stepMs = scaleDuration(260);
    if (stepMs === 0) {
      setVisiblePlayer(deal.playerCards);
      setVisibleBanker(deal.bankerCards);
      finishRound({
        roundId: started.roundId,
        payout: deal.payout,
        multiplier: deal.multiplier,
        outcome: deal.roundOutcome,
        summary: deal.summary,
      });
      setLastResult(deal);
      setBeadRoad((prev) => [deal.winner, ...prev].slice(0, 14));
      setIsDealing(false);
      lockRef.current = false;
      return;
    }

    // Sequential animated dealing: P1 -> B1 -> P2 -> B2 -> P3? -> B3?
    const timeline: Array<() => void> = [
      () => {
        playSound('cardDeal');
        setVisiblePlayer([deal.playerCards[0]!]);
      },
      () => {
        playSound('cardDeal');
        setVisibleBanker([deal.bankerCards[0]!]);
      },
      () => {
        playSound('cardDeal');
        setVisiblePlayer(deal.playerCards.slice(0, 2));
      },
      () => {
        playSound('cardDeal');
        setVisibleBanker(deal.bankerCards.slice(0, 2));
      },
    ];

    if (deal.playerCards[2]) {
      timeline.push(() => {
        playSound('cardFlip');
        setVisiblePlayer(deal.playerCards);
      });
    }
    if (deal.bankerCards[2]) {
      timeline.push(() => {
        playSound('cardFlip');
        setVisibleBanker(deal.bankerCards);
      });
    }

    timeline.forEach((fn, i) => {
      window.setTimeout(fn, i * stepMs);
    });

    window.setTimeout(() => {
      finishRound({
        roundId: started.roundId,
        payout: deal.payout,
        multiplier: deal.multiplier,
        outcome: deal.roundOutcome,
        summary: deal.summary,
      });
      setLastResult(deal);
      setBeadRoad((prev) => [deal.winner, ...prev].slice(0, 14));
      setIsDealing(false);
      lockRef.current = false;
    }, timeline.length * stepMs + 140);
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
      {/* Punto Banco Table */}
      <div
        style={{
          backgroundColor: 'var(--felt-bg)',
          border: '1px solid var(--felt-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {/* Player Box */}
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              backgroundColor: 'rgba(15, 32, 52, 0.72)',
              border: `2px solid ${
                lastResult?.winner === 'player' ? '#3b82f6' : 'rgba(59, 130, 246, 0.3)'
              }`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              minHeight: 195,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, color: '#93c5fd' }}>PLAYER · ИГРОК</span>
              {visiblePlayer.length > 0 && (
                <span className="badge badgeNeutral mono">
                  {baccaratHandScore(visiblePlayer)}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {visiblePlayer.length > 0 ? (
                visiblePlayer.map((c) => <PlayingCard key={c.id} card={c} size="md" />)
              ) : (
                <>
                  <PlayingCard faceDown size="md" />
                  <PlayingCard faceDown size="md" />
                </>
              )}
            </div>
          </div>

          {/* Banker Box */}
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              backgroundColor: 'rgba(43, 23, 27, 0.72)',
              border: `2px solid ${
                lastResult?.winner === 'banker' ? '#f59e0b' : 'rgba(245, 158, 11, 0.3)'
              }`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              minHeight: 195,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, color: '#fcd34d' }}>BANKER · БАНКИР</span>
              {visibleBanker.length > 0 && (
                <span className="badge badgeNeutral mono">
                  {baccaratHandScore(visibleBanker)}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {visibleBanker.length > 0 ? (
                visibleBanker.map((c) => <PlayingCard key={c.id} card={c} size="md" />)
              ) : (
                <>
                  <PlayingCard faceDown size="md" />
                  <PlayingCard faceDown size="md" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Outcome Banner */}
        <div
          aria-live="polite"
          style={{
            padding: '11px 16px',
            borderRadius: 10,
            backgroundColor: 'rgba(11, 14, 20, 0.68)',
            textAlign: 'center',
            color: '#f8fafc',
            fontWeight: 600,
          }}
        >
          {isDealing
            ? 'Раздаём карты по правилам Punto Banco…'
            : lastResult
              ? `${lastResult.summary}${
                  lastResult.payout > 0 ? ` · Выплата ${formatAmount(lastResult.payout)}` : ''
                }`
              : 'Выберите сторону: Player (x2.0), Banker (x1.95) или Tie (x9.0)'}
        </div>

        {/* Bead Road History */}
        <div>
          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: 6 }}>
            История исходов стола
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {beadRoad.map((item, idx) => (
              <span
                key={idx}
                className="mono"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  backgroundColor:
                    item === 'player'
                      ? '#2563eb'
                      : item === 'banker'
                        ? '#d97706'
                        : '#10b981',
                  color: item === 'tie' ? '#04130d' : '#ffffff',
                }}
                title={
                  item === 'player' ? 'Игрок' : item === 'banker' ? 'Банкир' : 'Ничья'
                }
              >
                {item === 'player' ? 'P' : item === 'banker' ? 'B' : 'T'}
              </span>
            ))}
          </div>
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
        <div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Сторона ставки
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {(
              [
                { id: 'player', label: 'Player', mult: 'x2.00', color: '#3b82f6' },
                { id: 'tie', label: 'Tie (Ничья)', mult: 'x9.00', color: '#10b981' },
                { id: 'banker', label: 'Banker', mult: 'x1.95', color: '#f59e0b' },
              ] as const
            ).map((opt) => {
              const active = side === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isDealing}
                  onClick={() => {
                    playSound('click');
                    setSide(opt.id);
                  }}
                  style={{
                    padding: '12px 8px',
                    borderRadius: 10,
                    backgroundColor: active
                      ? 'var(--bg-surface-hover)'
                      : 'var(--bg-surface-subtle)',
                    border: `2px solid ${active ? opt.color : 'var(--border-subtle)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>{opt.label}</span>
                  <span className="mono" style={{ fontSize: '0.78rem', color: opt.color, fontWeight: 700 }}>
                    {opt.mult}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <BetControls wager={wager} onChange={setWager} disabled={isDealing} />

        <button
          type="button"
          className="btn btnPrimary btnLg"
          disabled={isDealing || wager <= 0 || wager > balance}
          onClick={handlePlay}
        >
          <Play size={17} /> {isDealing ? 'Раздача…' : 'Сделать ставку и раздать'}
        </button>
      </div>
    </div>
  );
};
