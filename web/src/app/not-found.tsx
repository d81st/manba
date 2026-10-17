import { SearchX } from "lucide-react";
import Link from "next/link";
import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";

const t = getMessages().notFound;

export default function NotFound() {
  return (
    <Page className="flex flex-col items-start gap-3 py-12">
      <SearchX className="size-8 text-muted-foreground" />
      <h1 className="text-xl font-semibold">{t.title}</h1>
      <p className="text-muted-foreground">{t.text}</p>
      <Button asChild variant="outline">
        <Link href="/" className="no-underline">
          {t.back}
        </Link>
      </Button>
    </Page>
  );
}
