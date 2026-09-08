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
import { InGameChat, InGameChatMessage } from '@/components/game/InGameChat';
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
  BookOpen,
  MessageCircle,
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
  const [mobileDrawerTab, setMobileDrawerTab] = useState<'moves' | 'chat' | 'info' | 'rules' | null>(null);
  const [desktopSideTab, setDesktopSideTab] = useState<'moves' | 'chat'>('moves');
  const [localChatMessages, setLocalChatMessages] = useState<InGameChatMessage[]>([]);

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
    chatMessages: multiplayerChatMessages,
    sendChatMessage: sendMultiplayerChat,
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

  const activeChatMessages = isMultiplayer ? multiplayerChatMessages : localChatMessages;

  const handleSendChat = useCallback(
    (text: string) => {
      if (isMultiplayer) {
        sendMultiplayerChat(text);
      } else {
        const newMsg: InGameChatMessage = {
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          senderName: engineState.currentPlayer === 'WHITE' ? 'White' : 'Black',
          message: text,
          timestamp: Date.now(),
          isSelf: true,
        };
        setLocalChatMessages((prev) => [...prev, newMsg]);
      }
    },
    [isMultiplayer, sendMultiplayerChat, engineState.currentPlayer]
  );

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
  }, [isGameOver, initialSeconds, isMultiplayer, connectionStatus, engineState.currentPlayer]);

  // Handle board intersection click
  const handlePointClick = (pointIndex: number) => {
    if (isGameOver || currentReplayIndex !== null) return;
    if (isMultiplayer && (!isMyTurn || connectionStatus === 'WAITING')) return;

    const engine = engineRef.current;
    const state = engine.getState();
    const clickedPiece = state.board[pointIndex];
    const isOwnPiece = clickedPiece === state.currentPlayer;

    const applyMoveResult = (result: ReturnType<typeof engine.makeMove>, move: any) => {
      if (result.success) {
        setEngineState(result.state);
        setSelectedPoint(null);
        if (['FINISHED', 'DRAW', 'RESIGNED', 'TIMEOUT', 'ABANDONED'].includes(result.state.status)) {
          setShowGameOverModal(true);
        }
        if (isMultiplayer) {
          broadcastMove(move, clocks);
        }
      }
    };

    // 1. Capture pending phase
    if (state.status === 'CAPTURE_PENDING') {
      const move = {
        type: 'CAPTURE' as const,
        capturedPoint: pointIndex,
      };
      const result = engine.makeMove(move);
      applyMoveResult(result, move);
      return;
    }

    // 2. Placing phase
    if (state.phase === 'PLACING') {
      const move = {
        type: 'PLACE' as const,
        to: pointIndex,
      };
      const result = engine.makeMove(move);
      applyMoveResult(result, move);
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
        applyMoveResult(result, move);
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
    <div className="max-w-6xl mx-auto space-y-2 sm:space-y-4 animate-in fade-in duration-200">
      {/* Top Header Bar: Clean & Minimal (Single header, no duplicate on mobile) */}
      <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-background-border gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/play')}
          className="gap-1 px-2 sm:px-3 text-xs font-semibold text-ink-muted hover:text-ink shrink-0 h-8 sm:h-9"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden xs:inline">Leave Game</span>
          <span className="xs:hidden">Leave</span>
        </Button>

        <div className="text-center min-w-0">
          <h2 className="text-xs sm:text-sm font-bold text-ink tracking-wide truncate">
            {engineRef.current.config.name}
          </h2>
          <p className="text-[10px] sm:text-[11px] text-ink-subtle font-mono truncate">
            {isMultiplayer ? (
              <span className="text-primary font-semibold">
                Online • Room: {room?.code || roomIdParam}
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
            className="gap-1 px-2 sm:px-2.5 text-xs border-background-border text-ink shrink-0 h-8 sm:h-9"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden xs:inline">{copiedLink ? 'Copied' : 'Share'}</span>
          </Button>
        ) : (
          <div className="w-12 sm:w-16" />
        )}
      </div>

      {/* Online Notification Banners */}
      {isMultiplayer && (
        <div className="space-y-2">
          {/* Waiting for Opponent Banner */}
          {connectionStatus === 'WAITING' && (
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-gold-light border border-gold/40 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-ink">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-gold animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-ink">Waiting for opponent to join...</h3>
                  <p className="text-[11px] text-ink-muted">
                    Room Code: <strong className="font-mono text-ink bg-white px-1.5 py-0.5 rounded border border-gold/40">{room?.code || roomIdParam}</strong>
                  </p>
                </div>
              </div>
              <Button
                variant="amber"
                size="sm"
                onClick={handleCopyRoomLink}
                className="w-full sm:w-auto gap-1 text-xs font-bold h-8"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy Link
              </Button>
            </div>
          )}

          {/* Opponent Disconnect Grace Timer Banner */}
          {disconnectCountdown !== null && disconnectCountdown > 0 && (
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-red-50 border border-alert-danger/40 flex items-center justify-between text-alert-danger animate-pulse">
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4 shrink-0" />
                <div>
                  <span className="font-bold text-xs sm:text-sm">Opponent disconnected</span>
                  <p className="text-[10px] sm:text-xs text-ink-muted">
                    Auto-forfeiting in <strong>{disconnectCountdown}s</strong> if they do not reconnect...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Incoming Draw Offer Banner */}
          {incomingDrawOffer && (
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[#F2F7F4] border border-primary/30 flex items-center justify-between gap-2 text-ink">
              <div className="flex items-center gap-2">
                <Handshake className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-xs sm:text-sm">Opponent offered a draw.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="primary" size="sm" onClick={() => respondToDraw(true)} className="h-7 text-xs">
                  Accept
                </Button>
                <Button variant="outline" size="sm" onClick={() => respondToDraw(false)} className="h-7 text-xs">
                  Decline
                </Button>
              </div>
            </div>
          )}

          {/* Outgoing Draw Offer Banner */}
          {outgoingDrawOffer && (
            <div className="p-2.5 rounded-2xl bg-white border border-background-border flex items-center gap-2 text-xs text-ink-muted">
              <Handshake className="h-4 w-4 text-primary animate-pulse" />
              <span>Draw offer sent to opponent. Awaiting response...</span>
            </div>
          )}

          {/* Incoming Rematch Offer Banner */}
          {incomingRematchOffer && (
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[#F2F7F4] border border-primary/30 flex items-center justify-between gap-2 text-ink">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-xs sm:text-sm">Opponent wants a rematch!</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => acceptRematch(`room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`)}
                  className="h-7 text-xs font-bold"
                >
                  Accept Rematch
                </Button>
              </div>
            </div>
          )}

          {/* Outgoing Rematch Offer Banner */}
          {outgoingRematchOffer && (
            <div className="p-2.5 rounded-2xl bg-white border border-background-border flex items-center gap-2 text-xs text-ink-muted">
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

        {/* RIGHT AREA (Col 3): Moves, In-Game Chat & Match Details */}
        <div className="md:col-span-3 lg:col-span-3 flex flex-col space-y-3 h-[580px]">
          {/* Tab Switcher: Moves vs Chat */}
          <div className="flex rounded-xl bg-background-elevated p-1 border border-background-border shrink-0">
            <button
              onClick={() => setDesktopSideTab('moves')}
              className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                desktopSideTab === 'moves'
                  ? 'bg-white text-ink shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <History className="h-3.5 w-3.5 text-primary" />
              <span>Moves ({engineRef.current.getHistory().length})</span>
            </button>
            <button
              onClick={() => setDesktopSideTab('chat')}
              className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                desktopSideTab === 'chat'
                  ? 'bg-white text-ink shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5 text-gold" />
              <span>Chat {activeChatMessages.length > 0 && `(${activeChatMessages.length})`}</span>
            </button>
          </div>

          {desktopSideTab === 'moves' ? (
            <MoveHistoryView
              history={engineRef.current.getHistory()}
              currentReplayIndex={currentReplayIndex}
              onSelectMove={(idx) => setCurrentReplayIndex(idx)}
              className="flex-1"
            />
          ) : (
            <InGameChat
              messages={activeChatMessages}
              onSendMessage={handleSendChat}
              isMultiplayer={isMultiplayer}
              className="flex-1"
            />
          )}

          {/* Quick Rules Info Box */}
          <div className="p-3 rounded-2xl bg-white border border-background-border text-xs text-ink-muted space-y-1 shadow-soft shrink-0">
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
          MOBILE GAME LAYOUT (Board Dominant, Zero Desktop Clutter)
          Calibrated specifically for 320px, 360px, 375px, 390px, 430px screens
          ========================================================================= */}
      <div className="md:hidden flex flex-col space-y-1.5 xs:space-y-2 pb-4 max-w-[440px] mx-auto w-full">
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

        {/* 2. Dominant Large Board (Hero attraction with maximum screen presence) */}
        <div className="py-0.5 flex justify-center">
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

        {/* 5. Game Action Controls (Flip, Sound, Draw, Resign / Rematch) */}
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

        {/* 6. Secondary In-Game Drawer Controls: Moves | Chat | Rules & Info */}
        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          <button
            onClick={() => setMobileDrawerTab('moves')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-white border border-background-border text-[11px] font-semibold text-ink-muted hover:text-ink active:bg-background-elevated shadow-2xs transition-colors cursor-pointer"
          >
            <History className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">Moves ({engineRef.current.getHistory().length})</span>
          </button>

          <button
            onClick={() => setMobileDrawerTab('chat')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-white border border-background-border text-[11px] font-semibold text-ink-muted hover:text-ink active:bg-background-elevated shadow-2xs transition-colors cursor-pointer relative"
          >
            <MessageCircle className="h-3.5 w-3.5 text-gold shrink-0" />
            <span className="truncate">Chat</span>
            {activeChatMessages.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            )}
          </button>

          <button
            onClick={() => setMobileDrawerTab('rules')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-white border border-background-border text-[11px] font-semibold text-ink-muted hover:text-ink active:bg-background-elevated shadow-2xs transition-colors cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">Rules</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Sheet Drawer for Moves / Chat / Rules */}
      <Drawer
        isOpen={mobileDrawerTab !== null}
        onClose={() => setMobileDrawerTab(null)}
        title={
          mobileDrawerTab === 'moves'
            ? 'Move Log & Replay'
            : mobileDrawerTab === 'chat'
              ? 'Game Chat'
              : 'Variant Rules & Info'
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

        {mobileDrawerTab === 'chat' && (
          <div className="h-[380px]">
            <InGameChat
              messages={activeChatMessages}
              onSendMessage={handleSendChat}
              isMultiplayer={isMultiplayer}
              className="h-full"
            />
          </div>
        )}

        {mobileDrawerTab === 'rules' && (
          <div className="space-y-3 text-xs text-ink-muted leading-relaxed py-2">
            <div className="flex justify-between py-1.5 border-b border-background-border text-ink">
              <span>Game Variant</span>
              <strong>{engineRef.current.config.name}</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-background-border text-ink">
              <span>Time Control</span>
              <strong>{timeParam.replace('_', ' ')}</strong>
            </div>
            {isMultiplayer && room && (
              <div className="flex justify-between py-1.5 border-b border-background-border text-ink">
                <span>Room Code</span>
                <strong className="font-mono text-primary">{room.code}</strong>
              </div>
            )}
            <h4 className="font-bold text-sm text-ink pt-1">{engineRef.current.config.name} Overview</h4>
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
        userColor={isMultiplayer && myColor !== 'SPECTATOR' ? myColor : undefined}
      />
    </div>
  );
}
