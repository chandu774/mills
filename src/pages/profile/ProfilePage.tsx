import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { RatingBadge } from '@/components/common/RatingBadge';
import { StatCard } from '@/components/common/StatCard';
import { Tabs } from '@/components/ui/Tabs';
import { GameRecord, UserProfile } from '@/lib/types';
import { formatVariantShort, formatDuration } from '@/lib/utils';
import { Trophy, Swords, Calendar, Award, TrendingUp, ShieldCheck, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [activeHistoryTab, setActiveHistoryTab] = useState('all');
  const [matchHistory, setMatchHistory] = useState<GameRecord[]>([]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Active or Fallback profile (never hardcoded fake user)
  const currentProfile: UserProfile = profile || {
    id: user?.id || 'guest',
    username: user ? 'Player' : 'Guest',
    displayName: user ? 'Registered Player' : 'Guest Player',
    bio: user
      ? 'Competitive Mills player.'
      : 'Playing as Guest. Connect database and sign in to customize profile and preserve ratings.',
    createdAt: 'Joined today',
    ratings: {
      mills3: 1200,
      mills6: 1200,
      mills9: 1200,
    },
    stats: {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    },
  };

  useEffect(() => {
    async function fetchMatchHistory() {
      if (!isSupabaseConfigured() || !supabase || !user) {
        setMatchHistory([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('games')
          .select('id, variant, mode, time_control, status, winner_id, win_reason, created_at, started_at, ended_at, moves_count, white:white_player_id(id, username, display_name), black:black_player_id(id, username, display_name)')
          .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
          .eq('status', 'FINISHED')
          .order('ended_at', { ascending: false })
          .limit(20);

        if (data && !error) {
          const records: GameRecord[] = data.map((g: any) => {
            const isWhite = g.white?.id === user.id;
            const opponent = isWhite ? g.black : g.white;
            const didWin = g.winner_id === user.id;
            const isDraw = !g.winner_id;
            const duration = g.started_at && g.ended_at
              ? Math.max(1, Math.round((new Date(g.ended_at).getTime() - new Date(g.started_at).getTime()) / 1000))
              : 60;

            return {
              id: g.id,
              opponentUsername: opponent?.username || opponent?.display_name || 'Opponent',
              variant: g.variant,
              mode: g.mode,
              timeControl: g.time_control,
              result: didWin ? 'WIN' : isDraw ? 'DRAW' : 'LOSS',
              ratingChange: didWin ? 16 : isDraw ? 0 : -16,
              ratingAfter: 1200,
              date: new Date(g.ended_at || g.created_at).toLocaleDateString(),
              durationSeconds: duration,
              movesCount: g.moves_count || 0,
            };
          });
          setMatchHistory(records);
        } else {
          setMatchHistory([]);
        }
      } catch (err) {
        console.warn('[ProfilePage] Error fetching games:', err);
        setMatchHistory([]);
      }
    }

    fetchMatchHistory();
  }, [user?.id]);

  const winRate = currentProfile.stats.gamesPlayed > 0
    ? Math.round((currentProfile.stats.wins / currentProfile.stats.gamesPlayed) * 100)
    : 0;
  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Profile Header Banner */}
      <div className="rounded-3xl border border-background-border bg-white p-4 sm:p-6 md:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          <Avatar name={currentProfile.username} size="xl" status={user ? 'online' : 'offline'} className="shadow-md" />
          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-ink">{currentProfile.displayName}</h1>
                <p className="text-sm font-mono text-primary font-bold">@{currentProfile.username}</p>
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

            <p className="text-xs md:text-sm text-ink-muted max-w-2xl leading-relaxed">{currentProfile.bio}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-ink-muted pt-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-ink-light" /> Member since {currentProfile.createdAt}
              </span>
              <span className="flex items-center gap-1 text-primary font-medium">
                <ShieldCheck className="h-3.5 w-3.5" /> {user ? 'Verified Competitor' : 'Guest Account'}
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
                <p className="text-2xl sm:text-3xl font-black text-ink font-mono mt-0.5 sm:mt-1">{currentProfile.ratings.mills3}</p>
                <p className="text-[11px] text-primary font-semibold mt-0.5 sm:mt-1">Standard Rating</p>
              </div>
              <RatingBadge rating={currentProfile.ratings.mills3} size="md" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-soft transition-all">
            <CardContent className="p-3.5 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink-muted uppercase">6-Piece Mills</p>
                <p className="text-2xl sm:text-3xl font-black text-ink font-mono mt-0.5 sm:mt-1">{currentProfile.ratings.mills6}</p>
                <p className="text-[11px] text-gold font-semibold mt-0.5 sm:mt-1">Standard Rating</p>
              </div>
              <RatingBadge rating={currentProfile.ratings.mills6} size="md" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-soft transition-all">
            <CardContent className="p-3.5 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink-muted uppercase">9-Piece Morris</p>
                <p className="text-2xl sm:text-3xl font-black text-ink font-mono mt-0.5 sm:mt-1">{currentProfile.ratings.mills9}</p>
                <p className="text-[11px] text-[#8A6318] font-semibold mt-0.5 sm:mt-1">Standard Rating</p>
              </div>
              <RatingBadge rating={currentProfile.ratings.mills9} size="md" />
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
            value={currentProfile.stats.gamesPlayed}
            icon={<Swords className="h-5 w-5 text-ink-muted" />}
          />
          <StatCard
            label="Victories"
            value={currentProfile.stats.wins}
            subValue={`${winRate}% Win Rate`}
            icon={<Trophy className="h-5 w-5 text-primary" />}
          />
          <StatCard
            label="Defeats"
            value={currentProfile.stats.losses}
            subValue={`${currentProfile.stats.gamesPlayed > 0 ? Math.round((currentProfile.stats.losses / currentProfile.stats.gamesPlayed) * 100) : 0}% Loss Rate`}
            icon={<TrendingUp className="h-5 w-5 text-alert-red" />}
          />
          <StatCard
            label="Draws"
            value={currentProfile.stats.draws}
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
            {matchHistory.length === 0 ? (
              <div className="p-8 text-center bg-background/50 rounded-2xl border border-background-border">
                <p className="text-sm font-semibold text-ink-muted">No matches recorded yet</p>
                <p className="text-xs text-ink-light mt-1">Play an online or ranked game to log moves and track your ELO rating!</p>
              </div>
            ) : (
              matchHistory
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
