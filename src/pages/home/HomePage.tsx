import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Trophy, Users, ArrowUpRight, Flame, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { VariantCard } from '@/components/common/VariantCard';
import { RatingBadge } from '@/components/common/RatingBadge';
import { GameVariant, GameRecord } from '@/lib/types';
import { formatVariantShort, formatDuration } from '@/lib/utils';

export function HomePage() {
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState<GameVariant>('MILLS_9');

  // Realistic recent matches data for Phase 1 demo
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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner with Quick Play CTA */}
      <div className="relative overflow-hidden rounded-3xl border border-background-border bg-gradient-to-br from-background-card via-background-card to-background-elevated p-6 md:p-10 shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 opacity-10 hidden lg:block pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-64 h-64 stroke-white fill-none stroke-[2]">
            <rect x="10" y="10" width="80" height="80" />
            <rect x="25" y="25" width="50" height="50" />
            <rect x="40" y="40" width="20" height="20" />
            <line x1="50" y1="10" x2="50" y2="40" />
            <line x1="50" y1="60" x2="50" y2="90" />
            <line x1="10" y1="50" x2="40" y2="50" />
            <line x1="60" y1="50" x2="90" y2="50" />
          </svg>
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-4">
            <Flame className="h-3.5 w-3.5 fill-primary" />
            <span>Competitive Season 1 is Live</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Play Mills Online. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Outsmart Your Opponent.
            </span>
          </h1>

          <p className="mt-3 text-sm md:text-base text-slate-300 max-w-xl leading-relaxed">
            Form mills, capture opponent pieces, and climb the competitive leaderboards across 3-Piece, 6-Piece, and 9-Piece variants.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/play')}
              className="gap-2.5 text-base font-extrabold px-8 shadow-emerald-500/25"
            >
              <Play className="h-5 w-5 fill-current" />
              PLAY NOW
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/tournaments')}
              className="gap-2 text-base font-semibold"
            >
              <Trophy className="h-5 w-5 text-amber-400" />
              Join Tournaments
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/friends')}
              className="gap-2 text-base font-semibold"
            >
              <Users className="h-5 w-5 text-sky-400" />
              Play Friend
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Rating Breakdown & Active Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:border-emerald-500/40 cursor-pointer transition-all" onClick={() => navigate('/play?variant=MILLS_3')}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <CardTitle className="text-base">3-Piece Mills</CardTitle>
            </div>
            <RatingBadge rating={1247} showTier size="sm" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">Fast 3-point tactical sprints. Average match: 2 mins.</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-background-border pt-2">
              <span>Rank #142</span>
              <span className="text-primary font-semibold flex items-center gap-0.5">
                Play Ranked <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-sky-500/40 cursor-pointer transition-all" onClick={() => navigate('/play?variant=MILLS_6')}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <CardTitle className="text-base">6-Piece Mills</CardTitle>
            </div>
            <RatingBadge rating={1382} showTier size="sm" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">Strategic 2-ring maneuvering with 16 intersections.</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-background-border pt-2">
              <span>Rank #88</span>
              <span className="text-primary font-semibold flex items-center gap-0.5">
                Play Ranked <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-amber-500/40 cursor-pointer transition-all" onClick={() => navigate('/play?variant=MILLS_9')}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <CardTitle className="text-base">9-Piece Morris</CardTitle>
            </div>
            <RatingBadge rating={1516} showTier size="sm" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">The premier 24-point championship game with flying phase.</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-background-border pt-2">
              <span>Rank #29</span>
              <span className="text-primary font-semibold flex items-center gap-0.5">
                Play Ranked <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Select Variant Showcase */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Choose Your Variant</h2>
            <p className="text-xs text-slate-400">Select any variant to explore rules and jump straight into a game.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/rules')} className="text-xs gap-1">
            Rules & Guides <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <VariantCard
            variant="MILLS_3"
            isSelected={selectedVariant === 'MILLS_3'}
            onSelect={(v) => { setSelectedVariant(v); navigate(`/play?variant=${v}`); }}
          />
          <VariantCard
            variant="MILLS_6"
            isSelected={selectedVariant === 'MILLS_6'}
            onSelect={(v) => { setSelectedVariant(v); navigate(`/play?variant=${v}`); }}
          />
          <VariantCard
            variant="MILLS_9"
            isSelected={selectedVariant === 'MILLS_9'}
            onSelect={(v) => { setSelectedVariant(v); navigate(`/play?variant=${v}`); }}
          />
        </div>
      </section>

      {/* Two Column Grid: Recent Games & Arena Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Matches */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Games</CardTitle>
                <p className="text-xs text-slate-400">Your latest competitive match history</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="text-xs">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {recentGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-background-elevated/70 border border-background-border hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2.5 h-9 rounded-full ${
                          game.result === 'WIN' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">vs {game.opponentUsername}</span>
                          <span className="text-[10px] bg-background-card px-1.5 py-0.5 rounded text-slate-400 font-mono">
                            {formatVariantShort(game.variant)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {game.date} • {formatDuration(game.durationSeconds)} • {game.movesCount} moves
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span
                          className={`text-sm font-black font-mono ${
                            game.result === 'WIN' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {game.ratingChange > 0 ? `+${game.ratingChange}` : game.ratingChange}
                        </span>
                        <p className="text-[11px] font-mono text-slate-400">{game.ratingAfter}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => navigate('/profile')} className="h-8 px-2 text-xs">
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live / Upcoming Arena Spotlight */}
        <div>
          <Card className="border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <Trophy className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Arena Tournaments</span>
              </div>
              <CardTitle className="text-base">Weekend 9-Piece Blitz Arena</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Fast-paced arena with unlimited pairings for 60 minutes. Top 3 players win exclusive profile badges.
              </p>

              <div className="space-y-2 text-xs text-slate-400 bg-background-elevated/70 p-3 rounded-xl border border-background-border">
                <div className="flex justify-between">
                  <span>Variant:</span>
                  <strong className="text-slate-200">9-Piece Mills</strong>
                </div>
                <div className="flex justify-between">
                  <span>Time Control:</span>
                  <strong className="text-slate-200">3 minutes</strong>
                </div>
                <div className="flex justify-between">
                  <span>Registered:</span>
                  <strong className="text-emerald-400">48 / 128 Players</strong>
                </div>
                <div className="flex justify-between">
                  <span>Starts In:</span>
                  <strong className="text-amber-400 font-mono">00:42:15</strong>
                </div>
              </div>

              <Button
                variant="amber"
                size="md"
                className="w-full gap-2"
                onClick={() => navigate('/tournaments')}
              >
                <Sparkles className="h-4 w-4" />
                Join Arena
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
