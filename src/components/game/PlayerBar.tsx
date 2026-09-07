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
        "flex items-center justify-between px-3.5 py-2.5 rounded-2xl border transition-all select-none",
        isTurn
          ? "bg-background-elevated border-primary/50 shadow-md shadow-primary/10 ring-1 ring-primary/40"
          : "bg-background-card/80 border-background-border text-slate-400"
      )}
    >
      {/* Left: Player Identity & Color Badge */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar src={avatarUrl} name={username} size={isCompact ? 'sm' : 'md'} />
          {/* Color marker dot */}
          <span
            className={cn(
              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background-card shadow-sm",
              isWhite ? "bg-slate-100 ring-1 ring-slate-400" : "bg-slate-900 ring-1 ring-slate-600"
            )}
            title={`${color} pieces`}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className={cn("font-bold text-sm", isTurn ? "text-white" : "text-slate-300")}>
              {username}
            </span>
            <RatingBadge rating={rating} size="sm" />
          </div>
          <p className="text-[11px] text-slate-400">{displayName}</p>
        </div>
      </div>

      {/* Center: Unplaced Chips & Captured Pieces */}
      <div className="flex flex-col items-center gap-1">
        {unplacedCount > 0 && (
          <div className="flex items-center gap-1" title={`${unplacedCount} pieces remaining to place`}>
            {Array.from({ length: Math.min(unplacedCount, 9) }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full",
                  isWhite ? "bg-slate-200 border border-slate-400" : "bg-slate-800 border border-slate-600"
                )}
              />
            ))}
            {unplacedCount > 9 && <span className="text-[10px] text-slate-400 font-mono">+{unplacedCount - 9}</span>}
          </div>
        )}

        {capturedCount > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span className="font-bold text-rose-400">+{capturedCount}</span>
            <span>captured</span>
          </div>
        )}
      </div>

      {/* Right: Clock Timer (if timed) */}
      {timeRemainingSeconds !== undefined && (
        <div
          className={cn(
            "flex items-center gap-1.5 font-mono px-3 py-1.5 rounded-xl border font-bold text-sm min-w-[80px] justify-center transition-all",
            isTurn
              ? isLowTime
                ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse"
                : "bg-background-card text-white border-primary/40 shadow-sm"
              : "bg-background/50 text-slate-400 border-background-border"
          )}
        >
          <Clock className="h-3.5 w-3.5 opacity-70" />
          <span>{formatClock(timeRemainingSeconds)}</span>
        </div>
      )}
    </div>
  );
}
