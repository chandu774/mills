import { cn } from '@/lib/utils';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'in_game' | 'offline';
  className?: string;
}

export function Avatar({ src, alt, name, size = 'md', status, className }: AvatarProps) {
  const sizeMap = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base font-bold',
    xl: 'h-20 w-20 text-xl font-bold',
  };

  const statusSizeMap = {
    sm: 'h-2.5 w-2.5 ring-2',
    md: 'h-3 w-3 ring-2',
    lg: 'h-3.5 w-3.5 ring-2',
    xl: 'h-4 w-4 ring-2',
  };

  const statusColorMap = {
    online: 'bg-emerald-500',
    in_game: 'bg-amber-400',
    offline: 'bg-slate-500',
  };

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className={cn("relative inline-block shrink-0", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-background-border font-semibold text-slate-200 overflow-hidden shadow-sm",
          sizeMap[size]
        )}
      >
        {src ? (
          <img src={src} alt={alt || name || 'Avatar'} className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-background",
            statusColorMap[status],
            statusSizeMap[size]
          )}
          title={`Status: ${status.replace('_', ' ')}`}
        />
      )}
    </div>
  );
}
