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

  // Determine line segments for board rendering
  const boardLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];

    if (config.variant === 'MILLS_3') {
      // 3x3 rows & columns
      lines.push({ x1: 15, y1: 15, x2: 85, y2: 15 });
      lines.push({ x1: 15, y1: 50, x2: 85, y2: 50 });
      lines.push({ x1: 15, y1: 85, x2: 85, y2: 85 });
      lines.push({ x1: 15, y1: 15, x2: 15, y2: 85 });
      lines.push({ x1: 50, y1: 15, x2: 50, y2: 85 });
      lines.push({ x1: 85, y1: 15, x2: 85, y2: 85 });
      // Diagonals
      lines.push({ x1: 15, y1: 15, x2: 85, y2: 85 });
      lines.push({ x1: 85, y1: 15, x2: 15, y2: 85 });
    } else if (config.variant === 'MILLS_6') {
      // Outer square
      lines.push({ x1: 15, y1: 15, x2: 85, y2: 15 });
      lines.push({ x1: 85, y1: 15, x2: 85, y2: 85 });
      lines.push({ x1: 85, y1: 85, x2: 15, y2: 85 });
      lines.push({ x1: 15, y1: 85, x2: 15, y2: 15 });
      // Inner square
      lines.push({ x1: 32, y1: 32, x2: 68, y2: 32 });
      lines.push({ x1: 68, y1: 32, x2: 68, y2: 68 });
      lines.push({ x1: 68, y1: 68, x2: 32, y2: 68 });
      lines.push({ x1: 32, y1: 68, x2: 32, y2: 32 });
      // Midpoint cross connectors
      lines.push({ x1: 50, y1: 15, x2: 50, y2: 32 });
      lines.push({ x1: 85, y1: 50, x2: 68, y2: 50 });
      lines.push({ x1: 50, y1: 85, x2: 50, y2: 68 });
      lines.push({ x1: 15, y1: 50, x2: 32, y2: 50 });
    } else if (config.variant === 'MILLS_9') {
      // Outer square
      lines.push({ x1: 15, y1: 15, x2: 85, y2: 15 });
      lines.push({ x1: 85, y1: 15, x2: 85, y2: 85 });
      lines.push({ x1: 85, y1: 85, x2: 15, y2: 85 });
      lines.push({ x1: 15, y1: 85, x2: 15, y2: 15 });
      // Middle square
      lines.push({ x1: 27, y1: 27, x2: 73, y2: 27 });
      lines.push({ x1: 73, y1: 27, x2: 73, y2: 73 });
      lines.push({ x1: 73, y1: 73, x2: 27, y2: 73 });
      lines.push({ x1: 27, y1: 73, x2: 27, y2: 27 });
      // Inner square
      lines.push({ x1: 39, y1: 39, x2: 61, y2: 39 });
      lines.push({ x1: 61, y1: 39, x2: 61, y2: 61 });
      lines.push({ x1: 61, y1: 61, x2: 39, y2: 61 });
      lines.push({ x1: 39, y1: 61, x2: 39, y2: 39 });
      // Midpoint bridges
      lines.push({ x1: 50, y1: 15, x2: 50, y2: 39 });
      lines.push({ x1: 85, y1: 50, x2: 61, y2: 50 });
      lines.push({ x1: 50, y1: 85, x2: 50, y2: 61 });
      lines.push({ x1: 15, y1: 50, x2: 39, y2: 50 });
    }

    return lines;
  }, [config.variant]);

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

  return (
    <div className={cn("relative w-full max-w-[560px] aspect-square select-none mx-auto", className)}>
      {/* Outer physical wood board container with soft natural shadow */}
      <div className="w-full h-full p-2.5 sm:p-3 rounded-[28px] sm:rounded-[36px] bg-gradient-to-b from-[#4A321E] via-[#382313] to-[#25150A] shadow-board border-4 sm:border-[6px] border-[#2C190D]">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full rounded-[20px] sm:rounded-[26px] overflow-hidden"
          role="grid"
          aria-label={`${config.name} Board`}
        >
          <defs>
            {/* Rich Natural Walnut Wood Surface Gradient */}
            <radialGradient id="woodBoardGradient" cx="45%" cy="40%" r="75%">
              <stop offset="0%" stopColor="#432C1B" />
              <stop offset="60%" stopColor="#352012" />
              <stop offset="100%" stopColor="#28160B" />
            </radialGradient>

            {/* Radial gradient for Warm Ivory Pieces */}
            <radialGradient id="ivoryPieceGradient" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="45%" stopColor="#F9F4EB" />
              <stop offset="85%" stopColor="#E5D9C7" />
              <stop offset="100%" stopColor="#C8BCAB" />
            </radialGradient>

            {/* Radial gradient for Dark Walnut Pieces */}
            <radialGradient id="walnutPieceGradient" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#4A3423" />
              <stop offset="40%" stopColor="#312014" />
              <stop offset="85%" stopColor="#1C1008" />
              <stop offset="100%" stopColor="#100804" />
            </radialGradient>

            {/* Soft Piece Shadow Blur */}
            <filter id="pieceShadowBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
            </filter>
          </defs>

          {/* Board Wood Surface Background */}
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="url(#woodBoardGradient)"
          />

          {/* Subtle Inset Wood Bevel Border */}
          <rect
            x="3.5"
            y="3.5"
            width="93"
            height="93"
            rx="5"
            fill="none"
            stroke="#1D1007"
            strokeWidth="1.2"
          />
          <rect
            x="4.2"
            y="4.2"
            width="91.6"
            height="91.6"
            rx="4.5"
            fill="none"
            stroke="rgba(110, 72, 41, 0.4)"
            strokeWidth="0.6"
          />

          {/* Grid Connection Lines (Warm Engraved Inlay Relief) */}
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* Subtle shadow beneath engraved line */}
            <g stroke="#170C05" strokeWidth="1.7">
              {boardLines.map((line, idx) => (
                <line
                  key={`line-shadow-${idx}`}
                  x1={line.x1}
                  y1={line.y1 + 0.3}
                  x2={line.x2}
                  y2={line.y2 + 0.3}
                />
              ))}
            </g>
            {/* Main Walnut Engraved Line */}
            <g stroke="#6E4829" strokeWidth="1.4">
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

          {/* Active Mill Formed Lines (Muted Gold Inlay) */}
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
                {/* Empty Intersection Inlay Dot */}
                {!piece && (
                  <g>
                    <circle
                      cx={coord.x}
                      cy={coord.y + 0.3}
                      r="2.2"
                      fill="#1A0D06"
                    />
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r="1.9"
                      fill="#8C6544"
                      stroke="#2C190D"
                      strokeWidth="0.6"
                    />
                  </g>
                )}

                {/* Legal Move Destination Indicator (Natural Forest Green Ring) */}
                {isLegalTarget && (
                  <g className="cursor-pointer">
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r="4.2"
                      fill="rgba(46, 90, 58, 0.28)"
                      stroke="#2E5A3A"
                      strokeWidth="1.2"
                      className="animate-pulse"
                    />
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r="2.2"
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
                    isSelected={isSelected}
                    isEligibleCapture={isEligibleCapture}
                    isMillPiece={inActiveMill}
                    isLastMove={isLastMove}
                    onClick={() => !disabled && onPointClick(pointIndex)}
                  />
                )}

                {/* Large Invisible Hit Area for Ergonomic Touch (Min 48px equivalent) */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="7.5"
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
