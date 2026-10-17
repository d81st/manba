import type { Metadata } from "next";
import Link from "next/link";
import { getMessages } from "@/i18n";
import styles from "../../auth.module.css";

const t = getMessages();

export const metadata: Metadata = { title: t.authError.title };

export default function AuthErrorPage() {
  return (
    <main className={styles.page}>
      <div className={`card ${styles.box}`}>
        <h1 className={styles.title}>{t.authError.title}</h1>
        <p className="muted">{t.authError.text}</p>
        <p className={styles.note}>
          <Link href="/login">{t.authError.back}</Link>
        </p>
      </div>
    </main>
  );
}
