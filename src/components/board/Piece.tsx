import { PlayerColor } from '@/game/engine/types';

export interface PieceProps {
  color: PlayerColor;
  cx: number;
  cy: number;
  radius?: number;
  isSelected?: boolean;
  isEligibleCapture?: boolean;
  isMillPiece?: boolean;
  isLastMove?: boolean;
  onClick?: () => void;
}

export function Piece({
  color,
  cx,
  cy,
  radius = 4.8,
  isSelected = false,
  isEligibleCapture = false,
  isMillPiece = false,
  isLastMove = false,
  onClick,
}: PieceProps) {
  const isWhite = color === 'WHITE';

  return (
    <g
      onClick={onClick}
      className="cursor-pointer transition-transform duration-150 select-none group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`${color} piece at position`}
    >
      {/* Selection Halo */}
      {isSelected && (
        <circle
          cx={cx}
          cy={cy}
          r={radius * 1.55}
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.8"
          strokeDasharray="2 1.5"
          className="animate-spin-slow"
        />
      )}

      {/* Capture Reticle / Pulsing Ring */}
      {isEligibleCapture && (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={radius * 1.6}
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.6"
            className="animate-ping opacity-75"
          />
          <circle
            cx={cx}
            cy={cy}
            r={radius * 1.5}
            fill="rgba(239, 68, 68, 0.25)"
            stroke="#ef4444"
            strokeWidth="1.2"
          />
        </g>
      )}

      {/* Mill Highlight Ring */}
      {isMillPiece && !isSelected && !isEligibleCapture && (
        <circle
          cx={cx}
          cy={cy}
          r={radius * 1.35}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.2"
          className="animate-pulse"
        />
      )}

      {/* Last Move Indicator Ring */}
      {isLastMove && !isSelected && (
        <circle
          cx={cx}
          cy={cy}
          r={radius * 1.3}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="0.8"
          strokeDasharray="1.5 1.5"
        />
      )}

      {/* Piece Drop Shadow */}
      <circle
        cx={cx}
        cy={cy + 0.8}
        r={radius}
        fill="rgba(0, 0, 0, 0.45)"
        filter="blur(0.8px)"
      />

      {/* Main Piece Body with Radial Gradient */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={isWhite ? 'url(#whitePieceGradient)' : 'url(#blackPieceGradient)'}
        stroke={isWhite ? '#94a3b8' : '#0f172a'}
        strokeWidth="0.8"
        className="transition-transform group-hover:scale-105"
      />

      {/* Inner Gloss / Bevel Highlight */}
      <circle
        cx={cx - radius * 0.25}
        cy={cy - radius * 0.25}
        r={radius * 0.45}
        fill={isWhite ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.18)'}
        filter="blur(0.5px)"
      />

      {/* Center Tactile Indent Ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius * 0.48}
        fill="none"
        stroke={isWhite ? 'rgba(148, 163, 184, 0.4)' : 'rgba(15, 23, 42, 0.6)'}
        strokeWidth="0.6"
      />
    </g>
  );
}
