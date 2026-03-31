import { useState, useRef } from 'react';
import { useStore } from '@/stores/useStore';
import { useUiStore } from '@/stores/uiStore';
import { profileService } from '@/services/profile.service';
import { inputStyle } from '@/utils/styles';
import { NotificationBell } from '@/components/ui/NotificationBell';

function NotificationSidebarRow() {
  const { notifHasNew, openNotif } = useUiStore();
  return (
    <div style={{ padding:'0 10px 8px' }}>
      <button onClick={openNotif} style={{ width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,border:'none',background:'transparent',cursor:'pointer',textAlign:'left' }}>
        <span style={{ position:'relative',fontSize:18,lineHeight:1 }}>
          🔔
          {notifHasNew && <span style={{ position:'absolute',top:-2,right:-2,width:8,height:8,borderRadius:'50%',background:'#f06070',border:'2px solid #08080f' }} />}
        </span>
        <span style={{ fontSize:13,color:'#6c6c84',fontWeight:500 }}>Novedades</span>
        {notifHasNew && <span style={{ marginLeft:'auto',fontSize:9,fontWeight:700,color:'#f06070',background:'rgba(240,96,112,0.12)',padding:'2px 7px',borderRadius:20 }}>NUEVO</span>}
      </button>
    </div>
  );
}

