import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      
      setProfile(data);
      return data;
    } catch (error) {
      console.error("Profile fetch error:", error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session fetch error:", error);
          // Retry once after a short delay if there's an error
          retryTimeout = setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (mounted && retrySession) {
              setSession(retrySession);
              setUser(retrySession.user);
              await fetchProfile(retrySession.user.id);
            }
            setLoading(false);
          }, 1000);
          return;
        }

        if (mounted) {
          if (initialSession) {
            setSession(initialSession);
            setUser(initialSession.user);
            await fetchProfile(initialSession.user.id);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up single auth state listener for entire app
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log("Auth event:", event, "Session exists:", !!newSession);

        // Handle all auth state changes properly
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
            
            // Fetch profile in background (defer to prevent blocking)
            setTimeout(() => {
              if (mounted) {
                fetchProfile(newSession.user.id);
              }
            }, 0);
          } else if (event === 'INITIAL_SESSION') {
            // No session on initial load - user is not logged in
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear state on sign out
          setSession(null);
          setUser(null);
          setProfile(null);
          console.log("User signed out - clearing session");
        } else if (event === 'TOKEN_REFRESHED') {
          // Update session with new tokens but don't re-fetch profile
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
            console.log("Token refreshed successfully");
          }
        }
      }
    );

    initializeAuth();

    // Handle browser visibility changes to ensure session remains valid
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && mounted) {
        // When tab becomes visible again, verify session is still valid
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          if (error) {
            console.error("Session verification error on visibility change:", error);
          } else if (currentSession && (!session || session.access_token !== currentSession.access_token)) {
            // Session was refreshed while tab was hidden, update it
            setSession(currentSession);
            setUser(currentSession.user);
            console.log("Session updated after tab became visible");
          }
        } catch (error) {
          console.error("Visibility change session check error:", error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      clearTimeout(retryTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
