import { MoveHistoryEntry } from '@/game/engine/types';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MoveHistoryViewProps {
  history: MoveHistoryEntry[];
  currentReplayIndex: number | null;
  onSelectMove: (index: number) => void;
  className?: string;
}

export function MoveHistoryView({
  history,
  currentReplayIndex,
  onSelectMove,
  className,
}: MoveHistoryViewProps) {
  // Group moves into turns (Turn 1: White move, Black move)
  const turns = [];
  for (let i = 0; i < history.length; i += 2) {
    turns.push({
      turnNumber: Math.floor(i / 2) + 1,
      white: { ...history[i], globalIndex: i },
      black: history[i + 1] ? { ...history[i + 1], globalIndex: i + 1 } : null,
    });
  }

  const activeIndex = currentReplayIndex !== null ? currentReplayIndex : history.length - 1;

  return (
    <div className={cn("flex flex-col h-full rounded-2xl bg-white border border-background-border shadow-soft overflow-hidden text-ink", className)}>
      <div className="px-3.5 py-2.5 border-b border-background-border flex items-center justify-between bg-background-subtle/50">
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Move Log</h4>
        <span className="text-[11px] font-mono text-ink-subtle">{history.length} moves</span>
      </div>

      {/* Move list table */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs font-mono">
        {turns.length === 0 ? (
          <p className="text-ink-subtle text-center py-6 text-[11px] font-sans">No moves played yet.</p>
        ) : (
          turns.map((turn) => (
            <div key={turn.turnNumber} className="flex items-center rounded-lg hover:bg-background-elevated/60 px-2 py-1">
              <span className="w-8 text-ink-subtle text-[11px] shrink-0 font-sans">{turn.turnNumber}.</span>
              
              {/* White move */}
              <button
                onClick={() => onSelectMove(turn.white.globalIndex)}
                className={cn(
                  "flex-1 text-left px-2 py-0.5 rounded transition-colors cursor-pointer",
                  activeIndex === turn.white.globalIndex
                    ? "bg-primary/15 text-primary font-bold"
                    : "text-ink hover:text-primary"
                )}
              >
                {turn.white.notation}
              </button>

              {/* Black move */}
              {turn.black ? (
                <button
                  onClick={() => onSelectMove(turn.black!.globalIndex)}
                  className={cn(
                    "flex-1 text-left px-2 py-0.5 rounded transition-colors cursor-pointer",
                    activeIndex === turn.black.globalIndex
                      ? "bg-primary/15 text-primary font-bold"
                      : "text-ink-muted hover:text-ink"
                  )}
                >
                  {turn.black.notation}
                </button>
              ) : (
                <span className="flex-1" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Step navigation controls */}
      <div className="p-2 border-t border-background-border bg-background-subtle/70 flex items-center justify-center gap-1 sm:gap-2">
        <button
          onClick={() => onSelectMove(0)}
          disabled={history.length === 0 || activeIndex <= 0}
          className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-white disabled:opacity-30 cursor-pointer"
          title="First Move"
        >
          <ChevronFirst className="h-4 w-4" />
        </button>
        <button
          onClick={() => onSelectMove(Math.max(0, activeIndex - 1))}
          disabled={history.length === 0 || activeIndex <= 0}
          className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-white disabled:opacity-30 cursor-pointer"
          title="Previous Move"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onSelectMove(Math.min(history.length - 1, activeIndex + 1))}
          disabled={history.length === 0 || activeIndex >= history.length - 1}
          className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-white disabled:opacity-30 cursor-pointer"
          title="Next Move"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onSelectMove(history.length - 1)}
          disabled={history.length === 0 || activeIndex >= history.length - 1}
          className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-white disabled:opacity-30 cursor-pointer"
          title="Last Move"
        >
          <ChevronLast className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
