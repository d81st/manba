import { describe, expect, it } from "vitest";
import { clientAddress, isLocked, MAX_ADDRESS, MAX_LOGIN, MAX_PAIR, MAX_TOTAL } from "./login-limiter";

const open = { pair: 0, login: 0, address: 0, total: 0 };

describe("isLocked", () => {
  it("locks one login from one address after 10 failures", () => {
    expect(isLocked({ ...open, pair: MAX_PAIR - 1 })).toBe(false);
    expect(isLocked({ ...open, pair: MAX_PAIR })).toBe(true);
  });

  it("locks one login from rotating addresses after 10 failures", () => {
    expect(isLocked({ ...open, login: MAX_LOGIN })).toBe(true);
  });

  it("locks one address only after 30 failures, so a shared address survives a few mistakes", () => {
    expect(isLocked({ ...open, address: MAX_ADDRESS - 1 })).toBe(false);
    expect(isLocked({ ...open, address: MAX_ADDRESS })).toBe(true);
  });

  it("locks everyone after 50 failures", () => {
    expect(isLocked({ ...open, total: MAX_TOTAL })).toBe(true);
  });
});

describe("clientAddress", () => {
  it("uses the last forwarded hop, which the platform appends", () => {
    expect(clientAddress("203.0.113.5, 198.51.100.10")).toBe("198.51.100.10");
    expect(clientAddress("  spoofed , 198.51.100.10  ")).toBe("198.51.100.10");
  });

  it("keeps a single address and falls back when the header is empty", () => {
    expect(clientAddress("203.0.113.5")).toBe("203.0.113.5");
    expect(clientAddress(null, "198.51.100.10")).toBe("198.51.100.10");
    expect(clientAddress("", "  ")).toBe("local");
    expect(clientAddress(undefined)).toBe("local");
  });
});
