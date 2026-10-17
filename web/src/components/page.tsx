import { cn } from "@/lib/utils";

// Page body with the site's width and side gutters.
export function Page({ className, ...props }: React.ComponentProps<"main">) {
  return <main className={cn("mx-auto w-full max-w-5xl px-4 pb-12", className)} {...props} />;
}
