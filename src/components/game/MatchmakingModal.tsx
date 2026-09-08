import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameVariant, GameMode, TimeControl } from '@/lib/types';
import { formatVariantName, formatTimeControl } from '@/lib/utils';
import { matchmakingService, OpponentInfo } from '@/services/matchmaking/matchmakingService';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { RatingBadge } from '@/components/common/RatingBadge';
import { Button } from '@/components/ui/Button';
import { Swords, AlertCircle } from 'lucide-react';

export interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: GameVariant;
  mode: GameMode;
  timeControl: TimeControl;
}

export function MatchmakingModal({
  isOpen,
  onClose,
  variant,
  mode,
  timeControl,
}: MatchmakingModalProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [searchStatus, setSearchStatus] = useState('Searching for a worthy opponent...');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [tolerance, setTolerance] = useState(75);
  const [matchedGameId, setMatchedGameId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<OpponentInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const myRating = (variant === 'MILLS_3'
    ? profile?.ratings?.mills3
    : variant === 'MILLS_6'
      ? profile?.ratings?.mills6
      : profile?.ratings?.mills9) || 1200;

  useEffect(() => {
    if (!isOpen || !user) return;

    setMatchedGameId(null);
    setOpponent(null);
    setErrorMessage(null);
    setElapsedSec(0);
    setCountdown(null);

    matchmakingService.joinQueue({
      variant,
      mode,
      timeControl,
      userId: user.id,
      userRating: myRating,
      onMatched: (gameId, opp) => {
        setMatchedGameId(gameId);
        if (opp) setOpponent(opp);
        setCountdown(2);
      },
      onError: (err) => {
        setErrorMessage(err);
      },
      onStatusUpdate: (statusText, sec, tol) => {
        setSearchStatus(statusText);
        setElapsedSec(sec);
        setTolerance(tol);
      },
    });

    return () => {
      matchmakingService.cancelQueue();
    };
  }, [isOpen, variant, mode, timeControl, user?.id]);

  // Handle countdown transition to game
  useEffect(() => {
    if (countdown === null || !matchedGameId) return;

    if (countdown <= 0) {
      navigate(`/game?room=${matchedGameId}&variant=${variant}&time=${timeControl}`);
      onClose();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, matchedGameId, navigate, variant, timeControl, onClose]);

  const handleCancel = () => {
    matchmakingService.cancelQueue();
    onClose();
  };

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#1C110A] border border-[#5C3D26] p-6 text-center text-[#FAF7F2] shadow-2xl overflow-hidden">
        {/* Background ambient radial glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-[#C4973B]/10 blur-3xl pointer-events-none" />

        {/* Header Badges */}
        <div className="space-y-1 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3D2817] border border-[#5C3D26] text-[11px] font-mono font-bold tracking-widest text-[#C4973B] uppercase">
            <span>{formatVariantName(variant)}</span>
            <span>•</span>
            <span>{mode}</span>
            <span>•</span>
            <span>{formatTimeControl(timeControl)}</span>
          </div>
        </div>

        {/* Error State */}
        {errorMessage ? (
          <div className="py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-alert-danger/20 border border-alert-danger text-alert-danger mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-white">Matchmaking Unavailable</h3>
              <p className="text-xs text-ink-light px-4 leading-relaxed">{errorMessage}</p>
            </div>
            <Button
              variant="secondary"
              onClick={handleCancel}
              className="w-full bg-[#3D2817] hover:bg-[#4E341F] text-[#FAF7F2] border border-[#5C3D26] font-bold text-xs"
            >
              CLOSE
            </Button>
          </div>
        ) : matchedGameId ? (
          /* Opponent Found State */
          <div className="py-2 space-y-5 animate-in zoom-in-95 duration-300">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase animate-pulse">
                MATCH READY
              </span>
              <h2 className="text-2xl font-black text-[#FAF7F2] tracking-tight">
                OPPONENT FOUND!
              </h2>
            </div>

            {/* VS Matchup Cards */}
            <div className="flex items-center justify-between gap-3 bg-[#2A180E] p-4 rounded-2xl border border-[#5C3D26]/70 shadow-inner">
              {/* Opponent */}
              <div className="flex-1 flex flex-col items-center min-w-0">
                <Avatar
                  name={opponent?.username || 'Opponent'}
                  src={opponent?.avatarUrl}
                  size="lg"
                  className="shadow-md ring-2 ring-[#C4973B]/50"
                />
                <span className="font-bold text-xs text-[#FAF7F2] truncate max-w-[100px] mt-2">
                  {opponent?.username || 'Opponent'}
                </span>
                <RatingBadge rating={opponent?.rating || 1200} size="sm" />
              </div>

              {/* VS Badge */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className="w-9 h-9 rounded-full bg-[#3D2817] border border-[#C4973B]/60 flex items-center justify-center shadow-lg">
                  <span className="font-black font-mono text-xs text-[#C4973B]">VS</span>
                </div>
              </div>

              {/* You */}
              <div className="flex-1 flex flex-col items-center min-w-0">
                <Avatar
                  name={profile?.username || 'You'}
                  src={profile?.avatarUrl}
                  size="lg"
                  className="shadow-md ring-2 ring-emerald-500/50"
                />
                <span className="font-bold text-xs text-[#FAF7F2] truncate max-w-[100px] mt-2">
                  {profile?.username || 'You'}
                </span>
                <RatingBadge rating={myRating} size="sm" />
              </div>
            </div>

            <div className="text-center pt-1">
              <p className="text-xs font-mono text-emerald-400 font-bold">
                Starting game in {countdown}s...
              </p>
            </div>
          </div>
        ) : (
          /* Searching State */
          <div className="py-4 space-y-6">
            {/* Animated Radar Radar Circle */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              {/* Concentric ambient ripples */}
              <div className="absolute inset-0 rounded-full border border-[#C4973B]/20 animate-ping opacity-30" />
              <div className="absolute inset-2 rounded-full border border-[#C4973B]/30 animate-pulse" />
              <div className="absolute inset-6 rounded-full border border-dashed border-[#C4973B]/40 animate-spin" style={{ animationDuration: '14s' }} />

              {/* Center Medallion */}
              <div className="relative w-18 h-18 rounded-2xl bg-gradient-to-br from-[#5C3D26] to-[#3D2817] flex items-center justify-center border-2 border-[#C4973B] shadow-xl">
                <Swords className="w-8 h-8 text-[#C4973B] animate-pulse" />
              </div>
            </div>

            {/* Status & Timer */}
            <div className="space-y-1.5">
              <h3 className="text-lg font-black tracking-tight text-white uppercase">
                FINDING OPPONENT
              </h3>
              <div className="font-mono text-2xl font-bold text-[#C4973B]">
                {formatTimer(elapsedSec)}
              </div>
              <p className="text-xs text-ink-light px-2 leading-relaxed">
                {searchStatus}
              </p>
              {mode === 'RANKED' && (
                <p className="text-[11px] font-mono text-[#C4973B]/70">
                  Rating search window: ±{tolerance}
                </p>
              )}
            </div>

            {/* Cancel Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={handleCancel}
                className="w-full bg-[#2A180E] hover:bg-[#3D2817] text-[#FAF7F2] border border-[#5C3D26] font-bold text-xs tracking-wider uppercase rounded-2xl py-3 shadow-soft cursor-pointer transition-colors"
              >
                CANCEL
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
