import { NavLink } from 'react-router-dom';
import { Home, Play, Trophy, BarChart2, Users, BookOpen, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

import { useAuth } from '@/hooks/useAuth';
import { LogIn, LogOut } from 'lucide-react';

export interface DesktopSidebarProps {
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  unreadNotificationsCount?: number;
}

export function DesktopSidebar({ onOpenNotifications, onOpenAuth, unreadNotificationsCount = 2 }: DesktopSidebarProps) {
  const { user, profile, ratings, signOut } = useAuth();
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/play', label: 'Play', icon: Play },
    { to: '/tournaments', label: 'Tournaments', icon: Trophy, count: 3 },
    { to: '/leaderboard', label: 'Leaderboards', icon: BarChart2 },
    { to: '/friends', label: 'Friends', icon: Users, count: 1 },
    { to: '/rules', label: 'Learn Rules', icon: BookOpen },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-background-card border-r border-background-border h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="flex items-center justify-between p-5 border-b border-background-border">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center p-1.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 100 100" className="w-full h-full stroke-slate-950 fill-none stroke-[6]">
              <rect x="15" y="15" width="70" height="70" rx="6" />
              <rect x="35" y="35" width="30" height="30" rx="3" />
              <line x1="50" y1="15" x2="50" y2="35" />
              <line x1="50" y1="65" x2="50" y2="85" />
              <line x1="15" y1="50" x2="35" y2="50" />
              <line x1="65" y1="50" x2="85" y2="50" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-wider text-white">MILLS</span>
              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.2 rounded font-bold uppercase tracking-widest">PRO</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Competitive Platform</p>
          </div>
        </NavLink>

        <button
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-background-elevated transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-background-card" />
          )}
        </button>
      </div>

      {/* Primary Call To Action */}
      <div className="p-4">
        <NavLink to="/play">
          <Button variant="primary" size="lg" className="w-full gap-2.5 text-base font-extrabold shadow-emerald-500/25">
            <Play className="h-5 w-5 fill-current" />
            PLAY NOW
          </Button>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-background-elevated text-white border border-background-border font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-background-elevated/50"
                )
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span className="text-[11px] font-bold bg-background-border/80 px-2 py-0.5 rounded-full text-slate-300">
                  {item.count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Rating Snapshot Card */}
      <div className="p-4 border-t border-background-border bg-background-subtle/50">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Your Ratings</span>
          <NavLink to="/profile" className="text-[11px] text-primary hover:underline font-semibold">Details</NavLink>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-background-card border border-background-border">
            <span className="text-slate-400">3 Mills</span>
            <span className="font-mono font-bold text-emerald-400">{ratings?.mills3 || 1200}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-background-card border border-background-border">
            <span className="text-slate-400">6 Mills</span>
            <span className="font-mono font-bold text-sky-400">{ratings?.mills6 || 1200}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-background-card border border-background-border">
            <span className="text-slate-400">9 Mills</span>
            <span className="font-mono font-bold text-amber-400">{ratings?.mills9 || 1200}</span>
          </div>
        </div>

        {/* User Account Button */}
        <div className="pt-3 mt-3 border-t border-background-border">
          {user ? (
            <div className="flex items-center justify-between">
              <NavLink to="/profile" className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                  {profile?.displayName?.[0] || 'U'}
                </div>
                <span className="text-xs font-bold text-slate-200 truncate">
                  {profile?.displayName || 'Player'}
                </span>
              </NavLink>
              <button
                onClick={() => signOut()}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-background-elevated transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenAuth}
              className="w-full gap-2 text-xs font-bold"
            >
              <LogIn className="h-3.5 w-3.5" /> Sign In / Join
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
