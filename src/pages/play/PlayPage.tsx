import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GameVariant, GameMode, TimeControl } from '@/lib/types';
import { BotDifficulty } from '@/game/ai/botEngine';
import { VariantCard } from '@/components/common/VariantCard';
import { Button } from '@/components/ui/Button';
import { Play, Swords, Bot, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MatchmakingModal } from '@/components/game/MatchmakingModal';

export function PlayPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryVariant = searchParams.get('variant') as GameVariant;
  const [selectedVariant, setSelectedVariant] = useState<GameVariant>(
    queryVariant && ['MILLS_3', 'MILLS_6', 'MILLS_9'].includes(queryVariant) ? queryVariant : 'MILLS_9'
  );

  const queryMode = searchParams.get('mode') as GameMode;
  const [selectedMode, setSelectedMode] = useState<GameMode>(
    queryMode && ['RANKED', 'BOT', 'FRIEND'].includes(queryMode)
      ? queryMode
      : queryMode === 'CASUAL'
        ? 'BOT'
        : 'RANKED'
  );

  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty>('MEDIUM');
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>('5_MIN');
  const [showMatchmakingModal, setShowMatchmakingModal] = useState(false);

  const handleStartGame = () => {
    if (selectedMode === 'RANKED') {
      setShowMatchmakingModal(true);
      return;
    }

    if (selectedMode === 'BOT') {
      navigate(
        `/game?mode=BOT&variant=${selectedVariant}&time=${selectedTimeControl}&difficulty=${selectedDifficulty}`
      );
      return;
    }

    if (selectedMode === 'FRIEND') {
      navigate('/friends');
    }
  };

  const modes: { id: GameMode; label: string; icon: any; desc: string }[] = [
    { id: 'RANKED', label: 'Ranked', icon: Swords, desc: 'Climb leaderboards & earn ELO' },
    { id: 'BOT', label: 'Play with Bot', icon: Bot, desc: 'Practice against AI' },
    { id: 'FRIEND', label: 'Challenge a Friend', icon: Users, desc: 'Direct match with friends' },
  ];

  const difficulties: { id: BotDifficulty; label: string; elo: string; color: string }[] = [
    { id: 'EASY', label: 'Easy', elo: '800 ELO', color: 'border-emerald-500/40 text-emerald-800' },
    { id: 'MEDIUM', label: 'Medium', elo: '1200 ELO', color: 'border-amber-500/40 text-amber-800' },
    { id: 'HARD', label: 'Hard', elo: '1600 ELO', color: 'border-orange-500/40 text-orange-800' },
    { id: 'EXPERT', label: 'Expert', elo: '2000 ELO', color: 'border-red-500/40 text-red-800' },
  ];

  const timeControls: { id: TimeControl; label: string; sub: string }[] = [
    { id: '3_MIN', label: '3 min', sub: 'Blitz' },
    { id: '5_MIN', label: '5 min', sub: 'Rapid' },
    { id: '10_MIN', label: '10 min', sub: 'Classic' },
    { id: 'UNTIMED', label: 'Untimed', sub: 'Practice' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200 max-w-2xl mx-auto pb-8">
      {/* Game Lobby Header */}
      <div className="pt-1">
        <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#C4973B]">
          GAME LOBBY
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
          Play Mills
        </h1>
      </div>

      {/* 1. SELECT VARIANT */}
      <section className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
          Select Variant
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <VariantCard
            variant="MILLS_3"
            isSelected={selectedVariant === 'MILLS_3'}
            onSelect={setSelectedVariant}
          />
          <VariantCard
            variant="MILLS_6"
            isSelected={selectedVariant === 'MILLS_6'}
            onSelect={setSelectedVariant}
          />
          <VariantCard
            variant="MILLS_9"
            isSelected={selectedVariant === 'MILLS_9'}
            onSelect={setSelectedVariant}
          />
        </div>
      </section>

      {/* 2. GAME MODE */}
      <section className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
          Select Game Mode
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = selectedMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMode(m.id)}
                className={cn(
                  "flex sm:flex-col items-center sm:items-start gap-3 p-3.5 rounded-2xl border text-left cursor-pointer select-none transition-all active:scale-[0.98]",
                  isSelected
                    ? "border-primary bg-primary/[0.06] ring-2 ring-primary/60 shadow-soft"
                    : "border-background-border bg-white hover:border-ink/20 shadow-2xs"
                )}
              >
                <div
                  className={cn(
                    "p-2.5 rounded-xl shrink-0 transition-colors",
                    isSelected ? "bg-primary text-white" : "bg-background-elevated text-ink-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3
                    className={cn(
                      "text-sm font-bold truncate",
                      isSelected ? "text-primary" : "text-ink"
                    )}
                  >
                    {m.label}
                  </h3>
                  <p className="text-[11px] text-ink-muted truncate mt-0.5">{m.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. BOT DIFFICULTY (Displayed when Play with Bot is selected) */}
      {selectedMode === 'BOT' && (
        <section className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
            Bot Difficulty
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {difficulties.map((d) => {
              const isSelected = selectedDifficulty === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDifficulty(d.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border text-center cursor-pointer select-none transition-all active:scale-[0.98]",
                    isSelected
                      ? "border-primary bg-primary/[0.08] ring-2 ring-primary/60 shadow-soft"
                      : "border-background-border bg-white hover:border-ink/20 shadow-2xs"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-bold",
                      isSelected ? "text-primary" : "text-ink"
                    )}
                  >
                    {d.label}
                  </span>
                  <span className="text-[10px] font-mono text-ink-muted mt-0.5">{d.elo}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. TIME CONTROL */}
      <section className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
          Time Control
        </span>
        <div className="grid grid-cols-4 gap-2">
          {timeControls.map((tc) => {
            const isSelected = selectedTimeControl === tc.id;
            return (
              <button
                key={tc.id}
                type="button"
                onClick={() => setSelectedTimeControl(tc.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border text-center cursor-pointer select-none transition-all active:scale-[0.97]",
                  isSelected
                    ? "border-primary bg-primary/[0.06] ring-2 ring-primary/60 shadow-soft"
                    : "border-background-border bg-white hover:border-ink/20 shadow-2xs"
                )}
              >
                <span
                  className={cn(
                    "text-xs sm:text-sm font-black font-mono",
                    isSelected ? "text-primary" : "text-ink"
                  )}
                >
                  {tc.label}
                </span>
                <span className="text-[10px] text-ink-muted mt-0.5">{tc.sub}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. PLAY NOW CTA */}
      <div className="pt-2">
        <Button
          size="lg"
          variant="primary"
          onClick={handleStartGame}
          className="w-full gap-3 text-base sm:text-lg font-black py-4 shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-transform rounded-2xl bg-primary hover:bg-primary-hover border border-white/20"
        >
          <Play className="h-6 w-6 fill-current" />
          {selectedMode === 'RANKED'
            ? 'FIND RANKED MATCH'
            : selectedMode === 'BOT'
              ? `PLAY WITH BOT (${difficulties.find((d) => d.id === selectedDifficulty)?.label.toUpperCase()})`
              : 'CHALLENGE A FRIEND'}
        </Button>
      </div>

      {/* Ranked Online Matchmaking Modal */}
      <MatchmakingModal
        isOpen={showMatchmakingModal}
        onClose={() => setShowMatchmakingModal(false)}
        variant={selectedVariant}
        mode="RANKED"
        timeControl={selectedTimeControl}
      />
    </div>
  );
}
