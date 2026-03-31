import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import { cardStyle } from '@/utils/styles';
import { ST } from '@/components/ui/Shared';

export function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminService.getUsers()
      .then(setUsers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
    : '—';

  return (
    <div style={{ padding:'0 16px', maxWidth:700, margin:'0 auto' }}>
      <ST color="#f0a848">Panel de usuarios</ST>
      <p style={{ fontSize:11, color:'#5c5c72', marginBottom:16 }}>
        Usuarios registrados en la app · {loading ? '...' : `${users.length} total`}
      </p>

      {loading && <div style={{ fontSize:12, color:'#5c5c72' }}>Cargando...</div>}
      {error && <div style={{ fontSize:12, color:'#f06070' }}>Error: {error}</div>}

      {!loading && !error && (
        <div style={{ ...cardStyle, padding:0, overflow:'hidden' }}>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 160px 160px', gap:0, padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.03)' }}>
            <span style={{ fontSize:10, fontWeight:700, color:'#6c6c84', textTransform:'uppercase' }}>Email</span>
            <span style={{ fontSize:10, fontWeight:700, color:'#6c6c84', textTransform:'uppercase' }}>Registrado</span>
            <span style={{ fontSize:10, fontWeight:700, color:'#6c6c84', textTransform:'uppercase' }}>Último acceso</span>
          </div>

          {users.map((u, i) => (
            <div key={u.id} style={{
              display:'grid', gridTemplateColumns:'1fr 160px 160px', gap:0,
              padding:'11px 16px',
              borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              background: u.email === 'foschi246@gmail.com' ? 'rgba(240,168,72,0.05)' : 'transparent',
            }}>
              <span style={{ fontSize:12, color: u.email === 'foschi246@gmail.com' ? '#f0a848' : '#e8e8f0', fontWeight: u.email === 'foschi246@gmail.com' ? 600 : 400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {u.email === 'foschi246@gmail.com' ? '★ ' : ''}{u.email}
              </span>
              <span style={{ fontSize:11, color:'#8888a0' }}>{fmt(u.created_at)}</span>
              <span style={{ fontSize:11, color: (u.last_seen_at || u.last_sign_in) ? '#8888a0' : '#5c5c72' }}>{fmt(u.last_seen_at || u.last_sign_in)}</span>
            </div>
          ))}

          {users.length === 0 && (
            <div style={{ padding:'24px 16px', textAlign:'center', fontSize:12, color:'#5c5c72' }}>Sin usuarios</div>
          )}
        </div>
      )}

      <div style={{ height:80 }} />
    </div>
  );
}
