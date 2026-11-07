import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { getMessages } from "@/i18n";
import { requireAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { listUsers } from "@/lib/users";
import { CreateUserForm, UserRowForm } from "./users-forms";

const messages = getMessages();
const t = messages.admin.users;

export const metadata: Metadata = { title: t.title };

export default function UsersPage() {
  return (
    <Page>
      <nav className="mt-6 text-sm">
        <Link href="/admin">← {messages.admin.title}</Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 text-muted-foreground">{t.intro}</p>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">…</p>}>
        <Users />
      </Suspense>
    </Page>
  );
}

async function Users() {
  await requireAdmin();
  if (!isDatabaseConfigured()) return <p className="mt-6 text-destructive">{messages.quran.noDatabase}</p>;
  const users = await listUsers();
  return (
    <div className="mt-6 space-y-6">
      <CreateUserForm t={t} />
      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => (
            <UserRowForm key={user.id} t={t} user={user} />
          ))}
        </ul>
      )}
    </div>
  );
}
