import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { profileService } from '@/services/profile.service';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Distingue un cierre de sesión explícito del usuario vs. expiración de token
  const deliberateSignOut = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) profileService.touch().catch(() => {});
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Solo deslogear si fue acción explícita del usuario
        if (deliberateSignOut.current) {
          deliberateSignOut.current = false;
          setSession(null);
        }
        return;
      }
      setSession(session);
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        profileService.touch().catch(() => {});
      }
    });

    // Refresca el token cuando el usuario vuelve al tab tras inactividad
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const { data: { session: stored } } = await supabase.auth.getSession();
        if (!stored) return;
        const now = Math.floor(Date.now() / 1000);
        // Refrescar si el token ya expiró o vence en menos de 5 minutos
        if (!stored.expires_at || stored.expires_at - now < 300) {
          const { data } = await supabase.auth.refreshSession();
          if (data?.session) setSession(data.session);
        }
      } catch {}
    };

    // Refresca el token cuando el dispositivo recupera conectividad
    const handleOnline = async () => {
      try {
        const { data } = await supabase.auth.refreshSession();
        if (data?.session) setSession(data.session);
      } catch {}
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const signOut = async () => {
    deliberateSignOut.current = true;
    await supabase.auth.signOut();
    setSession(null);
  };

  return { session, authLoading, signOut };
}
