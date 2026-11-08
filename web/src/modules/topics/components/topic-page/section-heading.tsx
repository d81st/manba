// The small heading above each section of a topic page.
export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">{children}</h2>;
}
