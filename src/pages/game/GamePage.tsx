import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GameEngine } from '@/game/engine/GameEngine';
import { GameVariant, TimeControl } from '@/lib/types';
import { PlayerColor } from '@/game/engine/types';
import { MillsBoard } from '@/components/board/MillsBoard';
import { PlayerBar } from '@/components/game/PlayerBar';
import { TurnStatusBar } from '@/components/game/TurnStatusBar';
import { GameControls } from '@/components/game/GameControls';
import { MoveHistoryView } from '@/components/game/MoveHistoryView';
import { GameOverModal } from '@/components/game/GameOverModal';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function GamePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const variantParam = (searchParams.get('variant') as GameVariant) || 'MILLS_9';
  const timeParam = (searchParams.get('time') as TimeControl) || '5_MIN';

  // Clock duration in seconds
  const initialSeconds = useMemo(() => {
    switch (timeParam) {
      case '3_MIN':
        return 180;
      case '5_MIN':
        return 300;
      case '10_MIN':
        return 600;
      default:
        return undefined;
    }
  }, [timeParam]);

  // Engine instance reference
  const engineRef = useRef<GameEngine>(new GameEngine(variantParam));
  const [engineState, setEngineState] = useState(() => engineRef.current.getState());
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentReplayIndex, setCurrentReplayIndex] = useState<number | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  // Clocks for White and Black
  const [clocks, setClocks] = useState<{ WHITE?: number; BLACK?: number }>({
    WHITE: initialSeconds,
    BLACK: initialSeconds,
  });

  const isGameOver = ['FINISHED', 'DRAW', 'RESIGNED', 'TIMEOUT', 'ABANDONED'].includes(
    engineState.status
  );

  // Clock countdown interval
  useEffect(() => {
    if (isGameOver || initialSeconds === undefined) return;

    const interval = setInterval(() => {
      setClocks((prev) => {
        const active = engineState.currentPlayer;
        const currentVal = prev[active];
        if (currentVal === undefined) return prev;

        if (currentVal <= 1) {
          // Time expired!
          engineRef.current.timeout(active);
          setEngineState(engineRef.current.getState());
          setShowGameOverModal(true);
          return { ...prev, [active]: 0 };
        }

        return { ...prev, [active]: currentVal - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [engineState.currentPlayer, isGameOver, initialSeconds]);

  // Show Game Over modal when finished
  useEffect(() => {
    if (isGameOver) {
      setShowGameOverModal(true);
    }
  }, [isGameOver]);

  // Handle Point Click on Board
  const handlePointClick = (pointIndex: number) => {
    // If in review mode, exit review first
    if (currentReplayIndex !== null) {
      setCurrentReplayIndex(null);
    }

    if (isGameOver) return;

    const engine = engineRef.current;
    const state = engine.getState();
    const clickedPiece = state.board[pointIndex];
    const isOwnPiece = clickedPiece === state.currentPlayer;

    // 1. Capture mode
    if (state.status === 'CAPTURE_PENDING') {
      const result = engine.makeMove({
        type: 'CAPTURE',
        capturedPoint: pointIndex,
      });

      if (result.success) {
        setEngineState(result.state);
        setSelectedPoint(null);
      }
      return;
    }

    // 2. Placing phase
    if (state.phase === 'PLACING') {
      const result = engine.makeMove({
        type: 'PLACE',
        to: pointIndex,
      });

      if (result.success) {
        setEngineState(result.state);
        setSelectedPoint(null);
      }
      return;
    }

    // 3. Moving / Flying phase
    if (state.phase === 'MOVING' || state.phase === 'FLYING') {
      // If clicking own piece, select it
      if (isOwnPiece) {
        setSelectedPoint(pointIndex === selectedPoint ? null : pointIndex);
        return;
      }

      // If a piece is already selected and clicking empty point, attempt move
      if (selectedPoint !== null && clickedPiece === null) {
        const moveType = state.phase === 'FLYING' ? 'FLY' : 'MOVE';
        const result = engine.makeMove({
          type: moveType,
          from: selectedPoint,
          to: pointIndex,
        });

        if (result.success) {
          setEngineState(result.state);
          setSelectedPoint(null);
        }
      }
    }
  };

  const handleResign = (player: PlayerColor) => {
    const res = engineRef.current.resign(player);
    setEngineState(res.state);
    setShowGameOverModal(true);
  };

  const handleOfferDraw = () => {
    // In local play, agree immediately
    const res = engineRef.current.resign('WHITE'); // Placeholder for draw
    // Direct draw in engine
    res.state.status = 'DRAW';
    res.state.winner = null;
    res.state.winReason = 'Players agreed to a draw.';
    setEngineState({ ...res.state });
    setShowGameOverModal(true);
  };

  const handleRestartGame = () => {
    engineRef.current = new GameEngine(variantParam);
    setEngineState(engineRef.current.getState());
    setSelectedPoint(null);
    setCurrentReplayIndex(null);
    setShowGameOverModal(false);
    setClocks({
      WHITE: initialSeconds,
      BLACK: initialSeconds,
    });
  };

  // State displayed on board (allows scrubbing through history during replay)
  const displayedState = useMemo(() => {
    if (currentReplayIndex !== null) {
      return engineRef.current.replayAt(currentReplayIndex);
    }
    return engineState;
  }, [currentReplayIndex, engineState]);

  // Max pieces for variant
  const maxPieces = variantParam === 'MILLS_3' ? 3 : variantParam === 'MILLS_6' ? 6 : 9;
  const unplacedWhite = Math.max(0, maxPieces - engineState.piecesPlaced.WHITE);
  const unplacedBlack = Math.max(0, maxPieces - engineState.piecesPlaced.BLACK);

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-background-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/play')}
          className="gap-2 text-xs font-semibold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Leave Game
        </Button>

        <div className="text-center">
          <h2 className="text-sm font-bold text-white tracking-wide">
            {engineRef.current.config.name}
          </h2>
          <p className="text-[11px] text-slate-400 font-mono">
            Local Pass & Play • {timeParam.replace('_', ' ')}
          </p>
        </div>

        <div className="w-20" />
      </div>

      {/* Main Game Grid: Left Board, Right Info & Move History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Board & Status Area */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          {/* Opponent Player Bar (Black if default perspective) */}
          <PlayerBar
            color={isFlipped ? 'WHITE' : 'BLACK'}
            username={isFlipped ? 'Player 1 (White)' : 'Player 2 (Black)'}
            displayName="Local Player"
            rating={1380}
            isTurn={engineState.currentPlayer === (isFlipped ? 'WHITE' : 'BLACK')}
            unplacedCount={isFlipped ? unplacedWhite : unplacedBlack}
            capturedCount={isFlipped ? engineState.capturedPieces.WHITE : engineState.capturedPieces.BLACK}
            timeRemainingSeconds={isFlipped ? clocks.WHITE : clocks.BLACK}
            isCompact
          />

          {/* Interactive Mills Board */}
          <div className="py-1">
            <MillsBoard
              config={engineRef.current.config}
              state={displayedState}
              selectedPoint={selectedPoint}
              onPointClick={handlePointClick}
              isFlipped={isFlipped}
              disabled={isGameOver || currentReplayIndex !== null}
            />
          </div>

          {/* Player Bar (White if default perspective) */}
          <PlayerBar
            color={isFlipped ? 'BLACK' : 'WHITE'}
            username={isFlipped ? 'Player 2 (Black)' : 'Player 1 (White)'}
            displayName="Local Player"
            rating={1420}
            isTurn={engineState.currentPlayer === (isFlipped ? 'BLACK' : 'WHITE')}
            unplacedCount={isFlipped ? unplacedBlack : unplacedWhite}
            capturedCount={isFlipped ? engineState.capturedPieces.BLACK : engineState.capturedPieces.WHITE}
            timeRemainingSeconds={isFlipped ? clocks.BLACK : clocks.WHITE}
            isCompact
          />

          {/* Turn Status & Controls on Mobile */}
          <div className="space-y-3 pt-1">
            <TurnStatusBar state={engineState} selectedPoint={selectedPoint} />
            <GameControls
              onResign={handleResign}
              onOfferDraw={handleOfferDraw}
              onFlipBoard={() => setIsFlipped(!isFlipped)}
              onRestartGame={handleRestartGame}
              isGameOver={isGameOver}
              currentPlayer={engineState.currentPlayer}
            />
          </div>
        </div>

        {/* Desktop Sidebar: Move History & Match Details */}
        <div className="hidden lg:flex flex-col space-y-4 lg:col-span-4 h-[600px]">
          <MoveHistoryView
            history={engineRef.current.getHistory()}
            currentReplayIndex={currentReplayIndex}
            onSelectMove={(idx) => setCurrentReplayIndex(idx)}
            className="flex-1"
          />

          {currentReplayIndex !== null && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentReplayIndex(null)}
              className="w-full text-xs font-bold"
            >
              Exit Replay (Return to Live)
            </Button>
          )}
        </div>
      </div>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={showGameOverModal}
        onClose={() => setShowGameOverModal(false)}
        winner={engineState.winner}
        winReason={engineState.winReason}
        onRematch={handleRestartGame}
        onNewGame={() => navigate('/play')}
        onReturnHome={() => navigate('/')}
      />
    </div>
  );
}
