import { NavLink } from 'react-router-dom';
import { Bell, BookOpen, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export interface MobileHeaderProps {
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  unreadNotificationsCount?: number;
}

export function MobileHeader({ onOpenNotifications, onOpenAuth, unreadNotificationsCount = 2 }: MobileHeaderProps) {
  const { user, profile } = useAuth();
  return (
    <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-background-border pt-safe px-4 py-2.5 flex items-center justify-between select-none shadow-2xs">
      <NavLink to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#3D2817] flex items-center justify-center p-1 shadow-2xs border border-[#26150A]">
          <svg viewBox="0 0 100 100" className="w-full h-full stroke-[#FDFBF7] fill-none stroke-[7]">
            <rect x="15" y="15" width="70" height="70" rx="5" />
            <rect x="35" y="35" width="30" height="30" rx="3" />
            <line x1="50" y1="15" x2="50" y2="35" />
            <line x1="50" y1="65" x2="50" y2="85" />
            <line x1="15" y1="50" x2="35" y2="50" />
            <line x1="65" y1="50" x2="85" y2="50" />
          </svg>
        </div>
        <span className="font-black text-lg text-ink tracking-wider">MILLS</span>
      </NavLink>

      <div className="flex items-center gap-1.5">
        <NavLink
          to="/rules"
          className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-background-elevated"
          aria-label="How to play"
        >
          <BookOpen className="h-5 w-5" />
        </NavLink>

        <button
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="relative p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-background-elevated"
        >
          <Bell className="h-5 w-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-alert-danger ring-2 ring-white" />
          )}
        </button>

        {user ? (
          <NavLink
            to="/profile"
            className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-xs border border-primary/30"
          >
            {profile?.displayName?.[0] || 'U'}
          </NavLink>
        ) : (
          <button
            onClick={onOpenAuth}
            aria-label="Sign In"
            className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-background-elevated"
          >
            <LogIn className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
}
