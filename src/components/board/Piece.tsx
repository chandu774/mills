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
  radius = 4.0,
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
      aria-label={`${color} piece`}
    >
      {/* Selection Ring: Muted Forest Green (Compact, no collision) */}
      {isSelected && (
        <circle
          cx={cx}
          cy={cy}
          r={radius * 1.25}
          fill="none"
          stroke="#2E5A3A"
          strokeWidth="1.3"
          strokeDasharray="2.5 1.5"
          className="animate-spin-slow opacity-95"
        />
      )}

      {/* Capture Reticle: Muted Brick Red Pulse */}
      {isEligibleCapture && (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={radius * 1.28}
            fill="none"
            stroke="#B93838"
            strokeWidth="1.3"
            className="animate-ping opacity-60"
          />
          <circle
            cx={cx}
            cy={cy}
            r={radius * 1.22}
            fill="rgba(185, 56, 56, 0.2)"
            stroke="#B93838"
            strokeWidth="1.1"
          />
        </g>
      )}

      {/* Mill Highlight Ring: Muted Warm Gold */}
      {isMillPiece && !isSelected && !isEligibleCapture && (
        <circle
          cx={cx}
          cy={cy}
          r={radius * 1.24}
          fill="none"
          stroke="#D4AF37"
          strokeWidth="1.4"
          className="animate-pulse"
        />
      )}

      {/* Last Move Indicator Ring: Subtle Gold Inlay Ring */}
      {isLastMove && !isSelected && (
        <circle
          cx={cx}
          cy={cy}
          r={radius * 1.22}
          fill="none"
          stroke="#C59B27"
          strokeWidth="1.0"
          strokeDasharray="1.5 1.5"
        />
      )}

      {/* Natural Physical Piece Shadow */}
      <ellipse
        cx={cx}
        cy={cy + 0.75}
        rx={radius * 1.05}
        ry={radius * 0.95}
        fill={isWhite ? 'rgba(28, 14, 6, 0.45)' : 'rgba(0, 0, 0, 0.65)'}
        filter="url(#pieceShadowBlur)"
      />

      {/* Main Physical Turned Wood Piece Body */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={isWhite ? 'url(#ivoryPieceGradient)' : 'url(#walnutPieceGradient)'}
        stroke={isWhite ? '#B8A790' : '#140803'}
        strokeWidth="0.8"
        className="transition-transform group-hover:scale-105"
      />

      {/* Top Rim Sheen (Ensures piece never merges with dark board lines or teak) */}
      <path
        d={`M ${cx - radius * 0.7} ${cy - radius * 0.5} A ${radius * 0.85} ${radius * 0.85} 0 0 1 ${cx + radius * 0.7} ${cy - radius * 0.5}`}
        fill="none"
        stroke={isWhite ? 'rgba(255, 255, 255, 0.95)' : 'rgba(215, 165, 115, 0.42)'}
        strokeWidth="0.75"
        strokeLinecap="round"
      />

      {/* Turned Wooden Outer Concentric Ridge */}
      <circle
        cx={cx}
        cy={cy}
        r={radius * 0.68}
        fill="none"
        stroke={isWhite ? 'rgba(175, 155, 130, 0.55)' : 'rgba(10, 4, 1, 0.75)'}
        strokeWidth="0.6"
      />
      <path
        d={`M ${cx - radius * 0.45} ${cy - radius * 0.35} A ${radius * 0.58} ${radius * 0.58} 0 0 1 ${cx + radius * 0.45} ${cy - radius * 0.35}`}
        fill="none"
        stroke={isWhite ? 'rgba(255, 255, 255, 0.75)' : 'rgba(210, 160, 110, 0.28)'}
        strokeWidth="0.5"
        strokeLinecap="round"
      />

      {/* Turned Wooden Inner Crown Ridge */}
      <circle
        cx={cx}
        cy={cy}
        r={radius * 0.38}
        fill="none"
        stroke={isWhite ? 'rgba(165, 145, 120, 0.6)' : 'rgba(8, 3, 1, 0.85)'}
        strokeWidth="0.5"
      />

      {/* Center Pip / Turned Core */}
      <circle
        cx={cx}
        cy={cy}
        r={radius * 0.16}
        fill={isWhite ? 'rgba(220, 205, 185, 0.75)' : 'rgba(40, 24, 14, 0.85)'}
      />
    </g>
  );
}
