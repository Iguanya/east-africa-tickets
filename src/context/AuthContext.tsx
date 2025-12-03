import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "@/lib/supabase";
import { UserProfile } from "@/types/database";
import { getStoredAuth, setStoredAuth, StoredAuth } from "@/lib/api-client";

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  signIn: (payload: { email: string; password: string }) => Promise<void>;
  signUp: (payload: { email: string; password: string; fullName: string; phone?: string }) => Promise<void>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredAuth<UserProfile>();
    if (stored) {
      setUser(stored.user);
      setToken(stored.token);
    }
    setLoading(false);
  }, []);

  const persistAuth = (auth: StoredAuth<UserProfile> | null) => {
    if (!auth) {
      setUser(null);
      setToken(null);
      setStoredAuth(null);
      return;
    }

    setUser(auth.user);
    setToken(auth.token);
    setStoredAuth(auth);
  };

  const signIn = async (payload: { email: string; password: string }) => {
    const response = await authService.signIn(payload);
    persistAuth(response);
  };

  const signUp = async (payload: { email: string; password: string; fullName: string; phone?: string }) => {
    const response = await authService.signUp(payload);
    persistAuth(response);
  };

  const signOut = () => {
    persistAuth(null);
  };

  const refreshProfile = async () => {
    if (!token) return;
    const { user } = await authService.getMe();
    persistAuth({ token, user });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

