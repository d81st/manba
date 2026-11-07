// Password hashing for accounts in the users table (migration 043), and the
// rules for logins and new passwords. No database here, so it is unit-tested.
// scrypt is built into Node: no native dependency to install on Render.
import { randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number, options: object) => Promise<Buffer>;

const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;

export const MIN_PASSWORD = 10;
// Long inputs only cost CPU; nobody types more than this.
export const MAX_PASSWORD_BYTES = 128;

// "scrypt$16384$8$1$<salt>$<hash>", salt and hash in base64url.
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64url"), hash.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [n, r, p] = parts.slice(1, 4).map(Number);
  if (![n, r, p].every(Number.isInteger) || n > 1 << 17) return false;
  const expected = Buffer.from(parts[5], "base64url");
  if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) return false;
  const hash = await scrypt(password, Buffer.from(parts[4], "base64url"), expected.length, { N: n, r, p });
  return hash.length === expected.length && timingSafeEqual(hash, expected);
}

// "k7mx-4pra-n2wd": easy to read out, no 0/o, 1/l.
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
export function temporaryPassword() {
  const group = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${group()}-${group()}-${group()}`;
}

// Logins are stored lowercase: "Reader.One" and "reader.one" are one account.
export function normalizeLogin(login: string) {
  return login.trim().toLowerCase();
}

export function isValidLogin(login: string) {
  return /^[a-z0-9][a-z0-9._-]{2,39}$/.test(login);
}

export type PasswordProblem = "tooShort" | "tooLong" | "mismatch" | "same";

export function checkNewPassword(password: string, repeat: string, current?: string): PasswordProblem | null {
  if (password.length < MIN_PASSWORD) return "tooShort";
  if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) return "tooLong";
  if (password !== repeat) return "mismatch";
  if (current !== undefined && password === current) return "same";
  return null;
}
