import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { RatingBadge } from '@/components/common/RatingBadge';
import { GameVariant, LeaderboardEntry } from '@/lib/types';
import { Crown, Medal, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function LeaderboardPage() {
  const { user } = useAuth();
  const [activeVariant, setActiveVariant] = useState<GameVariant>('MILLS_9');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    async function loadLeaderboard() {
      if (!isSupabaseConfigured() || !supabase) {
        if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_LOCAL_MOCK === 'true') {
          setEntries([
            { rank: 1, username: 'MockLeader', displayName: 'Dev Lead', rating: 1500, gamesCount: 10, winRate: 70 },
          ]);
        } else {
          setEntries([]);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('ratings')
          .select('rating, games_played, wins, user_id, profiles:user_id(id, username, display_name, avatar_url)')
          .eq('variant', activeVariant)
          .gt('games_played', 0)
          .order('rating', { ascending: false })
          .limit(50);

        if (data && !error) {
          const mapped: LeaderboardEntry[] = data.map((row: any, idx: number) => {
            const prof = row.profiles;
            const games = row.games_played || 0;
            const wins = row.wins || 0;
            const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;
            return {
              rank: idx + 1,
              username: prof?.username || 'Player',
              displayName: prof?.display_name || prof?.username || 'Player',
              rating: row.rating,
              gamesCount: games,
              winRate,
              isCurrentUser: user?.id === row.user_id,
            };
          });
          setEntries(mapped);
        } else {
          setEntries([]);
        }
      } catch (err) {
        console.warn('[Leaderboard] Error loading ratings:', err);
        setEntries([]);
      }
    }

    loadLeaderboard();
  }, [activeVariant, user?.id]);

  const currentList = entries;
  const currentUserEntry = currentList.find((e) => e.isCurrentUser);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold text-[#1E140C] font-black shadow-soft">
          <Crown className="h-4 w-4 fill-current" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#D5C9BD] text-[#1E140C] font-black shadow-soft">
          <Medal className="h-4 w-4" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#B88225]/40 text-[#4A3423] font-black shadow-soft">
          <Medal className="h-4 w-4" />
        </div>
      );
    }
    return <span className="font-mono font-bold text-sm text-ink-muted">#{rank}</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="Global Leaderboards"
        subtitle="The highest-rated competitive Mills players in the world. Updated dynamically after every ranked match."
      />

      <Tabs
        tabs={[
          { id: 'MILLS_9', label: "9-Piece Morris" },
          { id: 'MILLS_6', label: '6-Piece Mills' },
          { id: 'MILLS_3', label: '3-Piece Mills' },
        ]}
        activeTab={activeVariant}
        onChange={(id) => setActiveVariant(id as GameVariant)}
      />

      {/* Empty / Disconnected State */}
      {currentList.length === 0 ? (
        <Card className="p-8 text-center bg-white border-background-border shadow-soft rounded-3xl">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-500/10 text-amber-700 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-ink">
            {isSupabaseConfigured() ? 'No Ranked Matches Yet' : 'Database Not Connected'}
          </h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto mt-1 leading-relaxed">
            {isSupabaseConfigured()
              ? `No ranked matches have been completed for ${activeVariant.replace('_', ' ')} yet. Play the first ranked match to take #1 on the leaderboard!`
              : 'Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local to load live competitive rankings.'}
          </p>
        </Card>
      ) : (
        <>
          {/* Top 3 Podium Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {currentList.slice(0, 3).map((player) => (
              <Card
                key={player.username}
                className={cn(
                  "relative overflow-hidden border transition-all text-center",
                  player.rank === 1
                    ? "border-gold/50 bg-gradient-to-b from-[#FAF4E8] to-white shadow-soft md:-translate-y-2"
                    : "border-background-border bg-white shadow-soft"
                )}
              >
                <div className="p-6 flex flex-col items-center">
                  <div className="mb-3 relative">
                    <Avatar name={player.username} size="lg" />
                    <div className="absolute -bottom-2 -right-2">
                      {getRankBadge(player.rank)}
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-ink">{player.username}</h3>
                  <p className="text-xs text-ink-muted">{player.displayName}</p>
                  <div className="mt-3">
                    <RatingBadge rating={player.rating} showTier size="md" />
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-4 text-xs text-ink-muted border-t border-background-border pt-3 w-full">
                    <span>{player.gamesCount} games</span>
                    <span>•</span>
                    <span className="text-primary font-bold">{player.winRate}% win rate</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Full Leaderboard Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-background-elevated text-ink-muted text-xs font-semibold uppercase tracking-wider border-b border-background-border">
                    <tr>
                      <th className="py-3.5 px-4 text-center w-16">Rank</th>
                      <th className="py-3.5 px-4">Player</th>
                      <th className="py-3.5 px-4 text-center">Rating</th>
                      <th className="py-3.5 px-4 text-center">Games</th>
                      <th className="py-3.5 px-4 text-right">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-background-border">
                    {currentList.map((entry) => (
                      <tr
                        key={entry.username}
                        className={cn(
                          "transition-colors",
                          entry.isCurrentUser
                            ? "bg-primary/[0.04] hover:bg-primary/[0.08] font-bold border-l-4 border-l-primary"
                            : "hover:bg-background-elevated/40"
                        )}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center">{getRankBadge(entry.rank)}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={entry.username} size="sm" />
                            <div>
                              <span className={cn("font-bold", entry.isCurrentUser ? "text-primary" : "text-ink")}>
                                {entry.username} {entry.isCurrentUser && '(You)'}
                              </span>
                              <p className="text-xs text-ink-muted font-normal">{entry.displayName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono font-bold text-ink text-base">{entry.rating}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-ink-muted">
                          {entry.gamesCount}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-mono font-bold text-primary">{entry.winRate}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* User Standing Spotlight */}
          {currentUserEntry && (
            <div className="p-4 rounded-2xl bg-white border border-primary/30 flex items-center justify-between shadow-soft">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary font-mono font-black text-sm">
                  #{currentUserEntry.rank}
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Your Current Standing in {activeVariant.replace('_', ' ')}</p>
                  <h4 className="text-sm font-bold text-ink">Keep playing ranked games to enter the Top 20!</h4>
                </div>
              </div>
              <RatingBadge rating={currentUserEntry.rating} size="lg" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
