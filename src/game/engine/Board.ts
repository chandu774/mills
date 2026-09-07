import { PlayerColor } from './types';

export class Board {
  private points: (PlayerColor | null)[];
  readonly size: number;

  constructor(size: number, initialPoints?: (PlayerColor | null)[]) {
    this.size = size;
    if (initialPoints) {
      if (initialPoints.length !== size) {
        throw new Error(`Invalid initial board size: expected ${size}, got ${initialPoints.length}`);
      }
      this.points = [...initialPoints];
    } else {
      this.points = new Array(size).fill(null);
    }
  }

  get(index: number): PlayerColor | null {
    if (index < 0 || index >= this.size) return null;
    return this.points[index];
  }

  set(index: number, player: PlayerColor): void {
    if (index < 0 || index >= this.size) {
      throw new Error(`Point index out of bounds: ${index}`);
    }
    this.points[index] = player;
  }

  clear(index: number): void {
    if (index < 0 || index >= this.size) {
      throw new Error(`Point index out of bounds: ${index}`);
    }
    this.points[index] = null;
  }

  isEmpty(index: number): boolean {
    return this.get(index) === null;
  }

  getPieceCount(player: PlayerColor): number {
    let count = 0;
    for (let i = 0; i < this.size; i++) {
      if (this.points[i] === player) count++;
    }
    return count;
  }

  getPlayerPoints(player: PlayerColor): number[] {
    const indices: number[] = [];
    for (let i = 0; i < this.size; i++) {
      if (this.points[i] === player) indices.push(i);
    }
    return indices;
  }

  getEmptyPoints(): number[] {
    const indices: number[] = [];
    for (let i = 0; i < this.size; i++) {
      if (this.points[i] === null) indices.push(i);
    }
    return indices;
  }

  toArray(): (PlayerColor | null)[] {
    return [...this.points];
  }

  clone(): Board {
    return new Board(this.size, this.points);
  }

  toHash(): string {
    return this.points.map((p) => (p === null ? '.' : p === 'WHITE' ? 'W' : 'B')).join('');
  }
}
