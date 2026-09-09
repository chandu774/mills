import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Bot } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VariantCard } from '@/components/common/VariantCard';
import { GameVariant, TimeControl } from '@/lib/types';
import { BotDifficulty } from '@/game/ai/botEngine';
import { cn } from '@/lib/utils';

export function BotsConfigPage() {
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState<GameVariant>('MILLS_9');
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty>('MEDIUM');
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>('5_MIN');

  const botDifficulties: { id: BotDifficulty; label: string; elo: string; badge: string }[] = [
    { id: 'EASY', label: 'Easy', elo: '800 ELO', badge: 'Casual' },
    { id: 'MEDIUM', label: 'Medium', elo: '1200 ELO', badge: 'Balanced' },
    { id: 'HARD', label: 'Hard', elo: '1600 ELO', badge: 'Challenging' },
    { id: 'EXPERT', label: 'Expert', elo: '2000 ELO', badge: 'Master' },
  ];

  const timeControls: { id: TimeControl; label: string; sub: string }[] = [
    { id: '3_MIN', label: '3 min', sub: 'Blitz' },
    { id: '5_MIN', label: '5 min', sub: 'Rapid' },
    { id: '10_MIN', label: '10 min', sub: 'Classic' },
    { id: 'UNTIMED', label: 'Untimed', sub: 'Standard' },
  ];

  const handleStartGame = () => {
    navigate(
      `/game?mode=BOT&variant=${selectedVariant}&time=${selectedTimeControl}&difficulty=${selectedDifficulty}`
    );
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
            SINGLE PLAYER
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            PLAY BOTS
          </h1>
        </div>
      </div>

      {/* 1. SELECT VARIANT */}
      <section className="space-y-2.5">
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

      {/* 2. BOT DIFFICULTY */}
      <section className="space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
          Bot Difficulty
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {botDifficulties.map((diff) => (
            <button
              key={diff.id}
              type="button"
              onClick={() => setSelectedDifficulty(diff.id)}
              className={cn(
                "p-3 rounded-2xl border text-center transition-all cursor-pointer select-none",
                selectedDifficulty === diff.id
                  ? "border-primary bg-primary/[0.08] ring-2 ring-primary/70 shadow-soft"
                  : "border-background-border bg-white hover:border-ink/20 shadow-2xs"
              )}
            >
              <div
                className={cn(
                  "text-sm font-bold",
                  selectedDifficulty === diff.id ? "text-primary" : "text-ink"
                )}
              >
                {diff.label}
              </div>
              <div className="text-[11px] text-ink-muted mt-0.5">{diff.elo}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. TIME CONTROL */}
      <section className="space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
          Time Control
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {timeControls.map((tc) => (
            <button
              key={tc.id}
              type="button"
              onClick={() => setSelectedTimeControl(tc.id)}
              className={cn(
                "p-3 rounded-2xl border text-center transition-all cursor-pointer select-none",
                selectedTimeControl === tc.id
                  ? "border-primary bg-primary/[0.08] ring-2 ring-primary/70 shadow-soft"
                  : "border-background-border bg-white hover:border-ink/20 shadow-2xs"
              )}
            >
              <div
                className={cn(
                  "text-sm font-bold",
                  selectedTimeControl === tc.id ? "text-primary" : "text-ink"
                )}
              >
                {tc.label}
              </div>
              <div className="text-[11px] text-ink-muted mt-0.5">{tc.sub}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 4. PLAY NOW CTA */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          onClick={handleStartGame}
          className="w-full py-4 text-base font-bold shadow-soft flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="h-5 w-5 fill-current" />
          PLAY NOW
        </Button>
      </div>
    </div>
  );
}
