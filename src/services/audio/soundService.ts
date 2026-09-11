/**
 * Modular Web Audio API Sound Service
 * 
 * 100% offline, zero external audio files, zero background music, zero network dependencies.
 * Synthesizes board game sound effects purely using browser AudioContext oscillators and gain envelopes:
 * 1. Move: Very short subtle click upon valid piece movement/placement
 * 2. Capture: Deeper resonant click/thud upon capturing an opponent piece
 * 3. Mill: Distinctive two-tone ascending musical chime when a Mill is successfully formed
 *
 * User sound preference (muted/unmuted) is persisted locally via localStorage.
 */

const STORAGE_KEY = 'mills_sound_muted';

export interface MoveResultAudioInput {
  success: boolean;
  formedMill?: boolean;
}

export interface MoveAudioInput {
  type: string;
}

export class SoundService {
  private ctx: AudioContext | null = null;
  private isMutedState: boolean = false;
  private listeners: Set<(isMuted: boolean) => void> = new Set();

  constructor() {
    this.isMutedState = this.loadMutedPreference();
    this.setupUserGestureUnlock();
  }

  private loadMutedPreference(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private saveMutedPreference(muted: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  private setupUserGestureUnlock(): void {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      this.ensureContextRunning();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!this.ctx) {
      try {
        this.ctx = new AudioContextClass();
      } catch {
        return null;
      }
    }

    this.ensureContextRunning();
    return this.ctx;
  }

  private ensureContextRunning(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  public setMuted(muted: boolean): void {
    this.isMutedState = muted;
    this.saveMutedPreference(muted);
    this.notifyListeners();
  }

  public toggleMuted(): boolean {
    const nextState = !this.isMutedState;
    this.setMuted(nextState);
    return nextState;
  }

  public subscribe(listener: (isMuted: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.isMutedState);
      } catch (err) {
        console.warn('[SoundService] Listener error:', err);
      }
    }
  }

  /**
   * Very short subtle click when a valid piece movement or placement is completed.
   * Synthesized using a swift high-to-mid frequency pitch envelope (~620Hz to 160Hz in 25ms)
   * with rapid exponential gain decay for an authentic wooden board game feel.
   */
  public playMove(): void {
    if (this.isMutedState) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.022);

      // Subtle volume envelope (gentle attack, fast decay)
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.028);
    } catch {
      // Ignore audio synthesis errors in unsupported environments
    }
  }

  /**
   * Deeper click when a piece is captured.
   * Synthesized using a resonant, lower frequency pitch envelope (~220Hz to 55Hz in 65ms)
   * with a richer triangle waveform for a satisfying acoustic piece-removal thud.
   */
  public playCapture(): void {
    if (this.isMutedState) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.06);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.075);
    } catch {
      // Ignore audio synthesis errors
    }
  }

  /**
   * Distinctive two-tone chime when a Mill is successfully formed.
   * Synthesized using dual ascending harmonic tones:
   * Tone 1: G5 (783.99 Hz) decaying over 240ms
   * Tone 2: C6 (1046.50 Hz) entering at +110ms and decaying over 320ms
   */
  public playMill(): void {
    if (this.isMutedState) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Tone 1: G5
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.24, now + 0.012);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.25);

      // Tone 2: C6 (entering at now + 110ms)
      const t2 = now + 0.11;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, t2);

      gain2.gain.setValueAtTime(0.001, t2);
      gain2.gain.linearRampToValueAtTime(0.28, t2 + 0.012);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.32);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(t2);
      osc2.stop(t2 + 0.34);
    } catch {
      // Ignore audio synthesis errors
    }
  }

  /**
   * Modular dispatcher that plays the appropriate sound effect
   * strictly upon validated move result.
   */
  public playForMoveResult(move: MoveAudioInput, result: MoveResultAudioInput): void {
    if (!result || !result.success) return;

    if (move.type === 'CAPTURE') {
      this.playCapture();
    } else if (result.formedMill) {
      this.playMill();
    } else {
      this.playMove();
    }
  }
}

export const soundService = new SoundService();
