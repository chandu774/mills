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
  boardId?: string;
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
  boardId,
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
      {/* Selection Ring: Distinct Forest Green Outline (Clear Focus) */}
      {isSelected && (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={radius + 1.3}
            fill="rgba(46, 90, 58, 0.18)"
            stroke="#2E5A3A"
            strokeWidth="1.8"
          />
        </g>
      )}

      {/* Capture Reticle: Muted Brick Red Pulse */}
      {isEligibleCapture && (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={radius + 1.2}
            fill="rgba(185, 56, 56, 0.2)"
            stroke="#B93838"
            strokeWidth="1.4"
          />
        </g>
      )}

      {/* Mill Highlight Ring: Muted Warm Gold */}
      {isMillPiece && !isSelected && !isEligibleCapture && (
        <circle
          cx={cx}
          cy={cy}
          r={radius + 1.2}
          fill="none"
          stroke="#D4AF37"
          strokeWidth="1.5"
          className="animate-pulse"
        />
      )}

      {/* Last Move Indicator: Exactly ONE Subtle Gold Outline Ring (No concentric circles, no radar target) */}
      {isLastMove && !isSelected && !isEligibleCapture && !isMillPiece && (
        <g>
          {/* Soft ambient glow */}
          <circle
            cx={cx}
            cy={cy}
            r={radius + 1.1}
            fill="none"
            stroke="#C49A45"
            strokeWidth="2.4"
            opacity="0.22"
          />
          {/* Main single subtle outline ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius + 1.1}
            fill="none"
            stroke="#C49A45"
            strokeWidth="1.1"
            opacity="0.9"
          />
        </g>
      )}

      {/* Natural Physical Piece Shadow */}
      <ellipse
        cx={cx}
        cy={cy + 0.75}
        rx={radius * 1.04}
        ry={radius * 0.94}
        fill={isWhite ? 'rgba(28, 14, 6, 0.4)' : 'rgba(0, 0, 0, 0.55)'}
        filter={boardId ? `url(#pieceShadowBlur-${boardId})` : 'url(#pieceShadowBlur)'}
      />

      {/* Main Physical Turned Wood Piece Body */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={
          boardId
            ? isWhite
              ? `url(#ivoryPieceGradient-${boardId})`
              : `url(#walnutPieceGradient-${boardId})`
            : isWhite
              ? 'url(#ivoryPieceGradient)'
              : 'url(#walnutPieceGradient)'
        }
        stroke={isWhite ? '#BFAFA0' : '#140803'}
        strokeWidth="0.8"
        className="transition-transform group-hover:scale-105"
      />

      {/* Top Rim Sheen (Subtle light reflection) */}
      <path
        d={`M ${cx - radius * 0.65} ${cy - radius * 0.45} A ${radius * 0.8} ${radius * 0.8} 0 0 1 ${cx + radius * 0.65} ${cy - radius * 0.45}`}
        fill="none"
        stroke={isWhite ? 'rgba(255, 255, 255, 0.85)' : 'rgba(225, 175, 125, 0.35)'}
        strokeWidth="0.65"
        strokeLinecap="round"
      />

      {/* Subtle Turned Medallion Inset (Single gentle bevel, not multiple concentric rings) */}
      <circle
        cx={cx}
        cy={cy}
        r={radius * 0.65}
        fill="none"
        stroke={isWhite ? 'rgba(175, 155, 130, 0.35)' : 'rgba(10, 4, 1, 0.45)'}
        strokeWidth="0.5"
      />
    </g>
  );
}
