import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Swords } from 'lucide-react';
import { VariantCard } from '@/components/common/VariantCard';
import { MatchmakingModal } from '@/components/game/MatchmakingModal';
import { GameVariant } from '@/lib/types';

export function RankedConfigPage() {
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState<GameVariant>('MILLS_9');
  const [showMatchmakingModal, setShowMatchmakingModal] = useState(false);

  const handleSelectVariant = (variant: GameVariant) => {
    setSelectedVariant(variant);
    setShowMatchmakingModal(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl mx-auto pb-10">
      {/* Top Bar with Return to Home */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl border border-background-border bg-white text-ink-muted hover:text-ink hover:border-ink/20 transition-all cursor-pointer shadow-2xs"
          aria-label="Back to Home"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#C4973B]">
            COMPETITIVE • 30S PER MOVE
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight flex items-center gap-2">
            <Swords className="h-6 w-6 text-primary" />
            RANKED
          </h1>
        </div>
      </div>

      {/* 1. SELECT VARIANT (Clicking any variant starts Ranked matchmaking immediately) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Select Variant
          </span>
          <span className="text-[11px] font-mono font-bold text-[#C4973B]">
            30s / move
          </span>
        </div>
        <p className="text-xs text-ink-muted px-1">
          Click any board to enter the matchmaking queue immediately. Every turn has a 30-second move timer.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
          <VariantCard
            variant="MILLS_3"
            isSelected={selectedVariant === 'MILLS_3'}
            onSelect={handleSelectVariant}
          />
          <VariantCard
            variant="MILLS_6"
            isSelected={selectedVariant === 'MILLS_6'}
            onSelect={handleSelectVariant}
          />
          <VariantCard
            variant="MILLS_9"
            isSelected={selectedVariant === 'MILLS_9'}
            onSelect={handleSelectVariant}
          />
        </div>
      </section>

      {/* Matchmaking Queue Dialog */}
      <MatchmakingModal
        isOpen={showMatchmakingModal}
        onClose={() => setShowMatchmakingModal(false)}
        variant={selectedVariant}
        mode="RANKED"
        timeControl="5_MIN"
      />
    </div>
  );
}
