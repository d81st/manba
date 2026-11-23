import { KeyRound, LogOut, Search, Settings } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/actions";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { getMessages } from "@/shared/i18n";
import { requireSession } from "@/shared/auth/auth";
import { LanguageSwitch } from "@/shared/layout/language-switch";

const t = getMessages();

export function SiteHeader({ menu }: { menu?: React.ReactNode } = {}) {
  return (
    <header className="overflow-x-clip border-b bg-card">
      <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3 px-4 py-3">
        {menu}
        <Link href="/" className="flex flex-col text-foreground no-underline">
          <span className="text-lg font-semibold leading-tight">{t.appName}</span>
          <span className="text-sm text-muted-foreground">{t.appTagline}</span>
        </Link>
        {/* One search for the whole site: the assistant finds the word or the
            address in the Quran, the hadiths, the books, the topics and the glossary. */}
        <form action="/assistant" role="search" className="order-last flex w-full gap-2 sm:order-none sm:w-auto sm:flex-1 sm:max-w-sm">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              maxLength={300}
              placeholder={t.assistant.headerPlaceholder}
              aria-label={t.assistant.headerLabel}
              className="ps-8"
            />
          </div>
        </form>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <LanguageSwitch />
          <Suspense fallback={<span className="text-sm text-muted-foreground">{t.home.loading}</span>}>
            <Account />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function Account() {
  const session = await requireSession();

  return (
    <form action={signOut} className="flex min-w-0 flex-wrap items-center gap-3 text-sm">
      <span className="min-w-0 max-w-[14rem] truncate text-muted-foreground sm:max-w-xs">
        {t.home.signedInAs} {session.login}
      </span>
      {session.uid && (
        <Link href="/account/password" className="inline-flex items-center gap-1">
          <KeyRound className="size-4" />
          {t.account.password}
        </Link>
      )}
      {session.role === "admin" && (
        <Link href="/admin" className="inline-flex items-center gap-1">
          <Settings className="size-4" />
          {t.admin.link}
        </Link>
      )}
      <Button type="submit" variant="outline" size="sm">
        <LogOut />
        {t.nav.signOut}
      </Button>
    </form>
  );
}
