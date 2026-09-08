import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { RatingBadge } from '@/components/common/RatingBadge';
import { StatCard } from '@/components/common/StatCard';
import { Tabs } from '@/components/ui/Tabs';
import { GameRecord, UserProfile } from '@/lib/types';
import { formatVariantShort, formatDuration } from '@/lib/utils';
import { Trophy, Swords, Calendar, Award, TrendingUp, ShieldCheck, ExternalLink } from 'lucide-react';

export function ProfilePage() {
  const [activeHistoryTab, setActiveHistoryTab] = useState('all');

  // Sample User Profile for Phase 1
  const profile: UserProfile = {
    id: 'usr_1',
    username: 'PlayerOne',
    displayName: 'Alex Chen',
    bio: 'Competitive Mills enthusiast aiming for 2000+ rating in 9-Piece Men\'s Morris. Always open for 5-min challenges!',
    createdAt: 'August 2026',
    ratings: {
      mills3: 1247,
      mills6: 1382,
      mills9: 1516,
    },
    stats: {
      gamesPlayed: 172,
      wins: 98,
      losses: 62,
      draws: 12,
    }
  };

  const matchHistory: GameRecord[] = [
    {
      id: 'm1',
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
      id: 'm2',
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
      id: 'm3',
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
    },
    {
      id: 'm4',
      opponentUsername: 'GrandmasterKai',
      variant: 'MILLS_9',
      mode: 'RANKED',
      timeControl: '10_MIN',
      result: 'LOSS',
      ratingChange: -11,
      ratingAfter: 1498,
      date: '3 days ago',
      durationSeconds: 610,
      movesCount: 56,
    },
    {
      id: 'm5',
      opponentUsername: 'CobaltKnight',
      variant: 'MILLS_9',
      mode: 'CASUAL',
      timeControl: '5_MIN',
      result: 'DRAW',
      ratingChange: 0,
      ratingAfter: 1509,
      date: '4 days ago',
      durationSeconds: 420,
      movesCount: 50,
    }
  ];

  const winRate = Math.round((profile.stats.wins / profile.stats.gamesPlayed) * 100);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Profile Header Banner */}
      <div className="rounded-3xl border border-background-border bg-white p-4 sm:p-6 md:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          <Avatar name={profile.username} size="xl" status="online" className="shadow-md" />
          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-ink">{profile.displayName}</h1>
                <p className="text-sm font-mono text-primary font-bold">@{profile.username}</p>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Button size="sm" variant="secondary" className="text-xs">
                  Edit Profile
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  Share Profile
                </Button>
              </div>
            </div>

            <p className="text-xs md:text-sm text-ink-muted max-w-2xl leading-relaxed">{profile.bio}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-ink-muted pt-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-ink-light" /> Member since {profile.createdAt}
              </span>
              <span className="flex items-center gap-1 text-primary font-medium">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified Competitor
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings Across All 3 Variants */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2.5">
          Competitive Ratings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
          <Card className="hover:shadow-soft transition-all">
            <CardContent className="p-3.5 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink-muted uppercase">3-Piece Mills</p>
                <p className="text-2xl sm:text-3xl font-black text-ink font-mono mt-0.5 sm:mt-1">{profile.ratings.mills3}</p>
                <p className="text-[11px] text-primary font-semibold mt-0.5 sm:mt-1">Challenger Tier</p>
              </div>
              <RatingBadge rating={profile.ratings.mills3} size="md" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-soft transition-all">
            <CardContent className="p-3.5 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink-muted uppercase">6-Piece Mills</p>
                <p className="text-2xl sm:text-3xl font-black text-ink font-mono mt-0.5 sm:mt-1">{profile.ratings.mills6}</p>
                <p className="text-[11px] text-gold font-semibold mt-0.5 sm:mt-1">Challenger Tier</p>
              </div>
              <RatingBadge rating={profile.ratings.mills6} size="md" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-soft transition-all">
            <CardContent className="p-3.5 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink-muted uppercase">9-Piece Morris</p>
                <p className="text-2xl sm:text-3xl font-black text-ink font-mono mt-0.5 sm:mt-1">{profile.ratings.mills9}</p>
                <p className="text-[11px] text-[#8A6318] font-semibold mt-0.5 sm:mt-1">Expert Tier</p>
              </div>
              <RatingBadge rating={profile.ratings.mills9} size="md" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Lifetime Performance Statistics */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
          Performance Record
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Games"
            value={profile.stats.gamesPlayed}
            icon={<Swords className="h-5 w-5 text-ink-muted" />}
          />
          <StatCard
            label="Victories"
            value={profile.stats.wins}
            subValue={`${winRate}% Win Rate`}
            icon={<Trophy className="h-5 w-5 text-primary" />}
          />
          <StatCard
            label="Defeats"
            value={profile.stats.losses}
            subValue={`${Math.round((profile.stats.losses / profile.stats.gamesPlayed) * 100)}% Loss Rate`}
            icon={<TrendingUp className="h-5 w-5 text-alert-red" />}
          />
          <StatCard
            label="Draws"
            value={profile.stats.draws}
            icon={<Award className="h-5 w-5 text-gold" />}
          />
        </div>
      </section>

      {/* Match History Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-bold text-ink">Match History</CardTitle>
            <p className="text-xs text-ink-muted">Complete record of your past rated and casual matches</p>
          </div>
          <Tabs
            tabs={[
              { id: 'all', label: 'All' },
              { id: 'MILLS_9', label: '9-Piece' },
              { id: 'MILLS_6', label: '6-Piece' },
              { id: 'MILLS_3', label: '3-Piece' },
            ]}
            activeTab={activeHistoryTab}
            onChange={setActiveHistoryTab}
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {matchHistory
              .filter(m => activeHistoryTab === 'all' || m.variant === activeHistoryTab)
              .map((match) => (
                <div
                  key={match.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-background border border-background-border hover:border-ink/20 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-10 rounded-full shrink-0 ${
                        match.result === 'WIN' ? 'bg-primary' : match.result === 'LOSS' ? 'bg-alert-red' : 'bg-gold'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink">vs {match.opponentUsername}</span>
                        <span className="text-[10px] bg-white border border-background-border px-2 py-0.5 rounded text-ink-muted font-mono">
                          {formatVariantShort(match.variant)}
                        </span>
                        <span className="text-[10px] bg-white border border-background-border px-1.5 py-0.5 rounded text-ink-muted">
                          {match.mode}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {match.date} • {formatDuration(match.durationSeconds)} • {match.movesCount} moves
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-background-border pt-2 sm:pt-0">
                    <div className="text-right">
                      <span
                        className={`text-sm font-black font-mono ${
                          match.result === 'WIN' ? 'text-primary' : match.result === 'LOSS' ? 'text-alert-red' : 'text-[#8A6318]'
                        }`}
                      >
                        {match.ratingChange > 0 ? `+${match.ratingChange}` : match.ratingChange === 0 ? '±0' : match.ratingChange}
                      </span>
                      <p className="text-[11px] font-mono text-ink-light">Rating: {match.ratingAfter}</p>
                    </div>

                    <Button size="sm" variant="ghost" className="h-8 px-3 text-xs gap-1 text-ink-muted hover:text-ink">
                      Review <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
