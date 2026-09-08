import { NavLink } from 'react-router-dom';
import { Home, Play, Trophy, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/friends', label: 'Friends', icon: Users },
    { to: '/play', label: 'Play', icon: Play, isPrimary: true },
    { to: '/tournaments', label: 'Arena', icon: Trophy },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-background-border pb-safe select-none shadow-soft">
      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center -mt-4 transition-transform active:scale-95",
                    isActive ? "scale-105" : ""
                  )
                }
              >
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-soft border-2 border-white p-2.5">
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </div>
                <span className="text-[10px] font-bold text-primary mt-0.5">Play</span>
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
                  "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors min-w-[54px]",
                  isActive ? "text-primary font-bold" : "text-ink-subtle hover:text-ink"
                )
              }
            >
              <Icon className="h-4.5 w-4.5 mb-0.5" />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
