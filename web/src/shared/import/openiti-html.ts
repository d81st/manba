// Some OpenITI exports keep pieces of the web page they were taken from:
// stray "</span>" tags (Mizan al-i'tidal, al-Furusiyya) and links around
// Quran quotations and book names (al-Irshad, from qadatona.org), whose
// opening tag may run over several lines of the file. This drops the tags and
// keeps the words between them; an opening tag broken over lines is removed
// with its line breaks, so the text after it stays in the same paragraph.
export function stripTags(text: string): { text: string; removed: number } {
  let removed = 0;
  const out = text.replace(/<\/?(?:a|span)\b[^>]*>/g, () => {
    removed += 1;
    return "";
  });
  return { text: out, removed };
}
