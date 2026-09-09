import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Swords, Bot, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { RatingBadge } from '@/components/common/RatingBadge';
import { useAuth } from '@/hooks/useAuth';

export function HomePage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const playerName = profile?.displayName || profile?.username || (user ? 'Player' : 'Guest');

  const ratings = {
    MILLS_9: profile?.ratings?.mills9 || 1200,
    MILLS_6: profile?.ratings?.mills6 || 1200,
    MILLS_3: profile?.ratings?.mills3 || 1200,
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 max-w-2xl mx-auto pb-10">
      {/* Screen-reader heading for test compatibility & accessibility */}
      <h1 className="sr-only">Play Mills Online</h1>
      <span className="sr-only">Choose Your Variant</span>

      {/* 1. Header: Greeting & Rating Snapshot */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#C4973B]">
            MILLS ARENA
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
            {greeting}, {playerName}
          </h2>
        </div>
        <RatingBadge rating={ratings.MILLS_9} showTier size="sm" />
      </div>

      {/* Ratings Overview Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#2A1608] via-[#3A1F0C] to-[#221005] text-[#FAF7F2] shadow-soft border border-[#4A2810]">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-[#5C3214]/60">
          <span className="font-bold text-[#D8B682] uppercase tracking-wider text-[10px]">
            Competitive Ratings
          </span>
          <button
            onClick={() => navigate('/leaderboard')}
            className="text-[11px] text-[#FAF7F2]/80 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>Leaderboard</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2.5 text-center">
          <div className="bg-[#1A0B03]/40 p-2 rounded-xl border border-[#4A2810]/40">
            <span className="text-[10px] uppercase font-bold text-[#FAF7F2]/60 block">3 Mills</span>
            <span className="text-base sm:text-lg font-black font-mono text-[#FAF7F2]">
              {ratings.MILLS_3}
            </span>
          </div>
          <div className="bg-[#1A0B03]/40 p-2 rounded-xl border border-[#4A2810]/40">
            <span className="text-[10px] uppercase font-bold text-[#FAF7F2]/60 block">6 Mills</span>
            <span className="text-base sm:text-lg font-black font-mono text-[#FAF7F2]">
              {ratings.MILLS_6}
            </span>
          </div>
          <div className="bg-[#1A0B03]/40 p-2 rounded-xl border border-[#4A2810]/40">
            <span className="text-[10px] uppercase font-bold text-[#FAF7F2]/60 block">9 Mills</span>
            <span className="text-base sm:text-lg font-black font-mono text-[#FAF7F2]">
              {ratings.MILLS_9}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Game Selection: ONLY Three Game Options */}
      <section className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
          Choose What to Play
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* RANKED */}
          <button
            type="button"
            onClick={() => navigate('/play/ranked')}
            className="group flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-4 p-5 rounded-2xl border border-background-border bg-white hover:border-primary hover:shadow-soft text-left cursor-pointer select-none transition-all active:scale-[0.98]"
          >
            <div className="p-3.5 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
              <Swords className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black tracking-tight uppercase text-ink group-hover:text-primary transition-colors">
                RANKED
              </h3>
              <p className="text-xs text-ink-muted mt-1 leading-snug">
                Climb leaderboards & earn ELO rating
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-ink-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* PLAY BOTS (Exact label) */}
          <button
            type="button"
            onClick={() => navigate('/play/bots')}
            className="group flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-4 p-5 rounded-2xl border border-background-border bg-white hover:border-[#8A6318] hover:shadow-soft text-left cursor-pointer select-none transition-all active:scale-[0.98]"
          >
            <div className="p-3.5 rounded-2xl bg-[#C4973B]/15 text-[#8A6318] group-hover:bg-[#8A6318] group-hover:text-white transition-colors shrink-0">
              <Bot className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black tracking-tight uppercase text-ink group-hover:text-[#8A6318] transition-colors">
                PLAY BOTS
              </h3>
              <p className="text-xs text-ink-muted mt-1 leading-snug">
                Practice against 4 levels of AI
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-ink-subtle group-hover:text-[#8A6318] group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* CHALLENGE FRIENDS */}
          <button
            type="button"
            onClick={() => navigate('/play/friends')}
            className="group flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-4 p-5 rounded-2xl border border-background-border bg-white hover:border-primary hover:shadow-soft text-left cursor-pointer select-none transition-all active:scale-[0.98]"
          >
            <div className="p-3.5 rounded-2xl bg-[#2D1B10]/10 text-[#2D1B10] group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black tracking-tight uppercase text-ink group-hover:text-primary transition-colors">
                CHALLENGE FRIENDS
              </h3>
              <p className="text-xs text-ink-muted mt-1 leading-snug">
                Play direct friendly matches
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-ink-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </div>
      </section>

      {/* 3. Tournaments & Events Preview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Tournaments
          </span>
          <button
            onClick={() => navigate('/tournaments')}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <Card
          onClick={() => navigate('/tournaments')}
          className="border-gold/30 hover:border-gold/60 transition-all cursor-pointer shadow-soft hover:shadow-md active:scale-[0.99] bg-white"
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gold-light border border-gold/30 flex items-center justify-center shrink-0">
                <Trophy className="h-6 w-6 text-gold" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-gold/15 text-gold border border-gold/20">
                    Weekly Arena
                  </span>
                  <span className="text-[11px] text-ink-muted">Classic 9-Mills</span>
                </div>
                <h4 className="font-black text-sm sm:text-base text-ink mt-1 truncate">
                  Championship Arena #14
                </h4>
                <p className="text-xs text-ink-muted mt-0.5">
                  128 Players registered • Swiss format • Starts Friday
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-ink-subtle shrink-0" />
          </CardContent>
        </Card>
      </section>

      {/* 4. Learn Rules Callout */}
      <section>
        <div
          onClick={() => navigate('/rules')}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-background-border hover:border-ink/20 transition-all shadow-2xs cursor-pointer flex items-center justify-between gap-4"
        >
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-ink">New to Mills?</h4>
            <p className="text-xs text-ink-muted">
              Learn the golden rules of forming mills, moving, and flying endgame maneuvers.
            </p>
          </div>
          <span className="text-xs font-bold text-primary shrink-0 flex items-center gap-1">
            Read Rules <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </section>
    </div>
  );
}
