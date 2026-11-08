// Shared pieces of every admin form: statuses of materials, degrees of
// recognition, problems reported to the form, and readable permanent ids.

// Statuses of a material: draft -> on review -> published (-> retired).
export const TERM_STATUSES = ["draft", "review", "published", "retired"] as const;
// Degree of recognition of a view: accepted by the tradition, by most researchers, a minority view.
export const RECOGNITIONS = ["tradition", "research_majority", "minority"] as const;

// A problem found in a form: the field, a code the form turns into text, and details.
export type InputProblem = { field: string; code: string; detail?: string };

// Russian letters in links, so a Russian title gives a readable address.
const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l",
  м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

// "Nāsikh" -> "nasikh", "Джихад" -> "dzhikhad": the permanent id used in links.
export function slugify(text: string) {
  const slug = text
    .toLowerCase()
    .replace(/[а-яё]/g, (letter) => CYRILLIC[letter] ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[ʿʾ'’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return /^[a-z]/.test(slug) ? slug : slug ? `t-${slug}` : "";
}
