import { useState, useEffect, useCallback } from 'react';
import { soundService, MoveAudioInput, MoveResultAudioInput } from '@/services/audio/soundService';

export function useSound() {
  const [isMuted, setIsMuted] = useState<boolean>(() => soundService.isMuted());

  useEffect(() => {
    return soundService.subscribe((muted) => {
      setIsMuted(muted);
    });
  }, []);

  const toggleMute = useCallback(() => {
    soundService.toggleMuted();
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    soundService.setMuted(muted);
  }, []);

  const playMove = useCallback(() => {
    soundService.playMove();
  }, []);

  const playCapture = useCallback(() => {
    soundService.playCapture();
  }, []);

  const playMill = useCallback(() => {
    soundService.playMill();
  }, []);

  const playForMoveResult = useCallback((move: MoveAudioInput, result: MoveResultAudioInput) => {
    soundService.playForMoveResult(move, result);
  }, []);

  return {
    isMuted,
    toggleMute,
    setMuted,
    playMove,
    playCapture,
    playMill,
    playForMoveResult,
  };
}
