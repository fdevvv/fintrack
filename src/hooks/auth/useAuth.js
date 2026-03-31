import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { profileService } from '@/services/profile.service';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) profileService.touch().catch(() => {});
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        profileService.touch().catch(() => {});
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return { session, authLoading, signOut };
}
