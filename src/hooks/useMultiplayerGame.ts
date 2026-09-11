import { useState, useEffect, useRef, useCallback } from 'react';
import { GameRoom, RoomPlayer, MultiplayerMessage } from '@/services/games/types';
import { RealtimeGameChannel } from '@/services/games/realtimeChannel';
import { gameService } from '@/services/games/gameService';
import { GameEngine } from '@/game/engine/GameEngine';
import { PlayerColor, PlayerMove, GameState } from '@/game/engine/types';
import { soundService } from '@/services/audio/soundService';

export interface GameChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  isSelf: boolean;
}

export interface UseMultiplayerGameProps {
  roomId: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  engine: GameEngine;
  onEngineStateUpdate: (state: GameState) => void;
  onClockUpdate?: (clocks: { WHITE?: number; BLACK?: number; turnStartedAt?: number }) => void;
  onGameFinished?: () => void;
}

export function useMultiplayerGame({
  roomId,
  user,
  engine,
  onEngineStateUpdate,
  onClockUpdate,
  onGameFinished,
}: UseMultiplayerGameProps) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [myColor, setMyColor] = useState<PlayerColor | 'SPECTATOR'>('WHITE');
  const [opponent, setOpponent] = useState<RoomPlayer | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'CONNECTING' | 'WAITING' | 'CONNECTED' | 'RECONNECTING'
  >('CONNECTING');

  const [disconnectCountdown, setDisconnectCountdown] = useState<number | null>(null);
  const [incomingDrawOffer, setIncomingDrawOffer] = useState(false);
  const [outgoingDrawOffer, setOutgoingDrawOffer] = useState(false);
  const [incomingRematchOffer, setIncomingRematchOffer] = useState(false);
  const [outgoingRematchOffer, setOutgoingRematchOffer] = useState(false);
  const [chatMessages, setChatMessages] = useState<GameChatMessage[]>([]);

  const channelRef = useRef<RealtimeGameChannel | null>(null);
  const opponentLastSeenRef = useRef<number>(Date.now());
  const engineRef = useRef(engine);
  engineRef.current = engine;

  const completeGame = useCallback(
    async (winner: PlayerColor | null, reason: string) => {
      try {
        const res = await gameService.finishGame({
          roomId,
          winner,
          reason,
        });
        if (res && (res.whiteChange !== undefined || res.blackChange !== undefined)) {
          setRoom((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'FINISHED',
                  winner,
                  winReason: reason,
                  whiteRatingChange: res.whiteChange,
                  blackRatingChange: res.blackChange,
                }
              : prev
          );
        }
        onGameFinished?.();
      } catch (err) {
        console.warn('[useMultiplayerGame] Error completing game:', err);
      }
    },
    [roomId, onGameFinished]
  );
  const completeGameRef = useRef(completeGame);
  completeGameRef.current = completeGame;

  // 1. Initialize room metadata & player assignment
  useEffect(() => {
    let isMounted = true;

    async function initRoom() {
      try {
        let loadedRoom = await gameService.getRoom(roomId);
        if (!loadedRoom) {
          // Auto-create room if it didn't exist yet (e.g. direct link)
          loadedRoom = await gameService.createRoom({
            variant: engineRef.current.getVariant(),
            timeControl: '5_MIN',
            mode: 'CASUAL',
            hostPlayer: {
              id: user.id,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              preferredColor: 'WHITE',
            },
          });
        }

        if (!isMounted) return;

        // Check our role
        if (loadedRoom.hostPlayer.id === user.id) {
          setMyColor(loadedRoom.hostPlayer.color);
          if (loadedRoom.guestPlayer) {
            setOpponent(loadedRoom.guestPlayer);
            setConnectionStatus('CONNECTED');
          } else {
            setConnectionStatus('WAITING');
          }
        } else if (loadedRoom.guestPlayer?.id === user.id) {
          setMyColor(loadedRoom.guestPlayer.color);
          setOpponent(loadedRoom.hostPlayer);
          setConnectionStatus('CONNECTED');
        } else if (!loadedRoom.guestPlayer && loadedRoom.status === 'WAITING') {
          // Join as guest
          const joinResult = await gameService.joinRoom(roomId, {
            id: user.id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          });
          if (joinResult.success && joinResult.room) {
            loadedRoom = joinResult.room;
            setMyColor(loadedRoom.guestPlayer!.color);
            setOpponent(loadedRoom.hostPlayer);
            setConnectionStatus('CONNECTED');
          }
        } else {
          // Spectator
          setMyColor('SPECTATOR');
          setOpponent(loadedRoom.guestPlayer || null);
          setConnectionStatus('CONNECTED');
        }

        setRoom(loadedRoom);
      } catch (err) {
        console.error('[useMultiplayerGame] Room init error:', err);
      }
    }

    initRoom();

    return () => {
      isMounted = false;
    };
  }, [roomId, user.id, user.displayName, user.avatarUrl]);

  // 2. Realtime Channel Setup & Message Handling
  useEffect(() => {
    const channel = new RealtimeGameChannel(roomId, user.id);
    channelRef.current = channel;

    const unsubscribe = channel.subscribe((msg: MultiplayerMessage) => {
      const { payload } = msg;

      switch (payload.type) {
        case 'PLAYER_JOIN': {
          setOpponent((prev) => {
            if (!prev || prev.id === payload.player.id) {
              return { ...payload.player, isOnline: true };
            }
            return prev;
          });
          setRoom((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: 'ACTIVE',
              guestPlayer: prev.guestPlayer || payload.player,
            };
          });
          setConnectionStatus('CONNECTED');
          setDisconnectCountdown(null);
          break;
        }

        case 'MOVE': {
          // Another player submitted a move
          const currentEng = engineRef.current;
          const res = currentEng.makeMove(payload.move);
          if (res.success) {
            soundService.playForMoveResult(payload.move, res);
            onEngineStateUpdate(res.state);
            if (['FINISHED', 'DRAW', 'RESIGNED', 'TIMEOUT', 'ABANDONED'].includes(res.state.status)) {
              completeGameRef.current(res.state.winner, res.state.winReason || 'Game finished.');
            }
            if (onClockUpdate) {
              onClockUpdate({
                ...(payload.clocks || {}),
                turnStartedAt: payload.turnStartedAt || Date.now(),
              });
            }
          }
          break;
        }

        case 'RESIGN': {
          const res = engineRef.current.resign(payload.player);
          onEngineStateUpdate(res.state);
          const winner = payload.player === 'WHITE' ? 'BLACK' : 'WHITE';
          completeGameRef.current(winner, `${payload.player === 'WHITE' ? 'White' : 'Black'} resigned.`);
          break;
        }

        case 'TIMEOUT': {
          engineRef.current.timeout(payload.player);
          onEngineStateUpdate(engineRef.current.getState());
          const winner = payload.player === 'WHITE' ? 'BLACK' : 'WHITE';
          completeGameRef.current(winner, `${payload.player === 'WHITE' ? 'White' : 'Black'} timed out.`);
          break;
        }

        case 'DRAW_OFFER': {
          setIncomingDrawOffer(true);
          break;
        }

        case 'DRAW_RESPONSE': {
          setOutgoingDrawOffer(false);
          if (payload.accepted) {
            const state = engineRef.current.getState();
            state.status = 'DRAW';
            state.winner = null;
            state.winReason = 'Players agreed to a draw.';
            onEngineStateUpdate({ ...state });
            completeGameRef.current(null, 'Players agreed to a draw.');
          }
          break;
        }

        case 'REMATCH_OFFER': {
          setIncomingRematchOffer(true);
          break;
        }

        case 'REMATCH_ACCEPT': {
          setIncomingRematchOffer(false);
          setOutgoingRematchOffer(false);
          // Navigate to new room
          if (typeof window !== 'undefined') {
            window.location.href = `/game?room=${payload.newRoomId}&variant=${engineRef.current.getVariant()}`;
          }
          break;
        }

        case 'HEARTBEAT': {
          if (payload.playerId !== user.id) {
            opponentLastSeenRef.current = Date.now();
            setOpponent((prev) => (prev ? { ...prev, isOnline: true } : prev));
            setDisconnectCountdown(null);
          }
          break;
        }

        case 'CHAT': {
          if (payload.senderId !== user.id) {
            setChatMessages((prev) => [
              ...prev,
              {
                id: `${payload.timestamp}_${Math.random()}`,
                senderId: payload.senderId,
                senderName: payload.senderName,
                message: payload.message,
                timestamp: payload.timestamp,
                isSelf: false,
              },
            ]);
          }
          break;
        }

        case 'PLAYER_DISCONNECT': {
          setOpponent((prev) => (prev ? { ...prev, isOnline: false } : prev));
          break;
        }
      }
    });

    // Announce presence
    channel.send({
      type: 'PLAYER_JOIN',
      player: {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        color: myColor === 'SPECTATOR' ? 'WHITE' : myColor,
        isOnline: true,
        connectedAt: Date.now(),
        lastSeen: Date.now(),
      },
    });

    // Heartbeat ticker
    const hbInterval = setInterval(() => {
      channel.send({
        type: 'HEARTBEAT',
        playerId: user.id,
        timestamp: Date.now(),
      });

      // Check opponent liveness (if not seen in 15 seconds)
      const now = Date.now();
      if (now - opponentLastSeenRef.current > 15000 && opponent?.isOnline) {
        setOpponent((prev) => (prev ? { ...prev, isOnline: false } : prev));
        // Start 60s disconnect grace period if game is in progress
        const state = engineRef.current.getState();
        if (['PLACING', 'MOVING', 'FLYING', 'CAPTURE_PENDING'].includes(state.status)) {
          setDisconnectCountdown(60);
        }
      }
    }, 4000);

    return () => {
      clearInterval(hbInterval);
      unsubscribe();
      channel.disconnect();
    };
  }, [roomId, user.id, user.displayName, user.avatarUrl, myColor, onEngineStateUpdate, onClockUpdate]);

  // 3. Disconnect Grace Period Countdown
  useEffect(() => {
    if (disconnectCountdown === null || disconnectCountdown <= 0) return;

    const timer = setInterval(() => {
      setDisconnectCountdown((prev) => {
        if (prev === null || prev <= 1) {
          // Grace period elapsed - Opponent forfeited by abandonment!
          if (opponent && myColor !== 'SPECTATOR') {
            const oppColor = myColor === 'WHITE' ? 'BLACK' : 'WHITE';
            const res = engineRef.current.resign(oppColor);
            res.state.winReason = 'Opponent disconnected and forfeited.';
            onEngineStateUpdate({ ...res.state });
            completeGameRef.current(myColor, 'Opponent disconnected and forfeited.');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [disconnectCountdown, opponent, myColor, onEngineStateUpdate]);

  // Actions
  const broadcastMove = useCallback(
    (move: PlayerMove, clocks?: { WHITE?: number; BLACK?: number }, turnStartedAt?: number) => {
      if (!channelRef.current) return;
      const state = engineRef.current.getState();
      const history = engineRef.current.getHistory();
      const fen = engineRef.current.getFEN();
      channelRef.current.send({
        type: 'MOVE',
        move,
        fen,
        clocks,
        moveNumber: history.length,
        turnStartedAt: turnStartedAt || Date.now(),
      });

      // Record move to persistence layer
      gameService.recordMove({
        roomId,
        playerColor: state.currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE', // Player who just made move
        move,
        notation: history[history.length - 1]?.notation || '',
        fen,
        moveNumber: history.length,
      });

      if (['FINISHED', 'DRAW', 'RESIGNED', 'TIMEOUT', 'ABANDONED'].includes(state.status)) {
        completeGame(state.winner, state.winReason || 'Game finished.');
      }
    },
    [roomId, completeGame]
  );

  const broadcastTimeout = useCallback(
    (player: PlayerColor) => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: 'TIMEOUT',
        player,
      });
      const winner = player === 'WHITE' ? 'BLACK' : 'WHITE';
      completeGame(winner, `${player === 'WHITE' ? 'White' : 'Black'} ran out of time.`);
    },
    [roomId, completeGame]
  );

  const broadcastResign = useCallback(
    (player: PlayerColor) => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: 'RESIGN',
        player,
      });
      const winner = player === 'WHITE' ? 'BLACK' : 'WHITE';
      completeGame(winner, `${player === 'WHITE' ? 'White' : 'Black'} resigned.`);
    },
    [roomId, completeGame]
  );

  const offerDraw = useCallback(() => {
    if (!channelRef.current || myColor === 'SPECTATOR') return;
    setOutgoingDrawOffer(true);
    channelRef.current.send({
      type: 'DRAW_OFFER',
      from: myColor,
    });
  }, [myColor]);

  const respondToDraw = useCallback(
    (accepted: boolean) => {
      if (!channelRef.current || myColor === 'SPECTATOR') return;
      setIncomingDrawOffer(false);
      channelRef.current.send({
        type: 'DRAW_RESPONSE',
        accepted,
        by: myColor,
      });

      if (accepted) {
        const state = engineRef.current.getState();
        state.status = 'DRAW';
        state.winner = null;
        state.winReason = 'Players agreed to a draw.';
        onEngineStateUpdate({ ...state });
        completeGame(null, 'Players agreed to a draw.');
      }
    },
    [myColor, onEngineStateUpdate, completeGame]
  );

  const offerRematch = useCallback(() => {
    if (!channelRef.current || myColor === 'SPECTATOR') return;
    setOutgoingRematchOffer(true);
    channelRef.current.send({
      type: 'REMATCH_OFFER',
      from: myColor,
    });
  }, [myColor]);

  const acceptRematch = useCallback(
    async (newRoomId: string) => {
      if (!channelRef.current) return;
      setIncomingRematchOffer(false);
      channelRef.current.send({
        type: 'REMATCH_ACCEPT',
        newRoomId,
      });
      if (typeof window !== 'undefined') {
        window.location.href = `/game?room=${newRoomId}&variant=${engineRef.current.getVariant()}`;
      }
    },
    []
  );

  const sendChatMessage = useCallback(
    (msgText: string) => {
      const trimmed = msgText.trim();
      if (!trimmed) return;
      const chatEntry: GameChatMessage = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        senderId: user.id,
        senderName: user.displayName,
        message: trimmed,
        timestamp: Date.now(),
        isSelf: true,
      };
      setChatMessages((prev) => [...prev, chatEntry]);
      if (channelRef.current) {
        channelRef.current.send({
          type: 'CHAT',
          senderId: user.id,
          senderName: user.displayName,
          message: trimmed,
          timestamp: Date.now(),
        });
      }
    },
    [user.id, user.displayName]
  );

  const isMyTurn =
    myColor !== 'SPECTATOR' &&
    engineRef.current.getState().currentPlayer === myColor &&
    !['FINISHED', 'DRAW', 'RESIGNED', 'TIMEOUT', 'ABANDONED'].includes(
      engineRef.current.getState().status
    );

  return {
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
    chatMessages,
    sendChatMessage,
    broadcastMove,
    broadcastResign,
    broadcastTimeout,
    offerDraw,
    respondToDraw,
    offerRematch,
    acceptRematch,
  };
}
