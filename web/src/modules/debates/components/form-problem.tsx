import { getMessages } from "@/shared/i18n";
import { FormAlert } from "@/shared/ui/field";

// What went wrong, at the top of the form. The code is the key returned by the server action.
export function FormProblem({ code }: { code?: string }) {
  const problems = getMessages().debates.problems;
  if (!code || !(code in problems)) return null;
  return <FormAlert>{problems[code as keyof typeof problems]}</FormAlert>;
}
