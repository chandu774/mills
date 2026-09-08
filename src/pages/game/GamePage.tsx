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
import { Drawer } from '@/components/ui/Drawer';
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
  History,
  Info,
  BookOpen,
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
  const [mobileDrawerTab, setMobileDrawerTab] = useState<'moves' | 'info' | 'rules' | null>(null);

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
    <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-200">
      {/* Top Header Bar: Clean & Minimal */}
      <div className="flex items-center justify-between pb-2 border-b border-background-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/play')}
          className="gap-2 text-xs font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Leave Game
        </Button>

        <div className="text-center">
          <h2 className="text-sm font-bold text-ink tracking-wide">
            {engineRef.current.config.name}
          </h2>
          <p className="text-[11px] text-ink-subtle font-mono">
            {isMultiplayer ? (
              <span className="text-primary font-semibold">
                Online Match • Room: {room?.code || roomIdParam}
              </span>
            ) : (
              `Pass & Play • ${timeParam.replace('_', ' ')}`
            )}
          </p>
        </div>

        {isMultiplayer ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyRoomLink}
            className="gap-1.5 text-xs border-background-border text-ink"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </Button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      {/* Online Notification Banners */}
      {isMultiplayer && (
        <div className="space-y-2">
          {/* Waiting for Opponent Banner */}
          {connectionStatus === 'WAITING' && (
            <div className="p-3.5 rounded-2xl bg-gold-light border border-gold/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-ink">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-gold animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink">Waiting for opponent to join...</h3>
                  <p className="text-xs text-ink-muted">
                    Share Room Code <strong className="font-mono text-ink text-sm bg-white px-2 py-0.5 rounded border border-gold/40">{room?.code || roomIdParam}</strong> or copy link.
                  </p>
                </div>
              </div>
              <Button
                variant="amber"
                size="sm"
                onClick={handleCopyRoomLink}
                className="w-full sm:w-auto gap-1.5 text-xs font-bold"
              >
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy Invite Link
              </Button>
            </div>
          )}

          {/* Opponent Disconnect Grace Timer Banner */}
          {disconnectCountdown !== null && disconnectCountdown > 0 && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-alert-danger/40 flex items-center justify-between text-alert-danger animate-pulse">
              <div className="flex items-center gap-2.5">
                <WifiOff className="h-5 w-5" />
                <div>
                  <span className="font-bold text-sm">Opponent disconnected</span>
                  <p className="text-xs text-ink-muted">
                    Auto-forfeiting in <strong>{disconnectCountdown}s</strong> if they do not reconnect...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Incoming Draw Offer Banner */}
          {incomingDrawOffer && (
            <div className="p-3.5 rounded-2xl bg-[#F2F7F4] border border-primary/30 flex items-center justify-between gap-3 text-ink">
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
            <div className="p-3 rounded-2xl bg-white border border-background-border flex items-center gap-2.5 text-xs text-ink-muted">
              <Handshake className="h-4 w-4 text-primary animate-pulse" />
              <span>Draw offer sent to opponent. Awaiting response...</span>
            </div>
          )}

          {/* Incoming Rematch Offer Banner */}
          {incomingRematchOffer && (
            <div className="p-3.5 rounded-2xl bg-[#F2F7F4] border border-primary/30 flex items-center justify-between gap-3 text-ink">
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
            <div className="p-3 rounded-2xl bg-white border border-background-border flex items-center gap-2.5 text-xs text-ink-muted">
              <RotateCcw className="h-4 w-4 text-primary animate-pulse" />
              <span>Rematch offer sent to opponent. Awaiting response...</span>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          DESKTOP GAME LAYOUT (3-Area Balanced Composition: Player | Board | Moves)
          ========================================================================= */}
      <div className="hidden md:grid md:grid-cols-12 gap-8 items-start pt-2">
        {/* LEFT AREA (Col 3): Player Information & Match Control */}
        <div className="md:col-span-3 lg:col-span-3 flex flex-col space-y-4">
          {/* Opponent Bar */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle px-1">
              Opponent
            </span>
            <PlayerBar
              color={topColor}
              username={topName}
              displayName={isMultiplayer ? (topColor === myColor ? 'Your Account' : 'Competitor') : 'Local Player'}
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
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center py-1">
            <span className="text-[10px] font-bold tracking-widest text-ink-subtle bg-background-elevated px-2.5 py-0.5 rounded-full border border-background-border">
              VS
            </span>
          </div>

          {/* User Bar */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle px-1">
              You
            </span>
            <PlayerBar
              color={bottomColor}
              username={bottomName}
              displayName={isMultiplayer ? (bottomColor === myColor ? 'Your Account' : 'Competitor') : 'Local Player'}
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
          </div>

          {/* Desktop Game Actions */}
          <div className="pt-2">
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

        {/* CENTER AREA (Col 6): Dominant Large Wooden Mills Board */}
        <div className="md:col-span-6 lg:col-span-6 flex flex-col space-y-4 items-center">
          {/* Turn Guidance Status */}
          <div className="w-full max-w-[540px]">
            <TurnStatusBar
              state={engineState}
              selectedPoint={selectedPoint}
              isTurnEnforced={isMultiplayer && !isMyTurn}
            />
          </div>

          {/* Physical Walnut Board */}
          <div className="w-full flex justify-center py-1">
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

          {/* Replay Notice */}
          {currentReplayIndex !== null && (
            <div className="w-full max-w-[540px] flex items-center justify-between px-4 py-2 rounded-xl bg-gold-light border border-gold/30 text-xs text-ink font-semibold">
              <span>Viewing past move #{currentReplayIndex + 1}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentReplayIndex(null)}
                className="py-1 px-2.5 text-xs font-bold"
              >
                Return to Live
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT AREA (Col 3): Moves, Match Info & Details */}
        <div className="md:col-span-3 lg:col-span-3 flex flex-col space-y-4 h-[580px]">
          <MoveHistoryView
            history={engineRef.current.getHistory()}
            currentReplayIndex={currentReplayIndex}
            onSelectMove={(idx) => setCurrentReplayIndex(idx)}
            className="flex-1"
          />

          {/* Quick Rules Info Box */}
          <div className="p-3.5 rounded-2xl bg-white border border-background-border text-xs text-ink-muted space-y-1.5 shadow-soft">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>Variant Rules</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {variantParam === 'MILLS_3' && 'Form 3-in-a-row to win immediately.'}
              {variantParam === 'MILLS_6' && 'Form mills to capture pieces. Reduce opponent to 2 pieces to win.'}
              {variantParam === 'MILLS_9' && 'Classic Nine Men\'s Morris. Flying phase activates at 3 pieces.'}
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE GAME LAYOUT (Intentional Vertical Rhythm: Board Dominant)
          ========================================================================= */}
      <div className="md:hidden flex flex-col space-y-2.5 pb-6">
        {/* 1. Opponent Bar */}
        <PlayerBar
          color={topColor}
          username={topName}
          displayName={isMultiplayer ? (topColor === myColor ? 'Your Account' : 'Competitor') : 'Local Player'}
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

        {/* 2. Dominant Large Board (Maximal Practical Area) */}
        <div className="py-1 flex justify-center">
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

        {/* 3. Your Player Bar */}
        <PlayerBar
          color={bottomColor}
          username={bottomName}
          displayName={isMultiplayer ? (bottomColor === myColor ? 'Your Account' : 'Competitor') : 'Local Player'}
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

        {/* 4. Clear Turn Guidance Banner */}
        <TurnStatusBar
          state={engineState}
          selectedPoint={selectedPoint}
          isTurnEnforced={isMultiplayer && !isMyTurn}
        />

        {/* 5. Game Action Controls (Draw, Resign, Flip, Mute) */}
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

        {/* 6. Compact Mobile Tabs: Moves | Info | Rules (Opens in Bottom Sheet Drawer) */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => setMobileDrawerTab('moves')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-background-border text-xs font-semibold text-ink-muted hover:text-ink shadow-2xs cursor-pointer"
          >
            <History className="h-3.5 w-3.5 text-primary" />
            <span>Moves ({engineRef.current.getHistory().length})</span>
          </button>

          <button
            onClick={() => setMobileDrawerTab('info')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-background-border text-xs font-semibold text-ink-muted hover:text-ink shadow-2xs cursor-pointer"
          >
            <Info className="h-3.5 w-3.5 text-gold" />
            <span>Game Info</span>
          </button>

          <button
            onClick={() => setMobileDrawerTab('rules')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-background-border text-xs font-semibold text-ink-muted hover:text-ink shadow-2xs cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>Rules</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Sheet Drawer for Moves / Info / Rules */}
      <Drawer
        isOpen={mobileDrawerTab !== null}
        onClose={() => setMobileDrawerTab(null)}
        title={
          mobileDrawerTab === 'moves'
            ? 'Move Log & Replay'
            : mobileDrawerTab === 'info'
              ? 'Match Information'
              : 'Variant Rules'
        }
      >
        {mobileDrawerTab === 'moves' && (
          <div className="h-[380px]">
            <MoveHistoryView
              history={engineRef.current.getHistory()}
              currentReplayIndex={currentReplayIndex}
              onSelectMove={(idx) => {
                setCurrentReplayIndex(idx);
                setMobileDrawerTab(null);
              }}
              className="h-full"
            />
          </div>
        )}

        {mobileDrawerTab === 'info' && (
          <div className="space-y-3 text-sm py-2">
            <div className="flex justify-between py-2 border-b border-background-border">
              <span className="text-ink-muted">Game Variant</span>
              <strong className="text-ink">{engineRef.current.config.name}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-background-border">
              <span className="text-ink-muted">Time Control</span>
              <strong className="text-ink">{timeParam.replace('_', ' ')}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-background-border">
              <span className="text-ink-muted">Mode</span>
              <strong className="text-ink">{isMultiplayer ? 'Online Multiplayer' : 'Local Pass & Play'}</strong>
            </div>
            {isMultiplayer && room && (
              <div className="flex justify-between py-2 border-b border-background-border">
                <span className="text-ink-muted">Room Code</span>
                <strong className="font-mono text-primary">{room.code}</strong>
              </div>
            )}
          </div>
        )}

        {mobileDrawerTab === 'rules' && (
          <div className="space-y-3 text-xs text-ink-muted leading-relaxed py-2">
            <h4 className="font-bold text-sm text-ink">{engineRef.current.config.name} Overview</h4>
            <p>
              <strong>Placing Phase:</strong> Players take turns placing one piece at any empty intersection point. Forming 3 pieces in a straight line forms a <em>mill</em>, which grants an immediate capture of any opponent piece not in an active mill.
            </p>
            <p>
              <strong>Moving Phase:</strong> Once all pieces have been placed, slide a piece along connected lines to adjacent open points.
            </p>
            {engineRef.current.config.allowsFlying && (
              <p>
                <strong>Flying Phase:</strong> When a player is reduced to 3 pieces, their pieces can "fly" (jump) to any unoccupied intersection on the board!
              </p>
            )}
            <p>
              <strong>Victory:</strong> Reduce opponent to fewer than 3 pieces or trap them so they have no legal moves.
            </p>
          </div>
        )}
      </Drawer>

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
