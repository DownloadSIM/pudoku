import { Eraser } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Grid } from "@/lib/sudoku";

type Props = {
  grid: Grid;
  onInput: (value: number) => void;
  disabled?: boolean;
};

export function NumberPad({ grid, onInput, disabled }: Props) {
  const counts = new Map<number, number>();
  grid.forEach((v) => v && counts.set(v, (counts.get(v) ?? 0) + 1));

  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
        const done = (counts.get(n) ?? 0) >= 9;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onInput(n)}
            className={cn(
              "flex aspect-square items-center justify-center rounded-md border border-ink/15 bg-card text-2xl font-medium tabular-nums text-ink shadow-sm transition-colors hover:bg-highlight active:bg-selection disabled:opacity-40",
              done && "text-muted-foreground",
            )}
          >
            {n}
          </button>
        );
      })}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onInput(0)}
        aria-label="Erase cell"
        className="flex aspect-square items-center justify-center rounded-md border border-ink/15 bg-card text-ink shadow-sm transition-colors hover:bg-highlight active:bg-selection disabled:opacity-40"
      >
        <Eraser className="size-5" />
      </button>
    </div>
  );
}
