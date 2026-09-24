import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Company, MockUser, Portal } from "@/lib/mock/users";
import { apiAceptarTerminos, apiMe, toCompany, toMockUser } from "@/lib/api/auth";
import { setActiveCompanyId, setUnauthorizedHandler } from "@/lib/api/http";
import { supabase } from "@/lib/supabase/client";
import type { AuthContextValue, LoginResult, LoginStep, PendingUser } from "@/lib/auth/types";

const ACTIVE_COMPANY_KEY = "procureos_active_company";
export const OAUTH_PORTAL_KEY = "procureos_oauth_portal";

const AuthContext = createContext<AuthContextValue | null>(null);

async function hasMfaEnrolled(): Promise<boolean> {
  const { data } = await supabase.auth.mfa.listFactors();
  return (data?.totp ?? []).some((f) => f.status === "verified");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
  const [loginStep, setLoginStep] = useState<LoginStep>("credentials");
  const [pendingUser, setPendingUser] = useState<PendingUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const pendingMeRef = useRef<Awaited<ReturnType<typeof apiMe>> | null>(null);

  async function logout() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveCompanyState(null);
    setPendingUser(null);
    setLoginStep("credentials");
    localStorage.removeItem(ACTIVE_COMPANY_KEY);
    setActiveCompanyId(null);
  }

  useEffect(() => {
    setUnauthorizedHandler(() => void logout());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve whatever session Supabase already has cached (survives refresh) —
  // The Supabase auth client persists + auto-refreshes it, we just load our app profile on top.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (!cancelled) setSessionLoading(false);
        return;
      }
      setActiveCompanyId(localStorage.getItem(ACTIVE_COMPANY_KEY));

      // A Google/SSO redirect just landed here — this is a brand-new session that
      // has never been through our portal/2FA/company gate, unlike a plain refresh
      // of an already-resolved session, so it needs the full check.
      const oauthPortal = localStorage.getItem(OAUTH_PORTAL_KEY);
      if (oauthPortal) {
        localStorage.removeItem(OAUTH_PORTAL_KEY);
        try {
          const me = await apiMe();
          const result = await applyMe(me, oauthPortal as Portal);
          if (result.status === "invalid") setOauthError(result.message ?? "No se pudo iniciar sesión con esa cuenta.");
        } catch {
          await logout();
          setOauthError("Tu cuenta de Google no está registrada en Procurex. Contacta a tu administrador.");
        } finally {
          if (!cancelled) setSessionLoading(false);
        }
        return;
      }

      try {
        const me = await apiMe();
        const requires2FA = await hasMfaEnrolled();
        if (cancelled) return;
        const companies = me.companies.map(toCompany);
        setCurrentUser(toMockUser(me.user, companies, requires2FA));
        setActiveCompanyState(toCompany(me.activeCompany));
        localStorage.setItem(ACTIVE_COMPANY_KEY, me.activeCompany.id);
        setLoginStep("done");
      } catch {
        await logout();
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function finalize(me: Awaited<ReturnType<typeof apiMe>>, requires2FA: boolean) {
    const companies = me.companies.map(toCompany);
    setCurrentUser(toMockUser(me.user, companies, requires2FA));
    setActiveCompanyState(toCompany(me.activeCompany));
    localStorage.setItem(ACTIVE_COMPANY_KEY, me.activeCompany.id);
    setLoginStep("done");
    setPendingUser(null);
    pendingMeRef.current = null;
  }

  /** Shared post-authentication gate: portal check, then 2FA, then multi-company — used by both password login and the Google/SSO redirect return. */
  async function applyMe(me: Awaited<ReturnType<typeof apiMe>>, expectedPortal?: Portal): Promise<LoginResult> {
    if (expectedPortal && me.user.portal.toLowerCase() !== expectedPortal) {
      await supabase.auth.signOut();
      return { status: "invalid", message: "Esta cuenta no pertenece a este portal." };
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      pendingMeRef.current = me;
      setPendingUser({ nombre: me.user.nombre, companies: me.companies.map(toCompany) });
      setLoginStep("2fa");
      return { status: "2fa_required" };
    }

    if (me.companies.length > 1) {
      pendingMeRef.current = me;
      setPendingUser({ nombre: me.user.nombre, companies: me.companies.map(toCompany) });
      setLoginStep("select-company");
      return { status: "select_company" };
    }

    const requires2FA = await hasMfaEnrolled();
    await finalize(me, requires2FA);
    return { status: "success" };
  }

  async function login(email: string, password: string, portal: Portal): Promise<LoginResult> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { status: "invalid", message: "Correo o contraseña incorrectos." };
    }

    let me;
    try {
      me = await apiMe();
    } catch {
      await supabase.auth.signOut();
      return { status: "invalid", message: "No se pudo cargar el perfil de la cuenta." };
    }

    return applyMe(me, portal);
  }

  async function loginWithGoogle(portal: Portal): Promise<{ error?: string }> {
    localStorage.setItem(OAUTH_PORTAL_KEY, portal);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/${portal}/login` },
    });
    if (error) {
      localStorage.removeItem(OAUTH_PORTAL_KEY);
      return { error: error.message };
    }
    return {};
  }

  async function verify2FA(code: string): Promise<{ status: "invalid" | "success" }> {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp[0];
    if (!factor) return { status: "invalid" };

    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (error) return { status: "invalid" };

    // Re-fetch: the session is now aal2 and `/auth/me` reflects the same profile.
    const me = pendingMeRef.current ?? (await apiMe());
    if (me.companies.length > 1) {
      setPendingUser({ nombre: me.user.nombre, companies: me.companies.map(toCompany) });
      setLoginStep("select-company");
      return { status: "success" };
    }
    await finalize(me, true);
    return { status: "success" };
  }

  async function selectCompany(companyId: string): Promise<void> {
    setActiveCompanyId(companyId);
    localStorage.setItem(ACTIVE_COMPANY_KEY, companyId);
    const me = await apiMe();
    const requires2FA = await hasMfaEnrolled();
    await finalize(me, requires2FA);
  }

  async function switchCompany(companyId: string): Promise<void> {
    if (!currentUser) return;
    setActiveCompanyId(companyId);
    localStorage.setItem(ACTIVE_COMPANY_KEY, companyId);
    const me = await apiMe();
    setCurrentUser(toMockUser(me.user, me.companies.map(toCompany), currentUser.requires2FA));
    setActiveCompanyState(toCompany(me.activeCompany));
  }

  function clearOauthError() {
    setOauthError(null);
  }

  async function acceptTerms() {
    const updated = await apiAceptarTerminos();
    setCurrentUser((prev) => (prev ? { ...prev, terminosAceptadosEn: updated.terminosAceptadosEn } : prev));
  }

  const value = useMemo<AuthContextValue>(() => ({
    currentUser, activeCompany, loginStep, pendingUser, sessionLoading, oauthError,
    login, loginWithGoogle, verify2FA, selectCompany, switchCompany, logout, clearOauthError, acceptTerms,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [currentUser, activeCompany, loginStep, pendingUser, sessionLoading, oauthError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
