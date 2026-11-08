import Link from "next/link";
import { AyahList } from "@/components/ayah-list";
import { HadithRefList } from "@/components/hadith-ref-list";
import { LinkedParagraphs } from "@/components/linked-text";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";
import type { QuizQuestion as Question } from "../quiz.types";
import { Quiz, QuizQuestion } from "./quiz";

const messages = getMessages();
const t = messages.tests;

const STRINGS = { answer: t.answer, right: t.right, wrong: t.wrong, rightAnswer: t.rightAnswer, score: t.score };

// The questions with the level filter above them; after any answer a question
// shows the fragments it is built on, with links into the library.
export function QuizList({
  questions,
  levels,
  wanted,
  href,
}: {
  questions: Question[];
  levels: (number | null)[];
  wanted: string | null;
  href: (level: string | null) => string;
}) {
  return (
    <>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        <Chip href={href(null)} active={!wanted}>
          {t.allLevels}
        </Chip>
        {levels.map((level) => (
          <Chip key={level ?? "none"} href={href(String(level ?? "none"))} active={wanted === String(level ?? "none")}>
            {level ? t.levelN.replace("{n}", String(level)) : t.noLevel}
          </Chip>
        ))}
      </nav>
      <Quiz strings={STRINGS} total={questions.length}>
        <ol className="mt-4 space-y-4">
          {questions.map((q, i) => (
            <QuestionCard key={q.id} question={q} number={i + 1} />
          ))}
        </ol>
      </Quiz>
    </>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "rounded-full border px-3 py-1 no-underline",
        active ? "border-primary bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
      )}
    >
      {children}
    </Link>
  );
}

function LevelBadge({ level }: { level: Question["level"] }) {
  if (level.sunni === null && level.shia === null) return <Badge variant="outline">{t.noLevel}</Badge>;
  const parts = [
    level.sunni !== null ? `${t.levelSunni} ${level.sunni}` : null,
    level.shia !== null ? `${t.levelShia} ${level.shia}` : null,
  ].filter(Boolean);
  return <Badge variant="outline">{`${t.levelN.replace(" {n}", "")}: ${parts.join(" · ")}`}</Badge>;
}

function QuestionCard({ question: q, number }: { question: Question; number: number }) {
  return (
    <li id={`q-${q.id}`} className="scroll-mt-4 rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="tabular-nums">{number}.</span>
        <LevelBadge level={q.level} />
        {q.status !== "published" && (
          <Badge variant="secondary">{messages.admin.statuses[q.status as keyof typeof messages.admin.statuses] ?? q.status}</Badge>
        )}
      </div>
      <p className="mt-2 text-lg font-medium whitespace-pre-line">{q.prompt}</p>
      <QuizQuestion id={q.id} options={q.options} strings={STRINGS}>
        <div className="space-y-3">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{t.sources}</h3>
          {q.ayahs.length > 0 && <AyahList ayahs={q.ayahs} compact />}
          {q.passages.length > 0 && <HadithRefList hadiths={q.passages} />}
          {q.note && (
            <div className="text-sm">
              <LinkedParagraphs text={q.note} />
            </div>
          )}
          <p className="flex flex-wrap gap-4 text-sm">
            {q.topic && (q.topic.published || q.status !== "published") && (
              <Link href={`/topics/${q.topic.slug}`}>
                {t.topic}: {q.topic.title}
              </Link>
            )}
            {q.term && (q.term.published || q.status !== "published") && (
              <Link href={`/glossary/${q.term.slug}`}>
                {t.term}: {q.term.title}
              </Link>
            )}
          </p>
        </div>
      </QuizQuestion>
    </li>
  );
}
