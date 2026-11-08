import Link from "next/link";
import { getMessages } from "@/i18n";

const t = getMessages().sira;

// While a preview is open, a way back to the published page. No link that turns drafts on.
export function PreviewBar({ href, preview }: { href: string; preview: boolean }) {
  if (!preview) return null;
  return (
    <>
      <div className="mt-2 flex justify-end text-sm">
        <Link href={href} className="text-muted-foreground">
          {t.publishedLink}
        </Link>
      </div>
      <PreviewNote preview />
    </>
  );
}

export function PreviewNote({ preview }: { preview: boolean }) {
  if (!preview) return null;
  return <p className="mt-3 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">{t.preview}</p>;
}
