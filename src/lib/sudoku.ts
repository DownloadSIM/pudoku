export type Grid = number[]; // 81 cells, 0 = empty
export type Difficulty = "easy" | "medium" | "hard";

export const CLUES: Record<Difficulty, number> = {
  easy: 42,
  medium: 32,
  hard: 26,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

export function canPlace(grid: Grid, idx: number, val: number): boolean {
  const r = Math.floor(idx / 9);
  const c = idx % 9;
  for (let i = 0; i < 9; i++) {
    if (grid[r * 9 + i] === val && r * 9 + i !== idx) return false;
    if (grid[i * 9 + c] === val && i * 9 + c !== idx) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const k = (br + i) * 9 + bc + j;
      if (grid[k] === val && k !== idx) return false;
    }
  }
  return true;
}

function fill(grid: Grid): boolean {
  const idx = grid.indexOf(0);
  if (idx === -1) return true;
  for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (canPlace(grid, idx, v)) {
      grid[idx] = v;
      if (fill(grid)) return true;
      grid[idx] = 0;
    }
  }
  return false;
}

/** Counts solutions, stopping at `limit`. */
function countSolutions(grid: Grid, limit = 2): number {
  const idx = grid.indexOf(0);
  if (idx === -1) return 1;
  let total = 0;
  for (let v = 1; v <= 9; v++) {
    if (canPlace(grid, idx, v)) {
      grid[idx] = v;
      total += countSolutions(grid, limit - total);
      grid[idx] = 0;
      if (total >= limit) return total;
    }
  }
  return total;
}

export function solve(puzzle: Grid): Grid | null {
  const g = [...puzzle];
  return fill(g) ? g : null;
}

export function generatePuzzle(difficulty: Difficulty): { puzzle: Grid; solution: Grid } {
  const solution: Grid = new Array(81).fill(0);
  fill(solution);

  const puzzle = [...solution];
  const target = CLUES[difficulty];
  let clues = 81;

  for (const idx of shuffle([...Array(81).keys()])) {
    if (clues <= target) break;
    const mirror = 80 - idx;
    if (puzzle[idx] === 0) continue;

    const a = puzzle[idx]!;
    const b = puzzle[mirror]!;
    puzzle[idx] = 0;
    puzzle[mirror] = 0;
    const removed = idx === mirror ? 1 : 2;

    if (countSolutions([...puzzle]) !== 1) {
      puzzle[idx] = a;
      puzzle[mirror] = b;
    } else {
      clues -= removed;
    }
  }

  return { puzzle, solution };
}

/** Cell indices that conflict with another filled cell in row/col/box. */
export function findConflicts(grid: Grid): Set<number> {
  const bad = new Set<number>();
  for (let i = 0; i < 81; i++) {
    const v = grid[i]!;
    if (v === 0) continue;
    if (!canPlace(grid, i, v)) bad.add(i);
  }
  return bad;
}

export function isSolved(grid: Grid): boolean {
  return !grid.includes(0) && findConflicts(grid).size === 0;
}

export function encodePuzzle(puzzle: Grid): string {
  // pack pairs of digits into bytes, then base64url
  const bytes = new Uint8Array(41);
  for (let i = 0; i < 81; i += 2) {
    const hi = puzzle[i]!;
    const lo = i + 1 < 81 ? puzzle[i + 1]! : 0;
    bytes[i / 2] = hi * 10 + lo;
  }
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodePuzzle(code: string): Grid | null {
  try {
    const bin = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
    if (bin.length !== 41) return null;
    const grid: Grid = [];
    for (let i = 0; i < 41; i++) {
      const byte = bin.charCodeAt(i);
      const hi = Math.floor(byte / 10);
      const lo = byte % 10;
      if (hi > 9 || lo > 9) return null;
      grid.push(hi);
      if (grid.length < 81) grid.push(lo);
    }
    if (grid.length !== 81) return null;
    if (findConflicts(grid).size > 0) return null;
    return grid;
  } catch {
    return null;
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
