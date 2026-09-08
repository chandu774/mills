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
      accentColor: 'text-primary bg-primary/10 border-primary/20',
      description: 'Quick placement on a 3x3 grid. First to form a 3-in-a-row mill wins immediately.',
      boardSvg: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 rounded-xl shadow-md overflow-hidden border border-[#532E16]">
          <rect width="100" height="100" fill="#915F33" />
          {/* Border bevel */}
          <rect x="5" y="5" width="90" height="90" rx="3" fill="none" stroke="#462410" strokeWidth="1.5" />
          {/* Dark espresso lines */}
          <g stroke="#261207" strokeWidth="2.5" strokeLinecap="round">
            <line x1="14" y1="14" x2="86" y2="14" />
            <line x1="14" y1="50" x2="86" y2="50" />
            <line x1="14" y1="86" x2="86" y2="86" />
            <line x1="14" y1="14" x2="14" y2="86" />
            <line x1="50" y1="14" x2="50" y2="86" />
            <line x1="86" y1="14" x2="86" y2="86" />
            <line x1="14" y1="14" x2="86" y2="86" strokeWidth="1.8" />
            <line x1="86" y1="14" x2="14" y2="86" strokeWidth="1.8" />
          </g>
          {/* Intersection Points */}
          {[14, 50, 86].map(x =>
            [14, 50, 86].map(y => (
              <g key={`${x}-${y}`}>
                <circle cx={x} cy={y} r="3.2" fill="#140802" />
                <circle cx={x} cy={y} r="2.0" fill="#C49A45" />
              </g>
            ))
          )}
        </svg>
      )
    },
    MILLS_6: {
      title: '6-Piece Mills',
      subtitle: 'Strategic & Balanced',
      pieces: 6,
      points: 16,
      icon: Shield,
      accentColor: 'text-amber-800 bg-amber-500/10 border-amber-500/20',
      description: 'Two concentric squares with 16 points. Rich tactical maneuvering and positioning.',
      boardSvg: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 rounded-xl shadow-md overflow-hidden border border-[#532E16]">
          <rect width="100" height="100" fill="#915F33" />
          <rect x="5" y="5" width="90" height="90" rx="3" fill="none" stroke="#462410" strokeWidth="1.5" />
          {/* Outer and Inner squares */}
          <g stroke="#261207" strokeWidth="2.5" strokeLinecap="round">
            <rect x="11" y="11" width="78" height="78" fill="none" />
            <rect x="31" y="31" width="38" height="38" fill="none" />
            {/* Midpoint bridges */}
            <line x1="50" y1="11" x2="50" y2="31" />
            <line x1="50" y1="69" x2="50" y2="89" />
            <line x1="11" y1="50" x2="31" y2="50" />
            <line x1="69" y1="50" x2="89" y2="50" />
          </g>
          {/* Points */}
          {[11, 50, 89].map(x => (
            <g key={`top-${x}`}><circle cx={x} cy={11} r="2.8" fill="#140802" /><circle cx={x} cy={11} r="1.8" fill="#C49A45" /></g>
          ))}
          {[11, 89].map(x => (
            <g key={`mid-${x}`}><circle cx={x} cy={50} r="2.8" fill="#140802" /><circle cx={x} cy={50} r="1.8" fill="#C49A45" /></g>
          ))}
          {[11, 50, 89].map(x => (
            <g key={`bot-${x}`}><circle cx={x} cy={89} r="2.8" fill="#140802" /><circle cx={x} cy={89} r="1.8" fill="#C49A45" /></g>
          ))}
          {[31, 50, 69].map(x => (
            <g key={`in-top-${x}`}><circle cx={x} cy={31} r="2.8" fill="#140802" /><circle cx={x} cy={31} r="1.8" fill="#C49A45" /></g>
          ))}
          {[31, 69].map(x => (
            <g key={`in-mid-${x}`}><circle cx={x} cy={50} r="2.8" fill="#140802" /><circle cx={x} cy={50} r="1.8" fill="#C49A45" /></g>
          ))}
          {[31, 50, 69].map(x => (
            <g key={`in-bot-${x}`}><circle cx={x} cy={69} r="2.8" fill="#140802" /><circle cx={x} cy={69} r="1.8" fill="#C49A45" /></g>
          ))}
        </svg>
      )
    },
    MILLS_9: {
      title: "9-Piece Men's Morris",
      subtitle: 'Classic Championship',
      pieces: 9,
      points: 24,
      icon: Crown,
      accentColor: 'text-amber-700 bg-amber-600/10 border-amber-600/20',
      description: 'The ancient 3-square 24-point classic. Full placement, moving, captures, and flying endgame.',
      boardSvg: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 rounded-xl shadow-md overflow-hidden border border-[#532E16]">
          <rect width="100" height="100" fill="#915F33" />
          <rect x="5" y="5" width="90" height="90" rx="3" fill="none" stroke="#462410" strokeWidth="1.5" />
          {/* 3 Concentric Squares */}
          <g stroke="#261207" strokeWidth="2.2" strokeLinecap="round">
            <rect x="9.5" y="9.5" width="81" height="81" fill="none" />
            <rect x="23" y="23" width="54" height="54" fill="none" />
            <rect x="36.5" y="36.5" width="27" height="27" fill="none" />
            {/* Midpoint bridges */}
            <line x1="50" y1="9.5" x2="50" y2="36.5" />
            <line x1="50" y1="63.5" x2="50" y2="90.5" />
            <line x1="9.5" y1="50" x2="36.5" y2="50" />
            <line x1="63.5" y1="50" x2="90.5" y2="50" />
          </g>
          {/* Key Inlay Points */}
          <circle cx="50" cy="9.5" r="2.5" fill="#140802" /><circle cx="50" cy="9.5" r="1.6" fill="#C49A45" />
          <circle cx="50" cy="23" r="2.5" fill="#140802" /><circle cx="50" cy="23" r="1.6" fill="#C49A45" />
          <circle cx="50" cy="36.5" r="2.5" fill="#140802" /><circle cx="50" cy="36.5" r="1.6" fill="#C49A45" />
          <circle cx="50" cy="63.5" r="2.5" fill="#140802" /><circle cx="50" cy="63.5" r="1.6" fill="#C49A45" />
          <circle cx="50" cy="77" r="2.5" fill="#140802" /><circle cx="50" cy="77" r="1.6" fill="#C49A45" />
          <circle cx="50" cy="90.5" r="2.5" fill="#140802" /><circle cx="50" cy="90.5" r="1.6" fill="#C49A45" />
        </svg>
      )
    }
  }[variant];

  const Icon = config.icon;

  return (
    <div
      onClick={() => onSelect?.(variant)}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 cursor-pointer select-none bg-white",
        isSelected
          ? "border-primary bg-primary/[0.03] shadow-md ring-2 ring-primary/70"
          : "border-background-border hover:border-ink/20 hover:shadow-soft",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-xl p-2.5 border", config.accentColor)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink group-hover:text-primary transition-colors">
              {config.title}
            </h3>
            <p className="text-xs font-medium text-ink-muted">{config.subtitle}</p>
          </div>
        </div>
        <div className="shrink-0">
          {config.boardSvg}
        </div>
      </div>

      <p className="my-4 text-xs text-ink-muted leading-relaxed">
        {config.description}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-background-border text-xs">
        <span className="text-ink-muted">
          <strong className="text-ink font-semibold">{config.pieces}</strong> pieces / player
        </span>
        <span className="text-ink-muted">
          <strong className="text-ink font-semibold">{config.points}</strong> intersections
        </span>
      </div>
    </div>
  );
}
