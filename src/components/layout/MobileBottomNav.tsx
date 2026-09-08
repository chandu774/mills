import { NavLink } from 'react-router-dom';
import { Home, Play, Trophy, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const navItems = [
    { to: '/', label: 'Home', icon: Home, isPrimary: false },
    { to: '/play', label: 'Play', icon: Play, isPrimary: true },
    { to: '/tournaments', label: 'Tournaments', icon: Trophy, isPrimary: false },
    { to: '/friends', label: 'Friends', icon: Users, isPrimary: false },
    { to: '/profile', label: 'Profile', icon: User, isPrimary: false },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-background-border pb-safe select-none shadow-board">
      <div className="flex items-center justify-around px-1 py-1.5 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center px-3 py-0.5 transition-transform active:scale-95",
                    isActive ? "scale-105" : ""
                  )
                }
              >
                <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md border-2 border-white p-2 transition-all hover:bg-primary-hover">
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </div>
                <span className="text-[10px] font-extrabold text-primary mt-0.5 tracking-tight">Play</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px] active:scale-95",
                  isActive ? "text-primary font-bold" : "text-ink-subtle hover:text-ink"
                )
              }
            >
              <Icon className="h-4.5 w-4.5 mb-0.5" />
              <span className="text-[10px] font-medium tracking-tight truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
