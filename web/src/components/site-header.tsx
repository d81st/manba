import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";

const t = getMessages();

export function SiteHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex flex-col text-foreground no-underline">
          <span className="text-lg font-semibold leading-tight">{t.appName}</span>
          <span className="text-sm text-muted-foreground">{t.appTagline}</span>
        </Link>
        <Suspense fallback={<span className="text-sm text-muted-foreground">{t.home.loading}</span>}>
          <Account />
        </Suspense>
      </div>
    </header>
  );
}

async function Account() {
  const session = await requireSession();

  return (
    <form action={signOut} className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">
        {t.home.signedInAs} {session.login}
      </span>
      <Link href="/admin" className="inline-flex items-center gap-1">
        <Settings className="size-4" />
        {t.admin.link}
      </Link>
      <Button type="submit" variant="outline" size="sm">
        <LogOut />
        {t.nav.signOut}
      </Button>
    </form>
  );
}
