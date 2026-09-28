// Contexte du compte : session, profil, état de la synchronisation
import { createContext, useContext, useEffect, useState } from "react";
import { loadProfile, startSync, supabase } from "./cloud.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [sync, setSync] = useState({ status: "idle", at: null });
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      // Lien « mot de passe oublié » : on affiche le formulaire de nouveau mot de passe
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setSync({ status: "idle", at: null });
      return undefined;
    }
    loadProfile(session.user)
      .then(setProfile)
      .catch(() => setProfile(null));
    return startSync(userId, (status, at) => setSync((s) => ({ status, at: at || s.at })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const value = {
    ready,
    session,
    user: session?.user || null,
    profile,
    setProfile,
    sync,
    recovery,
    setRecovery
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
