import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { MultiplayerMessage, MultiplayerPayload } from './types';
import { RealtimeChannel } from '@supabase/supabase-js';

// In-memory bus for Node / non-browser test environments or cross-instance fallback
type MessageCallback = (msg: MultiplayerMessage) => void;
const memoryBuses = new Map<string, Set<MessageCallback>>();

export class RealtimeGameChannel {
  private roomId: string;
  private senderId: string;
  private supabaseChannel: RealtimeChannel | null = null;
  private localBroadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<MessageCallback> = new Set();
  private connected: boolean = false;

  constructor(roomId: string, senderId: string) {
    this.roomId = roomId;
    this.senderId = senderId;
    this.init();
  }

  private init() {
    this.connected = true;

    // 1. Supabase Realtime if live credentials are configured (Authoritative)
    if (isSupabaseConfigured() && supabase) {
      this.supabaseChannel = supabase.channel(`mills_room:${this.roomId}`, {
        config: { broadcast: { self: false } },
      });

      this.supabaseChannel
        .on('broadcast', { event: 'game_event' }, ({ payload }) => {
          this.notifyListeners(payload as MultiplayerMessage);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.connected = true;
          }
        });
      return;
    }

    // 2. BroadcastChannel strictly for local development / test offline coordination
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localBroadcastChannel = new BroadcastChannel(`mills_game_${this.roomId}`);
        this.localBroadcastChannel.onmessage = (event: MessageEvent<MultiplayerMessage>) => {
          if (event.data && event.data.senderId !== this.senderId) {
            this.notifyListeners(event.data);
          }
        };
      } catch {
        // Fallback to in-memory bus below
      }
    }

    // 3. In-memory bus registration (works in test environments or single-process tabs)
    if (!memoryBuses.has(this.roomId)) {
      memoryBuses.set(this.roomId, new Set());
    }
    const memBus = memoryBuses.get(this.roomId)!;
    const memHandler: MessageCallback = (msg) => {
      if (msg.senderId !== this.senderId) {
        this.notifyListeners(msg);
      }
    };
    memBus.add(memHandler);
    this._memHandler = memHandler;
  }

  private _memHandler?: MessageCallback;

  private notifyListeners(msg: MultiplayerMessage) {
    this.listeners.forEach((fn) => {
      try {
        fn(msg);
      } catch (err) {
        console.error('[RealtimeGameChannel] Listener error:', err);
      }
    });
  }

  public subscribe(callback: MessageCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public send(payload: MultiplayerPayload): void {
    const message: MultiplayerMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      roomId: this.roomId,
      senderId: this.senderId,
      timestamp: Date.now(),
      payload,
    };

    // Broadcast over Supabase Realtime
    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'game_event',
        payload: message,
      });
      return;
    }

    // Broadcast over BroadcastChannel
    if (this.localBroadcastChannel) {
      try {
        this.localBroadcastChannel.postMessage(message);
      } catch (err) {
        console.error('[RealtimeGameChannel] BroadcastChannel post error:', err);
      }
    }

    // Broadcast over in-memory bus
    const memBus = memoryBuses.get(this.roomId);
    if (memBus) {
      memBus.forEach((fn) => {
        try {
          fn(message);
        } catch (err) {
          console.error('[RealtimeGameChannel] Memory bus dispatch error:', err);
        }
      });
    }
  }

  public disconnect(): void {
    this.connected = false;
    this.listeners.clear();

    if (this.supabaseChannel && supabase) {
      supabase.removeChannel(this.supabaseChannel);
      this.supabaseChannel = null;
    }

    if (this.localBroadcastChannel) {
      this.localBroadcastChannel.close();
      this.localBroadcastChannel = null;
    }

    if (this._memHandler) {
      const memBus = memoryBuses.get(this.roomId);
      if (memBus) {
        memBus.delete(this._memHandler);
        if (memBus.size === 0) {
          memoryBuses.delete(this.roomId);
        }
      }
      this._memHandler = undefined;
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }
}
