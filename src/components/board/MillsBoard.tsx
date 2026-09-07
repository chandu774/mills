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
    <div className={cn("relative w-full max-w-[540px] aspect-square select-none mx-auto", className)}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-br from-background-card via-[#131924] to-[#0c1017] border-2 border-background-border"
        role="grid"
        aria-label={`${config.name} Board`}
      >
        <defs>
          {/* Radial gradient for White Pieces */}
          <radialGradient id="whitePieceGradient" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </radialGradient>

          {/* Radial gradient for Black Pieces */}
          <radialGradient id="blackPieceGradient" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="70%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#090d16" />
          </radialGradient>

          {/* Wood/Slate subtle pattern effect */}
          <filter id="boardGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Outer board border frame */}
        <rect
          x="3"
          y="3"
          width="94"
          height="94"
          rx="6"
          fill="none"
          stroke="#263345"
          strokeWidth="1.2"
        />

        {/* Grid Connection Lines */}
        <g stroke="#3b485d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {boardLines.map((line, idx) => (
            <line
              key={`line-${idx}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
            />
          ))}
        </g>

        {/* Active Mill Glowing Lines */}
        {state.lastMillPoints && (
          <g stroke="#f59e0b" strokeWidth="2.4" strokeLinecap="round" className="animate-pulse">
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
              {/* Point Intersection Marker Dot (when empty) */}
              {!piece && (
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="2.2"
                  fill="#475569"
                  stroke="#1e293b"
                  strokeWidth="0.8"
                />
              )}

              {/* Legal Move Destination Indicator Ring / Dot */}
              {isLegalTarget && (
                <g className="cursor-pointer">
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="4.2"
                    fill="rgba(34, 197, 94, 0.3)"
                    stroke="#22c55e"
                    strokeWidth="1.2"
                    className="animate-pulse"
                  />
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="2.2"
                    fill="#22c55e"
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

              {/* Large Invisible Hit Area for Easy Touch on Phones (Min 48px equivalent) */}
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
  );
}
