import { useState } from 'react';
import { useUpdateCheck } from '@/hooks/useUpdateCheck';

export function UpdatePrompt() {
  const hasUpdate = useUpdateCheck();
  const [dismissed, setDismissed] = useState(false);

  if (!hasUpdate || dismissed) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9100, display: 'flex', alignItems: 'center', gap: 10,
      background: '#1a1a2e', border: '1px solid rgba(124,108,240,0.35)',
      borderRadius: 14, padding: '10px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)', maxWidth: '90vw', whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 18 }}>🚀</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#a8a0f8' }}>Nueva versión disponible</span>
      <button
        onClick={() => window.location.reload()}
        style={{ background: '#7c6cf0', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 12px', cursor: 'pointer' }}
      >
        Actualizar
      </button>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', color: '#5c5c72', fontSize: 16, cursor: 'pointer', padding: '2px' }}
      >
        ✕
      </button>
    </div>
  );
}
