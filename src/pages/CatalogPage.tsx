import React, { useMemo, useState } from 'react';
import { Clock, Flame, Search, Star, X } from 'lucide-react';
import { GameCard } from '../components/cards/GameCard';
import { GAME_CATALOG } from '../games/registry';
import { CATEGORY_LABELS } from '../games/types';
import { useCashUp } from '../state/CashUpContext';
import { GameCategory } from '../types';

type QuickScope = 'all' | 'favorites' | 'popular' | 'recent';
type SortMode = 'popular' | 'alpha' | 'multiplier' | 'most-played';

const CATEGORIES: Array<GameCategory | 'all'> = [
  'all',
  'roulette-wheels',
  'slots',
  'cards',
  'arcade-risk',
  'dice-numbers',
];

export const CatalogPage: React.FC = () => {
  const { state, activeProfile, updateUiState, playSound } = useCashUp();

  const [search, setSearch] = useState<string>('');
  const [scope, setScope] = useState<QuickScope>('all');
  const [category, setCategory] = useState<GameCategory | 'all'>(
    (state.uiState.catalogCategory as GameCategory | 'all') || 'all'
  );
  const [sortBy, setSortBy] = useState<SortMode>(
    (state.uiState.catalogSort as SortMode) || 'popular'
  );

  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase();
    return GAME_CATALOG.filter((game) => {
      if (scope === 'favorites' && !activeProfile?.favoriteGames.includes(game.id)) {
        return false;
      }
      if (scope === 'popular' && !game.featured) {
        return false;
      }
      if (scope === 'recent' && !activeProfile?.recentGames.includes(game.id)) {
        return false;
      }
      if (category !== 'all' && game.category !== category) {
        return false;
      }
      if (q) {
        const hay = `${game.title} ${game.shortDescription} ${game.categoryLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'alpha') {
        return a.title.localeCompare(b.title, 'ru');
      }
      if (sortBy === 'multiplier') {
        return b.maxMultiplierValue - a.maxMultiplierValue;
      }
      if (sortBy === 'most-played') {
        const ra = activeProfile?.stats.perGame[a.id]?.rounds ?? 0;
        const rb = activeProfile?.stats.perGame[b.id]?.rounds ?? 0;
        if (rb !== ra) return rb - ra;
      }
      return a.popularityRank - b.popularityRank;
    });
  }, [search, scope, category, sortBy, activeProfile]);

  return (
    <div className="pageEnter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
          <h1>Каталог игровых механик</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            Выберите любую игру — все 15 механик подключены к единому виртуальному балансу.
          </p>
        </div>

        {/* Search + Sort */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 250 }}>
            <Search
              size={16}
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
              style={{ paddingLeft: 35, paddingRight: search ? 30 : 12 }}
              placeholder="Поиск по названию…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Поиск игры по названию"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Очистить поиск"
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <select
            aria-label="Сортировка игр"
            className="inputField"
            style={{ width: 'auto' }}
            value={sortBy}
            onChange={(e) => {
              const v = e.target.value as SortMode;
              setSortBy(v);
              updateUiState({ catalogSort: v });
            }}
          >
            <option value="popular">По популярности</option>
            <option value="alpha">По алфавиту (А–Я)</option>
            <option value="multiplier">По макс. множителю</option>
            <option value="most-played">По вашим играм</option>
          </select>
        </div>
      </div>

      {/* Scope Tabs (All / Favorites / Popular / Recent) */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(
          [
            { id: 'all', label: `Все (${GAME_CATALOG.length})`, icon: null },
            {
              id: 'favorites',
              label: `Избранные (${activeProfile?.favoriteGames.length ?? 0})`,
              icon: <Star size={14} />,
            },
            { id: 'popular', label: 'Популярные', icon: <Flame size={14} /> },
            {
              id: 'recent',
              label: `Недавно сыгранные (${activeProfile?.recentGames.length ?? 0})`,
              icon: <Clock size={14} />,
            },
          ] as const
        ).map((tab) => {
          const active = scope === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`btn btnSm ${active ? 'btnPrimary' : 'btnSecondary'}`}
              onClick={() => {
                playSound('click');
                setScope(tab.id);
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* Category Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          paddingBottom: 6,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                playSound('click');
                setCategory(cat);
                updateUiState({ catalogCategory: cat });
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.82rem',
                fontWeight: 600,
                backgroundColor: active
                  ? 'var(--accent-primary-soft)'
                  : 'var(--bg-surface)',
                color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                border: `1px solid ${
                  active ? 'var(--border-accent)' : 'var(--border-subtle)'
                }`,
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      {/* Games Grid */}
      {filteredGames.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(265px, 1fr))',
            gap: 16,
          }}
        >
          {filteredGames.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: 36,
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}
        >
          <h3>Игры по выбранным фильтрам не найдены</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, marginBottom: 14 }}>
            Попробуйте сбросить строку поиска или выбрать категорию «Все категории».
          </p>
          <button
            type="button"
            className="btn btnSecondary"
            onClick={() => {
              setSearch('');
              setScope('all');
              setCategory('all');
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
};
