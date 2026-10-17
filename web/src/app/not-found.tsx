import Link from "next/link";
import { getMessages } from "@/i18n";

const t = getMessages().notFound;

export default function NotFound() {
  return (
    <main className="container" style={{ padding: "48px 16px" }}>
      <h1 style={{ fontSize: "1.3rem", marginBottom: 8 }}>{t.title}</h1>
      <p className="muted">{t.text}</p>
      <p style={{ marginTop: 16 }}>
        <Link href="/">{t.back}</Link>
      </p>
    </main>
  );
}
