import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Trophy, RotateCcw, Home, PlusCircle, ShieldAlert } from 'lucide-react';
import { PlayerColor } from '@/game/engine/types';

export interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  winner: PlayerColor | null;
  winReason: string | null;
  onRematch: () => void;
  onNewGame: () => void;
  onReturnHome: () => void;
  ratingBefore?: number;
  ratingChange?: number;
  isRated?: boolean;
  userColor?: PlayerColor;
}

export function GameOverModal({
  isOpen,
  onClose,
  winner,
  winReason,
  onRematch,
  onNewGame,
  onReturnHome,
  ratingBefore,
  ratingChange,
  isRated = false,
  userColor,
}: GameOverModalProps) {
  const isDraw = winner === null;
  const isUserWinner = userColor && winner === userColor;
  const isUserLoser = userColor && winner !== null && winner !== userColor;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md text-center p-5 sm:p-6">
      <div className="flex flex-col items-center py-2 space-y-4">
        {/* Trophy / Emblem */}
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-medium transition-transform transform scale-100 animate-in zoom-in-95 duration-300 ${
            isDraw
              ? 'bg-gold/15 text-gold border border-gold/30'
              : isUserWinner
                ? 'bg-amber-100 text-amber-600 border-2 border-amber-300 shadow-gold/30'
                : isUserLoser
                  ? 'bg-ink/10 text-ink-muted border border-ink/20'
                  : 'bg-primary/15 text-primary border-2 border-primary/30'
          }`}
        >
          {isDraw ? (
            <ShieldAlert className="h-10 w-10" />
          ) : (
            <Trophy className="h-10 w-10 fill-current animate-bounce duration-1000" />
          )}
        </div>

        {/* Victory / Defeat Typography */}
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-ink-subtle">
            Match Concluded
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-0.5">
            {isUserWinner
              ? 'YOU WON'
              : isUserLoser
                ? 'YOU LOST'
                : isDraw
                  ? 'DRAW'
                  : `${winner} Won!`}
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted mt-1.5 max-w-xs mx-auto leading-relaxed">
            {winReason || (isDraw ? 'The match ended in a draw.' : 'Decisive strategic victory.')}
          </p>
        </div>

        {/* Real Rating Adjustment Chip (Ranked Only) */}
        {isRated && ratingChange !== undefined && (
          <div
            className={`flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl border font-mono shadow-2xs ${
              ratingChange > 0
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : ratingChange < 0
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-background-elevated text-ink-muted border-background-border'
            }`}
          >
            <span className="text-base font-black">
              {ratingChange > 0 ? `+${ratingChange}` : ratingChange} Rating
            </span>
            {ratingBefore !== undefined && (
              <span className="text-xs font-semibold opacity-85">
                {ratingBefore} → {ratingBefore + ratingChange}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-2.5 pt-3 border-t border-background-border">
          <Button
            variant="primary"
            size="lg"
            onClick={onRematch}
            className="w-full gap-2 text-sm sm:text-base font-black tracking-wide shadow-soft active:scale-98"
          >
            <RotateCcw className="h-4 w-4" />
            REMATCH
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={onNewGame}
            className="w-full gap-2 text-xs sm:text-sm font-bold text-ink hover:bg-background-elevated active:scale-98"
          >
            <PlusCircle className="h-4 w-4 text-primary" />
            PLAY AGAIN
          </Button>

          <Button
            variant="ghost"
            size="md"
            onClick={onReturnHome}
            className="w-full gap-2 text-xs sm:text-sm text-ink-muted hover:text-ink"
          >
            <Home className="h-4 w-4" />
            RETURN TO LOBBY
          </Button>
        </div>
      </div>
    </Modal>
  );
}
