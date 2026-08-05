import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { mockUsers, DEMO_2FA_CODE, type Company, type MockUser, type Portal } from "@/lib/mock/users";
import { sleep } from "@/lib/mock/simulate";
import type { AuthContextValue, LoginResult, LoginStep } from "@/lib/auth/types";

const STORAGE_KEY = "procureos_session";
const MAX_ATTEMPTS = 5;

const AuthContext = createContext<AuthContextValue | null>(null);

function finalizeSession(user: MockUser, company: Company) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: user.id, companyId: company.id }));
}

interface StoredSession {
  user: MockUser;
  company: Company;
}

// Read synchronously during the initial render (not in an effect) so
// ProtectedRoute never sees a false "logged out" flash before hydration.
function readStoredSession(): StoredSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const { userId, companyId } = JSON.parse(raw);
    const user = mockUsers.find((u) => u.id === userId);
    const company = user?.companies.find((c) => c.id === companyId) ?? user?.companies[0];
    if (user && company) return { user, company };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [stored] = useState(readStoredSession);
  const [currentUser, setCurrentUser] = useState<MockUser | null>(stored?.user ?? null);
  const [activeCompany, setActiveCompany] = useState<Company | null>(stored?.company ?? null);
  const [loginStep, setLoginStep] = useState<LoginStep>(stored ? "done" : "credentials");
  const [pendingUser, setPendingUser] = useState<MockUser | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<Record<string, number>>({});

  async function login(email: string, password: string, portal: Portal): Promise<LoginResult> {
    await sleep(650);
    const key = `${portal}:${email.toLowerCase()}`;
    const attempts = failedAttempts[key] ?? 0;
    if (attempts >= MAX_ATTEMPTS) {
      return { status: "locked" };
    }
    const user = mockUsers.find((u) => u.portal === portal && u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      const next = attempts + 1;
      setFailedAttempts((prev) => ({ ...prev, [key]: next }));
      return { status: "invalid", attemptsLeft: Math.max(0, MAX_ATTEMPTS - next) };
    }
    setFailedAttempts((prev) => ({ ...prev, [key]: 0 }));
    if (user.requires2FA) {
      setPendingUser(user);
      setLoginStep("2fa");
      return { status: "2fa_required" };
    }
    if (user.companies.length > 1) {
      setPendingUser(user);
      setLoginStep("select-company");
      return { status: "select_company" };
    }
    setCurrentUser(user);
    setActiveCompany(user.companies[0]);
    setLoginStep("done");
    finalizeSession(user, user.companies[0]);
    return { status: "success" };
  }

  async function verify2FA(code: string): Promise<boolean> {
    await sleep(500);
    if (code !== DEMO_2FA_CODE || !pendingUser) return false;
    if (pendingUser.companies.length > 1) {
      setLoginStep("select-company");
      return true;
    }
    setCurrentUser(pendingUser);
    setActiveCompany(pendingUser.companies[0]);
    setLoginStep("done");
    finalizeSession(pendingUser, pendingUser.companies[0]);
    setPendingUser(null);
    return true;
  }

  function selectCompany(companyId: string) {
    if (!pendingUser) return;
    const company = pendingUser.companies.find((c) => c.id === companyId) ?? pendingUser.companies[0];
    setCurrentUser(pendingUser);
    setActiveCompany(company);
    setLoginStep("done");
    finalizeSession(pendingUser, company);
    setPendingUser(null);
  }

  function switchCompany(companyId: string) {
    if (!currentUser) return;
    const company = currentUser.companies.find((c) => c.id === companyId);
    if (!company) return;
    setActiveCompany(company);
    finalizeSession(currentUser, company);
  }

  function logout() {
    setCurrentUser(null);
    setActiveCompany(null);
    setPendingUser(null);
    setLoginStep("credentials");
    localStorage.removeItem(STORAGE_KEY);
  }

  const value = useMemo<AuthContextValue>(() => ({
    currentUser, activeCompany, loginStep, pendingUser,
    login, verify2FA, selectCompany, switchCompany, logout,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [currentUser, activeCompany, loginStep, pendingUser, failedAttempts]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
