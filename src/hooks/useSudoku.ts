import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  type Difficulty,
  type Grid,
  decodePuzzle,
  encodePuzzle,
  findConflicts,
  generatePuzzle,
  isSolved,
  solve,
} from "@/lib/sudoku";

type Move = { idx: number; from: number; to: number };

export type GameStatus = "idle" | "playing" | "paused" | "ended";

type State = {
  puzzle: Grid;
  grid: Grid;
  difficulty: Difficulty;
  past: Move[];
  future: Move[];
  selected: number | null;
  status: GameStatus;
};

type Action =
  | { type: "set"; idx: number; value: number }
  | { type: "select"; idx: number | null }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset" }
  | { type: "load"; puzzle: Grid; difficulty: Difficulty; grid?: Grid | undefined }
  | { type: "setStatus"; status: GameStatus };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "select":
      return { ...state, selected: action.idx };
    case "set": {
      const { idx, value } = action;
      if (state.puzzle[idx] !== 0 || state.status !== "playing") return state;
      const from = state.grid[idx]!;
      if (from === value) return state;
      const grid = [...state.grid];
      grid[idx] = value;
      return { ...state, grid, past: [...state.past, { idx, from, to: value }], future: [] };
    }
    case "undo": {
      if (state.status !== "playing") return state;
      const move = state.past[state.past.length - 1];
      if (!move) return state;
      const grid = [...state.grid];
      grid[move.idx] = move.from;
      return {
        ...state,
        grid,
        past: state.past.slice(0, -1),
        future: [move, ...state.future],
        selected: move.idx,
      };
    }
    case "redo": {
      if (state.status !== "playing") return state;
      const move = state.future[0];
      if (!move) return state;
      const grid = [...state.grid];
      grid[move.idx] = move.to;
      return {
        ...state,
        grid,
        past: [...state.past, move],
        future: state.future.slice(1),
        selected: move.idx,
      };
    }
    case "reset":
      return { ...state, grid: [...state.puzzle], past: [], future: [], status: "idle" };
    case "load":
      return {
        puzzle: action.puzzle,
        grid: action.grid ?? [...action.puzzle],
        difficulty: action.difficulty,
        past: [],
        future: [],
        selected: null,
        status: "idle",
      };
    case "setStatus":
      return { ...state, status: action.status };
  }
}

const STORAGE_PREFIX = "sudoku:";

function readSaved(code: string): { grid: Grid; seconds: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + code);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { grid: number[]; seconds: number };
    if (!Array.isArray(parsed.grid) || parsed.grid.length !== 81) return null;
    return { grid: parsed.grid, seconds: parsed.seconds ?? 0 };
  } catch {
    return null;
  }
}

const emptyState: State = {
  puzzle: new Array(81).fill(0),
  grid: new Array(81).fill(0),
  difficulty: "medium",
  past: [],
  future: [],
  selected: null,
  status: "idle",
};

export function useSudoku() {
  const [state, dispatch] = useReducer(reducer, emptyState);
  const [ready, setReady] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sharedPuzzle, setSharedPuzzle] = useState(false);

  const code = useMemo(() => (ready ? encodePuzzle(state.puzzle) : ""), [ready, state.puzzle]);
  const solved = useMemo(() => isSolved(state.grid), [state.grid]);
  const conflicts = useMemo(() => findConflicts(state.grid), [state.grid]);

  const solution = useMemo(() => solve(state.puzzle) ?? new Array(81).fill(0), [state.puzzle]);

  const accuracyPercentage = useMemo(() => {
    let totalBlank = 0;
    let correctFilled = 0;
    for (let i = 0; i < 81; i++) {
      if (state.puzzle[i] === 0) {
        totalBlank++;
        if (state.grid[i] === solution[i] && solution[i] !== 0) {
          correctFilled++;
        }
      }
    }
    if (totalBlank === 0) return 100;
    return Math.round((correctFilled / totalBlank) * 100);
  }, [state.puzzle, state.grid, solution]);

  // Initial load: shared link or fresh puzzle.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("p");
    const d = params.get("d") as Difficulty | null;
    const difficulty: Difficulty = d === "easy" || d === "medium" || d === "hard" ? d : "medium";

    const shared = p ? decodePuzzle(p) : null;
    if (shared) {
      const saved = readSaved(encodePuzzle(shared));
      setSharedPuzzle(true);
      setSeconds(saved?.seconds ?? 0);
      dispatch({ type: "load", puzzle: shared, difficulty, grid: saved?.grid });
    } else {
      const { puzzle } = generatePuzzle(difficulty);
      const saved = readSaved(encodePuzzle(puzzle));
      setSeconds(saved?.seconds ?? 0);
      dispatch({ type: "load", puzzle, difficulty, grid: saved?.grid });
    }
    setReady(true);
  }, []);

  // Timer
  useEffect(() => {
    if (!ready || state.status !== "playing" || solved) return;
    const id = window.setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [ready, state.status, solved]);

  useEffect(() => {
    if (solved && state.status === "playing") {
      dispatch({ type: "setStatus", status: "ended" });
    }
  }, [solved, state.status]);

  // Persist progress
  useEffect(() => {
    if (!ready || !code) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + code, JSON.stringify({ grid: state.grid, seconds }));
    } catch {
      /* ignore */
    }
  }, [ready, code, state.grid, seconds]);

  const newPuzzle = useCallback((difficulty: Difficulty) => {
    const { puzzle } = generatePuzzle(difficulty);
    setSharedPuzzle(false);
    setSeconds(0);
    dispatch({ type: "load", puzzle, difficulty });
    const url = new URL(window.location.href);
    url.searchParams.delete("p");
    url.searchParams.set("d", difficulty);
    window.history.replaceState(null, "", url.toString());
  }, []);

  const shareUrl = useMemo(() => {
    if (!ready || typeof window === "undefined") return "";
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("p", code);
    url.searchParams.set("d", state.difficulty);
    return url.toString();
  }, [ready, code, state.difficulty]);

  const hasProgress = state.past.length > 0;

  const startPause = useCallback(() => {
    if (state.status === "playing") {
      dispatch({ type: "setStatus", status: "paused" });
    } else if (state.status === "idle" || state.status === "paused") {
      dispatch({ type: "setStatus", status: "playing" });
    }
  }, [state.status]);

  const end = useCallback(() => {
    dispatch({ type: "setStatus", status: "ended" });
  }, []);

  return {
    ...state,
    ready,
    seconds,
    solved,
    conflicts,
    accuracyPercentage,
    shareUrl,
    sharedPuzzle,
    hasProgress,
    canUndo: state.status === "playing" && state.past.length > 0,
    canRedo: state.status === "playing" && state.future.length > 0,
    select: (idx: number | null) => {
      if (state.status === "playing") dispatch({ type: "select", idx });
    },
    setValue: (idx: number, value: number) => {
      if (state.status === "playing") dispatch({ type: "set", idx, value });
    },
    undo: () => {
      if (state.status === "playing") dispatch({ type: "undo" });
    },
    redo: () => {
      if (state.status === "playing") dispatch({ type: "redo" });
    },
    reset: () => dispatch({ type: "reset" }),
    newPuzzle,
    startPause,
    end,
  };
}