function ProfileSection() {
  const { profile, updateProfile } = useStore();
  const { showToast } = useUiStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const fileRef = useRef(null);

  if (!profile) return null;

  const startEdit = () => { setName(profile.display_name || ''); setEditing(true); };
  const saveName = async () => {
    if (!name.trim()) return;
    try { await updateProfile({ display_name: name.trim() }); showToast('✓ Nombre actualizado'); }
    catch { showToast('Error', true); }
    setEditing(false);
  };
  const handleAvatar = async (file) => {
    if (!file) return;
    try {
      const url = await profileService.uploadAvatar(file);
      await updateProfile({ avatar_url: url + '?t=' + Date.now() });
      showToast('✓ Foto actualizada');
    } catch { showToast('Error subiendo foto', true); }
  };

  return (
    <div style={{ padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.05)' }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { if (e.target.files?.[0]) handleAvatar(e.target.files[0]); }} />
      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:8 }}>
        <div onClick={() => fileRef.current?.click()} style={{ width:36,height:36,borderRadius:'50%',background:'rgba(124,108,240,0.15)',border:'2px solid rgba(124,108,240,0.3)',overflow:'hidden',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',position:'relative' }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
            : <span style={{ fontSize:16,color:'#a8a0f8' }}>{(profile.display_name || '?')[0].toUpperCase()}</span>
          }
          <div style={{ position:'absolute',bottom:-2,right:-2,width:14,height:14,borderRadius:'50%',background:'#7c6cf0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:'#fff',border:'2px solid #08080f' }}>📷</div>
        </div>
        {editing ? (
          <div style={{ flex:1,display:'flex',gap:4 }}>
            <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key==='Enter' && saveName()} style={{ ...inputStyle, padding:'5px 8px',fontSize:12,flex:1 }} autoFocus />
            <button onClick={saveName} style={{ background:'#2dd4a8',border:'none',color:'#0a0a12',fontSize:10,fontWeight:700,padding:'4px 8px',borderRadius:6,cursor:'pointer' }}>✓</button>
          </div>
        ) : (
          <div style={{ flex:1,minWidth:0 }}>
            <div onClick={startEdit} style={{ fontSize:12,fontWeight:600,color:'#e8e8f0',cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4 }} title="Click para editar">
              {profile.display_name || 'Sin nombre'} <span style={{ fontSize:10,opacity:0.4 }}>✏️</span>
            </div>
            <div style={{ fontSize:10,color:'#5c5c72',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{profile.email}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const NAVS = [
  { id:'dash', icon:'◫', label:'Panel' },
  { id:'add', icon:'＋', label:'Agregar' },
  { id:'list', icon:'☰', label:'Detalle' },
  { id:'gastos', icon:'💵', label:'Mes' },
  { id:'imp', icon:'↑', label:'Importar' },
  { id:'dolar', icon:'$', label:'Dólar' },
  { id:'cfg', icon:'⚙', label:'Config' },
];
const ADMIN_NAV = { id:'admin', icon:'👑', label:'Usuarios' };

export function Sidebar({ active, onNav, year, years, setYear, onSignOut, isAdmin }) {
  const [showLogout, setShowLogout] = useState(false);
  const yBS = { width:28,height:28,borderRadius:6,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'#e8e8f0',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' };

  return (
    <aside className="ft-sidebar">
      {/* Logo */}
      <div style={{ padding:'20px 20px 16px' }}>
        <div style={{ fontSize:16,fontWeight:800,color:'#e8e8f0',display:'flex',alignItems:'center',gap:8 }}>
          <span style={{ fontSize:20 }}>💰</span> FinTrack
        </div>
        <div style={{ fontSize:10,color:'#5c5c72',marginTop:4 }}>Control de gastos</div>
      </div>

      {/* Year selector */}
      <div style={{ padding:'0 16px 16px',display:'flex',alignItems:'center',gap:6 }}>
        <button onClick={() => years.includes(year-1) && setYear(year-1)} disabled={!years.includes(year-1)} style={{ ...yBS,opacity:years.includes(year-1)?1:0.3 }}>‹</button>
        <span style={{ fontSize:14,fontWeight:700,color:'#fff',flex:1,textAlign:'center' }}>{year}</span>
        <button onClick={() => years.includes(year+1) && setYear(year+1)} disabled={!years.includes(year+1)} style={{ ...yBS,opacity:years.includes(year+1)?1:0.3 }}>›</button>
      </div>

      {/* Nav items */}
      <nav style={{ flex:1,padding:'0 10px' }}>
        {[...NAVS, ...(isAdmin ? [ADMIN_NAV] : [])].map(n => (
          <button key={n.id} onClick={() => onNav(n.id)} style={{
            width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 12px',
            borderRadius:10,border:'none',marginBottom:2,
            background:active===n.id?'rgba(124,108,240,0.12)':'transparent',
            color:active===n.id?'#a8a0f8':'#6c6c84',
            fontSize:13,fontWeight:active===n.id?600:500,cursor:'pointer',
            transition:'all .15s',textAlign:'left',
          }}>
            <span style={{ fontSize:16,width:20,textAlign:'center' }}>{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* Novedades */}
      <NotificationSidebarRow />

      {/* Profile + Sign out */}
      <ProfileSection />
      <div style={{ padding:'0 16px 16px' }}>
        <button onClick={() => setShowLogout(true)} style={{
          width:'100%',padding:'9px 12px',borderRadius:8,border:'1px solid rgba(240,96,112,0.15)',
          background:'rgba(240,96,112,0.06)',color:'#f06070',fontSize:12,fontWeight:600,
          cursor:'pointer',transition:'all .2s',
        }}>
          Cerrar sesión
        </button>
      </div>
      {showLogout && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10000,padding:20 }} onClick={() => setShowLogout(false)}>
          <div style={{ background:'#14141e',borderRadius:16,padding:24,maxWidth:320,width:'100%',border:'1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:16,fontWeight:700,color:'#e8e8f0',marginBottom:8 }}>Cerrar sesión</div>
            <div style={{ fontSize:13,color:'#8888a0',lineHeight:1.5,marginBottom:20 }}>¿Estás seguro que querés cerrar sesión?</div>
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={() => setShowLogout(false)} style={{ flex:1,padding:10,borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',background:'transparent',color:'#8888a0',fontSize:13,fontWeight:600,cursor:'pointer' }}>Cancelar</button>
              <button onClick={() => { setShowLogout(false); onSignOut(); }} style={{ flex:1,padding:10,borderRadius:10,border:'none',background:'#f06070',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer' }}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export function TopBar({ year, years, setYear, syncing, onSignOut }) {
  const { profile, updateProfile } = useStore();
  const { showToast } = useUiStore();
  const [showLogout, setShowLogout] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const avatarRef = useRef(null);
  const today = new Date().toLocaleDateString('es-AR', { weekday:'long',day:'numeric',month:'long',year:'numeric' });
  const yBS = { width:32,height:32,borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'#e8e8f0',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' };

  const openProfile = () => { setEditName(profile?.display_name || ''); setShowProfile(true); };
  const saveName = async () => {
    if (!editName.trim()) return;
    try { await updateProfile({ display_name: editName.trim() }); showToast('✓ Nombre actualizado'); } catch { showToast('Error', true); }
    setShowProfile(false);
  };
  const handleAvatar = async (file) => {
    if (!file) return;
    try {
      const url = await profileService.uploadAvatar(file);
      await updateProfile({ avatar_url: url + '?t=' + Date.now() });
      showToast('✓ Foto actualizada');
    } catch { showToast('Error subiendo foto', true); }
  };

  return (
    <>
      <input ref={avatarRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { if (e.target.files?.[0]) handleAvatar(e.target.files[0]); }} />

      {/* Mobile header */}
      <header className="ft-mobile-header" style={{ padding:'10px 16px',background:'rgba(12,12,20,0.9)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.04)',position:'sticky',top:0,zIndex:50 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div onClick={openProfile} style={{ display:'flex',alignItems:'center',gap:8,minWidth:0,cursor:'pointer' }}>
            {/* Profile pic */}
            <div style={{ width:30,height:30,borderRadius:'50%',background:'rgba(124,108,240,0.15)',border:'2px solid rgba(124,108,240,0.3)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',position:'relative' }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                : <span style={{ fontSize:13,color:'#a8a0f8' }}>{(profile?.display_name || '?')[0].toUpperCase()}</span>
              }
            </div>
            <div style={{ minWidth:0 }}>
              <h1 style={{ fontSize:14,fontWeight:700,color:'#e8e8f0',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4 }}>
                {profile?.display_name || 'FinTrack'} <span style={{ fontSize:9,opacity:0.4 }}>✏️</span>
              </h1>
              <p style={{ fontSize:9,color:'#5c5c72',textTransform:'capitalize',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{today}</p>
            </div>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:5,flexShrink:0 }}>
            <button onClick={() => years.includes(year-1) && setYear(year-1)} disabled={!years.includes(year-1)} style={{ ...yBS,width:28,height:28,opacity:years.includes(year-1)?1:0.3 }}>‹</button>
            <span style={{ fontSize:14,fontWeight:700,color:'#fff',minWidth:38,textAlign:'center' }}>{year}</span>
            <button onClick={() => years.includes(year+1) && setYear(year+1)} disabled={!years.includes(year+1)} style={{ ...yBS,width:28,height:28,opacity:years.includes(year+1)?1:0.3 }}>›</button>
            <NotificationBell />
            <button onClick={() => setShowLogout(true)} style={{ padding:'5px 8px',borderRadius:6,border:'1px solid rgba(240,96,112,0.2)',background:'rgba(240,96,112,0.08)',color:'#f06070',fontSize:10,fontWeight:600,cursor:'pointer',marginLeft:2 }}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      {/* Profile edit modal */}
      {showProfile && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10000,padding:20 }} onClick={() => setShowProfile(false)}>
          <div style={{ background:'#14141e',borderRadius:16,padding:24,maxWidth:320,width:'100%',border:'1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:16,fontWeight:700,color:'#e8e8f0',marginBottom:16 }}>Editar perfil</div>
            {/* Avatar */}
            <div style={{ display:'flex',justifyContent:'center',marginBottom:16 }}>
              <div onClick={() => avatarRef.current?.click()} style={{ width:64,height:64,borderRadius:'50%',background:'rgba(124,108,240,0.15)',border:'3px solid rgba(124,108,240,0.3)',overflow:'hidden',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',position:'relative' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                  : <span style={{ fontSize:24,color:'#a8a0f8' }}>{(profile?.display_name || '?')[0].toUpperCase()}</span>
                }
                <div style={{ position:'absolute',bottom:0,right:0,width:20,height:20,borderRadius:'50%',background:'#7c6cf0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#fff',border:'2px solid #14141e' }}>📷</div>
              </div>
            </div>
            {/* Name input */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block',fontSize:11,fontWeight:600,color:'#6c6c84',marginBottom:5 }}>Nombre</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key==='Enter' && saveName()} style={{ ...inputStyle, padding:'10px 12px',fontSize:14 }} autoFocus />
            </div>
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={() => setShowProfile(false)} style={{ flex:1,padding:10,borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',background:'transparent',color:'#8888a0',fontSize:13,fontWeight:600,cursor:'pointer' }}>Cancelar</button>
              <button onClick={saveName} style={{ flex:1,padding:10,borderRadius:10,border:'none',background:'#7c6cf0',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Logout confirmation modal */}
      {showLogout && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10000,padding:20 }} onClick={() => setShowLogout(false)}>
          <div style={{ background:'#14141e',borderRadius:16,padding:24,maxWidth:320,width:'100%',border:'1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:16,fontWeight:700,color:'#e8e8f0',marginBottom:8 }}>Cerrar sesión</div>
            <div style={{ fontSize:13,color:'#8888a0',lineHeight:1.5,marginBottom:20 }}>¿Estás seguro que querés cerrar sesión?</div>
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={() => setShowLogout(false)} style={{ flex:1,padding:10,borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',background:'transparent',color:'#8888a0',fontSize:13,fontWeight:600,cursor:'pointer' }}>Cancelar</button>
              <button onClick={() => { setShowLogout(false); onSignOut(); }} style={{ flex:1,padding:10,borderRadius:10,border:'none',background:'#f06070',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer' }}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop top bar (inside main content) */}
      <div className="ft-topbar" style={{ padding:'20px 24px 12px',justifyContent:'space-between',alignItems:'center' }}>
        <div>
          <p style={{ fontSize:11,color:'#5c5c72',textTransform:'capitalize',margin:0 }}>{today}</p>
          {syncing && <span style={{ fontSize:9,color:'#7c6cf0',fontWeight:600 }}>⟳ Sincronizando...</span>}
        </div>
      </div>
    </>
  );
}

export function MobileNav({ active, onNav, isAdmin }) {
  return (
    <nav className="ft-mobile-nav" style={{ position:'fixed',bottom:0,left:0,right:0,background:'rgba(12,12,20,0.95)',backdropFilter:'blur(20px)',borderTop:'1px solid rgba(255,255,255,0.05)',justifyContent:'space-around',padding:'6px 0 env(safe-area-inset-bottom, 8px)',zIndex:100 }}>
      {[...NAVS, ...(isAdmin ? [ADMIN_NAV] : [])].map(n => (
        <button key={n.id} onClick={() => onNav(n.id)} style={{ background:'none',border:'none',color:active===n.id?'#7c6cf0':'#5c5c72',display:'flex',flexDirection:'column',alignItems:'center',gap:2,fontSize:9,fontWeight:600,cursor:'pointer',padding:'6px 8px' }}>
          <span style={{ fontSize:18,lineHeight:1 }}>{n.icon}</span>
          <span>{n.label}</span>
        </button>
      ))}
    </nav>
  );
}
