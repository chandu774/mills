import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Tournament } from '@/lib/types';
import { formatVariantShort, formatTimeControl } from '@/lib/utils';
import { Trophy, Clock, Users, Flame, CheckCircle, ArrowRight } from 'lucide-react';

export function TournamentsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  // Sample tournaments data for Phase 1
  const [tournaments, setTournaments] = useState<Tournament[]>([
    {
      id: 't1',
      name: 'Weekend 9-Piece Arena Blitz',
      description: '1-hour continuous arena. Win consecutive games to earn streak bonuses! All rating levels welcome.',
      variant: 'MILLS_9',
      timeControl: '3_MIN',
      type: 'ARENA',
      status: 'UPCOMING',
      startTime: 'Today, 6:00 PM',
      endTime: 'Today, 7:00 PM',
      maxPlayers: 128,
      currentPlayers: 54,
      userJoined: false,
      standings: [
        { rank: 1, username: 'GrandmasterKai', rating: 1940, score: 32, gamesPlayed: 11, wins: 9, losses: 1, draws: 1 },
        { rank: 2, username: 'MillEmperor', rating: 1885, score: 28, gamesPlayed: 10, wins: 8, losses: 2, draws: 0 },
        { rank: 3, username: 'TacticalEagle', rating: 1720, score: 22, gamesPlayed: 9, wins: 6, losses: 2, draws: 1 },
        { rank: 4, username: 'VortexStrategist', rating: 1650, score: 18, gamesPlayed: 8, wins: 5, losses: 3, draws: 0 },
      ]
    },
    {
      id: 't2',
      name: 'Daily 6-Piece Rapid Clash',
      description: 'Battle in 6-Piece Mills with 5-minute clocks. Fast tactical mills and tight positioning.',
      variant: 'MILLS_6',
      timeControl: '5_MIN',
      type: 'ARENA',
      status: 'LIVE',
      startTime: 'Live Now',
      endTime: 'Ends in 24 mins',
      maxPlayers: 64,
      currentPlayers: 42,
      userJoined: true,
      standings: [
        { rank: 1, username: 'ShadowRook', rating: 1750, score: 18, gamesPlayed: 6, wins: 5, losses: 1, draws: 0 },
        { rank: 2, username: 'PlayerOne', rating: 1382, score: 14, gamesPlayed: 5, wins: 4, losses: 1, draws: 0 },
        { rank: 3, username: 'CobaltKnight', rating: 1410, score: 10, gamesPlayed: 5, wins: 3, losses: 2, draws: 0 },
      ]
    },
    {
      id: 't3',
      name: 'Speed 3-Piece Championship',
      description: 'Ultra fast 3-piece mills. 3 minutes untimed turns. Perfect for lightning reaction time.',
      variant: 'MILLS_3',
      timeControl: '3_MIN',
      type: 'ARENA',
      status: 'UPCOMING',
      startTime: 'Tomorrow, 2:00 PM',
      endTime: 'Tomorrow, 3:00 PM',
      maxPlayers: 64,
      currentPlayers: 19,
      userJoined: false,
    },
    {
      id: 't4',
      name: 'Friday Night Morris Masters',
      description: 'Completed 9-Piece championship arena. 86 players competed.',
      variant: 'MILLS_9',
      timeControl: '5_MIN',
      type: 'ARENA',
      status: 'FINISHED',
      startTime: 'Friday, Sep 4',
      endTime: 'Completed',
      maxPlayers: 100,
      currentPlayers: 86,
      userJoined: false,
      standings: [
        { rank: 1, username: 'VortexStrategist', rating: 1845, score: 44, gamesPlayed: 14, wins: 12, losses: 1, draws: 1 },
        { rank: 2, username: 'GrandmasterKai', rating: 1930, score: 39, gamesPlayed: 13, wins: 11, losses: 2, draws: 0 },
        { rank: 3, username: 'MillEmperor', rating: 1860, score: 34, gamesPlayed: 12, wins: 9, losses: 2, draws: 1 },
      ]
    }
  ]);

  const filteredTournaments = tournaments.filter((t) => {
    if (activeTab === 'upcoming') return t.status === 'UPCOMING';
    if (activeTab === 'live') return t.status === 'LIVE';
    if (activeTab === 'finished') return t.status === 'FINISHED';
    return true;
  });

  const toggleJoin = (id: string) => {
    setTournaments((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextJoined = !t.userJoined;
          return {
            ...t,
            userJoined: nextJoined,
            currentPlayers: nextJoined ? t.currentPlayers + 1 : t.currentPlayers - 1,
          };
        }
        return t;
      })
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Tournaments Hub"
        subtitle="Compete in scheduled Arena tournaments, earn championship points, and climb the leaderboard."
      />

      <Tabs
        tabs={[
          { id: 'upcoming', label: 'Upcoming', count: tournaments.filter(t => t.status === 'UPCOMING').length },
          { id: 'live', label: 'Live Arenas', count: tournaments.filter(t => t.status === 'LIVE').length },
          { id: 'finished', label: 'Past Arenas', count: tournaments.filter(t => t.status === 'FINISHED').length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tournament Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTournaments.map((t) => {
          const isLive = t.status === 'LIVE';
          return (
            <Card
              key={t.id}
              className={isLive ? "border-primary/40 bg-gradient-to-br from-primary/[0.03] to-white shadow-soft" : "hover:shadow-soft transition-all"}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={isLive ? 'success' : t.status === 'UPCOMING' ? 'amber' : 'default'}>
                      {isLive && <Flame className="h-3 w-3 mr-1 fill-current" />}
                      {t.status}
                    </Badge>
                    <span className="text-xs font-mono text-ink-muted bg-background-elevated px-2 py-0.5 rounded border border-background-border">
                      {formatVariantShort(t.variant)}
                    </span>
                  </div>
                  <span className="text-xs text-ink-muted flex items-center gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTimeControl(t.timeControl)}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-ink">{t.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 pb-3">
                <p className="text-xs text-ink-muted leading-relaxed">{t.description}</p>
                <div className="flex items-center justify-between text-xs text-ink-muted pt-2.5 border-t border-background-border">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-ink-light" />
                    <strong className="text-ink font-semibold">{t.currentPlayers}</strong> / {t.maxPlayers} players
                  </span>
                  <span>{t.startTime}</span>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between gap-3 pt-3 border-t border-background-border">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedTournament(t)}
                  className="text-xs gap-1 text-ink-muted hover:text-ink"
                >
                  View Details & Standings <ArrowRight className="h-3.5 w-3.5" />
                </Button>

                {t.status !== 'FINISHED' && (
                  <Button
                    size="sm"
                    variant={t.userJoined ? 'outline' : 'primary'}
                    onClick={() => toggleJoin(t.id)}
                    className="text-xs font-bold"
                  >
                    {t.userJoined ? (
                      <span className="flex items-center gap-1 text-primary">
                        <CheckCircle className="h-3.5 w-3.5" /> Registered
                      </span>
                    ) : (
                      'Register Now'
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Tournament Details & Standings Modal */}
      {selectedTournament && (
        <Modal
          isOpen={Boolean(selectedTournament)}
          onClose={() => setSelectedTournament(null)}
          title={selectedTournament.name}
          description={`${formatVariantShort(selectedTournament.variant)} • ${formatTimeControl(selectedTournament.timeControl)} • ${selectedTournament.status}`}
        >
          <div className="space-y-5 mt-2">
            <p className="text-xs text-ink-muted leading-relaxed">{selectedTournament.description}</p>

            <div className="grid grid-cols-2 gap-3 text-xs bg-background-elevated p-3.5 rounded-xl border border-background-border">
              <div>
                <span className="text-ink-muted">Format:</span>
                <p className="font-bold text-ink mt-0.5">Arena (Continuous Pairings)</p>
              </div>
              <div>
                <span className="text-ink-muted">Scoring:</span>
                <p className="font-bold text-ink mt-0.5">Win: 2 pts • Draw: 1 pt • Loss: 0 pt</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-ink mb-2.5 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gold" /> Standings Table
              </h4>
              <div className="overflow-x-auto rounded-xl border border-background-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-background-elevated text-ink-muted font-semibold border-b border-background-border">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Player</th>
                      <th className="py-2.5 px-3">Rating</th>
                      <th className="py-2.5 px-3 text-center">Score</th>
                      <th className="py-2.5 px-3 text-right">W - L - D</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-background-border">
                    {(selectedTournament.standings || []).map((s) => (
                      <tr key={s.username} className="hover:bg-background-elevated/40">
                        <td className="py-2.5 px-3 font-bold text-ink">#{s.rank}</td>
                        <td className="py-2.5 px-3 font-bold text-ink">{s.username}</td>
                        <td className="py-2.5 px-3 font-mono text-ink-muted">{s.rating}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-gold font-mono text-sm">{s.score}</td>
                        <td className="py-2.5 px-3 text-right text-ink-muted">
                          {s.wins}W - {s.losses}L - {s.draws}D
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedTournament.status !== 'FINISHED' && (
              <Button
                variant={selectedTournament.userJoined ? 'outline' : 'primary'}
                className="w-full font-bold"
                onClick={() => {
                  toggleJoin(selectedTournament.id);
                  setSelectedTournament(prev => prev ? { ...prev, userJoined: !prev.userJoined } : null);
                }}
              >
                {selectedTournament.userJoined ? 'Leave Tournament' : 'Join Arena Tournament'}
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
