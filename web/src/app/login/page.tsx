import { LockKeyhole } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { getMessages } from "@/shared/i18n";
import { LanguageSwitch } from "@/shared/layout/language-switch";
import { LoginForm } from "@/modules/accounts";

const t = getMessages();

export function generateMetadata(): Metadata {
  return { title: t.login.title };
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex justify-end">
            <LanguageSwitch />
          </div>
          <CardTitle className="text-2xl">{t.appName}</CardTitle>
          <CardDescription>{t.appTagline}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-medium">
            <LockKeyhole className="size-4 text-muted-foreground" />
            {t.login.title}
          </h2>
          <Suspense>
            <LoginForm t={t.login} />
          </Suspense>
          <p className="text-sm text-muted-foreground">{t.login.closed}</p>
        </CardContent>
      </Card>
    </main>
  );
}
