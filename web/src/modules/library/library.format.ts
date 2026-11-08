
// A section page: /library/tafsir_ibn_kathir/s/2?page=3#p-2-255
export function sectionHref(work: string, section: number, page = 1, anchor?: string) {
  return `/library/${work}/s/${section}${page > 1 ? `?page=${page}` : ""}${anchor ? `#${anchor}` : ""}`;
}
