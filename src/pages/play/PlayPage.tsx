import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GameVariant, GameMode, TimeControl } from '@/lib/types';
import { VariantCard } from '@/components/common/VariantCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/common/PageHeader';
import { Play, Swords, UserCheck, Shield, Clock, Copy, Check, KeyRound, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { gameService } from '@/services/games/gameService';
import { useAuth } from '@/hooks/useAuth';

export function PlayPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const queryVariant = searchParams.get('variant') as GameVariant;
  const [selectedVariant, setSelectedVariant] = useState<GameVariant>(
    queryVariant && ['MILLS_3', 'MILLS_6', 'MILLS_9'].includes(queryVariant) ? queryVariant : 'MILLS_9'
  );

  const [selectedMode, setSelectedMode] = useState<GameMode>('RANKED');
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>('5_MIN');
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [privateLinkCopied, setPrivateLinkCopied] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearchingMatch) {
      interval = setInterval(() => {
        setSearchSeconds((s) => s + 1);
      }, 1000);
    } else {
      setSearchSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isSearchingMatch]);

  const handleStartGame = async () => {
    if (selectedMode === 'PRIVATE') {
      setIsCreatingRoom(true);
      try {
        const room = await gameService.createRoom({
          variant: selectedVariant,
          timeControl: selectedTimeControl,
          mode: 'PRIVATE',
          hostPlayer: {
            id: user?.id || 'host_' + Math.random().toString(36).substring(2, 7),
            displayName: profile?.displayName || profile?.username || 'Player 1',
            avatarUrl: profile?.avatarUrl,
            preferredColor: 'WHITE',
          },
        });
        navigate(`/game?room=${room.id}&variant=${selectedVariant}&time=${selectedTimeControl}`);
      } catch (err) {
        console.error('Failed to create room:', err);
      } finally {
        setIsCreatingRoom(false);
      }
      return;
    }

    if (selectedMode === 'FRIEND') {
      navigate('/friends');
      return;
    }

    // Default: Local Pass & Play or Instant Match
    navigate(`/game?variant=${selectedVariant}&time=${selectedTimeControl}&mode=${selectedMode}`);
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) {
      setJoinError('Please enter a room code');
      return;
    }

    try {
      const room = await gameService.getRoom(code);
      if (!room) {
        // Allow joining directly with code as room ID
        navigate(`/game?room=${code}&variant=${selectedVariant}`);
        setShowJoinModal(false);
        return;
      }
      navigate(`/game?room=${room.id}&variant=${room.variant}&time=${room.timeControl}`);
      setShowJoinModal(false);
    } catch {
      setJoinError('Could not find room with this code.');
    }
  };

  const handleCopyPrivateLink = () => {
    const code = gameService.generateRoomCode();
    const url = `${window.location.origin}/game?room=MILLS-${code}&variant=${selectedVariant}&time=${selectedTimeControl}`;
    navigator.clipboard.writeText(url);
    setPrivateLinkCopied(true);
    setTimeout(() => setPrivateLinkCopied(false), 2000);
  };

  const modes: { id: GameMode; label: string; icon: any; desc: string }[] = [
    { id: 'RANKED', label: 'Ranked Match', icon: Swords, desc: 'Play for ELO rating and climb the leaderboards' },
    { id: 'CASUAL', label: 'Casual Game', icon: Shield, desc: 'Friendly unrated match with standard rules' },
    { id: 'PRIVATE', label: 'Private Room', icon: UserCheck, desc: 'Generate a room code or link to play online' },
    { id: 'LOCAL', label: 'Pass & Play', icon: Monitor, desc: 'Two players on the same device' },
  ];

  const timeControls: { id: TimeControl; label: string; sub: string }[] = [
    { id: '3_MIN', label: '3 min', sub: 'Blitz tempo' },
    { id: '5_MIN', label: '5 min', sub: 'Rapid standard' },
    { id: '10_MIN', label: '10 min', sub: 'Classical time' },
    { id: 'UNTIMED', label: 'Untimed', sub: 'Casual practice' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Play Mills"
          subtitle="Select your preferred variant, competitive mode, and time control."
        />
        <Button
          variant="outline"
          onClick={() => setShowJoinModal(true)}
          className="gap-2 self-start md:self-auto border-background-border text-xs font-bold"
        >
          <KeyRound className="h-4 w-4 text-primary" />
          Join with Room Code
        </Button>
      </div>

      {/* Step 1: Variant Selection */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">Choose Variant</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <VariantCard
            variant="MILLS_3"
            isSelected={selectedVariant === 'MILLS_3'}
            onSelect={setSelectedVariant}
          />
          <VariantCard
            variant="MILLS_6"
            isSelected={selectedVariant === 'MILLS_6'}
            onSelect={setSelectedVariant}
          />
          <VariantCard
            variant="MILLS_9"
            isSelected={selectedVariant === 'MILLS_9'}
            onSelect={setSelectedVariant}
          />
        </div>
      </section>

      {/* Step 2 & 3: Mode and Time Control */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 2: Game Mode */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">2</span>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Select Mode</h2>
          </div>
          <div className="space-y-2.5">
            {modes.map((m) => {
              const Icon = m.icon;
              const isSelected = selectedMode === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMode(m.id)}
                  className={cn(
                    "flex items-center gap-3.5 p-3.5 rounded-2xl border cursor-pointer select-none transition-all duration-150",
                    isSelected
                      ? "border-primary bg-background-elevated shadow-md ring-1 ring-primary"
                      : "border-background-border bg-background-card hover:bg-background-elevated/70"
                  )}
                >
                  <div className={cn("p-2.5 rounded-xl", isSelected ? "bg-primary text-slate-950" : "bg-background-elevated text-slate-400")}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className={cn("text-sm font-bold", isSelected ? "text-white" : "text-slate-200")}>{m.label}</h3>
                    <p className="text-xs text-slate-400">{m.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Step 3: Time Control */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">3</span>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Time Control</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {timeControls.map((tc) => {
              const isSelected = selectedTimeControl === tc.id;
              return (
                <div
                  key={tc.id}
                  onClick={() => setSelectedTimeControl(tc.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border cursor-pointer select-none transition-all",
                    isSelected
                      ? "border-primary bg-background-elevated shadow-md ring-1 ring-primary"
                      : "border-background-border bg-background-card hover:bg-background-elevated/70"
                  )}
                >
                  <Clock className={cn("h-5 w-5 mb-2", isSelected ? "text-primary" : "text-slate-400")} />
                  <span className="text-base font-black text-white">{tc.label}</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">{tc.sub}</span>
                </div>
              );
            })}
          </div>

          {/* Private Room Share Box (if private selected) */}
          {selectedMode === 'PRIVATE' && (
            <Card className="mt-4 border-dashed border-sky-500/40 bg-sky-500/5">
              <CardContent className="p-4 space-y-2.5">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Direct Invite Link</span>
                <p className="text-xs text-slate-400">
                  Click below to generate a room and invite link you can share with any friend.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCopyPrivateLink}
                    className="w-full gap-2 text-xs font-bold border border-sky-500/30"
                  >
                    {privateLinkCopied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                    {privateLinkCopied ? 'Link Copied to Clipboard!' : 'Copy Shareable Room Link'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      {/* Step 4: Big PLAY Button */}
      <div className="pt-4 border-t border-background-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400 text-center sm:text-left">
          Ready to play: <strong className="text-white">{selectedVariant.replace('_', ' ')}</strong> • <strong className="text-white">{selectedMode}</strong> • <strong className="text-white">{selectedTimeControl.replace('_', ' ')}</strong>
        </div>

        <Button
          size="lg"
          variant="primary"
          onClick={handleStartGame}
          disabled={isCreatingRoom}
          className="w-full sm:w-auto px-10 text-lg font-black gap-3 shadow-emerald-500/25 min-w-[240px]"
        >
          <Play className="h-6 w-6 fill-current" />
          {isCreatingRoom ? 'CREATING ROOM...' : selectedMode === 'PRIVATE' ? 'CREATE PRIVATE ROOM' : 'PLAY NOW'}
        </Button>
      </div>

      {/* Join Room Code Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Online Room"
        description="Enter the 6-character room code or paste the full room ID to join your opponent."
      >
        <form onSubmit={handleJoinWithCode} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 block mb-1">Room Code</label>
            <Input
              placeholder="e.g. MILLS-8K2J or 8K2J4N"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              autoFocus
            />
            {joinError && <p className="text-xs text-rose-400 mt-1">{joinError}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowJoinModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="font-bold">
              Join Game
            </Button>
          </div>
        </form>
      </Modal>

      {/* Matchmaking Overlay Dialog */}
      <Modal
        isOpen={isSearchingMatch}
        onClose={() => setIsSearchingMatch(false)}
        title="Searching for Opponent..."
        description="Pairing with players around your rating tier (1200 - 1500 ELO)"
      >
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Swords className="h-7 w-7 text-primary animate-pulse" />
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-2xl font-mono font-bold text-white">00:{searchSeconds.toString().padStart(2, '0')}</p>
            <p className="text-xs text-slate-400">
              Expanding rating pool: <span className="text-emerald-400 font-semibold">&plusmn;{50 + Math.floor(searchSeconds / 5) * 25} ELO</span>
            </p>
          </div>

          <div className="w-full bg-background-elevated p-3 rounded-xl border border-background-border text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Selected Variant:</span>
              <strong className="text-slate-200">{selectedVariant.replace('_', ' ')}</strong>
            </div>
            <div className="flex justify-between">
              <span>Time Control:</span>
              <strong className="text-slate-200">{selectedTimeControl.replace('_', ' ')}</strong>
            </div>
          </div>

          <Button
            variant="danger"
            size="md"
            className="w-full font-bold"
            onClick={() => setIsSearchingMatch(false)}
          >
            Cancel Search
          </Button>
        </div>
      </Modal>
    </div>
  );
}
