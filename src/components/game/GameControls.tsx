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
}

export function GameControls({
  onResign,
  onOfferDraw,
  onFlipBoard,
  onRestartGame,
  isGameOver = false,
  currentPlayer,
  className,
}: GameControlsProps) {
  const [showResignModal, setShowResignModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-background-card border border-background-border">
        <div className="flex items-center gap-1.5">
          {/* Flip Perspective */}
          <button
            onClick={onFlipBoard}
            aria-label="Flip board perspective"
            title="Flip Board"
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-background-elevated transition-colors"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            title={isMuted ? "Unmute" : "Mute"}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-background-elevated transition-colors"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isGameOver && onRestartGame ? (
            <Button
              size="sm"
              variant="primary"
              onClick={onRestartGame}
              className="text-xs gap-1.5 h-9 font-bold"
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
                className="text-xs gap-1.5 h-9"
              >
                <Handshake className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Draw</span>
              </Button>

              {/* Resign Button */}
              <Button
                size="sm"
                variant="danger"
                onClick={() => setShowResignModal(true)}
                disabled={isGameOver}
                className="text-xs gap-1.5 h-9 font-bold"
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
        description={`Are you sure ${currentPlayer} wants to resign this match? The opponent will be awarded victory.`}
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
              onResign(currentPlayer);
            }}
          >
            Confirm Resign
          </Button>
        </div>
      </Modal>
    </div>
  );
}
