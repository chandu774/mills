import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Tournament } from '@/lib/types';
import { formatVariantShort, formatTimeControl } from '@/lib/utils';
import { Trophy, Clock, Users, Flame, CheckCircle, ArrowRight, Database } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export function TournamentsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    async function loadTournaments() {
      if (!isSupabaseConfigured() || !supabase) {
        if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_LOCAL_MOCK === 'true') {
          setTournaments([
            {
              id: 'mock_t1',
              name: 'Dev Arena 9-Piece',
              description: 'Local development mock tournament',
              variant: 'MILLS_9',
              timeControl: '3_MIN',
              type: 'ARENA',
              status: 'UPCOMING',
              startTime: 'Today, 6:00 PM',
              endTime: 'Today, 7:00 PM',
              maxPlayers: 32,
              currentPlayers: 4,
              userJoined: false,
            },
          ]);
        } else {
          setTournaments([]);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .order('start_time', { ascending: true });

        if (data && !error) {
          const mapped: Tournament[] = data.map((t: any) => ({
            id: t.id,
            name: t.title || t.name,
            description: t.description || '',
            variant: t.variant,
            timeControl: t.time_control,
            type: t.type || 'ARENA',
            status: t.status || 'UPCOMING',
            startTime: t.start_time ? new Date(t.start_time).toLocaleString() : 'Scheduled',
            endTime: t.end_time ? new Date(t.end_time).toLocaleString() : 'TBD',
            maxPlayers: t.max_players || 64,
            currentPlayers: 0,
            userJoined: false,
          }));
          setTournaments(mapped);
        } else {
          setTournaments([]);
        }
      } catch (err) {
        console.warn('[Tournaments] Error fetching tournaments:', err);
        setTournaments([]);
      }
    }

    loadTournaments();
  }, []);

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

      {/* Database Connection Notice */}
      {!isSupabaseConfigured() && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <Database className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold block">Database not connected</span>
            Configure <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px]">VITE_SUPABASE_URL</code> and <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px]">VITE_SUPABASE_ANON_KEY</code> in <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px]">.env.local</code> to fetch live scheduled tournaments and sync brackets.
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <Tabs
        tabs={[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'live', label: 'Live Arenas' },
          { id: 'finished', label: 'Completed' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tournament Cards Grid or Empty State */}
      {filteredTournaments.length === 0 ? (
        <div className="p-8 text-center bg-white border border-background-border rounded-3xl shadow-soft">
          <Trophy className="w-10 h-10 mx-auto text-ink-muted mb-2 opacity-50" />
          <h3 className="font-bold text-ink text-base">
            {isSupabaseConfigured() ? `No ${activeTab} tournaments` : 'Database Not Connected'}
          </h3>
          <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
            {isSupabaseConfigured()
              ? `There are currently no ${activeTab} arena tournaments. Check back soon for upcoming events!`
              : 'Connect Supabase in .env.local to load live competitive tournament schedules and brackets.'}
          </p>
        </div>
      ) : (
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
      )}

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
