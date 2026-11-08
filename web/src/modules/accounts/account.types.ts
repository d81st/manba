import type { PasswordProblem } from "@/lib/passwords";
import type { Role } from "@/lib/session";

export type UserRow = {
  id: number;
  login: string;
  role: Role;
  disabled: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  createdBy: string;
};

export type CreateResult = { problem?: "login" | "taken" | "reserved"; password?: string; login?: string };

export type ChangeResult = { problem?: PasswordProblem | "current"; ver?: number };
