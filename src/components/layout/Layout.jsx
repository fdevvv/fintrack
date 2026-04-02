import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { useUiStore } from '@/stores/uiStore';
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
  const { profile } = useStore();
  if (!profile) return null;
  return (
    <div style={{ padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
        <div style={{ width:36,height:36,borderRadius:'50%',background:'rgba(124,108,240,0.15)',border:'2px solid rgba(124,108,240,0.3)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
            : <span style={{ fontSize:16,color:'#a8a0f8' }}>{(profile.display_name || '?')[0].toUpperCase()}</span>
          }
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:12,fontWeight:600,color:'#e8e8f0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
            {profile.display_name || 'Sin nombre'}
          </div>
          <div style={{ fontSize:10,color:'#5c5c72',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{profile.email}</div>
        </div>
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
  { id:'perfil', icon:'👤', label:'Perfil' },
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
        <div style={{ fontSize:16,fontWeight:800,color:'#e8e8f0',display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ width:28,height:28,borderRadius:9,background:'linear-gradient(135deg,#7c6cf0 0%,#2dd4a8 100%)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 0 14px rgba(124,108,240,0.35)' }}>
            <svg width="16" height="16" viewBox="0 0 30 30" fill="none">
              <rect x="3" y="18" width="6" height="9" rx="2" fill="white" opacity="0.9"/>
              <rect x="12" y="11" width="6" height="16" rx="2" fill="white"/>
              <rect x="21" y="4" width="6" height="23" rx="2" fill="white" opacity="0.9"/>
            </svg>
          </div>
          FinTrack
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
            background:active===n.id?'rgba(124,108,240,0.10)':'transparent',
            color:active===n.id?'#b8b0ff':'#7070a0',
            fontSize:13,fontWeight:active===n.id?600:500,cursor:'pointer',
            transition:'all .15s',textAlign:'left',
            boxShadow:active===n.id?'inset 3px 0 0 #7c6cf0':'none',
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

export function TopBar({ year, years, setYear, syncing, onSignOut, onNav }) {
  const { profile } = useStore();
  const [showLogout, setShowLogout] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const today = new Date().toLocaleDateString('es-AR', { weekday:'long',day:'numeric',month:'long',year:'numeric' });
  const yBS = { width:32,height:32,borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'#e8e8f0',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' };

  return (
    <>
      {/* Mobile header */}
      <header className="ft-mobile-header" style={{ padding:'10px 16px',paddingTop:'calc(env(safe-area-inset-top, 0px) + 10px)',background:'rgba(12,12,24,0.92)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.07)',position:'fixed',top:0,left:0,right:0,zIndex:50 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          {/* Profile area con dropdown */}
          <div style={{ position:'relative', minWidth:0 }}>
            <div onClick={() => setShowMenu(m => !m)} style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer' }}>
              <div style={{ width:30,height:30,borderRadius:'50%',background:'rgba(124,108,240,0.15)',border:'2px solid rgba(124,108,240,0.3)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                  : <span style={{ fontSize:13,color:'#a8a0f8' }}>{(profile?.display_name || '?')[0].toUpperCase()}</span>
                }
              </div>
              <div style={{ minWidth:0 }}>
                <h1 style={{ fontSize:14,fontWeight:700,color:'#e8e8f0',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                  {profile?.display_name || 'FinTrack'}
                </h1>
                <p style={{ fontSize:9,color:'#5c5c72',textTransform:'capitalize',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{today}</p>
              </div>
            </div>
            {showMenu && (
              <>
                <div onClick={() => setShowMenu(false)} style={{ position:'fixed',inset:0,zIndex:200 }} />
                <div style={{ position:'absolute',top:'calc(100% + 8px)',left:0,zIndex:201,background:'#14141e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:6,minWidth:180,boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
                  <button onClick={() => { setShowMenu(false); onNav?.('perfil'); }} style={{ width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,border:'none',background:'transparent',color:'#e8e8f0',fontSize:13,fontWeight:600,cursor:'pointer',textAlign:'left' }}>
                    <span>👤</span> Mi Perfil
                  </button>
                </div>
              </>
            )}
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
  const mobileNavs = NAVS.filter(n => n.id !== 'perfil');
  return (
    <nav className="ft-mobile-nav" style={{ position:'fixed',bottom:0,left:0,right:0,background:'rgba(12,12,24,0.96)',backdropFilter:'blur(20px)',borderTop:'1px solid rgba(255,255,255,0.08)',justifyContent:'space-around',padding:'6px 0 env(safe-area-inset-bottom, 8px)',zIndex:100 }}>
      {[...mobileNavs, ...(isAdmin ? [ADMIN_NAV] : [])].map(n => (
        <button key={n.id} onClick={() => onNav(n.id)} style={{ background:'none',border:'none',color:active===n.id?'#a8a0f8':'#6c6c88',display:'flex',flexDirection:'column',alignItems:'center',gap:2,fontSize:9,fontWeight:600,cursor:'pointer',padding:'6px 8px' }}>
          <span style={{ fontSize:18,lineHeight:1 }}>{n.icon}</span>
          <span>{n.label}</span>
          <span style={{ width:16,height:2,borderRadius:1,background:active===n.id?'#7c6cf0':'transparent',marginTop:1,transition:'background .15s' }} />
        </button>
      ))}
    </nav>
  );
}
