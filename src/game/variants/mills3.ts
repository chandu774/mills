import { VariantConfig } from '../engine/types';

export const MILLS_3_CONFIG: VariantConfig = {
  variant: 'MILLS_3',
  name: '3-Piece Mills',
  piecesPerPlayer: 3,
  pointCount: 9,
  instantWinOnMill: true,
  allowsFlying: false,
  flyingPieceThreshold: 3,
  coordinates: {
    0: { x: 14, y: 14 },
    1: { x: 50, y: 14 },
    2: { x: 86, y: 14 },
    3: { x: 14, y: 50 },
    4: { x: 50, y: 50 },
    5: { x: 86, y: 50 },
    6: { x: 14, y: 86 },
    7: { x: 50, y: 86 },
    8: { x: 86, y: 86 },
  },
  adjacency: {
    0: [1, 3, 4],
    1: [0, 2, 4],
    2: [1, 5, 4],
    3: [0, 4, 6],
    4: [0, 1, 2, 3, 5, 6, 7, 8],
    5: [2, 4, 8],
    6: [3, 4, 7],
    7: [6, 4, 8],
    8: [5, 4, 7],
  },
  mills: [
    // Rows
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    // Columns
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    // Diagonals
    [0, 4, 8],
    [2, 4, 6],
  ],
};
