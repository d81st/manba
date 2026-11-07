import { describe, expect, it } from "vitest";
import { checkNewPassword, hashPassword, isValidLogin, normalizeLogin, temporaryPassword, verifyPassword } from "./passwords";

describe("passwords", () => {
  it("hashes with a salt and verifies", async () => {
    const a = await hashPassword("correct horse");
    const b = await hashPassword("correct horse");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$16384$8$1$")).toBe(true);
    expect(await verifyPassword("correct horse", a)).toBe(true);
    expect(await verifyPassword("wrong horse", a)).toBe(false);
    expect(await verifyPassword("correct horse", "not a hash")).toBe(false);
  });

  it("makes readable temporary passwords", () => {
    const password = temporaryPassword();
    expect(password).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
    expect(password).not.toMatch(/[01lo]/);
  });

  it("checks logins and new passwords", () => {
    expect(normalizeLogin("  Reader.One ")).toBe("reader.one");
    expect(isValidLogin("reader.one")).toBe(true);
    expect(isValidLogin("ab")).toBe(false);
    expect(isValidLogin("имя")).toBe(false);
    expect(checkNewPassword("short", "short")).toBe("tooShort");
    expect(checkNewPassword("long enough 1", "long enough 2")).toBe("mismatch");
    expect(checkNewPassword("long enough 1", "long enough 1", "long enough 1")).toBe("same");
    expect(checkNewPassword("x".repeat(200), "x".repeat(200))).toBe("tooLong");
    expect(checkNewPassword("long enough 1", "long enough 1", "old password")).toBeNull();
  });
});
