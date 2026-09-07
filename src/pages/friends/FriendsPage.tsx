import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import { Friend, FriendRequest, GameVariant, TimeControl } from '@/lib/types';
import { Search, Swords, UserPlus, Check, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FriendsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [challengeFriend, setChallengeFriend] = useState<Friend | null>(null);
  const [challengeVariant, setChallengeVariant] = useState<GameVariant>('MILLS_9');
  const [challengeTimeControl, setChallengeTimeControl] = useState<TimeControl>('5_MIN');
  const [challengeSent, setChallengeSent] = useState(false);

  // Sample friends dataset for Phase 1
  const [friends, setFriends] = useState<Friend[]>([
    {
      id: 'f1',
      username: 'GrandmasterKai',
      displayName: 'Kai Tanaka',
      status: 'online',
      ratings: { mills3: 1920, mills6: 1920, mills9: 2145 },
    },
    {
      id: 'f2',
      username: 'TacticalEagle',
      displayName: 'Marcus Vance',
      status: 'in_game',
      ratings: { mills3: 1650, mills6: 2040, mills9: 1994 },
    },
    {
      id: 'f3',
      username: 'VortexStrategist',
      displayName: 'Liam O’Connor',
      status: 'online',
      ratings: { mills3: 1710, mills6: 1860, mills9: 1912 },
    },
    {
      id: 'f4',
      username: 'ShadowRook',
      displayName: 'Sophia Chen',
      status: 'offline',
      ratings: { mills3: 1540, mills6: 1975, mills9: 1874 },
    },
  ]);

  // Sample friend requests
  const [requests, setRequests] = useState<FriendRequest[]>([
    {
      id: 'r1',
      fromUser: {
        id: 'req1',
        username: 'SilentNomad',
        displayName: 'Tariq Al-Mansoor',
        status: 'online',
        ratings: { mills3: 1400, mills6: 1620, mills9: 1810 },
      },
      createdAt: '1 hour ago',
      status: 'pending',
    }
  ]);

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
    <div className="space-y-8 animate-in fade-in duration-200">
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
              icon={<UserPlus className="h-8 w-8 text-slate-400" />}
              title="No Pending Friend Requests"
              description="When other players send you a friend invitation, it will appear here."
            />
          ) : (
            requests.map((req) => (
              <Card key={req.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={req.fromUser.username} status={req.fromUser.status} />
                    <div>
                      <h4 className="font-bold text-white text-sm">{req.fromUser.username}</h4>
                      <p className="text-xs text-slate-400">{req.fromUser.displayName} • Requested {req.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="primary" onClick={() => handleAcceptRequest(req.id)} className="h-9 gap-1.5">
                      <Check className="h-4 w-4" /> Accept
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeclineRequest(req.id)} className="h-9">
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
                icon={<Search className="h-8 w-8 text-slate-400" />}
                title="No Friends Found"
                description={searchQuery ? `No players found matching "${searchQuery}".` : "You haven't added any friends yet."}
              />
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <Card key={friend.id} className="hover:border-slate-600 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={friend.username} status={friend.status} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm truncate">{friend.username}</h4>
                        <span className="text-[10px] text-slate-400 capitalize">
                          ({friend.status.replace('_', ' ')})
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{friend.displayName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-mono text-amber-400 font-bold">
                          9M: {friend.ratings.mills9}
                        </span>
                        <span className="text-[11px] font-mono text-sky-400">
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
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">Challenge Sent!</h3>
              <p className="text-xs text-slate-400">Waiting for {challengeFriend.username} to accept...</p>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Variant</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['MILLS_3', 'MILLS_6', 'MILLS_9'] as GameVariant[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setChallengeVariant(v)}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                        challengeVariant === v
                          ? "border-primary bg-background-elevated text-primary"
                          : "border-background-border text-slate-400 hover:text-white"
                      )}
                    >
                      {v === 'MILLS_3' ? '3-Piece' : v === 'MILLS_6' ? '6-Piece' : '9-Piece'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Time Control</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['3_MIN', '5_MIN', '10_MIN', 'UNTIMED'] as TimeControl[]).map((tc) => (
                    <button
                      key={tc}
                      type="button"
                      onClick={() => setChallengeTimeControl(tc)}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-2",
                        challengeTimeControl === tc
                          ? "border-primary bg-background-elevated text-primary"
                          : "border-background-border text-slate-400 hover:text-white"
                      )}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {tc.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-background-border flex gap-2">
                <Button variant="ghost" onClick={() => setChallengeFriend(null)} className="flex-1">
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
