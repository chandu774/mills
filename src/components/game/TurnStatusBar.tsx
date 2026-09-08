import { GameState } from '@/game/engine/types';
import { Target, Zap, Shield, Swords, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TurnStatusBarProps {
  state: GameState;
  selectedPoint: number | null;
  className?: string;
  isTurnEnforced?: boolean;
}

export function TurnStatusBar({ state, selectedPoint, className, isTurnEnforced }: TurnStatusBarProps) {
  const { currentPlayer, status, phase, piecesPlaced, variant } = state;

  const getInstruction = () => {
    if (isTurnEnforced && !['FINISHED', 'DRAW', 'RESIGNED', 'TIMEOUT', 'ABANDONED'].includes(status)) {
      return {
        icon: Swords,
        title: "Opponent's Turn",
        subtitle: `Waiting for ${currentPlayer.toLowerCase()} to play...`,
        theme: 'bg-white border-background-border text-ink-muted',
        iconColor: 'text-ink-subtle bg-background-elevated',
      };
    }

    if (status === 'CAPTURE_PENDING') {
      return {
        icon: Target,
        title: 'Mill Formed! Capture a Piece',
        subtitle: 'Click any opponent piece to remove it from the board.',
        theme: 'bg-red-50/80 border-alert-danger/30 text-alert-danger',
        iconColor: 'text-alert-danger bg-red-100',
      };
    }

    if (status === 'FINISHED') {
      return {
        icon: Sparkles,
        title: 'Game Concluded',
        subtitle: state.winReason || 'Match has finished.',
        theme: 'bg-[#F2F7F4] border-primary/30 text-primary',
        iconColor: 'text-primary bg-primary/15',
      };
    }

    if (status === 'DRAW') {
      return {
        icon: Shield,
        title: 'Match Drawn',
        subtitle: state.winReason || 'Draw agreed.',
        theme: 'bg-gold-light border-gold/30 text-gold',
        iconColor: 'text-gold bg-gold/15',
      };
    }

    if (phase === 'PLACING') {
      const maxPieces = variant === 'MILLS_3' ? 3 : variant === 'MILLS_6' ? 6 : 9;
      const placed = piecesPlaced[currentPlayer];
      const remaining = maxPieces - placed;
      return {
        icon: Zap,
        title: `${currentPlayer}'s turn — Place a piece`,
        subtitle: `Tap any open intersection point (${remaining} piece${remaining !== 1 ? 's' : ''} left).`,
        theme: 'bg-[#F3F8F4] border-primary/30 text-ink',
        iconColor: 'text-primary bg-primary/15',
      };
    }

    if (phase === 'FLYING' || status === 'FLYING') {
      if (selectedPoint !== null) {
        return {
          icon: Swords,
          title: `${currentPlayer} Flying — Choose landing point`,
          subtitle: 'Tap any unoccupied point on the board to fly.',
          theme: 'bg-gold-light border-gold/30 text-ink',
          iconColor: 'text-gold bg-gold/15',
        };
      }
      return {
        icon: Swords,
        title: `${currentPlayer}'s turn — Flying Phase Active`,
        subtitle: 'Select one of your 3 pieces to jump anywhere.',
        theme: 'bg-gold-light border-gold/30 text-ink',
        iconColor: 'text-gold bg-gold/15',
      };
    }

    // Standard Moving Phase
    if (selectedPoint !== null) {
      return {
        icon: Swords,
        title: `${currentPlayer} — Choose destination`,
        subtitle: 'Tap an adjacent open point along a connected line.',
        theme: 'bg-[#F3F8F4] border-primary/30 text-ink',
        iconColor: 'text-primary bg-primary/15',
      };
    }

    return {
      icon: Swords,
      title: `${currentPlayer}'s turn — Move a piece`,
      subtitle: 'Select one of your pieces to slide to an adjacent point.',
      theme: 'bg-white border-background-border text-ink',
      iconColor: 'text-primary bg-primary/10',
    };
  };

  const instruction = getInstruction();
  const Icon = instruction.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border transition-all text-left shadow-soft select-none",
        instruction.theme,
        className
      )}
    >
      <div className={cn("p-1.5 sm:p-2 rounded-xl shrink-0", instruction.iconColor)}>
        <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-xs sm:text-sm font-bold truncate text-ink">{instruction.title}</h4>
        <p className="text-[11px] sm:text-xs text-ink-muted truncate mt-0.5">{instruction.subtitle}</p>
      </div>
    </div>
  );
}
