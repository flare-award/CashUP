import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';
import { GAME_NOMINATIVE_MAP } from '../../core/npc';
import { useCashUp } from '../../state/CashUpContext';
import { AvatarIcon } from './AvatarIcon';
import styles from './LiveHallRibbon.module.css';

export const LiveHallRibbon: React.FC = () => {
  const { state, formatAmount, playSound } = useCashUp();

  // Show winning events (left = newest win, pushing older wins to the right)
  const winners = useMemo(
    () =>
      state.npcHistory
        .filter((ev) => ev.actionType === 'win' || ev.actionType === 'multiplier')
        .slice(0, 12),
    [state.npcHistory]
  );

  const headId = winners[0]?.id ?? null;
  const prevHeadIdRef = useRef<string | null>(headId);
  const [animKey, setAnimKey] = useState<number>(0);

  useEffect(() => {
    if (headId && prevHeadIdRef.current && headId !== prevHeadIdRef.current) {
      setAnimKey((k) => k + 1);
    }
    prevHeadIdRef.current = headId;
  }, [headId]);

  return (
    <section
      className={styles.ribbon}
      aria-label="Лента выигрышей прямого эфира зала"
    >
      <div className={styles.liveTag}>
        <span className={styles.pulseDot} aria-hidden="true" />
        <Radio size={14} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
        <span className={styles.liveLabel}>Прямой эфир</span>
      </div>

      <div className={styles.viewport}>
        {winners.length === 0 ? (
          <span className={styles.emptyHint}>Ожидание новых выигрышей в зале…</span>
        ) : (
          <div
            key={animKey}
            className={`${styles.track} ${animKey > 0 ? styles.trackSliding : ''}`}
          >
            {winners.map((ev, index) => {
              const gameShort = GAME_NOMINATIVE_MAP[ev.gameId] ?? ev.gameName;
              const isFresh = animKey > 0 && index === 0;
              return (
                <Link
                  key={ev.id}
                  to={`/games/${ev.gameId}`}
                  onClick={() => playSound('click')}
                  className={`${styles.winCard} ${isFresh ? styles.winCardFresh : ''}`}
                  title={`${ev.nickname} — ${gameShort}`}
                >
                  <AvatarIcon avatarId={ev.avatarId} size={26} />
                  <div className={styles.meta}>
                    <div className={styles.topRow}>
                      <span className={styles.nickname}>{ev.nickname}</span>
                      {ev.multiplier !== undefined && (
                        <span className={styles.mult}>x{ev.multiplier}</span>
                      )}
                    </div>
                    <div className={styles.bottomRow}>
                      <span className={styles.gameTitle}>{gameShort}</span>
                      <span className={`${styles.amount} tabular`}>
                        {ev.amount !== undefined
                          ? `+${formatAmount(ev.amount)}`
                          : ev.multiplier !== undefined
                            ? `x${ev.multiplier}`
                            : 'Победа'}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
