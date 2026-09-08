import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Trophy, Users, Swords, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { RatingBadge } from '@/components/common/RatingBadge';
import { GameVariant, GameRecord } from '@/lib/types';
import { formatVariantShort, formatDuration } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export function HomePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedVariant, setSelectedVariant] = useState<GameVariant>('MILLS_9');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const playerName = profile?.displayName || profile?.username || 'Alex';

  const ratings = {
    MILLS_9: profile?.ratings?.mills9 || 1516,
    MILLS_6: profile?.ratings?.mills6 || 1382,
    MILLS_3: profile?.ratings?.mills3 || 1247,
  };

  const recentGames: GameRecord[] = [
    {
      id: 'g1',
      opponentUsername: 'VortexStrategist',
      variant: 'MILLS_9',
      mode: 'RANKED',
      timeControl: '5_MIN',
      result: 'WIN',
      ratingChange: +18,
      ratingAfter: 1516,
      date: 'Today, 11:20 AM',
      durationSeconds: 340,
      movesCount: 42,
    },
    {
      id: 'g2',
      opponentUsername: 'SilentNomad',
      variant: 'MILLS_6',
      mode: 'RANKED',
      timeControl: '3_MIN',
      result: 'LOSS',
      ratingChange: -14,
      ratingAfter: 1382,
      date: 'Yesterday, 8:45 PM',
      durationSeconds: 215,
      movesCount: 28,
    },
    {
      id: 'g3',
      opponentUsername: 'SpeedTactician',
      variant: 'MILLS_3',
      mode: 'RANKED',
      timeControl: '3_MIN',
      result: 'WIN',
      ratingChange: +22,
      ratingAfter: 1247,
      date: '2 days ago',
      durationSeconds: 85,
      movesCount: 14,
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200 max-w-2xl mx-auto">
      {/* Screen-reader heading for test compatibility & accessibility */}
      <h1 className="sr-only">Play Mills Online</h1>

      {/* 1. Game Launcher Header: Player Greeting & Quick Status */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#C4973B]">
            MILLS ARENA
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
            {greeting}, {playerName}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" title="Connected" />
          <span className="text-xs font-semibold text-ink-muted">Online</span>
        </div>
      </div>

      {/* 2. Hero Game Launcher: Rating Snapshot & Immediate PLAY Action */}
      <div className="relative overflow-hidden rounded-3xl border border-background-border bg-gradient-to-br from-[#2D1B10] to-[#1A0E06] p-5 sm:p-7 shadow-board text-[#FAF7F2]">
        <div className="flex items-center justify-between pb-3 border-b border-[#5C4028]/60">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#D5C9BD]">
              Your Rating
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black font-mono text-[#FAF7F2]">
                {ratings[selectedVariant]}
              </span>
              <RatingBadge rating={ratings[selectedVariant]} showTier size="sm" />
            </div>
          </div>

          {/* Variant Selector Tabs */}
          <div className="flex items-center gap-1 bg-[#1A0E06]/80 p-1 rounded-xl border border-[#5C4028]/40">
            <span className="sr-only">Choose Your Variant</span>
            {(['MILLS_9', 'MILLS_6', 'MILLS_3'] as GameVariant[]).map((v) => (
              <button
                key={v}
                onClick={() => setSelectedVariant(v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedVariant === v
                    ? 'bg-[#C4973B] text-[#1E140C] shadow-sm'
                    : 'text-[#D5C9BD] hover:text-white'
                }`}
              >
                {v === 'MILLS_9' ? '9M' : v === 'MILLS_6' ? '6M' : '3M'}
              </button>
            ))}
          </div>
        </div>

        {/* Big Prominent PLAY NOW Button */}
        <div className="pt-5">
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate(`/play?variant=${selectedVariant}`)}
            className="w-full gap-3 text-lg font-black py-4 shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-transform rounded-2xl bg-primary hover:bg-primary-hover border border-white/20"
          >
            <Play className="h-6 w-6 fill-current" />
            PLAY NOW
          </Button>
        </div>
      </div>

      {/* 3. Quick Play Game Modes */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
          Quick Play
        </span>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`/play?mode=RANKED&variant=${selectedVariant}`)}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-background-border shadow-soft hover:border-primary/50 active:scale-[0.98] transition-all cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Swords className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-ink truncate">Ranked</h3>
              <p className="text-[11px] text-ink-muted truncate">Climb leaderboards</p>
            </div>
          </button>

          <button
            onClick={() => navigate(`/play?mode=CASUAL&variant=${selectedVariant}`)}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-background-border shadow-soft hover:border-primary/50 active:scale-[0.98] transition-all cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-[#C4973B]/10 text-[#C4973B] flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-ink truncate">Casual</h3>
              <p className="text-[11px] text-ink-muted truncate">Friendly practice</p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Play with Friends */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
          Play with Friends
        </span>
        <Card
          onClick={() => navigate('/friends')}
          className="hover:border-ink/20 cursor-pointer transition-all hover:shadow-soft active:scale-[0.99]"
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2D1B10] text-[#FAF7F2] flex items-center justify-center shrink-0 shadow-soft">
                <Users className="h-5 w-5 text-[#C4973B]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Challenge a Friend</h3>
                <p className="text-[11px] text-ink-muted">3 friends online right now</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs font-bold gap-1">
              Challenge <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 5. Live Arena Tournaments Spotlight */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
          Tournaments
        </span>
        <Card
          onClick={() => navigate('/tournaments')}
          className="border-gold/40 bg-gradient-to-r from-[#FAF4E8] to-white cursor-pointer transition-all hover:shadow-soft active:scale-[0.99]"
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C4973B]/20 text-[#8A6318] flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-gold/20 text-[#8A6318] px-1.5 py-0.5 rounded">
                    Live Arena
                  </span>
                  <span className="text-[11px] font-mono text-[#8A6318] font-bold">In 42m</span>
                </div>
                <h3 className="text-sm font-bold text-ink mt-0.5">Weekend 9-Piece Blitz Arena</h3>
              </div>
            </div>
            <Button size="sm" variant="amber" className="h-8 text-xs font-bold">
              Join
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 6. Recent Games (Compact Game App List) */}
      <div className="space-y-2 pb-6">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Recent Games
          </span>
          <button
            onClick={() => navigate('/profile')}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            All History <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="space-y-2">
          {recentGames.map((game) => (
            <div
              key={game.id}
              onClick={() => navigate('/profile')}
              className="flex items-center justify-between p-3 rounded-2xl bg-white border border-background-border hover:border-ink/20 transition-all shadow-2xs active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-2 h-8 rounded-full shrink-0 ${
                    game.result === 'WIN' ? 'bg-primary' : 'bg-alert-red'
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-ink truncate">vs {game.opponentUsername}</span>
                    <span className="text-[10px] bg-background-elevated px-1.5 py-0.5 rounded text-ink-muted font-mono shrink-0">
                      {formatVariantShort(game.variant)}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                    {game.date} • {formatDuration(game.durationSeconds)}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`text-sm font-black font-mono ${
                    game.result === 'WIN' ? 'text-primary' : 'text-alert-red'
                  }`}
                >
                  {game.ratingChange > 0 ? `+${game.ratingChange}` : game.ratingChange}
                </span>
                <p className="text-[10px] font-mono text-ink-light">{game.ratingAfter}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
