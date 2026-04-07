import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { profileService } from '@/services/profile.service';
import { useStore } from '@/stores/useStore';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Distingue un cierre de sesión explícito del usuario vs. cualquier evento remoto
  const deliberateSignOut = useRef(false);
  // Evita refreshes concurrentes (visibilitychange + online pueden dispararse a la vez)
  const refreshing = useRef(false);

  useEffect(() => {
    // Intenta renovar el token de acceso. Si falla (refresh token expirado),
    // lee la sesión desde storage como último recurso.
    const tryRefresh = async () => {
      if (refreshing.current) return;
      refreshing.current = true;
      try {
        const { data } = await supabase.auth.refreshSession();
        if (data?.session) {
          setSession(data.session);
          refreshing.current = false;
          return;
        }
        // refreshSession devolvió null — leer desde storage por si acaso
        const { data: stored } = await supabase.auth.getSession();
        if (stored?.session) setSession(stored.session);
      } catch {}
      refreshing.current = false;
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      // Iniciar carga de datos inmediatamente, antes del ciclo de render de React.
      // La clave de deduplicación del store previene una carga doble cuando el
      // useEffect de App.jsx también dispara tras el render.
      if (session?.user?.id) {
        const store = useStore.getState();
        store.setUserId(session.user.id);
        store.loadAll();
      }
      setSession(session);
      setAuthLoading(false);
      if (session) profileService.touch().catch(() => {});
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Solo cerrar sesión si fue una acción explícita en este dispositivo.
        // Eventos remotos o de expiración disparan un intento de recuperación.
        if (deliberateSignOut.current) {
          deliberateSignOut.current = false;
          setSession(null);
        } else {
          // El refresh token puede haber expirado — intentar recuperar la sesión.
          tryRefresh();
        }
        return;
      }
      setSession(session);
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        profileService.touch().catch(() => {});
      }
    });

    // Refresca el token cuando el usuario vuelve al tab tras inactividad.
    // Cubre el caso donde autoRefreshToken no disparó (app en background, iOS PWA).
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const { data: { session: stored } } = await supabase.auth.getSession();
        if (!stored) return;
        const now = Math.floor(Date.now() / 1000);
        // Refrescar si el token ya expiró o vence en menos de 10 minutos
        if (!stored.expires_at || stored.expires_at - now < 600) {
          await tryRefresh();
        }
      } catch {}
    };

    // Refresca el token cuando el dispositivo recupera conectividad.
    const handleOnline = () => tryRefresh();

    // Refresh proactivo cada 45 minutos — cinturón sobre tirantes de autoRefreshToken.
    // Los timers de JS se pausan/matan en mobile y PWA en background; este intervalo
    // se reactiva al volver al primer plano y asegura tokens frescos en sesiones largas.
    const refreshInterval = setInterval(tryRefresh, 45 * 60 * 1000);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
      clearInterval(refreshInterval);
    };
  }, []);

  const signOut = async () => {
    deliberateSignOut.current = true;
    // scope: 'local' — solo invalida la sesión en este dispositivo
    await supabase.auth.signOut({ scope: 'local' });
    setSession(null);
  };

  return { session, authLoading, signOut };
}
