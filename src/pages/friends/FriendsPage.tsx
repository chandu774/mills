import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import { Friend, FriendRequest, GameVariant, TimeControl } from '@/lib/types';
import { Search, Swords, UserPlus, Check, X, Clock, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export function FriendsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [challengeFriend, setChallengeFriend] = useState<Friend | null>(null);
  const [challengeVariant, setChallengeVariant] = useState<GameVariant>('MILLS_9');
  const [challengeTimeControl, setChallengeTimeControl] = useState<TimeControl>('5_MIN');
  const [challengeSent, setChallengeSent] = useState(false);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    async function loadFriends() {
      if (!isSupabaseConfigured() || !supabase || !user) {
        if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_LOCAL_MOCK === 'true') {
          setFriends([
            {
              id: 'mock_f1',
              username: 'DevFriend',
              displayName: 'Dev Friend',
              status: 'online',
              ratings: { mills3: 1200, mills6: 1200, mills9: 1200 },
            },
          ]);
        } else {
          setFriends([]);
          setRequests([]);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('friendships')
          .select('id, friend:friend_id(id, username, display_name, avatar_url), status')
          .eq('user_id', user.id);

        if (data && !error) {
          const mapped: Friend[] = data.map((f: any) => ({
            id: f.friend?.id || f.id,
            username: f.friend?.username || 'Player',
            displayName: f.friend?.display_name || f.friend?.username || 'Player',
            status: 'offline',
            ratings: { mills3: 1200, mills6: 1200, mills9: 1200 },
          }));
          setFriends(mapped);
        } else {
          setFriends([]);
        }
      } catch (err) {
        console.warn('[FriendsPage] Error loading friends:', err);
        setFriends([]);
      }
    }

    loadFriends();
  }, [user?.id]);

  const filteredFriends = friends.filter((f) => {
    const matchesSearch = f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'online') return f.status === 'online' || f.status === 'in_game';
    return true;
  });

  const handleAcceptRequest = (reqId: string) => {
    const req = requests.find(r => r.id === reqId);
    if (req) {
      setFriends(prev => [...prev, req.fromUser]);
      setRequests(prev => prev.filter(r => r.id !== reqId));
    }
  };

  const handleDeclineRequest = (reqId: string) => {
    setRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const handleSendChallenge = () => {
    setChallengeSent(true);
    setTimeout(() => {
      setChallengeSent(false);
      setChallengeFriend(null);
    }, 1500);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Friends & Social"
        subtitle="Connect with rivals, challenge friends directly to any variant, and track their online status."
        actions={
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
        }
      />

      {/* Database Connection Notice */}
      {!isSupabaseConfigured() && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <Database className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold block">Database not connected</span>
            Configure <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px]">VITE_SUPABASE_URL</code> and <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px]">VITE_SUPABASE_ANON_KEY</code> in <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px]">.env.local</code> to add friends and sync friend challenges across devices.
          </div>
        </div>
      )}

      <Tabs
        tabs={[
          { id: 'all', label: 'All Friends', count: friends.length },
          { id: 'online', label: 'Online Now', count: friends.filter(f => f.status !== 'offline').length },
          { id: 'requests', label: 'Friend Requests', count: requests.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'requests' ? (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="h-8 w-8 text-ink-muted" />}
              title="No Pending Friend Requests"
              description="When other players send you a friend invitation, it will appear here."
            />
          ) : (
            requests.map((req) => (
              <Card key={req.id}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={req.fromUser.username} status={req.fromUser.status} />
                    <div className="min-w-0">
                      <h4 className="font-bold text-ink text-sm truncate">{req.fromUser.username}</h4>
                      <p className="text-xs text-ink-muted truncate">{req.fromUser.displayName} • Requested {req.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="primary" onClick={() => handleAcceptRequest(req.id)} className="h-9 gap-1.5 font-bold">
                      <Check className="h-4 w-4" /> Accept
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeclineRequest(req.id)} className="h-9 text-ink-muted hover:text-ink">
                      <X className="h-4 w-4" /> Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFriends.length === 0 ? (
            <div className="col-span-2">
              <EmptyState
                icon={<Search className="h-8 w-8 text-ink-muted" />}
                title="No Friends Found"
                description={searchQuery ? `No players found matching "${searchQuery}".` : "You haven't added any friends yet."}
              />
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <Card key={friend.id} className="hover:border-ink/20 transition-all hover:shadow-soft">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={friend.username} status={friend.status} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-ink text-sm truncate">{friend.username}</h4>
                        <span className="text-[10px] text-ink-light capitalize">
                          ({friend.status.replace('_', ' ')})
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted truncate">{friend.displayName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-mono font-bold text-[#8A6318] bg-gold/10 px-1.5 py-0.5 rounded">
                          9M: {friend.ratings.mills9}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          6M: {friend.ratings.mills6}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={friend.status === 'offline' ? 'outline' : 'primary'}
                    onClick={() => setChallengeFriend(friend)}
                    className="h-9 gap-1.5 shrink-0 text-xs font-bold"
                  >
                    <Swords className="h-4 w-4" />
                    Challenge
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Challenge Configuration Modal */}
      {challengeFriend && (
        <Modal
          isOpen={Boolean(challengeFriend)}
          onClose={() => setChallengeFriend(null)}
          title={`Challenge ${challengeFriend.username}`}
          description="Configure the match settings and send an instant direct invitation."
        >
          {challengeSent ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center mb-2">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-ink">Challenge Sent!</h3>
              <p className="text-xs text-ink-muted">Waiting for {challengeFriend.username} to accept...</p>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2 block">Variant</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['MILLS_3', 'MILLS_6', 'MILLS_9'] as GameVariant[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setChallengeVariant(v)}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                        challengeVariant === v
                          ? "border-primary bg-primary/[0.06] text-primary shadow-soft ring-1 ring-primary"
                          : "border-background-border bg-white text-ink-muted hover:text-ink"
                      )}
                    >
                      {v === 'MILLS_3' ? '3-Piece' : v === 'MILLS_6' ? '6-Piece' : '9-Piece'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2 block">Time Control</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['3_MIN', '5_MIN', '10_MIN', 'UNTIMED'] as TimeControl[]).map((tc) => (
                    <button
                      key={tc}
                      type="button"
                      onClick={() => setChallengeTimeControl(tc)}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-2",
                        challengeTimeControl === tc
                          ? "border-primary bg-primary/[0.06] text-primary shadow-soft ring-1 ring-primary"
                          : "border-background-border bg-white text-ink-muted hover:text-ink"
                      )}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {tc.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-background-border flex gap-2">
                <Button variant="ghost" onClick={() => setChallengeFriend(null)} className="flex-1 text-ink-muted hover:text-ink">
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSendChallenge} className="flex-1 font-bold gap-2">
                  <Swords className="h-4 w-4" /> Send Challenge
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
