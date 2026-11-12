import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BarChart3, Flame, TrendingDown, TrendingUp } from 'lucide-react';
import { STARTER_BALANCE } from '../core/balance';
import { formatSignedCurrency, roundCurrency } from '../core/currency';
import { getGameById } from '../games/registry';
import { useCashUp } from '../state/CashUpContext';
import { GameHistoryEntry } from '../types';

type StatsPeriod = 'all' | '24h' | '7d' | 'last30';

function computeStreaksForSlice(chronological: readonly GameHistoryEntry[]) {
  let curW = 0;
  let maxW = 0;
  let curL = 0;
  let maxL = 0;

  for (const h of chronological) {
    if (h.outcome === 'win') {
      curW += 1;
      curL = 0;
      if (curW > maxW) maxW = curW;
    } else if (h.outcome === 'loss') {
      curL += 1;
      curW = 0;
      if (curL > maxL) maxL = curL;
    }
  }
  return { maxW, maxL };
}

export const StatisticsPage: React.FC = () => {
  const { activeProfile, settings, formatAmount, playSound } = useCashUp();
  const [period, setPeriod] = useState<StatsPeriod>('all');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const filteredHistory = useMemo(() => {
    const all = activeProfile?.history ?? [];
    if (period === 'all') return all;
    if (period === 'last30') return all.slice(0, 30);

    const nowMs = Date.now();
    const cutoff =
      period === '24h' ? nowMs - 24 * 3600 * 1000 : nowMs - 7 * 24 * 3600 * 1000;
    return all.filter((item) => new Date(item.timestamp).getTime() >= cutoff);
  }, [activeProfile, period]);

  const computed = useMemo(() => {
    const statsAll = activeProfile?.stats;
    if (period === 'all' && statsAll) {
      const winRate =
        statsAll.totalRounds > 0
          ? ((statsAll.wins / statsAll.totalRounds) * 100).toFixed(1)
          : '0.0';
      return {
        rounds: statsAll.totalRounds,
        wins: statsAll.wins,
        losses: statsAll.losses,
        pushes: statsAll.pushes,
        winRate,
        wagered: statsAll.totalWagered,
        won: statsAll.totalWon,
        biggestWin: statsAll.biggestWin,
        longestWinStreak: statsAll.longestWinStreak,
        longestLossStreak: statsAll.longestLossStreak,
      };
    }

    const chronological = [...filteredHistory].reverse();
    let wins = 0;
    let losses = 0;
    let pushes = 0;
    let wagered = 0;
    let won = 0;
    let biggestWin = 0;

    for (const h of chronological) {
      if (h.outcome === 'win') {
        wins += 1;
        if (h.payout > biggestWin) biggestWin = h.payout;
      } else if (h.outcome === 'loss') {
        losses += 1;
      } else {
        pushes += 1;
      }
      wagered = roundCurrency(wagered + h.wager);
      won = roundCurrency(won + h.payout);
    }

    const streaks = computeStreaksForSlice(chronological);
    const rounds = chronological.length;
    const winRate = rounds > 0 ? ((wins / rounds) * 100).toFixed(1) : '0.0';

    return {
      rounds,
      wins,
      losses,
      pushes,
      winRate,
      wagered,
      won,
      biggestWin,
      longestWinStreak: streaks.maxW,
      longestLossStreak: streaks.maxL,
    };
  }, [activeProfile, period, filteredHistory]);

  // Chronological points for SVG balance chart
  const chartPoints = useMemo(() => {
    const chronological = [...filteredHistory].reverse().slice(-60);
    if (chronological.length === 0) {
      const b = activeProfile?.balance ?? STARTER_BALANCE;
      return [
        { label: 'Старт', value: b },
        { label: 'Сейчас', value: b },
      ];
    }
    const firstBefore = roundCurrency(
      chronological[0]!.balanceAfter - chronological[0]!.netChange
    );
    return [
      { label: 'Начало периода', value: firstBefore },
      ...chronological.map((h, idx) => ({
        label: `#${idx + 1} · ${h.gameName}`,
        value: h.balanceAfter,
      })),
    ];
  }, [filteredHistory, activeProfile]);

  const favoriteGamesRanking = useMemo(() => {
    const map = new Map<
      string,
      { gameId: string; title: string; rounds: number; wins: number; won: number }
    >();

    for (const h of filteredHistory) {
      const cur = map.get(h.gameId) ?? {
        gameId: h.gameId,
        title: getGameById(h.gameId)?.title ?? h.gameName,
        rounds: 0,
        wins: 0,
        won: 0,
      };
      cur.rounds += 1;
      if (h.outcome === 'win') cur.wins += 1;
      cur.won = roundCurrency(cur.won + h.payout);
      map.set(h.gameId, cur);
    }

    return Array.from(map.values())
      .sort((a, b) => b.rounds - a.rounds)
      .slice(0, 6);
  }, [filteredHistory]);

  // SVG Chart Geometry (680 x 210)
  const chartSvg = useMemo(() => {
    const w = 680;
    const h = 210;
    const padX = 20;
    const padY = 24;
    const vals = chartPoints.map((p) => p.value);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const span = Math.max(10, maxVal - minVal);

    const coords = chartPoints.map((pt, idx) => {
      const x =
        padX +
        (idx / Math.max(1, chartPoints.length - 1)) * (w - padX * 2);
      const y =
        h - padY - ((pt.value - minVal) / span) * (h - padY * 2);
      return { ...pt, x, y };
    });

    const linePath = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');
    const areaPath = `${linePath} L ${coords[coords.length - 1]!.x.toFixed(
      1
    )} ${h - padY} L ${coords[0]!.x.toFixed(1)} ${h - padY} Z`;

    return { w, h, minVal, maxVal, coords, linePath, areaPath };
  }, [chartPoints]);

  const hoveredPoint =
    hoverIdx !== null ? chartSvg.coords[hoverIdx] ?? null : null;

  return (
    <div className="pageEnter" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Top Header & Period Selector */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <div>
          <h1>Игровая статистика</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            Аналитика раундов, серий и динамики баланса активного профиля.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} role="tablist" aria-label="Период статистики">
          {(
            [
              { id: 'all', label: 'За всё время' },
              { id: '24h', label: '24 часа' },
              { id: '7d', label: '7 дней' },
              { id: 'last30', label: '30 раундов' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={period === p.id}
              className={`btn btnSm ${period === p.id ? 'btnPrimary' : 'btnSecondary'}`}
              onClick={() => {
                playSound('click');
                setPeriod(p.id);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: 14,
        }}
      >
        {[
          { label: 'Сыграно раундов', val: String(computed.rounds) },
          {
            label: 'Побед / Поражений',
            val: `${computed.wins} / ${computed.losses}`,
            accent: 'var(--accent-primary)',
          },
          {
            label: 'Процент побед',
            val: `${computed.winRate}%`,
            accent: 'var(--accent-primary)',
          },
          {
            label: 'Оборот ставок',
            val: formatAmount(computed.wagered),
          },
          {
            label: 'Сумма выигрышей',
            val: formatAmount(computed.won),
            accent: 'var(--accent-primary)',
          },
          {
            label: 'Наибольший выигрыш',
            val: formatAmount(computed.biggestWin),
            accent: 'var(--accent-gold)',
          },
          {
            label: 'Макс. победная серия',
            val: `${computed.longestWinStreak} подр.`,
          },
          {
            label: 'Макс. серия поражений',
            val: `${computed.longestLossStreak} подр.`,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 18px',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {kpi.label}
            </div>
            <div
              className="mono"
              style={{
                fontSize: '1.22rem',
                fontWeight: 800,
                marginTop: 5,
                color: kpi.accent ?? 'var(--text-primary)',
              }}
            >
              {kpi.val}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}
      >
        {/* Balance Trajectory SVG Chart */}
        <section
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={19} style={{ color: 'var(--accent-primary)' }} />
              Динамика баланса
            </h2>
            <span className="mono" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {hoveredPoint
                ? `${hoveredPoint.label}: ${formatAmount(hoveredPoint.value)}`
                : `Мин: ${formatAmount(chartSvg.minVal)} · Макс: ${formatAmount(chartSvg.maxVal)}`}
            </span>
          </div>

          <svg
            viewBox={`0 0 ${chartSvg.w} ${chartSvg.h}`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            role="img"
            aria-label="График изменения баланса"
            onMouseLeave={() => setHoverIdx(null)}
          >
            <defs>
              <linearGradient id="balanceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {[40, 105, 170].map((y) => (
              <line
                key={y}
                x1="20"
                y1={y}
                x2="660"
                y2={y}
                stroke="var(--border-subtle)"
                strokeDasharray="4 4"
              />
            ))}

            <path d={chartSvg.areaPath} fill="url(#balanceAreaGrad)" />
            <path
              d={chartSvg.linePath}
              fill="none"
              stroke="var(--accent-primary)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {chartSvg.coords.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={hoverIdx === idx ? 5.5 : 3}
                fill={hoverIdx === idx ? '#f59e0b' : '#10b981'}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoverIdx(idx)}
              />
            ))}
          </svg>
        </section>

        {/* Favorite Games Breakdown */}
        <section
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Award size={19} style={{ color: 'var(--accent-gold)' }} />
            Любимые игры периода
          </h2>

          {favoriteGamesRanking.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '18px 0' }}>
              За выбранный период ещё нет завершённых раундов.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {favoriteGamesRanking.map((item) => {
                const maxRounds = favoriteGamesRanking[0]!.rounds || 1;
                const pct = Math.round((item.rounds / maxRounds) * 100);
                return (
                  <div key={item.gameId}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.86rem',
                        marginBottom: 5,
                      }}
                    >
                      <Link
                        to={`/games/${item.gameId}`}
                        style={{ fontWeight: 600 }}
                      >
                        {item.title}
                      </Link>
                      <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                        {item.rounds} раунд. · Выигрыши {formatAmount(item.won)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: 'var(--bg-surface-subtle)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          borderRadius: 999,
                          backgroundColor: 'var(--accent-primary)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Outcome Ratio Bar */}
          {computed.rounds > 0 && (
            <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                Соотношение исходов ({computed.wins} побед / {computed.pushes} ничьих / {computed.losses} поражений)
              </div>
              <div
                style={{
                  display: 'flex',
                  height: 10,
                  borderRadius: 999,
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-surface-subtle)',
                }}
              >
                <div
                  style={{
                    width: `${(computed.wins / computed.rounds) * 100}%`,
                    backgroundColor: 'var(--accent-primary)',
                  }}
                />
                <div
                  style={{
                    width: `${(computed.pushes / computed.rounds) * 100}%`,
                    backgroundColor: 'var(--accent-gold)',
                  }}
                />
                <div
                  style={{
                    width: `${(computed.losses / computed.rounds) * 100}%`,
                    backgroundColor: 'var(--color-danger)',
                  }}
                />
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Recent Gaming Sessions */}
      <section
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Flame size={19} style={{ color: 'var(--accent-primary)' }} />
            Последние игровые сессии
          </h2>
          <Link
            to="/history"
            style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600 }}
          >
            Открыть полную историю →
          </Link>
        </div>

        {filteredHistory.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            История раундов за выбранный период пуста.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredHistory.slice(0, 8).map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 10,
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.86rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {item.outcome === 'win' ? (
                    <TrendingUp size={16} color="var(--accent-primary)" />
                  ) : (
                    <TrendingDown size={16} color="var(--color-danger)" />
                  )}
                  <Link to={`/games/${item.gameId}`} style={{ fontWeight: 700 }}>
                    {item.gameName}
                  </Link>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.summary}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {item.multiplier !== null && (
                    <span className="badge badgeGold mono">x{item.multiplier}</span>
                  )}
                  <span
                    className="mono"
                    style={{
                      fontWeight: 700,
                      color:
                        item.netChange > 0
                          ? 'var(--accent-primary)'
                          : item.netChange < 0
                            ? 'var(--color-danger)'
                            : 'var(--text-secondary)',
                    }}
                  >
                    {formatSignedCurrency(item.netChange, settings.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
