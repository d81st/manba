"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { Messages } from "@/i18n";
import { checkLinksAction, type CheckState } from "../server/video.actions";

export function CheckLinks({ t }: { t: Messages["admin"]["videos"] }) {
  const [state, action, pending] = useActionState<CheckState>(checkLinksAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-3 text-sm">
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? t.checking : t.check}
      </Button>
      {state.checked !== undefined && (
        <span className="text-muted-foreground">
          {t.checked.replace("{checked}", String(state.checked)).replace("{unavailable}", String(state.unavailable ?? 0))}
        </span>
      )}
    </form>
  );
}
