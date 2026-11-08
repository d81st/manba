import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPreviewToken,
  createSessionToken,
  credentialsMatch,
  PREVIEW_MAX_AGE,
  readPreviewToken,
  readSessionToken,
  SESSION_MAX_AGE,
} from "@/shared/auth/session";

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

  it("gives the main administrator the admin role", () => {
    expect(readSessionToken(createSessionToken("admin")!)?.role).toBe("admin");
  });

  it("carries an account's role, id and version", () => {
    const token = createSessionToken("reader.one", { role: "reader", uid: 7, ver: 3, pc: true })!;
    expect(readSessionToken(token)).toMatchObject({ login: "reader.one", role: "reader", uid: 7, ver: 3, pc: true });
  });

  it("does not accept a preview token as a session", () => {
    expect(readSessionToken(createPreviewToken()!)).toBeNull();
  });
});

describe("preview token", () => {
  it("round-trips and expires", () => {
    vi.useFakeTimers();
    const token = createPreviewToken()!;
    expect(readPreviewToken(token)?.exp).toBeGreaterThan(0);
    vi.advanceTimersByTime((PREVIEW_MAX_AGE + 1) * 1000);
    expect(readPreviewToken(token)).toBeNull();
  });

  it("rejects a session token and a forged payload", () => {
    expect(readPreviewToken(createSessionToken("admin")!)).toBeNull();
    const token = createPreviewToken()!;
    const [, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ kind: "preview", exp: 9_999_999_999 })).toString("base64url");
    expect(readPreviewToken(`${forged}.${signature}`)).toBeNull();
  });
});
