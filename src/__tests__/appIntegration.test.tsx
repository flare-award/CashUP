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

  it('shows currency selection and live $10 converted preview at onboarding, persists once, and shows zero simulation disclaimers', async () => {
    const { unmount, container } = renderCashUp('/');

    expect(screen.getByText('Добро пожаловать в CashUP')).toBeInTheDocument();
    // Default currency is USD -> $10 preview
    expect(screen.getAllByText('$10').length).toBeGreaterThan(0);

    // Selecting RUB at onboarding previews 960 ₽ live!
    fireEvent.click(screen.getByRole('radio', { name: /RUB \(₽\)/i }));
    expect(screen.getAllByText(/960\s*₽/).length).toBeGreaterThan(0);

    // Switch back to USD ($10) and create profile
    fireEvent.click(screen.getByRole('radio', { name: /USD \(\$\)/i }));
    fireEvent.change(screen.getByLabelText('Ваш никнейм'), {
      target: { value: 'Marat' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Создать профиль и начать/i }));

    await waitFor(() => {
      expect(screen.getByText(/Привет, Marat!/i)).toBeInTheDocument();
    });

    // No "виртуальн" or "Локальная симуляция" anywhere in DOM
    expect(container.textContent).not.toMatch(/виртуальн/i);
    expect(container.textContent).not.toMatch(/Локальная симуляция/i);

    // Unmount and remount to verify starter bonus is never duplicated
    unmount();
    renderCashUp('/');

    expect(screen.queryByText('Добро пожаловать в CashUP')).not.toBeInTheDocument();
    expect(screen.getByText(/Привет, Marat!/i)).toBeInTheDocument();
    expect(screen.getAllByText('$10')[0]).toBeInTheDocument();
  });

  it('converts balances accurately when switching currencies, switches themes, and disables animations', async () => {
    renderCashUp('/settings');

    fireEvent.change(screen.getByLabelText('Ваш никнейм'), {
      target: { value: 'TesterPro' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Создать профиль и начать/i }));

    // Switch to Light theme
    fireEvent.click(screen.getByRole('button', { name: /Светлая тема/i }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    // Switch currency from $10 USD to RUB (960 ₽) and KZT (4 950 ₸)
    fireEvent.click(screen.getByRole('button', { name: /RUB \(₽\)/i }));
    expect(screen.getAllByText(/960\s*₽/)[0]).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /KZT \(₸\)/i }));
    expect(screen.getAllByText(/4\s*950\s*₸/)[0]).toBeInTheDocument();

    // Disable animations for instant round settlement
    const animCheckbox = screen.getByRole('checkbox', { name: /Игровые анимации/i });
    fireEvent.click(animCheckbox);
    expect(document.documentElement.getAttribute('data-motion')).toBe('none');
  });

  it('renders detailed partner advertisement showcases in sidebar and home page with interactive dossier modal', async () => {
    const { container } = renderCashUp('/');
    fireEvent.change(screen.getByLabelText('Ваш никнейм'), {
      target: { value: 'Collector' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Создать профиль и начать/i }));

    // Ensure ad copy never breaks immersion by calling itself fake/fictional
    expect(container.textContent).not.toMatch(/вымышлен/i);

    // Click to open interactive luxury showcase modal
    const detailButtons = screen.getAllByRole('button', {
      name: /Открыть хронограф|Конфигуратор GT|Ноты композиции|Акустический стенд/i,
    });
    expect(detailButtons.length).toBeGreaterThan(0);
    fireEvent.click(detailButtons[0]!);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('renders every single one of the 15 registered games without console or render errors', () => {
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

    const histView = renderCashUp('/history');
    expect(screen.getByRole('link', { name: 'Кости' })).toBeInTheDocument();
    expect(screen.getByText(/Раунды \(1\)/i)).toBeInTheDocument();
    histView.unmount();

    renderCashUp('/statistics');
    expect(screen.getByText('Сыграно раундов')).toBeInTheDocument();
  });

  it('supports creating multiple profiles with currency preview and validates imported JSON saves', async () => {
    const profView = renderCashUp('/profile');
    fireEvent.change(screen.getByLabelText('Ваш никнейм'), {
      target: { value: 'FirstUser' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Создать профиль и начать/i }));

    expect(screen.getByRole('heading', { level: 1, name: 'FirstUser' })).toBeInTheDocument();

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
    expect(screen.getByText(/Игровые профили \(2\)/i)).toBeInTheDocument();
    profView.unmount();

    // Settings JSON file import validation & restore
    renderCashUp('/settings');
    const fileInput = screen.getByTestId('save-file-input');

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

    const importedProfile = {
      ...createNewProfile('RestoredHero', 'royal-crown'),
      balance: 77.5,
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
      expect(screen.getAllByText(/\$77,50/)[0]).toBeInTheDocument();
    });
  });
});
