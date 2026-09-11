import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SoundService, soundService } from '@/services/audio/soundService';
import { GameControls } from '@/components/game/GameControls';

// Mock Web Audio API
class MockAudioParam {
  value: number = 0;
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class MockOscillatorNode {
  type: string = 'sine';
  frequency = new MockAudioParam();
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockGainNode {
  gain = new MockAudioParam();
  connect = vi.fn();
}

class MockAudioContext {
  state: AudioContextState = 'suspended';
  currentTime: number = 0;
  destination = {};
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createGain = vi.fn(() => new MockGainNode());
  resume = vi.fn().mockImplementation(() => {
    this.state = 'running';
    return Promise.resolve();
  });
}

describe('Web Audio API Sound Service', () => {
  let originalAudioContext: any;
  let mockCtx: MockAudioContext;

  beforeEach(() => {
    localStorage.clear();
    mockCtx = new MockAudioContext();
    originalAudioContext = window.AudioContext;
    (window as any).AudioContext = vi.fn(() => mockCtx);
    soundService.setMuted(false);
  });

  afterEach(() => {
    (window as any).AudioContext = originalAudioContext;
    vi.restoreAllMocks();
  });

  describe('Sound Synthesis (Offline Web Audio API)', () => {
    it('plays subtle click for move', () => {
      const service = new SoundService();
      service.setMuted(false);

      service.playMove();

      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockCtx.createGain).toHaveBeenCalledTimes(1);
    });

    it('plays deeper click for capture', () => {
      const service = new SoundService();
      service.setMuted(false);

      service.playCapture();

      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockCtx.createGain).toHaveBeenCalledTimes(1);
    });

    it('plays two-tone chime for mill', () => {
      const service = new SoundService();
      service.setMuted(false);

      service.playMill();

      // Mill chime uses two oscillators for ascending musical tones
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
      expect(mockCtx.createGain).toHaveBeenCalledTimes(2);
    });

    it('resumes suspended AudioContext on play', () => {
      const service = new SoundService();
      service.playMove();
      expect(mockCtx.resume).toHaveBeenCalled();
    });
  });

  describe('Mute and LocalStorage Persistence', () => {
    it('defaults to unmuted when no localStorage value is set', () => {
      const service = new SoundService();
      expect(service.isMuted()).toBe(false);
    });

    it('loads muted state from localStorage when initialized', () => {
      localStorage.setItem('mills_sound_muted', 'true');
      const service = new SoundService();
      expect(service.isMuted()).toBe(true);
    });

    it('persists mute toggle in localStorage', () => {
      const service = new SoundService();
      expect(service.isMuted()).toBe(false);

      service.toggleMuted();
      expect(service.isMuted()).toBe(true);
      expect(localStorage.getItem('mills_sound_muted')).toBe('true');

      service.toggleMuted();
      expect(service.isMuted()).toBe(false);
      expect(localStorage.getItem('mills_sound_muted')).toBe('false');
    });

    it('does not play any sounds when muted', () => {
      const service = new SoundService();
      service.setMuted(true);

      service.playMove();
      service.playCapture();
      service.playMill();

      expect(mockCtx.createOscillator).not.toHaveBeenCalled();
      expect(mockCtx.createGain).not.toHaveBeenCalled();
    });

    it('notifies subscribers when mute state changes', () => {
      const service = new SoundService();
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);

      service.setMuted(true);
      expect(listener).toHaveBeenCalledWith(true);

      service.toggleMuted();
      expect(listener).toHaveBeenCalledWith(false);

      unsubscribe();
      service.setMuted(true);
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('Move Result Validation Routing', () => {
    it('does not play any sound when action validation fails', () => {
      const service = new SoundService();
      const playMoveSpy = vi.spyOn(service, 'playMove');
      const playCaptureSpy = vi.spyOn(service, 'playCapture');
      const playMillSpy = vi.spyOn(service, 'playMill');

      service.playForMoveResult({ type: 'PLACE' }, { success: false });
      service.playForMoveResult({ type: 'MOVE' }, { success: false });
      service.playForMoveResult({ type: 'CAPTURE' }, { success: false });

      expect(playMoveSpy).not.toHaveBeenCalled();
      expect(playCaptureSpy).not.toHaveBeenCalled();
      expect(playMillSpy).not.toHaveBeenCalled();
    });

    it('triggers playCapture on valid CAPTURE action', () => {
      const service = new SoundService();
      const playCaptureSpy = vi.spyOn(service, 'playCapture');

      service.playForMoveResult({ type: 'CAPTURE' }, { success: true });

      expect(playCaptureSpy).toHaveBeenCalledTimes(1);
    });

    it('triggers playMill when a mill is formed on valid move/place', () => {
      const service = new SoundService();
      const playMillSpy = vi.spyOn(service, 'playMill');

      service.playForMoveResult({ type: 'PLACE' }, { success: true, formedMill: true });
      expect(playMillSpy).toHaveBeenCalledTimes(1);

      service.playForMoveResult({ type: 'MOVE' }, { success: true, formedMill: true });
      expect(playMillSpy).toHaveBeenCalledTimes(2);
    });

    it('triggers playMove on normal valid placement or move without mill', () => {
      const service = new SoundService();
      const playMoveSpy = vi.spyOn(service, 'playMove');

      service.playForMoveResult({ type: 'PLACE' }, { success: true, formedMill: false });
      expect(playMoveSpy).toHaveBeenCalledTimes(1);

      service.playForMoveResult({ type: 'MOVE' }, { success: true });
      expect(playMoveSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('UI Mute/Unmute Control (GameControls)', () => {
    it('renders mute button and toggles state when clicked', () => {
      soundService.setMuted(false);

      render(
        <GameControls
          currentPlayer="WHITE"
          onResign={vi.fn()}
          onOfferDraw={vi.fn()}
          onFlipBoard={vi.fn()}
        />
      );

      const muteBtn = screen.getByRole('button', { name: /Mute sound/i });
      expect(muteBtn).toBeInTheDocument();

      act(() => {
        fireEvent.click(muteBtn);
      });

      expect(soundService.isMuted()).toBe(true);
      expect(localStorage.getItem('mills_sound_muted')).toBe('true');

      // Now button label changes to Unmute sound
      expect(screen.getByRole('button', { name: /Unmute sound/i })).toBeInTheDocument();

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /Unmute sound/i }));
      });

      expect(soundService.isMuted()).toBe(false);
      expect(localStorage.getItem('mills_sound_muted')).toBe('false');
    });
  });
});
