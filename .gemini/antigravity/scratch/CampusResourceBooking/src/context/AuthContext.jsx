import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  ensureSupabaseConfigured,
  isSupabaseConfigured,
  supabase,
} from '../services/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setProfile(null);
      return null;
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Failed to load profile:', error.message);
        setProfile(null);
        return null;
      }

      if (data) {
        setProfile(data);
        return data;
      }

      // Brief wait in case the auth trigger is finishing initial profile creation
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    setProfile(null);
    return null;
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    async function initAuth() {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await loadProfile(initialSession.user.id);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        await loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = async ({ fullName, email, password, role }) => {
    ensureSupabaseConfigured();
    // Enforce public registration role constraint on client as defense-in-depth
    const safeRole = role === 'faculty' ? 'faculty' : 'student';

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: safeRole,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) throw error;
    return data;
  };

  const signIn = async ({ email, password }) => {
    ensureSupabaseConfigured();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    if (data.user) {
      await loadProfile(data.user.id);
    }
    return data;
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email) => {
    ensureSupabaseConfigured();
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    ensureSupabaseConfigured();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const updateProfileName = async (fullName) => {
    ensureSupabaseConfigured();
    if (!user) throw new Error('Not authenticated.');

    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id)
      .select('id, full_name, email, role, created_at')
      .single();

    if (error) throw error;
    setProfile(data);
    return data;
  };

  const role = profile?.role || null;
  const isAdmin = role === 'admin';
  const isFaculty = role === 'faculty';
  const isStudent = role === 'student';

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role,
        isAdmin,
        isFaculty,
        isStudent,
        loading,
        isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        updateProfileName,
        refreshProfile: () => (user ? loadProfile(user.id) : Promise.resolve(null)),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
