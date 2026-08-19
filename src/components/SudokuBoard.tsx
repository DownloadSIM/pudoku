import { cn } from "@/lib/utils";
import type { Grid } from "@/lib/sudoku";

type Props = {
  puzzle: Grid;
  grid: Grid;
  selected: number | null;
  conflicts: Set<number>;
  onSelect: (idx: number) => void;
};

export function SudokuBoard({ puzzle, grid, selected, conflicts, onSelect }: Props) {
  const selRow = selected === null ? -1 : Math.floor(selected / 9);
  const selCol = selected === null ? -1 : selected % 9;
  const selBox = selected === null ? -1 : Math.floor(selRow / 3) * 3 + Math.floor(selCol / 3);
  const selValue = selected === null ? 0 : (grid[selected] ?? 0);

  return (
    <div
      className="grid grid-cols-9 overflow-hidden rounded-md border-2 border-ink bg-card shadow-[0_10px_40px_-20px_rgba(0,0,0,0.45)]"
      role="grid"
      aria-label="Sudoku board"
    >
      {grid.map((value, idx) => {
        const row = Math.floor(idx / 9);
        const col = idx % 9;
        const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
        const given = puzzle[idx] !== 0;
        const isSelected = selected === idx;
        const inLine = !isSelected && (row === selRow || col === selCol || box === selBox);
        const sameValue = !isSelected && value !== 0 && value === selValue;
        const conflict = conflicts.has(idx);

        return (
          <button
            key={idx}
            type="button"
            role="gridcell"
            aria-label={`Row ${row + 1} column ${col + 1}${value ? `, ${value}` : ", empty"}`}
            onClick={() => onSelect(idx)}
            className={cn(
              "relative flex aspect-square items-center justify-center border border-grid-line/60 text-xl font-medium tabular-nums transition-colors sm:text-2xl md:text-3xl",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              col % 3 === 2 && col !== 8 && "border-r-2 border-r-ink",
              row % 3 === 2 && row !== 8 && "border-b-2 border-b-ink",
              given ? "font-semibold text-ink" : "text-pencil",
              inLine && "bg-highlight",
              sameValue && "bg-highlight-strong",
              isSelected && "bg-selection",
              conflict && "text-conflict",
            )}
          >
            {value !== 0 ? value : ""}
          </button>
        );
      })}
    </div>
  );
}
