import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type Role = "admin" | "editor" | "user";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isEditor: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, is_active")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to load profile:", error.message);
      setProfile(null);
      return false;
    }

    if (!data.is_active) {
      console.warn("Profile inactive — signing out");
      await supabase.auth.signOut();
      setProfile(null);
      return false;
    }

    setProfile(data as Profile);
    return true;
  }

  useEffect(() => {
    // Initial session bootstrap. Crucially, we DON'T set loading=false
    // until loadProfile has finished, so RequireRole never sees a
    // transient null profile on refresh.
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) {
        await loadProfile(data.session.user.id);
      }
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          // Keep loading=true until the profile is resolved, so guards
          // don't bounce mid-flight.
          setLoading(true);
          await loadProfile(newSession.user.id);
          setLoading(false);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  const role = profile?.role;
  const isActive = profile?.is_active !== false;

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    isAdmin: role === "admin" && isActive,
    isEditor: (role === "admin" || role === "editor") && isActive,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}