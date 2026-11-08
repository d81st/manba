"use client";

import { Check, X } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Strings = { answer: string; right: string; wrong: string; rightAnswer: string; score: string };

// Answers given on the page, for the score; kept only in the browser.
const Score = createContext<{ results: Record<number, boolean>; record: (id: number, right: boolean) => void } | null>(null);

export function Quiz({ children, strings, total }: { children: React.ReactNode; strings: Strings; total: number }) {
  const [results, setResults] = useState<Record<number, boolean>>({});
  const answered = Object.keys(results).length;
  const right = Object.values(results).filter(Boolean).length;
  return (
    <Score.Provider value={{ results, record: (id, ok) => setResults((r) => ({ ...r, [id]: ok })) }}>
      {answered > 0 && (
        <p className="sticky top-0 z-10 mt-4 rounded-lg border bg-card px-3 py-2 text-sm shadow-sm" aria-live="polite">
          {strings.score.replace("{right}", String(right)).replace("{total}", String(total))}
        </p>
      )}
      {children}
    </Score.Provider>
  );
}

// One question: the options, then on answering whether it was right, the right
// answer and the sources (rendered on the server, passed as children).
export function QuizQuestion({
  id,
  options,
  strings,
  children,
}: {
  id: number;
  options: { id: number; text: string; correct: boolean }[];
  strings: Strings;
  children: React.ReactNode;
}) {
  const score = useContext(Score);
  const [chosen, setChosen] = useState<number[]>([]);
  const [answered, setAnswered] = useState(false);
  const many = options.filter((o) => o.correct).length > 1;
  const right =
    answered && options.every((o) => o.correct === chosen.includes(o.id));
  const toggle = (optionId: number) =>
    setChosen((c) => (many ? (c.includes(optionId) ? c.filter((x) => x !== optionId) : [...c, optionId]) : [optionId]));

  return (
    <div>
      <fieldset className="mt-3 space-y-2" disabled={answered}>
        {options.map((o) => {
          const picked = chosen.includes(o.id);
          return (
            <label
              key={o.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2",
                !answered && picked && "border-primary bg-accent",
                answered && o.correct && "border-primary bg-accent",
                answered && picked && !o.correct && "border-destructive",
              )}
            >
              <input
                type={many ? "checkbox" : "radio"}
                name={`q-${id}`}
                className="accent-primary"
                checked={picked}
                onChange={() => toggle(o.id)}
              />
              <span className="flex-1">{o.text}</span>
              {answered && o.correct && <Check className="size-4 text-primary" aria-label={strings.rightAnswer} />}
              {answered && picked && !o.correct && <X className="size-4 text-destructive" />}
            </label>
          );
        })}
      </fieldset>
      {!answered ? (
        <Button
          type="button"
          className="mt-3"
          disabled={chosen.length === 0}
          onClick={() => {
            setAnswered(true);
            score?.record(id, options.every((o) => o.correct === chosen.includes(o.id)));
          }}
        >
          {strings.answer}
        </Button>
      ) : (
        <div className="mt-3 space-y-3">
          <p className={cn("font-medium", right ? "text-primary" : "text-destructive")} aria-live="polite">
            {right ? strings.right : strings.wrong}
          </p>
          {children}
        </div>
      )}
    </div>
  );
}
