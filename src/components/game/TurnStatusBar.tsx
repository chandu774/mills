import { GameState } from '@/game/engine/types';
import { Target, Zap, Shield, Swords, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TurnStatusBarProps {
  state: GameState;
  selectedPoint: number | null;
  className?: string;
}

export function TurnStatusBar({ state, selectedPoint, className }: TurnStatusBarProps) {
  const { currentPlayer, status, phase, piecesPlaced, variant } = state;
  const isWhite = currentPlayer === 'WHITE';

  const getInstruction = () => {
    if (status === 'CAPTURE_PENDING') {
      return {
        icon: Target,
        title: 'Mill Formed!',
        subtitle: 'Select an opponent piece to capture and remove from the board.',
        theme: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
        iconColor: 'text-rose-400',
      };
    }

    if (status === 'FINISHED') {
      return {
        icon: Sparkles,
        title: 'Game Over',
        subtitle: state.winReason || 'Match has concluded.',
        theme: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        iconColor: 'text-emerald-400',
      };
    }

    if (status === 'DRAW') {
      return {
        icon: Shield,
        title: 'Game Drawn',
        subtitle: state.winReason || 'Draw agreed.',
        theme: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        iconColor: 'text-amber-400',
      };
    }

    if (phase === 'PLACING') {
      const maxPieces = variant === 'MILLS_3' ? 3 : variant === 'MILLS_6' ? 6 : 9;
      const placed = piecesPlaced[currentPlayer];
      const remaining = maxPieces - placed;
      return {
        icon: Zap,
        title: `${currentPlayer}'s turn — Place a piece`,
        subtitle: `Click any empty intersection point (${remaining} piece${remaining !== 1 ? 's' : ''} left).`,
        theme: 'bg-background-elevated border-background-border text-slate-200',
        iconColor: isWhite ? 'text-slate-100' : 'text-slate-400',
      };
    }

    if (phase === 'FLYING' || status === 'FLYING') {
      if (selectedPoint !== null) {
        return {
          icon: Swords,
          title: `${currentPlayer} Flying — Choose landing point`,
          subtitle: 'Click any unoccupied point on the board to jump.',
          theme: 'bg-primary-subtle border-primary/30 text-primary',
          iconColor: 'text-primary',
        };
      }
      return {
        icon: Swords,
        title: `${currentPlayer}'s turn — Flying Phase Active`,
        subtitle: 'Select one of your 3 pieces to jump to any open point.',
        theme: 'bg-primary-subtle border-primary/30 text-primary',
        iconColor: 'text-primary',
      };
    }

    // Standard Moving Phase
    if (selectedPoint !== null) {
      return {
        icon: Swords,
        title: `${currentPlayer} — Choose destination`,
        subtitle: 'Click an adjacent open point along a connected line.',
        theme: 'bg-primary-subtle border-primary/30 text-primary',
        iconColor: 'text-primary',
      };
    }

    return {
      icon: Swords,
      title: `${currentPlayer}'s turn — Move`,
      subtitle: 'Select one of your pieces to slide to an adjacent point.',
      theme: 'bg-background-elevated border-background-border text-slate-200',
      iconColor: isWhite ? 'text-slate-100' : 'text-slate-400',
    };
  };

  const instruction = getInstruction();
  const Icon = instruction.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left shadow-sm select-none",
        instruction.theme,
        className
      )}
    >
      <div className={cn("p-2 rounded-xl bg-background-card border border-background-border shrink-0", instruction.iconColor)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-bold truncate text-white">{instruction.title}</h4>
        <p className="text-xs text-slate-400 truncate mt-0.5">{instruction.subtitle}</p>
      </div>
    </div>
  );
}
