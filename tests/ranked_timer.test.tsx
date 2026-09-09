import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RankedConfigPage } from '@/pages/play/RankedConfigPage';
import { GamePage } from '@/pages/game/GamePage';
import { AuthProvider } from '@/context/AuthContext';
import { matchmakingService } from '@/services/matchmaking/matchmakingService';

describe('Ranked Mode — Immediate Start & 30s Per-Move Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('RankedConfigPage Start Flow', () => {
    it('has no Time Control selection and no Play Now button', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <RankedConfigPage />
          </AuthProvider>
        </MemoryRouter>
      );

      // Verify Time Control options are completely removed
      expect(screen.queryByText(/Time Control/i)).not.toBeInTheDocument();
      expect(screen.queryByText('3 min')).not.toBeInTheDocument();
      expect(screen.queryByText('5 min')).not.toBeInTheDocument();
      expect(screen.queryByText('10 min')).not.toBeInTheDocument();
      expect(screen.queryByText('Untimed')).not.toBeInTheDocument();

      // Verify PLAY NOW button is completely removed
      expect(screen.queryByRole('button', { name: /PLAY NOW/i })).not.toBeInTheDocument();

      // Verify all 3 variants are displayed
      expect(screen.getByText('3 Mills')).toBeInTheDocument();
      expect(screen.getByText('6 Mills')).toBeInTheDocument();
      expect(screen.getByText('9 Mills')).toBeInTheDocument();
      expect(screen.getAllByText(/30s \/ move/i).length).toBeGreaterThanOrEqual(1);
    });

    it('clicking any variant card opens matchmaking immediately', async () => {
      vi.spyOn(matchmakingService, 'joinQueue').mockImplementation(async (params) => {
        params.onStatusUpdate?.('Searching for a closely rated opponent...', 0, 75);
      });
      vi.spyOn(matchmakingService, 'cancelQueue').mockResolvedValue();

      render(
        <MemoryRouter>
          <AuthProvider>
            <RankedConfigPage />
          </AuthProvider>
        </MemoryRouter>
      );

      // Allow AuthProvider useEffect to resolve
      await act(async () => {
        await Promise.resolve();
      });

      // Click 3 Mills card
      const variantCard = screen.getByText('3 Mills').closest('[role="button"]');
      expect(variantCard).toBeInTheDocument();
      await act(async () => {
        fireEvent.click(variantCard!);
      });

      // Matchmaking modal should open immediately
      expect(screen.getByText('FINDING OPPONENT')).toBeInTheDocument();
      expect(screen.getAllByText(/3-Piece Mills/i).length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText(/30s \/ move/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GamePage 30-Second Per-Move Timer', () => {
    it('initializes both player clocks to 30s in Ranked mode', async () => {
      render(
        <MemoryRouter initialEntries={['/game?variant=MILLS_3&mode=RANKED']}>
          <AuthProvider>
            <Routes>
              <Route path="/game" element={<GamePage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      // Header indicates Ranked 30s per move
      expect(screen.getByText(/Ranked • 30s per move/i)).toBeInTheDocument();

      // Both PlayerBars render 30s
      const clocks = screen.getAllByText('30s');
      expect(clocks.length).toBeGreaterThanOrEqual(2);
    });

    it('counts down the active player from 30s in real time', async () => {
      render(
        <MemoryRouter initialEntries={['/game?variant=MILLS_3&mode=RANKED']}>
          <AuthProvider>
            <Routes>
              <Route path="/game" element={<GamePage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      // Advance time by 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Active player (White) should now display 27s
      expect(screen.getAllByText('27s').length).toBeGreaterThanOrEqual(1);
      // Inactive player (Black) remains at 30s
      expect(screen.getAllByText('30s').length).toBeGreaterThanOrEqual(1);
    });

    it('resets timer to 30s after a move and starts counting down for the next player', async () => {
      render(
        <MemoryRouter initialEntries={['/game?variant=MILLS_3&mode=RANKED']}>
          <AuthProvider>
            <Routes>
              <Route path="/game" element={<GamePage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      // Advance by 5s for White
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getAllByText('25s').length).toBeGreaterThanOrEqual(1);

      // Place a piece for White on intersection point 0
      const point0 = document.querySelector('[data-point="0"]');
      expect(point0).toBeInTheDocument();

      act(() => {
        fireEvent.click(point0!);
      });

      // Now turn switched to Black!
      // Clocks reset to 30s
      expect(screen.getAllByText('30s').length).toBeGreaterThanOrEqual(2);

      // Advance by 4s for Black
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      // Black's clock should now be 26s
      expect(screen.getAllByText('26s').length).toBeGreaterThanOrEqual(1);
      // White's clock should be at 30s
      expect(screen.getAllByText('30s').length).toBeGreaterThanOrEqual(1);
    });

    it('ends the game on timeout when the 30-second timer reaches 0', async () => {
      render(
        <MemoryRouter initialEntries={['/game?variant=MILLS_3&mode=RANKED']}>
          <AuthProvider>
            <Routes>
              <Route path="/game" element={<GamePage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      // Advance 30.5 seconds to trigger White's timeout
      act(() => {
        vi.advanceTimersByTime(30500);
      });

      // Game over modal appears
      expect(screen.getByText('Match Concluded')).toBeInTheDocument();
      expect(screen.getByText(/WHITE ran out of time/i)).toBeInTheDocument();
      expect(screen.getByText(/BLACK Won!/i)).toBeInTheDocument();
    });
  });
});
