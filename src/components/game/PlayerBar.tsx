import { PlayerColor } from '@/game/engine/types';
import { Avatar } from '@/components/ui/Avatar';
import { RatingBadge } from '@/components/common/RatingBadge';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PlayerBarProps {
  color: PlayerColor;
  username: string;
  displayName: string;
  avatarUrl?: string;
  rating: number;
  isTurn: boolean;
  unplacedCount: number;
  capturedCount: number;
  timeRemainingSeconds?: number;
  isPerMoveTimer?: boolean;
  isCompact?: boolean;
  isOnline?: boolean;
}

export function PlayerBar({
  color,
  username,
  displayName,
  avatarUrl,
  rating,
  isTurn,
  unplacedCount,
  capturedCount,
  timeRemainingSeconds,
  isPerMoveTimer = false,
  isCompact = false,
  isOnline,
}: PlayerBarProps) {
  const isWhite = color === 'WHITE';

  const formatClock = (seconds: number) => {
    if (isPerMoveTimer) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = isPerMoveTimer
    ? timeRemainingSeconds !== undefined && timeRemainingSeconds <= 8
    : timeRemainingSeconds !== undefined && timeRemainingSeconds <= 30;

  return (
    <div
      className={cn(
        "flex items-center justify-between px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl border transition-all select-none gap-1.5 sm:gap-2",
        isTurn
          ? "bg-[#F3F8F4] border-primary/40 shadow-soft ring-1.5 ring-primary/30"
          : "bg-white/95 border-background-border/90 text-ink-muted shadow-soft"
      )}
    >
      {/* Left: Player Identity & Color Badge */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <div className="relative shrink-0">
          <Avatar src={avatarUrl} name={username} size={isCompact ? 'sm' : 'md'} />
          {/* Tactile piece color marker dot */}
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-2xs",
              isWhite ? "bg-[#FAF7F2] ring-1 ring-[#D4C7B5]" : "bg-[#2A170B] ring-1 ring-[#4A321E]"
            )}
            title={`${color} pieces`}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className={cn("font-bold text-xs sm:text-sm truncate max-w-[80px] xs:max-w-[110px] sm:max-w-[150px]", isTurn ? "text-ink" : "text-ink-muted")}>
              {username}
            </span>
            {isOnline !== undefined && (
              <span
                className={cn(
                  "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0",
                  isOnline ? "bg-primary" : "bg-alert-danger animate-pulse"
                )}
                title={isOnline ? "Online" : "Disconnected"}
              />
            )}
            <RatingBadge rating={rating} size="sm" />
          </div>
          <p className="text-[10px] sm:text-[11px] text-ink-subtle truncate max-w-[80px] xs:max-w-[110px] sm:max-w-[150px] hidden xs:block">{displayName}</p>
        </div>
      </div>

      {/* Center: Unplaced Chips & Captured Pieces (Sized compactly for mobile) */}
      <div className="flex flex-col items-center gap-0.5 shrink-0 px-1 sm:px-2">
        {unplacedCount > 0 && (
          <div className="flex items-center gap-1" title={`${unplacedCount} pieces remaining to place`}>
            {/* Show up to 4 dots + count tag on small screen to save space */}
            {Array.from({ length: Math.min(unplacedCount, 4) }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full shadow-2xs",
                  isWhite ? "bg-[#FAF7F2] border border-[#C8BCAB]" : "bg-[#25150A] border border-[#432A16]"
                )}
              />
            ))}
            {unplacedCount > 4 && (
              <span className="text-[10px] font-mono font-bold text-ink-muted">
                +{unplacedCount - 4}
              </span>
            )}
          </div>
        )}

        {capturedCount > 0 && (
          <div className="flex items-center gap-0.5 text-[10px] sm:text-[11px] text-ink-subtle">
            <span className="font-bold text-alert-danger">+{capturedCount}</span>
            <span className="hidden sm:inline">captured</span>
          </div>
        )}
      </div>

      {/* Right: Clock Timer */}
      {timeRemainingSeconds !== undefined && (
        <div
          className={cn(
            "flex items-center gap-1 font-mono px-2 sm:px-2.5 py-1 rounded-xl border font-bold text-xs sm:text-sm min-w-[56px] sm:min-w-[68px] justify-center transition-all shrink-0 select-none",
            isTurn
              ? isLowTime
                ? "bg-red-50 text-alert-danger border-alert-danger/60 animate-pulse ring-1 ring-alert-danger/30"
                : "bg-white text-ink border-primary/40 shadow-2xs ring-1 ring-primary/20"
              : "bg-background-elevated text-ink-subtle border-background-border/60"
          )}
          title={isPerMoveTimer ? `${timeRemainingSeconds}s remaining for this turn` : `${timeRemainingSeconds}s remaining`}
        >
          <Clock className={cn("h-3 w-3 shrink-0", isTurn ? (isLowTime ? "text-alert-danger" : "text-primary") : "opacity-60")} />
          <span>{formatClock(timeRemainingSeconds)}</span>
        </div>
      )}
    </div>
  );
}
