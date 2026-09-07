import { VariantConfig } from '../engine/types';

export const MILLS_6_CONFIG: VariantConfig = {
  variant: 'MILLS_6',
  name: '6-Piece Mills',
  piecesPerPlayer: 6,
  pointCount: 16,
  instantWinOnMill: false,
  allowsFlying: false,
  flyingPieceThreshold: 3,
  coordinates: {
    // Outer square
    0: { x: 15, y: 15 },
    1: { x: 50, y: 15 },
    2: { x: 85, y: 15 },
    3: { x: 85, y: 50 },
    4: { x: 85, y: 85 },
    5: { x: 50, y: 85 },
    6: { x: 15, y: 85 },
    7: { x: 15, y: 50 },
    // Inner square
    8: { x: 32, y: 32 },
    9: { x: 50, y: 32 },
    10: { x: 68, y: 32 },
    11: { x: 68, y: 50 },
    12: { x: 68, y: 68 },
    13: { x: 50, y: 68 },
    14: { x: 32, y: 68 },
    15: { x: 32, y: 50 },
  },
  adjacency: {
    // Outer square
    0: [1, 7],
    1: [0, 2, 9],
    2: [1, 3],
    3: [2, 4, 11],
    4: [3, 5],
    5: [4, 6, 13],
    6: [5, 7],
    7: [6, 0, 15],
    // Inner square
    8: [9, 15],
    9: [8, 10, 1],
    10: [9, 11],
    11: [10, 12, 3],
    12: [11, 13],
    13: [12, 14, 5],
    14: [13, 15],
    15: [14, 8, 7],
  },
  mills: [
    // Outer square sides
    [0, 1, 2],
    [2, 3, 4],
    [4, 5, 6],
    [6, 7, 0],
    // Inner square sides
    [8, 9, 10],
    [10, 11, 12],
    [12, 13, 14],
    [14, 15, 8],
  ],
};
