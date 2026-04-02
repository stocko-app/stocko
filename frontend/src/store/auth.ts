import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  username: string | null;
  setAuth: (token: string, username: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      username: null,
      setAuth: (token, username) => {
        localStorage.setItem("stocko_token", token);
        set({ token, username });
      },
      logout: () => {
        localStorage.removeItem("stocko_token");
        set({ token: null, username: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    {
      name: "stocko-auth",
      partialize: (state) => ({ token: state.token, username: state.username }),
    }
  )
);
