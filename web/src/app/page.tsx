import { Suspense } from "react";
import { getMessages } from "@/i18n";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "./actions";
import styles from "./page.module.css";

const t = getMessages();

export default function Home() {
  const sections = Object.values(t.home.sections);

  return (
    <>
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <div>
            <p className={styles.brand}>{t.appName}</p>
            <p className="muted">{t.appTagline}</p>
          </div>
          <Suspense fallback={<span className="muted">{t.home.loading}</span>}>
            <Account />
          </Suspense>
        </div>
      </header>
      <main className="container">
        <h1 className={styles.title}>{t.home.sectionsTitle}</h1>
        <ul className={styles.grid}>
          {sections.map((name) => (
            <li key={name} className={`card ${styles.section}`}>
              <span>{name}</span>
              <span className={`muted ${styles.soon}`}>{t.home.soon}</span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

async function Account() {
  const user = await getCurrentUser();

  return (
    <form action={signOut} className={styles.account}>
      <span className="muted">
        {t.home.signedInAs} {user.email}
      </span>
      <button className="button button-ghost" type="submit">
        {t.nav.signOut}
      </button>
    </form>
  );
}
