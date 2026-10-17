import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/actions";
import { getMessages } from "@/i18n";
import { requireSession } from "@/lib/auth";
import styles from "./site-header.module.css";

const t = getMessages();

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          <span className={styles.name}>{t.appName}</span>
          <span className={`muted ${styles.tagline}`}>{t.appTagline}</span>
        </Link>
        <Suspense fallback={<span className="muted">{t.home.loading}</span>}>
          <Account />
        </Suspense>
      </div>
    </header>
  );
}

async function Account() {
  const session = await requireSession();

  return (
    <form action={signOut} className={styles.account}>
      <span className="muted">
        {t.home.signedInAs} {session.login}
      </span>
      <button className="button button-ghost" type="submit">
        {t.nav.signOut}
      </button>
    </form>
  );
}
