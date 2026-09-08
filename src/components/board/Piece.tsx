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
  radius = 4.6,
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
      {/* Selection Ring: Muted Forest Green */}
      {isSelected && (
        <circle
          cx={cx}
          cy={cy}
          r={radius * 1.5}
          fill="none"
          stroke="#2E5A3A"
          strokeWidth="1.6"
          strokeDasharray="2 1.5"
          className="animate-spin-slow opacity-90"
        />
      )}

      {/* Capture Reticle / Muted Red Pulse */}
      {isEligibleCapture && (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={radius * 1.55}
            fill="none"
            stroke="#B93838"
            strokeWidth="1.5"
            className="animate-ping opacity-60"
          />
          <circle
            cx={cx}
            cy={cy}
            r={radius * 1.45}
            fill="rgba(185, 56, 56, 0.18)"
            stroke="#B93838"
            strokeWidth="1.2"
          />
        </g>
      )}

      {/* Mill Highlight Ring: Muted Warm Gold */}
      {isMillPiece && !isSelected && !isEligibleCapture && (
        <circle
          cx={cx}
          cy={cy}
          r={radius * 1.35}
          fill="none"
          stroke="#C4973B"
          strokeWidth="1.4"
          className="animate-pulse"
        />
      )}

      {/* Last Move Indicator Ring: Subtle Stone Dot/Ring */}
      {isLastMove && !isSelected && (
        <circle
          cx={cx}
          cy={cy}
          r={radius * 1.3}
          fill="none"
          stroke="#D4AF37"
          strokeWidth="0.9"
          strokeDasharray="1.5 1.5"
        />
      )}

      {/* Natural Physical Piece Shadow */}
      <ellipse
        cx={cx}
        cy={cy + 0.9}
        rx={radius * 1.02}
        ry={radius * 0.96}
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
        strokeWidth="0.8"
        strokeLinecap="round"
      />

      {/* Center Tactile Carved Indent */}
      <circle
        cx={cx}
        cy={cy}
        r={radius * 0.45}
        fill="none"
        stroke={isWhite ? 'rgba(180, 165, 145, 0.5)' : 'rgba(15, 8, 4, 0.7)'}
        strokeWidth="0.6"
      />
    </g>
  );
}
