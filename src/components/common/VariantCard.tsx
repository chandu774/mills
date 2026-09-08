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
        <svg viewBox="0 0 100 100" className="w-16 h-16 rounded-lg shadow-sm overflow-hidden">
          <rect width="100" height="100" rx="8" fill="#3D2817" />
          <rect x="18" y="18" width="64" height="64" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeOpacity="0.75" />
          <line x1="50" y1="18" x2="50" y2="82" stroke="#D4AF37" strokeWidth="2.5" strokeOpacity="0.75" />
          <line x1="18" y1="50" x2="82" y2="50" stroke="#D4AF37" strokeWidth="2.5" strokeOpacity="0.75" />
          <line x1="18" y1="18" x2="82" y2="82" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.6" />
          <line x1="82" y1="18" x2="18" y2="82" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.6" />
          {/* Intersection Points */}
          {[18, 50, 82].map(x =>
            [18, 50, 82].map(y => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" fill="#FAF7F2" stroke="#25150A" strokeWidth="1" />
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
        <svg viewBox="0 0 100 100" className="w-16 h-16 rounded-lg shadow-sm overflow-hidden">
          <rect width="100" height="100" rx="8" fill="#3D2817" />
          <rect x="18" y="18" width="64" height="64" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeOpacity="0.75" />
          <rect x="34" y="34" width="32" height="32" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeOpacity="0.75" />
          <line x1="50" y1="18" x2="50" y2="34" stroke="#D4AF37" strokeWidth="2.5" strokeOpacity="0.75" />
          <line x1="50" y1="66" x2="50" y2="82" stroke="#D4AF37" strokeWidth="2.5" strokeOpacity="0.75" />
          <line x1="18" y1="50" x2="34" y2="50" stroke="#D4AF37" strokeWidth="2.5" strokeOpacity="0.75" />
          <line x1="66" y1="50" x2="82" y2="50" stroke="#D4AF37" strokeWidth="2.5" strokeOpacity="0.75" />
          {/* Key points */}
          {[18, 50, 82].map(x => (
            <circle key={`top-${x}`} cx={x} cy={18} r="3" fill="#FAF7F2" stroke="#25150A" strokeWidth="1" />
          ))}
          {[18, 82].map(x => (
            <circle key={`mid-${x}`} cx={x} cy={50} r="3" fill="#FAF7F2" stroke="#25150A" strokeWidth="1" />
          ))}
          {[18, 50, 82].map(x => (
            <circle key={`bot-${x}`} cx={x} cy={82} r="3" fill="#FAF7F2" stroke="#25150A" strokeWidth="1" />
          ))}
          {[34, 50, 66].map(x => (
            <circle key={`inner-top-${x}`} cx={x} cy={34} r="3" fill="#FAF7F2" stroke="#25150A" strokeWidth="1" />
          ))}
          {[34, 66].map(x => (
            <circle key={`inner-mid-${x}`} cx={x} cy={50} r="3" fill="#FAF7F2" stroke="#25150A" strokeWidth="1" />
          ))}
          {[34, 50, 66].map(x => (
            <circle key={`inner-bot-${x}`} cx={x} cy={66} r="3" fill="#FAF7F2" stroke="#25150A" strokeWidth="1" />
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
        <svg viewBox="0 0 100 100" className="w-16 h-16 rounded-lg shadow-sm overflow-hidden">
          <rect width="100" height="100" rx="8" fill="#3D2817" />
          <rect x="14" y="14" width="72" height="72" fill="none" stroke="#D4AF37" strokeWidth="2" strokeOpacity="0.75" />
          <rect x="27" y="27" width="46" height="46" fill="none" stroke="#D4AF37" strokeWidth="2" strokeOpacity="0.75" />
          <rect x="39" y="39" width="22" height="22" fill="none" stroke="#D4AF37" strokeWidth="2" strokeOpacity="0.75" />
          <line x1="50" y1="14" x2="50" y2="39" stroke="#D4AF37" strokeWidth="2" strokeOpacity="0.75" />
          <line x1="50" y1="61" x2="50" y2="86" stroke="#D4AF37" strokeWidth="2" strokeOpacity="0.75" />
          <line x1="14" y1="50" x2="39" y2="50" stroke="#D4AF37" strokeWidth="2" strokeOpacity="0.75" />
          <line x1="61" y1="50" x2="86" y2="50" stroke="#D4AF37" strokeWidth="2" strokeOpacity="0.75" />
          {/* Inlay Points */}
          <circle cx="50" cy="14" r="3" fill="#D4AF37" />
          <circle cx="50" cy="27" r="3" fill="#D4AF37" />
          <circle cx="50" cy="39" r="3" fill="#D4AF37" />
          <circle cx="50" cy="61" r="3" fill="#D4AF37" />
          <circle cx="50" cy="73" r="3" fill="#D4AF37" />
          <circle cx="50" cy="86" r="3" fill="#D4AF37" />
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
