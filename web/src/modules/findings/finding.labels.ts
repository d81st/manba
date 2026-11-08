// How the address where a text was found is written for people.
import "server-only";
import { formatBookRef, isBook } from "@/shared/addresses/book-query";
import { formatHadithRef } from "@/shared/addresses/hadith-query";

export const foundLabel = (address: string) => {
  const work = address.split(".")[0];
  return work === "quran" ? address.split(".").slice(1).join(":") : isBook(work) ? formatBookRef(address) : formatHadithRef(address);
};
