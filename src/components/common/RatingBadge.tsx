import { getRankTier } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface RatingBadgeProps {
  rating: number;
  showTier?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RatingBadge({ rating, showTier = false, className, size = 'md' }: RatingBadgeProps) {
  const tier = getRankTier(rating);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5 font-bold',
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl font-mono font-bold border",
        tier.badgeBg,
        sizeClasses[size],
        className
      )}
    >
      <span>{rating}</span>
      {showTier && (
        <span className={cn("text-[10px] font-sans uppercase tracking-wider opacity-85", tier.color)}>
          {tier.name}
        </span>
      )}
    </div>
  );
}
