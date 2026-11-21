import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireSession } from "@/shared/auth/auth";
import { isDatabaseConfigured } from "@/shared/db";
import { getMessages } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { canSee, isParticipant, uncheckedIds } from "../debate.rules";
import {
  acceptDebateAction,
  acceptQuestionAction,
  adminCloseAction,
  adminReopenAction,
  cancelQuestionAction,
  declineDebateAction,
  rejectQuestionAction,
  requestCloseAction,
  withdrawDebateAction,
} from "../server/debate.actions";
import { getDebate } from "../server/debate.queries";
import { DebateTree, parentOptions } from "./debate-tree";
import { MoveForm } from "./move-form";
import { PublishForm } from "./moderation-forms";
import { QuestionForm } from "./question-form";

const messages = getMessages();
const t = messages.debates;

function Step({ action, id, label }: { action: (data: FormData) => Promise<void>; id: number; label: string }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="outline">
        {label}
      </Button>
    </form>
  );
}

// One dispute: the agreed question, the tree, and the actions the viewer may take.
export async function DebateView({ id }: { id: number }) {
  await connection();
  const session = await requireSession();
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const debate = await getDebate(id);
  if (!debate || !canSee(debate, session)) notFound();

  const mine = isParticipant(debate, session.login);
  const admin = session.role === "admin";
  const open = debate.status === "open";
  const left = uncheckedIds(debate.moves).length;

  return (
    <>
      <nav className="mt-6 text-sm">
        <Link href="/debates">← {t.back}</Link>
      </nav>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{t.statuses[debate.status]}</Badge>
        <span className="text-sm text-muted-foreground">{t.languages[debate.language]}</span>
      </div>
      <h1 className="mt-3 text-2xl font-semibold break-words" dir="auto">
        {debate.question}
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t.intro}</p>
      <p className="mt-3 text-sm">
        <span className="text-muted-foreground">{t.participants}: </span>
        {debate.createdBy} · {debate.partner}
        <span className="text-muted-foreground"> · {debate.createdAt} {t.at}</span>
      </p>
      {debate.topicSlug && (
        <p className="mt-1 text-sm">
          <Link href={`/topics/${debate.topicSlug}`}>{debate.topicSlug}</Link>
        </p>
      )}
      {debate.editorNote && (
        <p className="mt-3 max-w-3xl text-sm break-words" dir="auto">
          <span className="text-muted-foreground">{t.editorNote}: </span>
          {debate.editorNote}
        </p>
      )}

      {debate.status === "proposed" && mine && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {session.login === debate.partner && (
              <>
                <Step action={acceptDebateAction} id={debate.id} label={t.accept} />
                <Step action={declineDebateAction} id={debate.id} label={t.decline} />
              </>
            )}
            {session.login === debate.createdBy && <Step action={withdrawDebateAction} id={debate.id} label={t.withdraw} />}
          </div>
          {session.login === debate.createdBy && <QuestionForm id={debate.id} mode="edit" current={debate.question} />}
        </>
      )}

      {open && mine && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">{t.change}</h2>
          {debate.pendingQuestion ? (
            <>
              <p className="mt-2 break-words" dir="auto">
                {debate.pendingQuestion}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t.changeWait.replace("{login}", debate.pendingQuestionBy ?? "")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {debate.pendingQuestionBy === session.login ? (
                  <Step action={cancelQuestionAction} id={debate.id} label={t.changeCancel} />
                ) : (
                  <>
                    <Step action={acceptQuestionAction} id={debate.id} label={t.changeAccept} />
                    <Step action={rejectQuestionAction} id={debate.id} label={t.changeReject} />
                  </>
                )}
              </div>
            </>
          ) : (
            <QuestionForm id={debate.id} mode="propose" />
          )}
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {debate.closeRequestedBy === session.login
                ? t.closeWaiting
                : debate.closeRequestedBy
                  ? t.closeAgree
                  : t.closeHint}
            </p>
            <div className="flex flex-wrap gap-2">
              <Step
                action={requestCloseAction}
                id={debate.id}
                label={debate.closeRequestedBy && debate.closeRequestedBy !== session.login ? t.closeAgree : t.closeAsk}
              />
            </div>
          </div>
        </section>
      )}

      {admin && open && (
        <form action={adminCloseAction} className="mt-4 flex max-w-xl flex-col gap-2">
          <input type="hidden" name="id" value={debate.id} />
          <p className="text-sm text-muted-foreground">{t.adminCloseHint}</p>
          <Button type="submit" size="sm" variant="outline" className="w-fit">
            {t.adminClose}
          </Button>
        </form>
      )}
      {admin && debate.status === "closed" && (
        <form action={adminReopenAction} className="mt-4">
          <input type="hidden" name="id" value={debate.id} />
          <Button type="submit" size="sm" variant="outline">
            {t.reopen}
          </Button>
        </form>
      )}

      <DebateTree moves={debate.moves} debateId={debate.id} moderate={admin && (open || debate.status === "closed")} />

      {open && mine && <MoveForm key={debate.moves.length} debateId={debate.id} parents={parentOptions(debate.moves)} />}

      {admin && debate.status === "closed" && <PublishForm debateId={debate.id} unchecked={left} />}

      <p className="mt-6 text-sm">
        <a href={`/api/debates/${debate.id}/export`} download={`debate-${debate.id}.json`}>
          {t.export}
        </a>
      </p>
    </>
  );
}
