import { describe, expect, it } from "vitest";
import { isLocked, recordFailure, recordSuccess } from "./login-limiter";

const MINUTE = 60 * 1000;

describe("login limiter", () => {
  it("locks an address after 10 failures and unlocks after 15 minutes", () => {
    const now = 1_000_000;
    for (let i = 0; i < 9; i++) recordFailure("10.0.0.1", now);
    expect(isLocked("10.0.0.1", now)).toBe(false);
    recordFailure("10.0.0.1", now);
    expect(isLocked("10.0.0.1", now)).toBe(true);
    expect(isLocked("10.0.0.2", now)).toBe(false);
    expect(isLocked("10.0.0.1", now + 16 * MINUTE)).toBe(false);
  });

  it("forgets failures of an address after a successful login", () => {
    const now = 5_000_000;
    for (let i = 0; i < 9; i++) recordFailure("10.0.1.1", now);
    recordSuccess("10.0.1.1");
    recordFailure("10.0.1.1", now);
    expect(isLocked("10.0.1.1", now)).toBe(false);
  });

  it("locks everyone after 50 failures from rotating addresses", () => {
    const now = 9_000_000;
    for (let i = 0; i < 50; i++) recordFailure(`10.1.0.${i}`, now);
    expect(isLocked("10.9.9.9", now)).toBe(true);
    expect(isLocked("10.9.9.9", now + 16 * MINUTE)).toBe(false);
  });
});
