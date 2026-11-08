import { describe, expect, it } from "vitest";
import { slugify } from "./input";

describe("slugify", () => {
  it("makes a latin id from a transliteration", () => {
    expect(slugify("Nāsikh")).toBe("nasikh");
    expect(slugify("Ahl al-Kitāb")).toBe("ahl-al-kitab");
    expect(slugify("ʿIlm al-ḥadīth")).toBe("ilm-al-hadith");
    expect(slugify("2 words")).toBe("t-2-words");
    expect(slugify("  ")).toBe("");
  });

  it("transliterates Russian titles", () => {
    expect(slugify("Джихад и война")).toBe("dzhikhad-i-voyna");
    expect(slugify("История текста Корана")).toBe("istoriya-teksta-korana");
  });
});
