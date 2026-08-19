import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Redo2,
  RotateCcw,
  Share2,
  Sparkles,
  Undo2,
  Shuffle,
  Play,
  Pause,
  Square,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

import { SudokuBoard } from "@/components/SudokuBoard";
import { NumberPad } from "@/components/NumberPad";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTime, type Difficulty } from "@/lib/sudoku";
import { useSudoku } from "@/hooks/useSudoku";
import { TRANSLATIONS, type LanguageCode } from "@/translations";

const TITLE = "Sudoku Together — Play Sudoku Online & Share the Same Puzzle";
const DESCRIPTION =
  "Play Sudoku instantly in your browser. Pick easy, medium or hard, undo, redo or reset any time, and share a link so friends solve the exact same puzzle.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SudokuPage,
});

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

function SudokuPage() {
  const game = useSudoku();
  const {
    ready,
    puzzle,
    grid,
    selected,
    conflicts,
    difficulty,
    solved,
    seconds,
    status,
    accuracyPercentage,
    shareUrl,
    sharedPuzzle,
    hasProgress,
    canUndo,
    canRedo,
    select,
    setValue,
    undo,
    redo,
    reset,
    newPuzzle,
    startPause,
    end,
  } = game;

  const [lang, setLang] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("sudoku_lang") as LanguageCode) || "en";
    }
    return "en";
  });

  useEffect(() => {
    localStorage.setItem("sudoku_lang", lang);
  }, [lang]);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [confirmDifficulty, setConfirmDifficulty] = useState<Difficulty | null>(null);

  const input = useCallback(
    (value: number) => {
      if (status !== "playing") {
        toast("Click Start to begin playing");
        return;
      }
      if (selected === null) {
        toast("Pick a cell first");
        return;
      }
      setValue(selected, value);
    },
    [selected, setValue, status],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (status !== "playing") return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (selected === null) return;
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        setValue(selected, Number(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        e.preventDefault();
        setValue(selected, 0);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const row = Math.floor(selected / 9);
        const col = selected % 9;
        const next =
          e.key === "ArrowUp"
            ? ((row + 8) % 9) * 9 + col
            : e.key === "ArrowDown"
              ? ((row + 1) % 9) * 9 + col
              : e.key === "ArrowLeft"
                ? row * 9 + ((col + 8) % 9)
                : row * 9 + ((col + 1) % 9);
        select(next);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, setValue, select, undo, redo, status]);

  const share = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied — everyone who opens it gets this exact puzzle.");
    } catch {
      toast.error("Couldn't copy. The link is in your address bar after you share.");
    }
  }, [shareUrl]);

  const changeDifficulty = (next: Difficulty) => {
    if (next === difficulty && !sharedPuzzle) return;
    if (hasProgress) {
      setConfirmDifficulty(next);
      return;
    }
    newPuzzle(next);
  };

  const difficultyLabels: Record<Difficulty, string> = {
    easy: t.easy,
    medium: t.medium,
    hard: t.hard,
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 pb-24 sm:py-12 sm:pb-24">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-mono text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {t.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {sharedPuzzle ? t.subtitleShared : t.subtitleFresh}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-mono text-lg tabular-nums text-ink">{formatTime(seconds)}</div>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant={status === "playing" ? "default" : "outline"}
                onClick={startPause}
                disabled={!ready || status === "ended"}
              >
                {status === "playing" ? (
                  <Pause className="size-4 mr-1" />
                ) : (
                  <Play className="size-4 mr-1" />
                )}
                {status === "playing" ? t.pause : status === "paused" ? t.resume : t.start}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={end}
                disabled={!ready || status === "idle" || status === "ended"}
              >
                <Square className="size-4 mr-1" /> {t.end}
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-ink/15 bg-card p-1">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => changeDifficulty(d)}
                  className={cn(
                    "rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    d === difficulty
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-ink",
                  )}
                >
                  {difficultyLabels[d]}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => newPuzzle(difficulty)}>
              <Shuffle className="size-4" /> {t.newPuzzle}
            </Button>
            <Button size="sm" onClick={share} disabled={!ready}>
              <Share2 className="size-4" /> {t.share}
            </Button>
          </div>

          <div className="flex items-center gap-1.5 rounded-md border border-ink/15 bg-card px-2 py-1">
            <Globe className="size-4 text-muted-foreground" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as LanguageCode)}
              aria-label="Select Language"
              className="bg-transparent text-sm font-medium text-ink focus:outline-none cursor-pointer"
            >
              {Object.entries(TRANSLATIONS).map(([code, data]) => (
                <option key={code} value={code} className="bg-card text-ink">
                  {data.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {ready ? (
          <SudokuBoard
            puzzle={puzzle}
            grid={grid}
            selected={status === "playing" ? selected : null}
            conflicts={conflicts}
            onSelect={select}
          />
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-md border-2 border-ink/20 text-sm text-muted-foreground">
            Generating puzzle…
          </div>
        )}

        {(solved || status === "ended") && (
          <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-accent px-4 py-3 text-accent-foreground">
            <Sparkles className="size-5" />
            <p className="text-sm font-medium">
              {solved
                ? t.solvedIn(formatTime(seconds))
                : t.solvedPercentIn(accuracyPercentage, formatTime(seconds))}
            </p>
          </div>
        )}

        <NumberPad grid={grid} onInput={input} disabled={!ready || status !== "playing"} />

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={undo} disabled={!canUndo}>
            <Undo2 className="size-4" /> {t.undo}
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={!canRedo}>
            <Redo2 className="size-4" /> {t.redo}
          </Button>
          <Button variant="ghost" size="sm" onClick={reset} disabled={!hasProgress}>
            <RotateCcw className="size-4" /> {t.reset}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">{t.keyboardTip}</p>
      </div>

      {confirmDifficulty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-sm rounded-lg border border-ink/15 bg-card p-5 shadow-lg">
            <h2 className="text-base font-semibold text-ink">
              Start a new {confirmDifficulty} puzzle?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your progress on this grid will be replaced.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmDifficulty(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  newPuzzle(confirmDifficulty);
                  setConfirmDifficulty(null);
                }}
              >
                New puzzle
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
