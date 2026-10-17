import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getMessages, type Messages } from "@/i18n";
import styles from "./page.module.css";

const t = getMessages();

// Sections that already have pages.
const LINKS: Partial<Record<keyof Messages["home"]["sections"], string>> = {
  library: "/quran",
};

export default function Home() {
  const sections = Object.entries(t.home.sections) as [keyof typeof t.home.sections, string][];

  return (
    <>
      <SiteHeader />
      <main className="container">
        <h1 className={styles.title}>{t.home.sectionsTitle}</h1>
        <ul className={styles.grid}>
          {sections.map(([key, name]) => {
            const href = LINKS[key];
            const body = (
              <>
                <span>{name}</span>
                <span className={`muted ${styles.soon}`}>{href ? t.home.open : t.home.soon}</span>
              </>
            );
            return (
              <li key={key}>
                {href ? (
                  <Link href={href} className={`card ${styles.section} ${styles.link}`}>
                    {body}
                  </Link>
                ) : (
                  <div className={`card ${styles.section}`}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
