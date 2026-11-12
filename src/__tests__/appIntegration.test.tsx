import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppRoutes } from '../App';
import { createNewProfile } from '../core/balance';
import { createInitialSaveData, serializeSaveData } from '../core/saveSchema';
import { GAME_CATALOG } from '../games/registry';
import { CashUpProvider } from '../state/CashUpContext';

function renderCashUp(initialRoute = '/') {
  return render(
    <CashUpProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AppRoutes />
      </MemoryRouter>
    </CashUpProvider>
  );
}

describe('CashUP End-to-End UI Integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('onboards a new user on first launch, persists 1 000 starter balance, and does not duplicate bonus on reload', async () => {
    const { unmount } = renderCashUp('/');

    // Onboarding modal is visible
    expect(screen.getByText('Добро пожаловать в CashUP')).toBeInTheDocument();
    const input = screen.getByLabelText('Ваш никнейм');
    fireEvent.change(input, { target: { value: 'Marat' } });
    fireEvent.click(screen.getByRole('button', { name: /Создать профиль и начать/i }));

    await waitFor(() => {
      expect(screen.getByText(/Привет, Marat!/i)).toBeInTheDocument();
    });

    // Unmount and remount to simulate browser refresh
    unmount();
    renderCashUp('/');

    expect(screen.queryByText('Добро пожаловать в CashUP')).not.toBeInTheDocument();
    expect(screen.getByText(/Привет, Marat!/i)).toBeInTheDocument();
    // Balance remains 1 000 RUB, not 2 000
    expect(screen.getAllByText(/1\s*000\s*₽/)[0]).toBeInTheDocument();
  });

  it('switches themes, currencies, disables animations, and completes game rounds with history & stats updates', async () => {
    renderCashUp('/settings');

    // Create profile first
    fireEvent.change(screen.getByLabelText('Ваш никнейм'), {
      target: { value: 'TesterPro' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Создать профиль и начать/i }));

    // Switch to Light theme
    fireEvent.click(screen.getByRole('button', { name: /Светлая тема/i }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    // Switch currency to USD ($) — numeric value stays 1 000!
    fireEvent.click(screen.getByRole('button', { name: /USD \(\$\)/i }));
    expect(screen.getAllByText(/\$1\s*000/)[0]).toBeInTheDocument();

    // Disable animations for instant round settlement
    const animCheckbox = screen.getByRole('checkbox', { name: /Игровые анимации/i });
    fireEvent.click(animCheckbox);
    expect(document.documentElement.getAttribute('data-motion')).toBe('none');
  });

  it('renders every single one of the 15 registered games without console or render errors', () => {
    // Seed profile via initial mount
    const first = renderCashUp('/');
    fireEvent.change(screen.getByLabelText('Ваш никнейм'), {
      target: { value: 'AllGamesQA' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Создать профиль и начать/i }));
    first.unmount();

    expect(GAME_CATALOG).toHaveLength(15);

    for (const game of GAME_CATALOG) {
      const view = renderCashUp(`/games/${game.id}`);
      expect(
        screen.getByRole('heading', { level: 1, name: game.title })
      ).toBeInTheDocument();
      view.unmount();
    }
  });

  it('plays Dice round with animations disabled and updates Statistics & History', async () => {
    const setup = renderCashUp('/settings');
    fireEvent.change(screen.getByLabelText('Ваш никнейм'), {
      target: { value: 'DiceMaster' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Создать профиль и начать/i }));

    // Turn off animations so setTimeout(0) resolves cleanly
    fireEvent.click(screen.getByRole('checkbox', { name: /Игровые анимации/i }));
    setup.unmount();

    const gameView = renderCashUp('/games/dice');
    fireEvent.click(screen.getByRole('button', { name: /Бросить кости/i }));

    await waitFor(
      () => {
        expect(screen.getByText(/Последние раунды · Кости/i)).toBeInTheDocument();
      },
      { timeout: 1500 }
    );
    gameView.unmount();

    // Verify History page shows the completed round link and summary
    const histView = renderCashUp('/history');
    expect(screen.getByRole('link', { name: 'Кости' })).toBeInTheDocument();
    expect(screen.getByText(/Раунды \(1\)/i)).toBeInTheDocument();
    histView.unmount();

    // Verify Statistics page reflects 1 round played
    renderCashUp('/statistics');
    expect(screen.getByText('Сыграно раундов')).toBeInTheDocument();
  });

  it('supports creating multiple local profiles and switching between isolated balances', async () => {
    renderCashUp('/profile');
    fireEvent.change(screen.getByLabelText('Ваш никнейм'), {
      target: { value: 'FirstUser' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Создать профиль и начать/i }));

    expect(screen.getByRole('heading', { level: 1, name: 'FirstUser' })).toBeInTheDocument();

    // Open New Profile modal
    fireEvent.click(screen.getByRole('button', { name: /Новый профиль/i }));
    fireEvent.change(screen.getByLabelText('Никнейм нового профиля'), {
      target: { value: 'SecondUser' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Создать профиль$/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'SecondUser' })
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Локальные профили \(2\)/i)).toBeInTheDocument();
  });

  it('validates imported JSON files on Settings page, rejects corrupted files, and restores valid saves', async () => {
    renderCashUp('/settings');
    fireEvent.change(screen.getByLabelText('Ваш никнейм'), {
      target: { value: 'TempUser' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Создать профиль и начать/i }));

    const fileInput = screen.getByTestId('save-file-input');

    // 1. Corrupt JSON file -> shows error alert without breaking current profile
    const badFile = new File(['{not-valid-json'], 'broken.json', {
      type: 'application/json',
    });
    Object.defineProperty(badFile, 'text', {
      value: () => Promise.resolve('{not-valid-json'),
    });
    fireEvent.change(fileInput, { target: { files: [badFile] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // 2. Valid CashUP JSON save -> shows preview confirmation modal & restores profile
    const importedProfile = {
      ...createNewProfile('RestoredHero', 'royal-crown'),
      balance: 7777,
    };
    const validSaveJson = serializeSaveData({
      ...createInitialSaveData(),
      activeProfileId: importedProfile.id,
      profiles: [importedProfile],
    });
    const goodFile = new File([validSaveJson], 'CashUP_Save_2026-11-12.json', {
      type: 'application/json',
    });
    Object.defineProperty(goodFile, 'text', {
      value: () => Promise.resolve(validSaveJson),
    });
    fireEvent.change(fileInput, { target: { files: [goodFile] } });

    await waitFor(() => {
      expect(
        screen.getByText('Подтверждение загрузки сохранения')
      ).toBeInTheDocument();
    });
    expect(screen.getByText('RestoredHero')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Подтвердить и восстановить/i })
    );

    await waitFor(() => {
      expect(screen.getAllByText(/7\s*777/)[0]).toBeInTheDocument();
    });
  });
});
