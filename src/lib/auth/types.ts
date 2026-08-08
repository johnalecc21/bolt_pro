import type { Company, MockUser, Portal } from "@/lib/mock/users";

export type LoginStep = "credentials" | "2fa" | "select-company" | "done";

export type LoginResultStatus = "invalid" | "2fa_required" | "select_company" | "success";

export interface LoginResult {
  status: LoginResultStatus;
  message?: string;
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
  /** True while the initial Supabase session is being resolved on page load. */
  sessionLoading: boolean;
  /** Set when a Google/SSO redirect resolves to an account that can't log into this portal. */
  oauthError: string | null;
  clearOauthError: () => void;
  login: (email: string, password: string, portal: Portal) => Promise<LoginResult>;
  loginWithGoogle: (portal: Portal) => Promise<{ error?: string }>;
  verify2FA: (code: string) => Promise<{ status: "invalid" | "success" }>;
  selectCompany: (companyId: string) => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
  logout: () => Promise<void>;
}
