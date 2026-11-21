import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { formatSignedCurrency } from '../core/currency';
import { GAME_CATALOG } from '../games/registry';
import { useCashUp } from '../state/CashUpContext';

type HistoryTab = 'rounds' | 'ledger';
type SortOrder = 'newest' | 'oldest' | 'wager-desc' | 'net-desc';

export const HistoryPage: React.FC = () => {
  const { activeProfile, settings, formatAmount, playSound } = useCashUp();

  const [tab, setTab] = useState<HistoryTab>('rounds');
  const [query, setQuery] = useState<string>('');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const filteredRounds = useMemo(() => {
    const list = activeProfile?.history ?? [];
    const q = query.trim().toLowerCase();

    return list
      .filter((item) => {
        if (gameFilter !== 'all' && item.gameId !== gameFilter) return false;
        if (outcomeFilter !== 'all' && item.outcome !== outcomeFilter) return false;
        if (q) {
          const text = `${item.gameName} ${item.summary}`.toLowerCase();
          if (!text.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
        if (sortOrder === 'wager-desc') {
          return b.wager - a.wager;
        }
        if (sortOrder === 'net-desc') {
          return b.netChange - a.netChange;
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [activeProfile, query, gameFilter, outcomeFilter, sortOrder]);

  const filteredLedger = useMemo(() => {
    const list = activeProfile?.ledger ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((op) =>
      q ? op.description.toLowerCase().includes(q) : true
    );
  }, [activeProfile, query]);

  const formatDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="pageEnter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <h1>История игр и операций</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            Журнал ставок, результатов раундов и всех движений баланса счёта.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`btn btnSm ${tab === 'rounds' ? 'btnPrimary' : 'btnSecondary'}`}
            onClick={() => {
              playSound('click');
              setTab('rounds');
            }}
          >
            Раунды ({activeProfile?.history.length ?? 0})
          </button>
          <button
            type="button"
            className={`btn btnSm ${tab === 'ledger' ? 'btnPrimary' : 'btnSecondary'}`}
            onClick={() => {
              playSound('click');
              setTab('ledger');
            }}
          >
            Операции баланса ({activeProfile?.ledger.length ?? 0})
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 14,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: 11,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="search"
            className="inputField"
            style={{ paddingLeft: 34 }}
            placeholder="Поиск по игре или описанию…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Поиск в истории"
          />
        </div>

        {tab === 'rounds' && (
          <>
            <select
              aria-label="Фильтр по игре"
              className="inputField"
              style={{ width: 'auto' }}
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
            >
              <option value="all">Все игры</option>
              {GAME_CATALOG.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>

            <select
              aria-label="Фильтр по результату"
              className="inputField"
              style={{ width: 'auto' }}
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
            >
              <option value="all">Любой исход</option>
              <option value="win">Выигрыш</option>
              <option value="loss">Проигрыш</option>
              <option value="push">Возврат / Ничья</option>
            </select>

            <select
              aria-label="Сортировка"
              className="inputField"
              style={{ width: 'auto' }}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            >
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
              <option value="wager-desc">По размеру ставки</option>
              <option value="net-desc">По изменению баланса</option>
            </select>
          </>
        )}
      </div>

      {/* Table / List */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflowX: 'auto',
        }}
      >
        {tab === 'rounds' ? (
          filteredRounds.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Записей по выбранным параметрам пока нет.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720, fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Игра</th>
                  <th style={{ padding: '12px 12px' }}>Дата и время</th>
                  <th style={{ padding: '12px 12px' }}>Вирт. ставка</th>
                  <th style={{ padding: '12px 12px' }}>Результат</th>
                  <th style={{ padding: '12px 12px' }}>Множитель</th>
                  <th style={{ padding: '12px 12px' }}>Исход</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Изм. баланса</th>
                </tr>
              </thead>
              <tbody>
                {filteredRounds.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                      <Link
                        to={`/games/${row.gameId}`}
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        {row.gameName}
                      </Link>
                    </td>
                    <td className="mono" style={{ padding: '12px 12px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {formatDateTime(row.timestamp)}
                    </td>
                    <td className="mono" style={{ padding: '12px 12px' }}>
                      {formatAmount(row.wager)}
                    </td>
                    <td style={{ padding: '12px 12px', color: 'var(--text-secondary)' }}>
                      {row.summary}
                    </td>
                    <td className="mono" style={{ padding: '12px 12px' }}>
                      {row.multiplier !== null ? `x${row.multiplier}` : '—'}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span
                        className={`badge ${
                          row.outcome === 'win'
                            ? 'badgeEmerald'
                            : row.outcome === 'loss'
                              ? 'badgeDanger'
                              : 'badgeNeutral'
                        }`}
                      >
                        {row.outcome === 'win'
                          ? 'Выигрыш'
                          : row.outcome === 'loss'
                            ? 'Проигрыш'
                            : 'Возврат'}
                      </span>
                    </td>
                    <td
                      className="mono"
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color:
                          row.netChange > 0
                            ? 'var(--accent-primary)'
                            : row.netChange < 0
                              ? 'var(--color-danger)'
                              : 'var(--text-secondary)',
                      }}
                    >
                      <div>{formatSignedCurrency(row.netChange, settings.currency)}</div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                        Итог: {formatAmount(row.balanceAfter)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : filteredLedger.length === 0 ? (
          <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Операции баланса не найдены.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620, fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Дата и время</th>
                <th style={{ padding: '12px 12px' }}>Описание операции</th>
                <th style={{ padding: '12px 12px', textAlign: 'right' }}>Сумма</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Баланс после</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.map((op) => (
                <tr key={op.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="mono" style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {formatDateTime(op.timestamp)}
                  </td>
                  <td style={{ padding: '12px 12px' }}>{op.description}</td>
                  <td
                    className="mono"
                    style={{
                      padding: '12px 12px',
                      textAlign: 'right',
                      fontWeight: 700,
                      color:
                        op.amount >= 0
                          ? 'var(--accent-primary)'
                          : 'var(--color-danger)',
                    }}
                  >
                    {formatSignedCurrency(op.amount, settings.currency)}
                  </td>
                  <td className="mono" style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {formatAmount(op.balanceAfter)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
