import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { onAuthStateChanged, getIdToken, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: FirebaseUser | null;
  session: string | null; // idToken string
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
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const ref = doc(db, "profiles", userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        return data;
      } else {
        setProfile(null);
        return null;
      }
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

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const token = await getIdToken(firebaseUser, true);
          setSession(token);
        } catch {
          setSession(null);
        }
        const existing = await fetchProfile(firebaseUser.uid);
        if (!existing) {
          // Create a minimal profile document on first login
          await setDoc(doc(db, "profiles", firebaseUser.uid), {
            id: firebaseUser.uid,
            email: firebaseUser.email ?? null,
            name: firebaseUser.displayName ?? "",
            avatar_url: firebaseUser.photoURL ?? null,
            created_at: serverTimestamp(),
          }, { merge: true });
          await fetchProfile(firebaseUser.uid);
        }
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
      }
      setLoading(false);
    });

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && mounted) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            const token = await getIdToken(currentUser, true);
            setSession(token);
          } catch {
            // ignore
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsub();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
