import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { setAuthTokenGetter } from "../lib/api";
import { clearSession, loadOnboardingSeen, loadSession, markOnboardingSeen, saveSession } from "../lib/session";

type AuthState = {
  bootstrapping: boolean;
  token: string | null;
  identity: string | null;
  isAuthenticated: boolean;
  onboardingSeen: boolean;
  setOnboardingSeen: () => void;
  signIn: (token: string, identity: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [identity, setIdentity] = useState<string | null>(null);
  const [onboardingSeen, setOnboardingSeenState] = useState(false);

  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  useEffect(() => {
    async function bootstrap() {
      const [session, seen] = await Promise.all([loadSession(), loadOnboardingSeen()]);
      setToken(session.token);
      setIdentity(session.identity);
      setOnboardingSeenState(seen);
      setBootstrapping(false);
    }
    void bootstrap();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      bootstrapping,
      token,
      identity,
      isAuthenticated: Boolean(token),
      onboardingSeen,
      setOnboardingSeen: () => {
        void markOnboardingSeen();
        setOnboardingSeenState(true);
      },
      signIn: async (nextToken: string, nextIdentity: string) => {
        await saveSession(nextToken, nextIdentity);
        setToken(nextToken);
        setIdentity(nextIdentity);
      },
      signOut: async () => {
        await clearSession();
        setToken(null);
        setIdentity(null);
      },
    }),
    [bootstrapping, token, identity, onboardingSeen]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

