import { useState, useEffect, useRef } from 'react';

const INTERVAL_MS = 2 * 60 * 1000; // chequea cada 2 minutos

export function useUpdateCheck() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const initialVersion = useRef(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) return;
        const { v } = await res.json();
        if (initialVersion.current === null) {
          initialVersion.current = v;
        } else if (v !== initialVersion.current) {
          setHasUpdate(true);
        }
      } catch {}
    };

    check();
    const id = setInterval(check, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return hasUpdate;
}
