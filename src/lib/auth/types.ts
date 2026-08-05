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

export interface AuthContextValue {
  currentUser: MockUser | null;
  activeCompany: Company | null;
  loginStep: LoginStep;
  pendingUser: MockUser | null;
  login: (email: string, password: string, portal: Portal) => Promise<LoginResult>;
  verify2FA: (code: string) => Promise<boolean>;
  selectCompany: (companyId: string) => void;
  switchCompany: (companyId: string) => void;
  logout: () => void;
}
