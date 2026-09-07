import { GameVariant } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Shield, Zap, Crown } from 'lucide-react';

export interface VariantCardProps {
  variant: GameVariant;
  isSelected?: boolean;
  onSelect?: (variant: GameVariant) => void;
  className?: string;
}

export function VariantCard({ variant, isSelected, onSelect, className }: VariantCardProps) {
  const config = {
    MILLS_3: {
      title: '3-Piece Mills',
      subtitle: 'Fast & Tactical',
      pieces: 3,
      points: 9,
      icon: Zap,
      accentColor: 'text-emerald-400',
      description: 'Quick placement on a 3x3 grid. First to form a 3-in-a-row mill wins immediately.',
      boardSvg: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 stroke-slate-500 fill-none stroke-[3]">
          <rect x="15" y="15" width="70" height="70" />
          <line x1="50" y1="15" x2="50" y2="85" />
          <line x1="15" y1="50" x2="85" y2="50" />
          <line x1="15" y1="15" x2="85" y2="85" strokeDasharray="3 3" />
          <line x1="85" y1="15" x2="15" y2="85" strokeDasharray="3 3" />
          {/* Points */}
          <circle cx="15" cy="15" r="4" className="fill-slate-300 stroke-none" />
          <circle cx="50" cy="15" r="4" className="fill-slate-300 stroke-none" />
          <circle cx="85" cy="15" r="4" className="fill-slate-300 stroke-none" />
          <circle cx="15" cy="50" r="4" className="fill-slate-300 stroke-none" />
          <circle cx="50" cy="50" r="4" className="fill-slate-300 stroke-none" />
          <circle cx="85" cy="50" r="4" className="fill-slate-300 stroke-none" />
          <circle cx="15" cy="85" r="4" className="fill-slate-300 stroke-none" />
          <circle cx="50" cy="85" r="4" className="fill-slate-300 stroke-none" />
          <circle cx="85" cy="85" r="4" className="fill-slate-300 stroke-none" />
        </svg>
      )
    },
    MILLS_6: {
      title: '6-Piece Mills',
      subtitle: 'Strategic & Balanced',
      pieces: 6,
      points: 16,
      icon: Shield,
      accentColor: 'text-sky-400',
      description: 'Two concentric squares with 16 points. Rich tactical maneuvering and positioning.',
      boardSvg: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 stroke-slate-500 fill-none stroke-[3]">
          <rect x="15" y="15" width="70" height="70" />
          <rect x="32" y="32" width="36" height="36" />
          <line x1="50" y1="15" x2="50" y2="32" />
          <line x1="50" y1="68" x2="50" y2="85" />
          <line x1="15" y1="50" x2="32" y2="50" />
          <line x1="68" y1="50" x2="85" y2="50" />
          {/* Outer points */}
          <circle cx="15" cy="15" r="3.5" className="fill-slate-300 stroke-none" />
          <circle cx="50" cy="15" r="3.5" className="fill-slate-300 stroke-none" />
          <circle cx="85" cy="15" r="3.5" className="fill-slate-300 stroke-none" />
          <circle cx="15" cy="50" r="3.5" className="fill-slate-300 stroke-none" />
          <circle cx="85" cy="50" r="3.5" className="fill-slate-300 stroke-none" />
          <circle cx="15" cy="85" r="3.5" className="fill-slate-300 stroke-none" />
          <circle cx="50" cy="85" r="3.5" className="fill-slate-300 stroke-none" />
          <circle cx="85" cy="85" r="3.5" className="fill-slate-300 stroke-none" />
        </svg>
      )
    },
    MILLS_9: {
      title: "9-Piece Men's Morris",
      subtitle: 'Classic Championship',
      pieces: 9,
      points: 24,
      icon: Crown,
      accentColor: 'text-amber-400',
      description: 'The ancient 3-square 24-point classic. Full placement, moving, captures, and flying endgame.',
      boardSvg: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 stroke-slate-500 fill-none stroke-[3]">
          <rect x="12" y="12" width="76" height="76" />
          <rect x="26" y="26" width="48" height="48" />
          <rect x="38" y="38" width="24" height="24" />
          <line x1="50" y1="12" x2="50" y2="38" />
          <line x1="50" y1="62" x2="50" y2="88" />
          <line x1="12" y1="50" x2="38" y2="50" />
          <line x1="62" y1="50" x2="88" y2="50" />
          {/* Highlights */}
          <circle cx="50" cy="12" r="3" className="fill-amber-400 stroke-none" />
          <circle cx="50" cy="26" r="3" className="fill-amber-400 stroke-none" />
          <circle cx="50" cy="38" r="3" className="fill-amber-400 stroke-none" />
        </svg>
      )
    }
  }[variant];

  const Icon = config.icon;

  return (
    <div
      onClick={() => onSelect?.(variant)}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 cursor-pointer select-none",
        isSelected
          ? "border-primary bg-background-elevated shadow-lg shadow-primary/10 ring-2 ring-primary"
          : "border-background-border bg-background-card hover:border-slate-600 hover:bg-background-elevated",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-xl p-2.5 bg-background-card border border-background-border", config.accentColor)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">
              {config.title}
            </h3>
            <p className="text-xs font-medium text-slate-400">{config.subtitle}</p>
          </div>
        </div>
        <div className="shrink-0 p-1 rounded-lg bg-background/50">
          {config.boardSvg}
        </div>
      </div>

      <p className="my-4 text-xs text-slate-400 leading-relaxed">
        {config.description}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-background-border/60 text-xs">
        <span className="text-slate-400">
          <strong className="text-slate-200">{config.pieces}</strong> pieces / player
        </span>
        <span className="text-slate-400">
          <strong className="text-slate-200">{config.points}</strong> intersections
        </span>
      </div>
    </div>
  );
}
