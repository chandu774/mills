import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MillsBoard } from '@/components/board/MillsBoard';
import { PlayerBar } from '@/components/game/PlayerBar';
import { TurnStatusBar } from '@/components/game/TurnStatusBar';
import { GameControls } from '@/components/game/GameControls';
import { GameOverModal } from '@/components/game/GameOverModal';
import { GameEngine } from '@/game/engine/GameEngine';
import { MILLS_3_CONFIG, MILLS_6_CONFIG, MILLS_9_CONFIG } from '@/game/variants';

describe('Phase 3: Interactive Mills Board UI', () => {
  it('renders SVG board with correct point targets for 3-Piece Mills', () => {
    const engine = new GameEngine('MILLS_3');
    const onPointClick = vi.fn();

    render(
      <MillsBoard
        config={MILLS_3_CONFIG}
        state={engine.getState()}
        selectedPoint={null}
        onPointClick={onPointClick}
      />
    );

    const boardSvg = screen.getByRole('grid', { name: /3-Piece Mills Board/i });
    expect(boardSvg).toBeInTheDocument();
  });

  it('renders SVG board for 9-Piece Men\'s Morris with concentric squares', () => {
    const engine = new GameEngine('MILLS_9');
    render(
      <MillsBoard
        config={MILLS_9_CONFIG}
        state={engine.getState()}
        selectedPoint={null}
        onPointClick={() => {}}
      />
    );

    const boardSvg = screen.getByRole('grid', { name: /9-Piece Men's Morris Board/i });
    expect(boardSvg).toBeInTheDocument();
  });

  it('triggers onPointClick when clicking an intersection point', () => {
    const engine = new GameEngine('MILLS_6');
    const handleClick = vi.fn();

    const { container } = render(
      <MillsBoard
        config={MILLS_6_CONFIG}
        state={engine.getState()}
        selectedPoint={null}
        onPointClick={handleClick}
      />
    );

    // The hit areas are transparent circles
    const hitAreas = container.querySelectorAll('circle[fill="transparent"]');
    expect(hitAreas.length).toBe(16);

    fireEvent.click(hitAreas[0]);
    expect(handleClick).toHaveBeenCalledWith(0);
  });
});

describe('Phase 3: Game Room UI Components', () => {
  it('renders PlayerBar with rating, unplaced chips, and clock', () => {
    render(
      <PlayerBar
        color="WHITE"
        username="GrandmasterKai"
        displayName="Kai Tanaka"
        rating={2145}
        isTurn={true}
        unplacedCount={4}
        capturedCount={2}
        timeRemainingSeconds={240}
      />
    );

    expect(screen.getByText('GrandmasterKai')).toBeInTheDocument();
    expect(screen.getByText('2145')).toBeInTheDocument();
    expect(screen.getByText('04:00')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('renders TurnStatusBar with appropriate phase instructions', () => {
    const engine = new GameEngine('MILLS_9');
    const state = engine.getState();

    render(<TurnStatusBar state={state} selectedPoint={null} />);
    expect(screen.getByText(/WHITE's turn — Place a piece/i)).toBeInTheDocument();
  });

  it('renders GameControls and opens confirmation modal on resign', () => {
    const handleResign = vi.fn();
    const handleOfferDraw = vi.fn();
    const handleFlip = vi.fn();

    render(
      <GameControls
        onResign={handleResign}
        onOfferDraw={handleOfferDraw}
        onFlipBoard={handleFlip}
        currentPlayer="WHITE"
      />
    );

    const resignButton = screen.getByRole('button', { name: /Resign/i });
    fireEvent.click(resignButton);

    // Modal dialog should appear
    expect(screen.getByText(/Confirm Resignation/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /Confirm Resign/i });
    fireEvent.click(confirmButton);
    expect(handleResign).toHaveBeenCalledWith('WHITE');
  });

  it('renders GameOverModal with victory details and action buttons', () => {
    const handleRematch = vi.fn();
    const handleNewGame = vi.fn();
    const handleHome = vi.fn();

    render(
      <GameOverModal
        isOpen={true}
        onClose={() => {}}
        winner="WHITE"
        winReason="Formed a 3-piece mill (instant win)."
        onRematch={handleRematch}
        onNewGame={handleNewGame}
        onReturnHome={handleHome}
      />
    );

    expect(screen.getByText('WHITE Won!')).toBeInTheDocument();
    expect(screen.getByText(/Formed a 3-piece mill/i)).toBeInTheDocument();

    const rematchBtn = screen.getByRole('button', { name: /REMATCH/i });
    fireEvent.click(rematchBtn);
    expect(handleRematch).toHaveBeenCalled();
  });
});
