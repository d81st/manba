import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSessionToken,
  credentialsMatch,
  readSessionToken,
  SESSION_MAX_AGE,
} from "./session";

beforeEach(() => {
  vi.stubEnv("SITE_LOGIN", "admin");
  vi.stubEnv("SITE_PASSWORD", "test-password");
  vi.stubEnv("SESSION_SECRET", "test-secret-test-secret-test-secret");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("credentialsMatch", () => {
  it("accepts only the configured login and password", () => {
    expect(credentialsMatch("admin", "test-password")).toBe(true);
    expect(credentialsMatch("admin", "wrong")).toBe(false);
    expect(credentialsMatch("other", "test-password")).toBe(false);
  });

  it("refuses everything when the gate is not configured", () => {
    vi.stubEnv("SESSION_SECRET", "");
    expect(credentialsMatch("admin", "test-password")).toBe(false);
  });
});

describe("session token", () => {
  it("round-trips", () => {
    const token = createSessionToken("admin")!;
    expect(readSessionToken(token)?.login).toBe("admin");
  });

  it("rejects a changed payload or signature", () => {
    const [payload, signature] = createSessionToken("admin")!.split(".");
    const forged = Buffer.from(
      JSON.stringify({ login: "root", exp: 9_999_999_999 }),
    ).toString("base64url");
    expect(readSessionToken(`${forged}.${signature}`)).toBeNull();
    expect(readSessionToken(`${payload}.${signature.slice(0, -2)}xx`)).toBeNull();
    expect(readSessionToken("garbage")).toBeNull();
    expect(readSessionToken(undefined)).toBeNull();
  });

  it("expires", () => {
    vi.useFakeTimers();
    const token = createSessionToken("admin")!;
    vi.advanceTimersByTime((SESSION_MAX_AGE + 1) * 1000);
    expect(readSessionToken(token)).toBeNull();
  });

  it("is invalidated by a password change", () => {
    const token = createSessionToken("admin")!;
    vi.stubEnv("SITE_PASSWORD", "new-password");
    expect(readSessionToken(token)).toBeNull();
  });
});
