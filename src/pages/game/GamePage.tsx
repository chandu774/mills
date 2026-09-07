import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GameEngine } from '@/game/engine/GameEngine';
import { GameVariant, TimeControl } from '@/lib/types';
import { PlayerColor, GameState } from '@/game/engine/types';
import { MillsBoard } from '@/components/board/MillsBoard';
import { PlayerBar } from '@/components/game/PlayerBar';
import { TurnStatusBar } from '@/components/game/TurnStatusBar';
import { GameControls } from '@/components/game/GameControls';
import { MoveHistoryView } from '@/components/game/MoveHistoryView';
import { GameOverModal } from '@/components/game/GameOverModal';
import { useAuth } from '@/hooks/useAuth';
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  Handshake,
  RotateCcw,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function GamePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const variantParam = (searchParams.get('variant') as GameVariant) || 'MILLS_9';
  const timeParam = (searchParams.get('time') as TimeControl) || '5_MIN';
  const roomIdParam = searchParams.get('room');

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
  const [copiedLink, setCopiedLink] = useState(false);

  // Clocks for White and Black
  const [clocks, setClocks] = useState<{ WHITE?: number; BLACK?: number }>({
    WHITE: initialSeconds,
    BLACK: initialSeconds,
  });

  const currentUser = useMemo(() => {
    return {
      id: user?.id || 'player_local',
      displayName: profile?.displayName || profile?.username || 'You',
      avatarUrl: profile?.avatarUrl,
    };
  }, [user?.id, profile?.displayName, profile?.username, profile?.avatarUrl]);

  // Multiplayer Hook (if room param is present)
  const isMultiplayer = Boolean(roomIdParam);

  const handleEngineStateUpdate = useCallback((newState: GameState) => {
    setEngineState(newState);
    if (['FINISHED', 'DRAW', 'RESIGNED', 'TIMEOUT', 'ABANDONED'].includes(newState.status)) {
      setShowGameOverModal(true);
    }
  }, []);

  const handleClockUpdate = useCallback((newClocks: { WHITE?: number; BLACK?: number }) => {
    setClocks(newClocks);
  }, []);

  const {
    room,
    myColor,
    opponent,
    isMyTurn,
    connectionStatus,
    disconnectCountdown,
    incomingDrawOffer,
    outgoingDrawOffer,
    incomingRematchOffer,
    outgoingRematchOffer,
    broadcastMove,
    broadcastResign,
    offerDraw,
    respondToDraw,
    offerRematch,
    acceptRematch,
  } = useMultiplayerGame({
    roomId: roomIdParam || '',
    user: currentUser,
    engine: engineRef.current,
    onEngineStateUpdate: handleEngineStateUpdate,
    onClockUpdate: handleClockUpdate,
  });

  // Auto flip board for Black player in multiplayer
  useEffect(() => {
    if (isMultiplayer && myColor === 'BLACK') {
      setIsFlipped(true);
    }
  }, [isMultiplayer, myColor]);

  const isGameOver = ['FINISHED', 'DRAW', 'RESIGNED', 'TIMEOUT', 'ABANDONED'].includes(
    engineState.status
  );

  // Clock countdown interval
  useEffect(() => {
    if (isGameOver || initialSeconds === undefined) return;
    if (isMultiplayer && connectionStatus === 'WAITING') return;

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
  }, [engineState.currentPlayer, isGameOver, initialSeconds, isMultiplayer, connectionStatus]);

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

    // In multiplayer mode, player can only move when it is their turn!
    if (isMultiplayer) {
      if (!isMyTurn) return;
    }

    const engine = engineRef.current;
    const state = engine.getState();
    const clickedPiece = state.board[pointIndex];
    const isOwnPiece = clickedPiece === state.currentPlayer;

    // 1. Capture mode
    if (state.status === 'CAPTURE_PENDING') {
      const move = {
        type: 'CAPTURE' as const,
        capturedPoint: pointIndex,
      };
      const result = engine.makeMove(move);

      if (result.success) {
        setEngineState(result.state);
        setSelectedPoint(null);
        if (isMultiplayer) {
          broadcastMove(move, clocks);
        }
      }
      return;
    }

    // 2. Placing phase
    if (state.phase === 'PLACING') {
      const move = {
        type: 'PLACE' as const,
        to: pointIndex,
      };
      const result = engine.makeMove(move);

      if (result.success) {
        setEngineState(result.state);
        setSelectedPoint(null);
        if (isMultiplayer) {
          broadcastMove(move, clocks);
        }
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
        const moveType = state.phase === 'FLYING' ? ('FLY' as const) : ('MOVE' as const);
        const move = {
          type: moveType,
          from: selectedPoint,
          to: pointIndex,
        };
        const result = engine.makeMove(move);

        if (result.success) {
          setEngineState(result.state);
          setSelectedPoint(null);
          if (isMultiplayer) {
            broadcastMove(move, clocks);
          }
        }
      }
    }
  };

  const handleResign = (player: PlayerColor) => {
    if (isMultiplayer) {
      broadcastResign(player);
    }
    const res = engineRef.current.resign(player);
    setEngineState(res.state);
    setShowGameOverModal(true);
  };

  const handleOfferDraw = () => {
    if (isMultiplayer) {
      offerDraw();
    } else {
      // In local play, agree immediately
      const res = engineRef.current.resign('WHITE');
      res.state.status = 'DRAW';
      res.state.winner = null;
      res.state.winReason = 'Players agreed to a draw.';
      setEngineState({ ...res.state });
      setShowGameOverModal(true);
    }
  };

  const handleRestartGame = () => {
    if (isMultiplayer) {
      offerRematch();
      return;
    }
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

  const handleCopyRoomLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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

  // Player identity bindings
  const whiteName = isMultiplayer
    ? myColor === 'WHITE'
      ? currentUser.displayName + ' (You)'
      : opponent?.displayName || 'Opponent'
    : isFlipped
      ? 'Player 2 (White)'
      : 'Player 1 (White)';

  const blackName = isMultiplayer
    ? myColor === 'BLACK'
      ? currentUser.displayName + ' (You)'
      : opponent?.displayName || 'Opponent'
    : isFlipped
      ? 'Player 1 (Black)'
      : 'Player 2 (Black)';

  const topColor = isFlipped ? 'WHITE' : 'BLACK';
  const bottomColor = isFlipped ? 'BLACK' : 'WHITE';
  const topName = isFlipped ? whiteName : blackName;
  const bottomName = isFlipped ? blackName : whiteName;
  const topRating = isFlipped ? 1420 : 1380;
  const bottomRating = isFlipped ? 1380 : 1420;
  const topIsOnline = isMultiplayer
    ? isFlipped
      ? myColor === 'WHITE'
        ? true
        : opponent?.isOnline
      : myColor === 'BLACK'
        ? true
        : opponent?.isOnline
    : undefined;
  const bottomIsOnline = isMultiplayer
    ? isFlipped
      ? myColor === 'BLACK'
        ? true
        : opponent?.isOnline
      : myColor === 'WHITE'
        ? true
        : opponent?.isOnline
    : undefined;

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
            {isMultiplayer ? (
              <span className="text-primary font-semibold">
                Online Match • Room: {room?.code || roomIdParam}
              </span>
            ) : (
              `Local Pass & Play • ${timeParam.replace('_', ' ')}`
            )}
          </p>
        </div>

        {isMultiplayer ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyRoomLink}
            className="gap-1.5 text-xs border-background-border"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Share Room'}</span>
          </Button>
        ) : (
          <div className="w-20" />
        )}
      </div>

      {/* Online Notification Banners */}
      {isMultiplayer && (
        <div className="space-y-2">
          {/* Waiting for Opponent Banner */}
          {connectionStatus === 'WAITING' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-3 text-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Waiting for opponent to join...</h3>
                  <p className="text-xs text-amber-300/80">
                    Share Room Code <strong className="font-mono text-white text-sm bg-background-elevated px-2 py-0.5 rounded border border-amber-500/40">{room?.code || roomIdParam}</strong> or send the invite link.
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCopyRoomLink}
                className="w-full md:w-auto gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
              >
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy Invite Link
              </Button>
            </div>
          )}

          {/* Opponent Disconnect Grace Timer Banner */}
          {disconnectCountdown !== null && disconnectCountdown > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-between text-rose-200 animate-pulse">
              <div className="flex items-center gap-2.5">
                <WifiOff className="h-5 w-5 text-rose-400" />
                <div>
                  <span className="font-bold text-sm text-white">Opponent disconnected</span>
                  <p className="text-xs text-rose-300">
                    Auto-forfeiting in <strong>{disconnectCountdown}s</strong> if they do not reconnect...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Incoming Draw Offer Banner */}
          {incomingDrawOffer && (
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/40 flex items-center justify-between gap-3 text-slate-100">
              <div className="flex items-center gap-2.5">
                <Handshake className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">Opponent has offered a draw.</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={() => respondToDraw(true)}>
                  Accept Draw
                </Button>
                <Button variant="outline" size="sm" onClick={() => respondToDraw(false)}>
                  Decline
                </Button>
              </div>
            </div>
          )}

          {/* Outgoing Draw Offer Banner */}
          {outgoingDrawOffer && (
            <div className="p-3 rounded-2xl bg-background-elevated border border-background-border flex items-center gap-2.5 text-xs text-slate-300">
              <Handshake className="h-4 w-4 text-primary animate-pulse" />
              <span>Draw offer sent to opponent. Awaiting response...</span>
            </div>
          )}

          {/* Incoming Rematch Offer Banner */}
          {incomingRematchOffer && (
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/40 flex items-center justify-between gap-3 text-slate-100">
              <div className="flex items-center gap-2.5">
                <RotateCcw className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">Opponent wants a rematch!</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => acceptRematch(`room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`)}
                >
                  Accept Rematch
                </Button>
              </div>
            </div>
          )}

          {/* Outgoing Rematch Offer Banner */}
          {outgoingRematchOffer && (
            <div className="p-3 rounded-2xl bg-background-elevated border border-background-border flex items-center gap-2.5 text-xs text-slate-300">
              <RotateCcw className="h-4 w-4 text-primary animate-pulse" />
              <span>Rematch offer sent to opponent. Awaiting response...</span>
            </div>
          )}
        </div>
      )}

      {/* Main Game Grid: Left Board, Right Info & Move History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Board & Status Area */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          {/* Opponent Player Bar */}
          <PlayerBar
            color={topColor}
            username={topName}
            displayName={isMultiplayer ? (topColor === myColor ? 'Your Account' : 'Online Competitor') : 'Local Player'}
            rating={topRating}
            isTurn={engineState.currentPlayer === topColor}
            unplacedCount={topColor === 'WHITE' ? unplacedWhite : unplacedBlack}
            capturedCount={
              topColor === 'WHITE' ? engineState.capturedPieces.WHITE : engineState.capturedPieces.BLACK
            }
            timeRemainingSeconds={topColor === 'WHITE' ? clocks.WHITE : clocks.BLACK}
            isOnline={topIsOnline}
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
              disabled={
                isGameOver ||
                currentReplayIndex !== null ||
                (isMultiplayer && !isMyTurn) ||
                (isMultiplayer && connectionStatus === 'WAITING')
              }
            />
          </div>

          {/* Player Bar (Bottom / User) */}
          <PlayerBar
            color={bottomColor}
            username={bottomName}
            displayName={isMultiplayer ? (bottomColor === myColor ? 'Your Account' : 'Online Competitor') : 'Local Player'}
            rating={bottomRating}
            isTurn={engineState.currentPlayer === bottomColor}
            unplacedCount={bottomColor === 'WHITE' ? unplacedWhite : unplacedBlack}
            capturedCount={
              bottomColor === 'WHITE' ? engineState.capturedPieces.WHITE : engineState.capturedPieces.BLACK
            }
            timeRemainingSeconds={bottomColor === 'WHITE' ? clocks.WHITE : clocks.BLACK}
            isOnline={bottomIsOnline}
            isCompact
          />

          {/* Turn Status & Controls on Mobile */}
          <div className="space-y-3 pt-1">
            <TurnStatusBar
              state={engineState}
              selectedPoint={selectedPoint}
              isTurnEnforced={isMultiplayer && !isMyTurn}
            />
            <GameControls
              onResign={handleResign}
              onOfferDraw={handleOfferDraw}
              onFlipBoard={() => setIsFlipped(!isFlipped)}
              onRestartGame={handleRestartGame}
              isGameOver={isGameOver}
              currentPlayer={engineState.currentPlayer}
              isMultiplayer={isMultiplayer}
              myColor={myColor === 'SPECTATOR' ? undefined : myColor}
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
