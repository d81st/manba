import { getMessages } from "@/shared/i18n";

// One line under a form. The code is the key returned by the server action.
export function FormProblem({ code }: { code?: string }) {
  const problems = getMessages().debates.problems;
  if (!code || !(code in problems)) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {problems[code as keyof typeof problems]}
    </p>
  );
}
