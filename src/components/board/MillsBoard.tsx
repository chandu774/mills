import { useMemo } from 'react';
import { GameState, PlayerColor, VariantConfig } from '@/game/engine/types';
import { Piece } from './Piece';
import { cn } from '@/lib/utils';

export interface MillsBoardProps {
  config: VariantConfig;
  state: GameState;
  selectedPoint: number | null;
  onPointClick: (pointIndex: number) => void;
  isFlipped?: boolean;
  disabled?: boolean;
  className?: string;
}

export function MillsBoard({
  config,
  state,
  selectedPoint,
  onPointClick,
  isFlipped = false,
  disabled = false,
  className,
}: MillsBoardProps) {
  // Transform coordinates if board is flipped (for Black perspective)
  const getPointCoord = (index: number) => {
    const raw = config.coordinates[index];
    if (!raw) return { x: 50, y: 50 };
    if (!isFlipped) return raw;
    return { x: 100 - raw.x, y: 100 - raw.y };
  };

  // Determine which points are currently legal move/placement destinations
  const legalDestinations = useMemo(() => {
    if (disabled) return [];
    const { legalMoves, status, phase } = state;

    if (status === 'CAPTURE_PENDING') {
      return [];
    }

    if (phase === 'PLACING') {
      return legalMoves
        .filter((m) => m.type === 'PLACE' && m.to !== undefined)
        .map((m) => m.to as number);
    }

    if (selectedPoint !== null) {
      return legalMoves
        .filter((m) => (m.type === 'MOVE' || m.type === 'FLY') && m.from === selectedPoint && m.to !== undefined)
        .map((m) => m.to as number);
    }

    return [];
  }, [state, selectedPoint, disabled]);

  // Determine which points are eligible for capture
  const eligibleCaptures = useMemo(() => {
    if (disabled || state.status !== 'CAPTURE_PENDING') return [];
    return state.legalMoves
      .filter((m) => m.type === 'CAPTURE' && m.capturedPoint !== undefined)
      .map((m) => m.capturedPoint as number);
  }, [state, disabled]);

  // Determine line segments for board rendering based on variant coordinates
  const boardLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const coords = config.coordinates;

    const getC = (idx: number) => {
      const pt = coords[idx];
      return pt ? { x: pt.x, y: pt.y } : { x: 50, y: 50 };
    };

    if (config.variant === 'MILLS_3') {
      const p0 = getC(0), p1 = getC(1), p2 = getC(2);
      const p3 = getC(3), p5 = getC(5);
      const p6 = getC(6), p7 = getC(7), p8 = getC(8);

      // Rows
      lines.push({ x1: p0.x, y1: p0.y, x2: p2.x, y2: p2.y });
      lines.push({ x1: p3.x, y1: p3.y, x2: p5.x, y2: p5.y });
      lines.push({ x1: p6.x, y1: p6.y, x2: p8.x, y2: p8.y });
      // Columns
      lines.push({ x1: p0.x, y1: p0.y, x2: p6.x, y2: p6.y });
      lines.push({ x1: p1.x, y1: p1.y, x2: p7.x, y2: p7.y });
      lines.push({ x1: p2.x, y1: p2.y, x2: p8.x, y2: p8.y });
      // Diagonals
      lines.push({ x1: p0.x, y1: p0.y, x2: p8.x, y2: p8.y });
      lines.push({ x1: p2.x, y1: p2.y, x2: p6.x, y2: p6.y });
    } else if (config.variant === 'MILLS_6') {
      const p0 = getC(0), p2 = getC(2), p4 = getC(4), p6 = getC(6);
      const p8 = getC(8), p10 = getC(10), p12 = getC(12), p14 = getC(14);
      const p1 = getC(1), p3 = getC(3), p5 = getC(5), p7 = getC(7);
      const p9 = getC(9), p11 = getC(11), p13 = getC(13), p15 = getC(15);

      // Outer square perimeter
      lines.push({ x1: p0.x, y1: p0.y, x2: p2.x, y2: p2.y });
      lines.push({ x1: p2.x, y1: p2.y, x2: p4.x, y2: p4.y });
      lines.push({ x1: p4.x, y1: p4.y, x2: p6.x, y2: p6.y });
      lines.push({ x1: p6.x, y1: p6.y, x2: p0.x, y2: p0.y });
      // Inner square perimeter
      lines.push({ x1: p8.x, y1: p8.y, x2: p10.x, y2: p10.y });
      lines.push({ x1: p10.x, y1: p10.y, x2: p12.x, y2: p12.y });
      lines.push({ x1: p12.x, y1: p12.y, x2: p14.x, y2: p14.y });
      lines.push({ x1: p14.x, y1: p14.y, x2: p8.x, y2: p8.y });
      // Midpoint cross bridges
      lines.push({ x1: p1.x, y1: p1.y, x2: p9.x, y2: p9.y });
      lines.push({ x1: p3.x, y1: p3.y, x2: p11.x, y2: p11.y });
      lines.push({ x1: p5.x, y1: p5.y, x2: p13.x, y2: p13.y });
      lines.push({ x1: p7.x, y1: p7.y, x2: p15.x, y2: p15.y });
    } else if (config.variant === 'MILLS_9') {
      const p0 = getC(0), p2 = getC(2), p4 = getC(4), p6 = getC(6);
      const p8 = getC(8), p10 = getC(10), p12 = getC(12), p14 = getC(14);
      const p16 = getC(16), p18 = getC(18), p20 = getC(20), p22 = getC(22);
      const p1 = getC(1), p3 = getC(3), p5 = getC(5), p7 = getC(7);
      const p17 = getC(17), p19 = getC(19), p21 = getC(21), p23 = getC(23);

      // Outer square perimeter
      lines.push({ x1: p0.x, y1: p0.y, x2: p2.x, y2: p2.y });
      lines.push({ x1: p2.x, y1: p2.y, x2: p4.x, y2: p4.y });
      lines.push({ x1: p4.x, y1: p4.y, x2: p6.x, y2: p6.y });
      lines.push({ x1: p6.x, y1: p6.y, x2: p0.x, y2: p0.y });
      // Middle square perimeter
      lines.push({ x1: p8.x, y1: p8.y, x2: p10.x, y2: p10.y });
      lines.push({ x1: p10.x, y1: p10.y, x2: p12.x, y2: p12.y });
      lines.push({ x1: p12.x, y1: p12.y, x2: p14.x, y2: p14.y });
      lines.push({ x1: p14.x, y1: p14.y, x2: p8.x, y2: p8.y });
      // Inner square perimeter
      lines.push({ x1: p16.x, y1: p16.y, x2: p18.x, y2: p18.y });
      lines.push({ x1: p18.x, y1: p18.y, x2: p20.x, y2: p20.y });
      lines.push({ x1: p20.x, y1: p20.y, x2: p22.x, y2: p22.y });
      lines.push({ x1: p22.x, y1: p22.y, x2: p16.x, y2: p16.y });
      // Midpoint bridges (connecting outer through middle to inner)
      lines.push({ x1: p1.x, y1: p1.y, x2: p17.x, y2: p17.y });
      lines.push({ x1: p3.x, y1: p3.y, x2: p19.x, y2: p19.y });
      lines.push({ x1: p5.x, y1: p5.y, x2: p21.x, y2: p21.y });
      lines.push({ x1: p7.x, y1: p7.y, x2: p23.x, y2: p23.y });
    }

    return lines;
  }, [config.variant, config.coordinates]);

  // Check if a point was part of the last move
  const isLastMovePoint = (pointIndex: number) => {
    const lastMove = state.lastMove;
    if (!lastMove) return false;
    return lastMove.to === pointIndex || lastMove.from === pointIndex;
  };

  // Check if a point is part of the newly completed mill
  const isMillPoint = (pointIndex: number) => {
    return Boolean(state.lastMillPoints && state.lastMillPoints.includes(pointIndex));
  };

  // Calibrated piece and touch dimensions per variant for balanced spacing
  const pieceRadius = config.variant === 'MILLS_9' ? 3.9 : config.variant === 'MILLS_6' ? 4.4 : 4.8;
  const hitRadius = config.variant === 'MILLS_9' ? 5.4 : config.variant === 'MILLS_6' ? 6.2 : 7.0;

  return (
    <div className={cn("relative w-full max-w-[min(100vw-16px,440px)] md:max-w-[540px] aspect-square select-none mx-auto", className)}>
      {/* Outer physical wood board container with soft natural shadow */}
      <div className="w-full h-full p-2 sm:p-3 rounded-[24px] sm:rounded-[38px] bg-gradient-to-b from-[#7A4B29] via-[#61391D] to-[#472712] shadow-[0_12px_36px_rgba(25,12,5,0.45),0_3px_10px_rgba(0,0,0,0.3)] border-[4px] sm:border-[7px] border-[#532E16]">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full rounded-[16px] sm:rounded-[26px] overflow-hidden"
          role="grid"
          aria-label={`${config.name} Board`}
        >
          <defs>
            {/* Natural Teak Wood Surface Radial Gradient */}
            <radialGradient id="teakWoodGradient" cx="48%" cy="44%" r="72%">
              <stop offset="0%" stopColor="#A87444" />
              <stop offset="35%" stopColor="#925E31" />
              <stop offset="70%" stopColor="#794820" />
              <stop offset="100%" stopColor="#5E3314" />
            </radialGradient>

            {/* Top-to-Bottom Subtle Wood Lighting Gradient */}
            <linearGradient id="teakPlankLighting" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 240, 215, 0.08)" />
              <stop offset="50%" stopColor="rgba(0, 0, 0, 0)" />
              <stop offset="100%" stopColor="rgba(30, 12, 4, 0.14)" />
            </linearGradient>

            {/* Clean Vector Teak Wood Grain Pattern (Zero GPU Shader Rainbow Artifacts) */}
            <pattern id="teakGrainPattern" width="18" height="100" patternUnits="userSpaceOnUse">
              <line x1="2.2" y1="0" x2="2.6" y2="100" stroke="#3A1C08" strokeWidth="0.55" opacity="0.07" />
              <line x1="6.0" y1="0" x2="5.6" y2="100" stroke="#DDB686" strokeWidth="0.4" opacity="0.07" />
              <line x1="10.5" y1="0" x2="10.9" y2="100" stroke="#3A1C08" strokeWidth="0.65" opacity="0.06" />
              <line x1="15.2" y1="0" x2="14.8" y2="100" stroke="#DDB686" strokeWidth="0.35" opacity="0.06" />
            </pattern>

            {/* Radial gradient for Warm Ivory Pieces */}
            <radialGradient id="ivoryPieceGradient" cx="32%" cy="28%" r="68%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#F9F5EC" />
              <stop offset="70%" stopColor="#E6D8C4" />
              <stop offset="100%" stopColor="#C4B39A" />
            </radialGradient>

            {/* Radial gradient for Dark Walnut Pieces */}
            <radialGradient id="walnutPieceGradient" cx="32%" cy="28%" r="68%">
              <stop offset="0%" stopColor="#4D3320" />
              <stop offset="38%" stopColor="#352013" />
              <stop offset="75%" stopColor="#221209" />
              <stop offset="100%" stopColor="#140803" />
            </radialGradient>

            {/* Soft Piece Contact Shadow Blur */}
            <filter id="pieceShadowBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.85" />
            </filter>
          </defs>

          {/* Natural Teak Board Wood Surface */}
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="url(#teakWoodGradient)"
          />

          {/* Natural Subtle Teak Grain Striations */}
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="url(#teakGrainPattern)"
          />

          {/* Ambient Lighting Plank Sheen */}
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="url(#teakPlankLighting)"
          />

          {/* Beveled Routed Inner Playing Field Border */}
          <rect
            x="3.8"
            y="3.8"
            width="92.4"
            height="92.4"
            rx="4.5"
            fill="none"
            stroke="#3C2110"
            strokeWidth="1.2"
          />
          <rect
            x="4.4"
            y="4.4"
            width="91.2"
            height="91.2"
            rx="4.0"
            fill="none"
            stroke="rgba(255, 230, 195, 0.2)"
            strokeWidth="0.6"
          />

          {/* Grid Connection Lines (Dark Espresso Engraved Routed Groove) */}
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* Inset shadow at top of engraved groove */}
            <g stroke="#170A03" strokeWidth="1.8">
              {boardLines.map((line, idx) => (
                <line
                  key={`line-shadow-${idx}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                />
              ))}
            </g>
            {/* Inset bottom light reflection (gives physical routed depth) */}
            <g stroke="rgba(255, 230, 195, 0.22)" strokeWidth="0.55">
              {boardLines.map((line, idx) => (
                <line
                  key={`line-highlight-${idx}`}
                  x1={line.x1}
                  y1={line.y1 + 0.35}
                  x2={line.x2}
                  y2={line.y2 + 0.35}
                />
              ))}
            </g>
            {/* Main Dark Espresso Line */}
            <g stroke="#261207" strokeWidth="1.45">
              {boardLines.map((line, idx) => (
                <line
                  key={`line-main-${idx}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                />
              ))}
            </g>
          </g>

          {/* Active Mill Formed Lines (Warm Gold Inlay) */}
          {state.lastMillPoints && (
            <g stroke="#D4AF37" strokeWidth="2.2" strokeLinecap="round" className="animate-pulse">
              {config.mills
                .filter((mill) => mill.every((p) => state.lastMillPoints?.includes(p)))
                .map((mill, idx) => {
                  const p1 = getPointCoord(mill[0]);
                  const p2 = getPointCoord(mill[mill.length - 1]);
                  return (
                    <line
                      key={`active-mill-line-${idx}`}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                    />
                  );
                })}
            </g>
          )}

          {/* Board Points & Interaction Touch Targets */}
          {Array.from({ length: config.pointCount }).map((_, pointIndex) => {
            const coord = getPointCoord(pointIndex);
            const piece = state.board[pointIndex];
            const isLegalTarget = legalDestinations.includes(pointIndex);
            const isEligibleCapture = eligibleCaptures.includes(pointIndex);
            const isSelected = selectedPoint === pointIndex;
            const isLastMove = isLastMovePoint(pointIndex);
            const inActiveMill = isMillPoint(pointIndex);

            return (
              <g key={`pt-${pointIndex}`}>
                {/* Empty Intersection Inlay Socket */}
                {!piece && (
                  <g>
                    {/* Dark recessed socket */}
                    <circle
                      cx={coord.x}
                      cy={coord.y + 0.2}
                      r={config.variant === 'MILLS_9' ? 1.7 : 2.0}
                      fill="#140802"
                    />
                    {/* Brass inlay core */}
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={config.variant === 'MILLS_9' ? 1.15 : 1.35}
                      fill="#C49A45"
                      stroke="#2E160A"
                      strokeWidth="0.45"
                    />
                    {/* Tiny sheen highlight */}
                    <circle
                      cx={coord.x - 0.3}
                      cy={coord.y - 0.3}
                      r={config.variant === 'MILLS_9' ? 0.35 : 0.45}
                      fill="rgba(255, 245, 220, 0.55)"
                    />
                  </g>
                )}

                {/* Legal Move Destination Indicator (Natural Forest Green Ring) */}
                {isLegalTarget && (
                  <g className="cursor-pointer">
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={pieceRadius * 1.15}
                      fill="rgba(46, 90, 58, 0.22)"
                      stroke="#2E5A3A"
                      strokeWidth="1.2"
                      className="animate-pulse"
                    />
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={pieceRadius * 0.4}
                      fill="#2E5A3A"
                    />
                  </g>
                )}

                {/* Piece Rendering */}
                {piece && (
                  <Piece
                    color={piece as PlayerColor}
                    cx={coord.x}
                    cy={coord.y}
                    radius={pieceRadius}
                    isSelected={isSelected}
                    isEligibleCapture={isEligibleCapture}
                    isMillPiece={inActiveMill}
                    isLastMove={isLastMove}
                    onClick={() => !disabled && onPointClick(pointIndex)}
                  />
                )}

                {/* Invisible Hit Area for Ergonomic Touch (Non-overlapping, safe touch) */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={hitRadius}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => !disabled && onPointClick(pointIndex)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
