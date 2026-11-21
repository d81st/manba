import { cn } from "@/shared/ui/utils";

// Page body with the site's width and side gutters.
export function Page({ className, ...props }: React.ComponentProps<"main">) {
  return <main className={cn("mx-auto w-full min-w-0 max-w-5xl break-words px-4 pb-12", className)} {...props} />;
}
