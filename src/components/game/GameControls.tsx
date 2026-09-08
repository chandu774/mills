import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Flag, Handshake, ArrowUpDown, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { PlayerColor } from '@/game/engine/types';

export interface GameControlsProps {
  onResign: (player: PlayerColor) => void;
  onOfferDraw: () => void;
  onFlipBoard: () => void;
  onRestartGame?: () => void;
  isGameOver?: boolean;
  currentPlayer: PlayerColor;
  className?: string;
  isMultiplayer?: boolean;
  myColor?: PlayerColor;
}

export function GameControls({
  onResign,
  onOfferDraw,
  onFlipBoard,
  onRestartGame,
  isGameOver = false,
  currentPlayer,
  className,
  isMultiplayer,
  myColor,
}: GameControlsProps) {
  const [showResignModal, setShowResignModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-white/95 border border-background-border shadow-soft">
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Flip Perspective */}
          <button
            onClick={onFlipBoard}
            aria-label="Flip board perspective"
            title="Flip Board"
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl text-ink-muted hover:text-ink hover:bg-background-elevated active:scale-95 transition-all cursor-pointer"
          >
            <ArrowUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            title={isMuted ? "Unmute" : "Mute"}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl text-ink-muted hover:text-ink hover:bg-background-elevated active:scale-95 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isGameOver && onRestartGame ? (
            <Button
              size="sm"
              variant="primary"
              onClick={onRestartGame}
              className="text-xs gap-1.5 h-8 sm:h-8.5 font-bold px-3"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Rematch
            </Button>
          ) : (
            <>
              {/* Offer Draw */}
              <Button
                size="sm"
                variant="outline"
                onClick={onOfferDraw}
                disabled={isGameOver}
                className="text-xs gap-1 sm:gap-1.5 h-8 sm:h-8.5 px-2 sm:px-2.5 font-medium border-background-border text-ink hover:bg-background-subtle"
              >
                <Handshake className="h-3.5 w-3.5 text-ink-muted" />
                <span>Draw</span>
              </Button>

              {/* Resign Button */}
              <Button
                size="sm"
                variant="danger"
                onClick={() => setShowResignModal(true)}
                disabled={isGameOver}
                className="text-xs gap-1 sm:gap-1.5 h-8 sm:h-8.5 px-2 sm:px-2.5 font-semibold"
              >
                <Flag className="h-3.5 w-3.5" />
                <span>Resign</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal to prevent accidental forfeits */}
      <Modal
        isOpen={showResignModal}
        onClose={() => setShowResignModal(false)}
        title="Confirm Resignation"
        description="Are you sure you want to resign this match? The opponent will be awarded victory."
      >
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="secondary" size="md" onClick={() => setShowResignModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={() => {
              setShowResignModal(false);
              const resigningPlayer = (isMultiplayer && myColor) ? myColor : currentPlayer;
              onResign(resigningPlayer);
            }}
          >
            Confirm Resign
          </Button>
        </div>
      </Modal>
    </div>
  );
}
