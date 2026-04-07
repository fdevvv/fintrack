import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check .env file.'
  );
}

// Migración única: copia el token de la clave default de Supabase a la clave personalizada.
// Necesario para usuarios que tenían sesión activa antes del cambio de storageKey.
try {
  if (!localStorage.getItem('fintrack-auth')) {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    const oldKey = `sb-${projectRef}-auth-token`;
    const oldToken = localStorage.getItem(oldKey);
    if (oldToken) {
      localStorage.setItem('fintrack-auth', oldToken);
      localStorage.removeItem(oldKey);
    }
  }
} catch {}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'fintrack-auth',
  },
});
