import type { Metadata } from "next";
import { getMessages } from "@/i18n";
import { PasswordForm } from "./password-form";
import styles from "../../auth.module.css";

const t = getMessages();

export const metadata: Metadata = { title: t.password.title };

export default function PasswordPage() {
  return (
    <main className={styles.page}>
      <div className={`card ${styles.box}`}>
        <h1 className={styles.title}>{t.password.title}</h1>
        <p className="muted">{t.password.hint}</p>
        <div style={{ marginTop: 16 }}>
          <PasswordForm t={t.password} />
        </div>
      </div>
    </main>
  );
}
