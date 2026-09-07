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
    <div className={cn("flex flex-col h-full rounded-2xl bg-background-card border border-background-border overflow-hidden", className)}>
      <div className="p-3 border-b border-background-border flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Move Log</h4>
        <span className="text-[11px] font-mono text-slate-500">{history.length} moves</span>
      </div>

      {/* Move list table */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs font-mono">
        {turns.length === 0 ? (
          <p className="text-slate-500 text-center py-6 text-[11px] font-sans">No moves played yet.</p>
        ) : (
          turns.map((turn) => (
            <div key={turn.turnNumber} className="flex items-center rounded-lg hover:bg-background-elevated/40 px-2 py-1">
              <span className="w-8 text-slate-500 text-[11px] shrink-0">{turn.turnNumber}.</span>
              
              {/* White move */}
              <button
                onClick={() => onSelectMove(turn.white.globalIndex)}
                className={cn(
                  "flex-1 text-left px-2 py-0.5 rounded transition-colors",
                  activeIndex === turn.white.globalIndex
                    ? "bg-primary/20 text-primary font-bold"
                    : "text-slate-200 hover:text-white"
                )}
              >
                {turn.white.notation}
              </button>

              {/* Black move */}
              {turn.black ? (
                <button
                  onClick={() => onSelectMove(turn.black!.globalIndex)}
                  className={cn(
                    "flex-1 text-left px-2 py-0.5 rounded transition-colors",
                    activeIndex === turn.black.globalIndex
                      ? "bg-primary/20 text-primary font-bold"
                      : "text-slate-300 hover:text-white"
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
      <div className="p-2 border-t border-background-border bg-background-subtle flex items-center justify-center gap-2">
        <button
          onClick={() => onSelectMove(0)}
          disabled={history.length === 0 || activeIndex <= 0}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-background-elevated disabled:opacity-30"
          title="First Move"
        >
          <ChevronFirst className="h-4 w-4" />
        </button>
        <button
          onClick={() => onSelectMove(Math.max(0, activeIndex - 1))}
          disabled={history.length === 0 || activeIndex <= 0}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-background-elevated disabled:opacity-30"
          title="Previous Move"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onSelectMove(Math.min(history.length - 1, activeIndex + 1))}
          disabled={history.length === 0 || activeIndex >= history.length - 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-background-elevated disabled:opacity-30"
          title="Next Move"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onSelectMove(history.length - 1)}
          disabled={history.length === 0 || activeIndex >= history.length - 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-background-elevated disabled:opacity-30"
          title="Last Move"
        >
          <ChevronLast className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
