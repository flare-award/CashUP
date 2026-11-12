import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { GameLayout } from '../components/ui/GameLayout';
import { getGameById } from '../games/registry';

export const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const game = getGameById(gameId);

  if (!game) {
    return (
      <div
        className="pageEnter"
        style={{
          padding: 40,
          textAlign: 'center',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <h2>Игра не найдена</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 18px' }}>
          Проверьте адрес страницы или перейдите в полный каталог игр CashUP.
        </p>
        <Link to="/catalog" className="btn btnPrimary">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  const ActiveGameComponent = game.Component;

  return (
    <GameLayout game={game}>
      <ActiveGameComponent />
    </GameLayout>
  );
};
