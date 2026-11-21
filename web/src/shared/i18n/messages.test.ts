import { describe, expect, it } from "vitest";
import { installLocaleReader } from "./active-locale";
import { getMessages, plural } from "./index";

describe("interface language", () => {
  it("stays Russian until a request asks for English", () => {
    installLocaleReader(() => "ru");
    const t = getMessages();
    expect(t.appName).toBe("Манба");
    expect(t.quran.jump.label).toBe("Аят");
    installLocaleReader(() => "en");
    expect(t.appName).toBe("Manba");
    expect(t.appTagline).toBe("An encyclopedia of Islam from primary sources");
    expect(t.quran.jump.label).toBe("Ayah");
    expect(t.quran.jump.submit).toBe("Show");
    expect(t.locale.ru).toBe("Русский");
    expect(t.locale.en).toBe("English");
    expect(plural(5, t.quran.ayahs)).toBe("5 ayahs");
    expect(t.assistant.exampleQueries).toEqual(["2:255", "Bukhari 1", "صوم"]);
    installLocaleReader(() => "ru");
    expect(plural(5, t.quran.ayahs)).toBe("5 аятов");
  });

  it("can be copied into a plain object", () => {
    installLocaleReader(() => "en");
    const login = JSON.parse(JSON.stringify(getMessages().login)) as { title: string; submit: string };
    expect(login).toEqual(expect.objectContaining({ title: "Sign in", submit: "Sign in" }));
    installLocaleReader(() => "ru");
  });
});
