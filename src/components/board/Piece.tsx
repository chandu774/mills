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
      {/* Selection Ring: Muted Forest Green (Compact to prevent intersection overlap) */}
      {isSelected && (
        <circle
          cx={cx}
          cy={cy}
          r={radius * 1.3}
          fill="none"
          stroke="#2E5A3A"
          strokeWidth="1.2"
          strokeDasharray="2 1.5"
          className="animate-spin-slow opacity-95"
        />
      )}

      {/* Capture Reticle: Muted Red Pulse (Sized to stay within 11-unit spacing) */}
      {isEligibleCapture && (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={radius * 1.34}
            fill="none"
            stroke="#B93838"
            strokeWidth="1.2"
            className="animate-ping opacity-60"
          />
          <circle
            cx={cx}
            cy={cy}
            r={radius * 1.26}
            fill="rgba(185, 56, 56, 0.18)"
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
          r={radius * 1.25}
          fill="none"
          stroke="#C4973B"
          strokeWidth="1.2"
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
          stroke="#D4AF37"
          strokeWidth="0.9"
          strokeDasharray="1.5 1.5"
        />
      )}

      {/* Natural Physical Piece Shadow */}
      <ellipse
        cx={cx}
        cy={cy + 0.6}
        rx={radius * 1.02}
        ry={radius * 0.94}
        fill={isWhite ? 'rgba(30, 18, 10, 0.35)' : 'rgba(0, 0, 0, 0.55)'}
        filter="url(#pieceShadowBlur)"
      />

      {/* Main Physical Tactile Piece Body */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={isWhite ? 'url(#ivoryPieceGradient)' : 'url(#walnutPieceGradient)'}
        stroke={isWhite ? '#C8BCAB' : '#1A0E06'}
        strokeWidth="0.75"
        className="transition-transform group-hover:scale-105"
      />

      {/* Inner Gloss / Bevel Top-Left Sheen */}
      <path
        d={`M ${cx - radius * 0.75} ${cy} A ${radius * 0.75} ${radius * 0.75} 0 0 1 ${cx + radius * 0.75} ${cy}`}
        fill="none"
        stroke={isWhite ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.18)'}
        strokeWidth="0.7"
        strokeLinecap="round"
      />

      {/* Center Tactile Carved Indent */}
      <circle
        cx={cx}
        cy={cy}
        r={radius * 0.45}
        fill="none"
        stroke={isWhite ? 'rgba(180, 165, 145, 0.5)' : 'rgba(15, 8, 4, 0.7)'}
        strokeWidth="0.5"
      />
    </g>
  );
}
