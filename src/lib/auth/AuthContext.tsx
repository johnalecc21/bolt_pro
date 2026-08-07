import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Company, MockUser, Portal } from "@/lib/mock/users";
import {
  apiLogin, apiVerify2FA, apiSelectCompany, apiSwitchCompany, apiMe,
  toCompany, toMockUser,
} from "@/lib/api/auth";
import { TOKEN_KEY, setUnauthorizedHandler } from "@/lib/api/http";
import type { AuthContextValue, LoginResult, LoginStep, PendingUser } from "@/lib/auth/types";

const SESSION_CACHE_KEY = "procureos_session_cache";

const AuthContext = createContext<AuthContextValue | null>(null);

interface SessionCache {
  user: MockUser;
  activeCompany: Company;
}

function persistSession(token: string, user: MockUser, activeCompany: Company) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ user, activeCompany }));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_CACHE_KEY);
}

// Read synchronously during the initial render (not in an effect) so
// ProtectedRoute never sees a false "logged out" flash before hydration.
function readCachedSession(): SessionCache | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const raw = localStorage.getItem(SESSION_CACHE_KEY);
  if (!token || !raw) return null;
  try {
    return JSON.parse(raw) as SessionCache;
  } catch {
    clearSession();
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [cached] = useState(readCachedSession);
  const [currentUser, setCurrentUser] = useState<MockUser | null>(cached?.user ?? null);
  const [activeCompany, setActiveCompany] = useState<Company | null>(cached?.activeCompany ?? null);
  const [loginStep, setLoginStep] = useState<LoginStep>(cached ? "done" : "credentials");
  const [pendingUser, setPendingUser] = useState<PendingUser | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  function logout() {
    setCurrentUser(null);
    setActiveCompany(null);
    setPendingUser(null);
    setPendingToken(null);
    setLoginStep("credentials");
    clearSession();
  }

  // Register the 401 handler once; re-registering on every render would leak listeners.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validate the cached session against the backend in the background — logs out silently if the token expired.
  useEffect(() => {
    if (!cached) return;
    apiMe()
      .then((data) => {
        const companies = data.companies.map(toCompany);
        setCurrentUser(toMockUser(data.user, companies));
        setActiveCompany(toCompany(data.activeCompany));
      })
      .catch(() => logout());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string, portal: Portal): Promise<LoginResult> {
    const data = await apiLogin(email, password, portal);
    if (data.status === "invalid") {
      return { status: "invalid", attemptsLeft: data.attemptsLeft };
    }
    if (data.status === "locked") {
      return { status: "locked" };
    }
    if (data.status === "2fa_required") {
      setPendingToken(data.pendingToken);
      setPendingUser({ nombre: data.user.nombre, companies: [] });
      setLoginStep("2fa");
      return { status: "2fa_required" };
    }
    if (data.status === "select_company") {
      setPendingToken(data.pendingToken);
      setPendingUser({ nombre: "", companies: data.companies.map(toCompany) });
      setLoginStep("select-company");
      return { status: "select_company" };
    }
    const companies = data.companies.map(toCompany);
    setCurrentUser(toMockUser(data.user, companies));
    setActiveCompany(toCompany(data.activeCompany));
    setLoginStep("done");
    persistSession(data.accessToken, toMockUser(data.user, companies), toCompany(data.activeCompany));
    return { status: "success" };
  }

  async function verify2FA(code: string): Promise<{ status: "invalid" | "select_company" | "success" }> {
    if (!pendingToken) return { status: "invalid" };
    let data;
    try {
      data = await apiVerify2FA(pendingToken, code);
    } catch {
      return { status: "invalid" };
    }
    if (data.status === "select_company") {
      setPendingToken(data.pendingToken);
      setPendingUser((prev) => ({ nombre: prev?.nombre ?? "", companies: data.companies.map(toCompany) }));
      setLoginStep("select-company");
      return { status: "select_company" };
    }
    const companies = data.companies.map(toCompany);
    setCurrentUser(toMockUser(data.user, companies));
    setActiveCompany(toCompany(data.activeCompany));
    setLoginStep("done");
    persistSession(data.accessToken, toMockUser(data.user, companies), toCompany(data.activeCompany));
    setPendingUser(null);
    setPendingToken(null);
    return { status: "success" };
  }

  async function selectCompany(companyId: string): Promise<void> {
    if (!pendingToken) return;
    const data = await apiSelectCompany(pendingToken, companyId);
    const companies = data.companies.map(toCompany);
    setCurrentUser(toMockUser(data.user, companies));
    setActiveCompany(toCompany(data.activeCompany));
    setLoginStep("done");
    persistSession(data.accessToken, toMockUser(data.user, companies), toCompany(data.activeCompany));
    setPendingUser(null);
    setPendingToken(null);
  }

  async function switchCompany(companyId: string): Promise<void> {
    if (!currentUser) return;
    const data = await apiSwitchCompany(companyId);
    const companies = data.companies.map(toCompany);
    const user = toMockUser(data.user, companies);
    setCurrentUser(user);
    setActiveCompany(toCompany(data.activeCompany));
    persistSession(data.accessToken, user, toCompany(data.activeCompany));
  }

  const value = useMemo<AuthContextValue>(() => ({
    currentUser, activeCompany, loginStep, pendingUser,
    login, verify2FA, selectCompany, switchCompany, logout,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [currentUser, activeCompany, loginStep, pendingUser, pendingToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
