import { enablePreview } from "@/app/admin/preview";
import { cn } from "@/shared/ui/utils";

// A button that looks like the surrounding text links and sets the preview cookie.
export function PreviewLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form action={enablePreview} className="inline-flex">
      <input type="hidden" name="next" value={href} />
      <button type="submit" className={cn("cursor-pointer text-primary hover:underline", className)}>
        {children}
      </button>
    </form>
  );
}
