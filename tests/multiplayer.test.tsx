import { describe, it, expect, beforeEach } from 'vitest';
import { GameService } from '@/services/games/gameService';
import { RealtimeGameChannel } from '@/services/games/realtimeChannel';
import { GameEngine } from '@/game/engine/GameEngine';

describe('Phase 5: Online Realtime Multiplayer Engine', () => {
  let service: GameService;

  beforeEach(() => {
    service = new GameService();
  });

  describe('Game Room Service & Lifecycle', () => {
    it('generates unique 6-character room codes', () => {
      const code1 = service.generateRoomCode();
      const code2 = service.generateRoomCode();

      expect(code1).toHaveLength(6);
      expect(code2).toHaveLength(6);
      expect(code1).not.toBe(code2);
      expect(/^[A-Z0-9]+$/.test(code1)).toBe(true);
    });

    it('creates a new room with host player in WAITING status', async () => {
      const room = await service.createRoom({
        variant: 'MILLS_9',
        timeControl: '5_MIN',
        mode: 'PRIVATE',
        hostPlayer: {
          id: 'user_host_1',
          displayName: 'HostPlayer',
          preferredColor: 'WHITE',
        },
      });

      expect(room.id).toBeDefined();
      expect(room.code).toHaveLength(6);
      expect(room.status).toBe('WAITING');
      expect(room.hostPlayer.color).toBe('WHITE');
      expect(room.hostPlayer.displayName).toBe('HostPlayer');
      expect(room.guestPlayer).toBeUndefined();
    });

    it('retrieves room by ID and by code', async () => {
      const created = await service.createRoom({
        variant: 'MILLS_6',
        timeControl: '3_MIN',
        mode: 'CASUAL',
        hostPlayer: {
          id: 'user_host_2',
          displayName: 'PlayerTwo',
        },
      });

      const byId = await service.getRoom(created.id);
      expect(byId).not.toBeNull();
      expect(byId?.id).toBe(created.id);

      const byCode = await service.getRoom(created.code);
      expect(byCode).not.toBeNull();
      expect(byCode?.id).toBe(created.id);
    });

    it('allows guest to join room and activates the match with opposite color', async () => {
      const created = await service.createRoom({
        variant: 'MILLS_9',
        timeControl: '5_MIN',
        mode: 'PRIVATE',
        hostPlayer: {
          id: 'host_alpha',
          displayName: 'Alpha',
          preferredColor: 'WHITE',
        },
      });

      const joinRes = await service.joinRoom(created.id, {
        id: 'guest_beta',
        displayName: 'Beta',
      });

      expect(joinRes.success).toBe(true);
      expect(joinRes.room?.status).toBe('ACTIVE');
      expect(joinRes.room?.guestPlayer).toBeDefined();
      expect(joinRes.room?.guestPlayer?.color).toBe('BLACK');
      expect(joinRes.room?.guestPlayer?.displayName).toBe('Beta');
    });

    it('rejects third player attempting to join an active room', async () => {
      const created = await service.createRoom({
        variant: 'MILLS_3',
        timeControl: 'UNTIMED',
        mode: 'CASUAL',
        hostPlayer: {
          id: 'host_one',
          displayName: 'One',
        },
      });

      await service.joinRoom(created.id, {
        id: 'guest_two',
        displayName: 'Two',
      });

      const thirdJoin = await service.joinRoom(created.id, {
        id: 'intruder_three',
        displayName: 'Three',
      });

      expect(thirdJoin.success).toBe(false);
      expect(thirdJoin.error).toContain('already has 2 active players');
    });
  });

  describe('Realtime Transport & Message Relay', () => {
    it('relays moves between two connected peers on the same room channel', async () => {
      const roomId = `test_room_${Date.now()}`;
      const channelHost = new RealtimeGameChannel(roomId, 'host_user');
      const channelGuest = new RealtimeGameChannel(roomId, 'guest_user');

      const receivedByGuest: any[] = [];
      const receivedByHost: any[] = [];

      channelGuest.subscribe((msg) => {
        receivedByGuest.push(msg);
      });

      channelHost.subscribe((msg) => {
        receivedByHost.push(msg);
      });

      // Host (White) broadcasts a PLACE move
      channelHost.send({
        type: 'MOVE',
        move: { type: 'PLACE', to: 0 },
        fen: 'W:0:0:0',
        moveNumber: 1,
      });

      // Guest should receive the move
      expect(receivedByGuest).toHaveLength(1);
      expect(receivedByGuest[0].payload.type).toBe('MOVE');
      expect(receivedByGuest[0].payload.move.to).toBe(0);

      // Host should NOT receive their own move
      expect(receivedByHost).toHaveLength(0);

      channelHost.disconnect();
      channelGuest.disconnect();
    });

    it('relays resignation and draw offers between peers', () => {
      const roomId = `test_room_res_${Date.now()}`;
      const channel1 = new RealtimeGameChannel(roomId, 'p1');
      const channel2 = new RealtimeGameChannel(roomId, 'p2');

      const p2Events: any[] = [];
      channel2.subscribe((msg) => p2Events.push(msg.payload));

      // P1 sends draw offer
      channel1.send({
        type: 'DRAW_OFFER',
        from: 'WHITE',
      });

      expect(p2Events).toHaveLength(1);
      expect(p2Events[0].type).toBe('DRAW_OFFER');
      expect(p2Events[0].from).toBe('WHITE');

      // P1 resigns
      channel1.send({
        type: 'RESIGN',
        player: 'WHITE',
      });

      expect(p2Events).toHaveLength(2);
      expect(p2Events[1].type).toBe('RESIGN');

      channel1.disconnect();
      channel2.disconnect();
    });
  });

  describe('Engine Synchronization Across Peers', () => {
    it('keeps two independent GameEngine instances in perfect lockstep via moves', () => {
      const engineHost = new GameEngine('MILLS_9');
      const engineGuest = new GameEngine('MILLS_9');

      // 1. Host plays PLACE at point 0
      const hostMove1 = { type: 'PLACE' as const, to: 0 };
      const resHost1 = engineHost.makeMove(hostMove1);
      expect(resHost1.success).toBe(true);

      // Synchronize to Guest
      const resGuest1 = engineGuest.makeMove(hostMove1);
      expect(resGuest1.success).toBe(true);
      expect(engineGuest.getState().board[0]).toBe('WHITE');
      expect(engineGuest.getState().currentPlayer).toBe('BLACK');

      // 2. Guest plays PLACE at point 1
      const guestMove1 = { type: 'PLACE' as const, to: 1 };
      const resGuest2 = engineGuest.makeMove(guestMove1);
      expect(resGuest2.success).toBe(true);

      // Synchronize back to Host
      const resHost2 = engineHost.makeMove(guestMove1);
      expect(resHost2.success).toBe(true);
      expect(engineHost.getState().board[1]).toBe('BLACK');
      expect(engineHost.getState().currentPlayer).toBe('WHITE');

      // Board states match identically
      expect(engineHost.getState().board).toEqual(engineGuest.getState().board);
      expect(engineHost.getFEN()).toEqual(engineGuest.getFEN());
    });
  });
});
