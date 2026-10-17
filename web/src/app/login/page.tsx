import type { Metadata } from "next";
import { Suspense } from "react";
import { getMessages } from "@/i18n";
import { LoginForm } from "./login-form";
import styles from "../auth.module.css";

const t = getMessages();

export const metadata: Metadata = { title: t.login.title };

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <div className={`card ${styles.box}`}>
        <h1 className={styles.brand}>{t.appName}</h1>
        <p className="muted">{t.appTagline}</p>
        <h2 className={styles.title}>{t.login.title}</h2>
        <Suspense>
          <LoginForm t={t.login} />
        </Suspense>
        <p className={`muted ${styles.note}`}>{t.login.closed}</p>
      </div>
    </main>
  );
}
