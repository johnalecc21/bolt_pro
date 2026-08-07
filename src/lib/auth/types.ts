import type { Company, MockUser, Portal } from "@/lib/mock/users";

export type LoginStep = "credentials" | "2fa" | "select-company" | "done";

export type LoginResultStatus = "invalid" | "locked" | "2fa_required" | "select_company" | "success";

export interface LoginResult {
  status: LoginResultStatus;
  attemptsLeft?: number;
}

export interface Session {
  user: MockUser;
  activeCompany: Company;
}

/** Partial identity known during the 2FA / company-select steps, before the full user record is available. */
export interface PendingUser {
  nombre: string;
  companies: Company[];
}

export interface AuthContextValue {
  currentUser: MockUser | null;
  activeCompany: Company | null;
  loginStep: LoginStep;
  pendingUser: PendingUser | null;
  login: (email: string, password: string, portal: Portal) => Promise<LoginResult>;
  verify2FA: (code: string) => Promise<{ status: "invalid" | "select_company" | "success" }>;
  selectCompany: (companyId: string) => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
  logout: () => void;
}
