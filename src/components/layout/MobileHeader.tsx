import { NavLink } from 'react-router-dom';
import { Bell, BookOpen } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { LogIn } from 'lucide-react';

export interface MobileHeaderProps {
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  unreadNotificationsCount?: number;
}

export function MobileHeader({ onOpenNotifications, onOpenAuth, unreadNotificationsCount = 2 }: MobileHeaderProps) {
  const { user, profile } = useAuth();
  return (
    <header className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-background-border pt-safe px-4 py-3 flex items-center justify-between select-none">
      <NavLink to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center p-1 shadow-sm">
          <svg viewBox="0 0 100 100" className="w-full h-full stroke-slate-950 fill-none stroke-[7]">
            <rect x="15" y="15" width="70" height="70" rx="6" />
            <rect x="35" y="35" width="30" height="30" rx="3" />
            <line x1="50" y1="15" x2="50" y2="35" />
            <line x1="50" y1="65" x2="50" y2="85" />
            <line x1="15" y1="50" x2="35" y2="50" />
            <line x1="65" y1="50" x2="85" y2="50" />
          </svg>
        </div>
        <span className="font-black text-lg text-white tracking-wider">MILLS</span>
      </NavLink>

      <div className="flex items-center gap-2">
        <NavLink
          to="/rules"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-background-card"
          aria-label="How to play"
        >
          <BookOpen className="h-5 w-5" />
        </NavLink>

        <button
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-background-card"
        >
          <Bell className="h-5 w-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background" />
          )}
        </button>

        {user ? (
          <NavLink
            to="/profile"
            className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs border border-primary/30"
          >
            {profile?.displayName?.[0] || 'U'}
          </NavLink>
        ) : (
          <button
            onClick={onOpenAuth}
            aria-label="Sign In"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-background-card"
          >
            <LogIn className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
}
