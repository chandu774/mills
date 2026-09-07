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
  ratingChange?: number;
}

export function GameOverModal({
  isOpen,
  onClose,
  winner,
  winReason,
  onRematch,
  onNewGame,
  onReturnHome,
  ratingChange = 18,
}: GameOverModalProps) {
  const isDraw = winner === null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md text-center">
      <div className="flex flex-col items-center py-4 space-y-4">
        {/* Trophy / Icon Banner */}
        <div
          className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl ${
            isDraw
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          {isDraw ? <ShieldAlert className="h-8 w-8" /> : <Trophy className="h-8 w-8 fill-current" />}
        </div>

        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {isDraw ? 'Game Drawn' : `${winner} Won!`}
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xs mx-auto">
            {winReason || (isDraw ? 'The match ended in a draw.' : 'Decisive victory.')}
          </p>
        </div>

        {/* Rating Adjustment Chip */}
        {!isDraw && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-background-elevated border border-background-border font-mono text-sm">
            <span className="text-slate-400 font-sans text-xs">Rating Change:</span>
            <span className="text-emerald-400 font-bold">+{ratingChange}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-2 pt-4 border-t border-background-border">
          <Button
            variant="primary"
            size="lg"
            onClick={onRematch}
            className="w-full gap-2 text-base font-extrabold shadow-emerald-500/25"
          >
            <RotateCcw className="h-4 w-4" />
            REMATCH
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={onNewGame}
            className="w-full gap-2 text-sm font-semibold"
          >
            <PlusCircle className="h-4 w-4" />
            NEW GAME
          </Button>

          <Button
            variant="ghost"
            size="md"
            onClick={onReturnHome}
            className="w-full gap-2 text-sm text-slate-400 hover:text-white"
          >
            <Home className="h-4 w-4" />
            RETURN HOME
          </Button>
        </div>
      </div>
    </Modal>
  );
}
