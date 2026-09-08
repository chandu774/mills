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
    0: { x: 11, y: 11 },
    1: { x: 50, y: 11 },
    2: { x: 89, y: 11 },
    3: { x: 89, y: 50 },
    4: { x: 89, y: 89 },
    5: { x: 50, y: 89 },
    6: { x: 11, y: 89 },
    7: { x: 11, y: 50 },
    // Inner square
    8: { x: 31, y: 31 },
    9: { x: 50, y: 31 },
    10: { x: 69, y: 31 },
    11: { x: 69, y: 50 },
    12: { x: 69, y: 69 },
    13: { x: 50, y: 69 },
    14: { x: 31, y: 69 },
    15: { x: 31, y: 50 },
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
