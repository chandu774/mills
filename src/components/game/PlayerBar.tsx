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
  isCompact = false,
  isOnline,
}: PlayerBarProps) {
  const isWhite = color === 'WHITE';

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemainingSeconds !== undefined && timeRemainingSeconds <= 30;

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3.5 py-2 sm:py-2.5 rounded-2xl border transition-all select-none",
        isTurn
          ? "bg-[#F3F8F4] border-primary/40 shadow-soft ring-1.5 ring-primary/30"
          : "bg-white/95 border-background-border/90 text-ink-muted shadow-soft"
      )}
    >
      {/* Left: Player Identity & Color Badge */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="relative shrink-0">
          <Avatar src={avatarUrl} name={username} size={isCompact ? 'sm' : 'md'} />
          {/* Tactile piece color marker dot */}
          <span
            className={cn(
              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm",
              isWhite ? "bg-[#FAF7F2] ring-1 ring-[#D4C7B5]" : "bg-[#2A170B] ring-1 ring-[#4A321E]"
            )}
            title={`${color} pieces`}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={cn("font-bold text-xs sm:text-sm truncate", isTurn ? "text-ink" : "text-ink-muted")}>
              {username}
            </span>
            {isOnline !== undefined && (
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  isOnline ? "bg-primary" : "bg-alert-danger animate-pulse"
                )}
                title={isOnline ? "Online" : "Disconnected"}
              />
            )}
            <RatingBadge rating={rating} size="sm" />
          </div>
          <p className="text-[11px] text-ink-subtle truncate">{displayName}</p>
        </div>
      </div>

      {/* Center: Unplaced Chips & Captured Pieces */}
      <div className="flex flex-col items-center gap-1 shrink-0 px-2">
        {unplacedCount > 0 && (
          <div className="flex items-center gap-1" title={`${unplacedCount} pieces remaining to place`}>
            {Array.from({ length: Math.min(unplacedCount, 9) }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full shadow-2xs",
                  isWhite ? "bg-[#FAF7F2] border border-[#C8BCAB]" : "bg-[#25150A] border border-[#432A16]"
                )}
              />
            ))}
            {unplacedCount > 9 && <span className="text-[10px] text-ink-subtle font-mono">+{unplacedCount - 9}</span>}
          </div>
        )}

        {capturedCount > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-ink-subtle">
            <span className="font-bold text-alert-danger">+{capturedCount}</span>
            <span>captured</span>
          </div>
        )}
      </div>

      {/* Right: Clock Timer */}
      {timeRemainingSeconds !== undefined && (
        <div
          className={cn(
            "flex items-center gap-1.5 font-mono px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border font-bold text-xs sm:text-sm min-w-[72px] sm:min-w-[80px] justify-center transition-all shrink-0",
            isTurn
              ? isLowTime
                ? "bg-red-50 text-alert-danger border-alert-danger/40 animate-pulse"
                : "bg-white text-ink border-primary/30 shadow-2xs"
              : "bg-background-elevated text-ink-subtle border-background-border/60"
          )}
        >
          <Clock className="h-3.5 w-3.5 opacity-60 shrink-0" />
          <span>{formatClock(timeRemainingSeconds)}</span>
        </div>
      )}
    </div>
  );
}
