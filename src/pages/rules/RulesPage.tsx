import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Play, Zap, Shield, Crown, CheckCircle, Target } from 'lucide-react';

export function RulesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="Rules & How to Play"
        subtitle="Master the ancient tactical game of Mills across 3-Piece, 6-Piece, and 9-Piece variants."
        actions={
          <Button variant="primary" size="md" onClick={() => navigate('/play')} className="gap-2 font-bold shadow-soft">
            <Play className="h-4 w-4 fill-current" /> Play Practice Game
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: 'overview', label: 'Game Overview' },
          { id: 'phases', label: 'The 3 Phases' },
          { id: 'variants', label: 'Variant Comparison' },
          { id: 'strategy', label: 'Tactics & Strategy' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-ink">What is Mills (Nine Men's Morris)?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-ink-muted leading-relaxed">
              <p>
                <strong className="text-ink">Mills</strong> (also known historically as <em>Nine Men's Morris</em>, <em>Merels</em>, or <em>Mühle</em>) is one of the oldest strategy board games known to humanity, with archaeological evidence dating back to the Roman Empire and ancient Egypt.
              </p>
              <p>
                Two players take turns placing and maneuvering their pieces on a grid of points. The primary objective is to align three of your pieces in a straight line along the marked grid lines — this configuration is called a <strong className="text-ink">"Mill"</strong>.
              </p>
              <div className="p-4 rounded-xl bg-primary/[0.05] border border-primary/20 text-ink flex items-start gap-3.5">
                <Target className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-ink text-sm">The Golden Rule: Forming a Mill</h4>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                    Every time you form a Mill (3 pieces of your color in a row), you earn the right to <strong className="text-ink">capture and remove one opponent piece</strong> from the board. Captured pieces are permanently removed from play.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold text-primary">How to Win</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs text-ink-muted leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span><strong className="text-ink">Reduce your opponent to 2 pieces:</strong> Since you need at least 3 pieces to form a Mill, a player with only 2 pieces remaining cannot form any mills and loses immediately.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span><strong className="text-ink">Block all opponent moves:</strong> If it is your opponent's turn and they have no legal moves available (all pieces are trapped), they lose by stalemate.</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold text-gold">Capture Immunity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs text-ink-muted leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <Shield className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                  <span><strong className="text-ink">Pieces in an active Mill are protected:</strong> You cannot capture an opponent's piece if it is part of a formed Mill, <em>unless</em> all of the opponent's pieces on the board are currently part of mills.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'phases' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card>
            <CardHeader>
              <div className="w-8 h-8 rounded-lg bg-[#3D2817] text-[#FDFBF7] flex items-center justify-center font-bold text-sm mb-2 shadow-soft">
                1
              </div>
              <CardTitle className="text-base font-bold text-ink">Phase 1: Placing</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-ink-muted space-y-2.5 leading-relaxed">
              <p>The board begins completely empty.</p>
              <p>Players take turns placing one piece at a time onto any unoccupied intersection point on the board.</p>
              <p>If a player forms a Mill during this placement phase, they immediately remove an eligible opponent piece.</p>
              <p>Phase 1 concludes once all allocated pieces (3, 6, or 9 per player) have been placed.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-8 h-8 rounded-lg bg-[#3D2817] text-[#FDFBF7] flex items-center justify-center font-bold text-sm mb-2 shadow-soft">
                2
              </div>
              <CardTitle className="text-base font-bold text-ink">Phase 2: Moving</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-ink-muted space-y-2.5 leading-relaxed">
              <p>Once all pieces are placed, players take turns sliding one piece along a connected grid line to an adjacent empty point.</p>
              <p>Pieces cannot jump over other pieces during this phase.</p>
              <p>Forming a Mill by sliding into place allows you to capture an opponent piece.</p>
              <p>A player who cannot make any legal move on their turn loses the game.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-8 h-8 rounded-lg bg-[#3D2817] text-[#FDFBF7] flex items-center justify-center font-bold text-sm mb-2 shadow-soft">
                3
              </div>
              <CardTitle className="text-base font-bold text-ink">Phase 3: Flying</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-ink-muted space-y-2.5 leading-relaxed">
              <p><strong className="text-ink">Applies in 9-Piece Mills:</strong></p>
              <p>When a player is reduced to exactly <strong className="text-ink">3 pieces</strong>, their pieces gain the ability to "fly".</p>
              <p>Instead of being restricted to adjacent points, the player can move a piece to <em>any</em> unoccupied point on the entire board.</p>
              <p>This creates a dramatic endgame where the defender can mount a swift counterattack.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'variants' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-primary mb-1">
                <Zap className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Fast & Direct</span>
              </div>
              <CardTitle className="text-lg font-bold text-ink">3-Piece Mills</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-ink-muted space-y-2.5">
              <p>Played on a 3x3 grid with 9 points (including diagonal lines).</p>
              <ul className="list-disc pl-4 space-y-1 text-ink-muted">
                <li>3 pieces per player</li>
                <li>Diagonal mills are permitted</li>
                <li>First player to form a 3-in-a-row wins immediately</li>
                <li>Avg game duration: 1 to 3 minutes</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-gold mb-1">
                <Shield className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Tactical & Compact</span>
              </div>
              <CardTitle className="text-lg font-bold text-ink">6-Piece Mills</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-ink-muted space-y-2.5">
              <p>Played on two concentric squares with 16 points.</p>
              <ul className="list-disc pl-4 space-y-1 text-ink-muted">
                <li>6 pieces per player</li>
                <li>Only horizontal and vertical mills</li>
                <li>Capturing reduces opponent to 2 pieces to win</li>
                <li>Avg game duration: 4 to 8 minutes</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-[#8A6318] mb-1">
                <Crown className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Championship Standard</span>
              </div>
              <CardTitle className="text-lg font-bold text-ink">9-Piece Men's Morris</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-ink-muted space-y-2.5">
              <p>The iconic 3 concentric squares with 24 points.</p>
              <ul className="list-disc pl-4 space-y-1 text-ink-muted">
                <li>9 pieces per player</li>
                <li>Full 3-phase gameplay including flying</li>
                <li>Deep strategic planning and multi-threat mills</li>
                <li>Avg game duration: 8 to 15 minutes</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'strategy' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-ink">Pro Strategy: The "Running Mill" (Double Mill)</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-ink-muted space-y-2 leading-relaxed">
              <p>
                The most formidable weapon in Mills is the <strong className="text-ink">Running Mill</strong> (also called a "see-saw" or "double mill").
              </p>
              <p>
                By positioning five pieces such that one piece can slide back and forth between two different potential mills, you can close a Mill on <em>every single turn</em>, capturing an opponent piece on every move while leaving them powerless to stop you.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-ink">Crucial Placement Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-ink-muted space-y-2 leading-relaxed">
              <p>• <strong className="text-ink">Control the cross connections:</strong> Points that connect inner and outer squares offer maximum mobility (4 branches).</p>
              <p>• <strong className="text-ink">Avoid early corners:</strong> Corners only have 2 degrees of movement, making them prone to getting trapped in Phase 2.</p>
              <p>• <strong className="text-ink">Form multiple threats simultaneously:</strong> Place pieces that can complete two different mills at once, forcing your opponent to choose which one to block.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
