import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { useUiStore } from '@/stores/uiStore';
import { NotificationBell } from '@/components/ui/NotificationBell';

/* ─── SVG Icon set ─────────────────────────────────────────────────────── */
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  dash:   'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  add:    'M12 5v14M5 12h14',
  list:   'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  gastos: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  imp:    'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  dolar:  'M12 2v2m0 16v2M6 6.93A6 6 0 1018 17.07M12 6a4 4 0 100 12',
  perfil: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  cfg:    'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  admin:  'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  bell:   'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  chevL:  'M15 18l-6-6 6-6',
  chevR:  'M9 18l6-6-6-6',
};

const NAVS = [
  { id:'dash',   icon: ICONS.dash,   label:'Panel'    },
  { id:'add',    icon: ICONS.add,    label:'Agregar'  },
  { id:'list',   icon: ICONS.list,   label:'Detalle'  },
  { id:'gastos', icon: ICONS.gastos, label:'Mes'      },
  { id:'imp',    icon: ICONS.imp,    label:'Importar' },
  { id:'dolar',  icon: ICONS.dolar,  label:'Dólar'    },
  { id:'perfil', icon: ICONS.perfil, label:'Perfil'   },
  { id:'cfg',    icon: ICONS.cfg,    label:'Config'   },
];
const ADMIN_NAV = { id:'admin', icon: ICONS.admin, label:'Usuarios' };

/* ─── Logo SVG ─────────────────────────────────────────────────────────── */
function LogoMark({ size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.32),
      background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      boxShadow: '0 0 20px rgba(99,102,241,0.4)',
    }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 30 30" fill="none">
        <rect x="3"  y="18" width="6" height="9"  rx="2" fill="white" opacity="0.85"/>
        <rect x="12" y="11" width="6" height="16" rx="2" fill="white"/>
        <rect x="21" y="4"  width="6" height="23" rx="2" fill="white" opacity="0.85"/>
      </svg>
    </div>
  );
}

/* ─── YearSelector ─────────────────────────────────────────────────────── */
function YearSelector({ year, years, setYear, compact = false }) {
  const canPrev = years.includes(year - 1);
  const canNext = years.includes(year + 1);
  const btnS = {
    width: 28, height: 28, borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#94a3b8', fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  };
  return (
    <div style={{ display:'flex', alignItems:'center', gap: compact ? 4 : 6 }}>
      <button onClick={() => canPrev && setYear(year - 1)} disabled={!canPrev}
        style={{ ...btnS, opacity: canPrev ? 1 : 0.25 }}>
        <Icon d={ICONS.chevL} size={13} />
      </button>
      <span style={{ fontSize: compact ? 13 : 14, fontWeight: 700, color: '#e2e8f0',
        minWidth: compact ? 34 : 38, textAlign: 'center', letterSpacing: '-0.3px' }}>
        {year}
      </span>
      <button onClick={() => canNext && setYear(year + 1)} disabled={!canNext}
        style={{ ...btnS, opacity: canNext ? 1 : 0.25 }}>
        <Icon d={ICONS.chevR} size={13} />
      </button>
    </div>
  );
}

/* ─── LogoutModal ───────────────────────────────────────────────────────── */
function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',
      backdropFilter:'blur(6px)',display:'flex',alignItems:'center',
      justifyContent:'center',zIndex:10000,padding:20 }} onClick={onCancel}>
      <div style={{ background:'#1c2030',borderRadius:16,padding:24,
        maxWidth:320,width:'100%',border:'1px solid rgba(255,255,255,0.1)',
        boxShadow:'0 24px 64px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:16,fontWeight:700,color:'#e2e8f0',marginBottom:8 }}>
          Cerrar sesión
        </div>
        <div style={{ fontSize:13,color:'#64748b',lineHeight:1.6,marginBottom:20 }}>
          ¿Estás seguro que querés cerrar sesión?
        </div>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onCancel} style={{
            flex:1,padding:'10px 0',borderRadius:10,
            border:'1px solid rgba(255,255,255,0.08)',background:'transparent',
            color:'#94a3b8',fontSize:13,fontWeight:600,cursor:'pointer',
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            flex:1,padding:'10px 0',borderRadius:10,border:'none',
            background:'linear-gradient(135deg,#ef4444,#f87171)',
            color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',
          }}>Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar Profile ───────────────────────────────────────────────────── */
function ProfileSection() {
  const { profile } = useStore();
  if (!profile) return null;
  return (
    <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:34, height:34, borderRadius:'50%',
          background:'rgba(99,102,241,0.15)',
          border:'2px solid rgba(129,140,248,0.3)',
          overflow:'hidden', flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <span style={{ fontSize:15, fontWeight:700, color:'#818cf8' }}>
                {(profile.display_name || '?')[0].toUpperCase()}
              </span>
          }
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12,fontWeight:600,color:'#e2e8f0',
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
            {profile.display_name || 'Sin nombre'}
          </div>
          <div style={{ fontSize:10,color:'#475569',
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
            {profile.email}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Notifications row ─────────────────────────────────────────────────── */
function NotificationSidebarRow() {
  const { notifHasNew, openNotif } = useUiStore();
  return (
    <div style={{ padding:'0 10px 6px' }}>
      <button onClick={openNotif} style={{
        width:'100%', display:'flex', alignItems:'center', gap:10,
        padding:'9px 12px', borderRadius:10, border:'none',
        background:'transparent', cursor:'pointer', textAlign:'left',
        transition:'background 0.15s',
      }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
         onMouseLeave={e => e.currentTarget.style.background='transparent'}>
        <span style={{ position:'relative', flexShrink:0, display:'flex',
          alignItems:'center', color: notifHasNew ? '#fbbf24' : '#64748b' }}>
          <Icon d={ICONS.bell} size={17} />
          {notifHasNew && (
            <span style={{ position:'absolute',top:-3,right:-3,width:7,height:7,
              borderRadius:'50%',background:'#f87171',
              border:'2px solid #09090f' }} />
          )}
        </span>
        <span style={{ fontSize:13, color:'#64748b', fontWeight:500 }}>Novedades</span>
        {notifHasNew && (
          <span style={{ marginLeft:'auto',fontSize:9,fontWeight:700,color:'#f87171',
            background:'rgba(248,113,113,0.12)',padding:'2px 7px',borderRadius:20,
            border:'1px solid rgba(248,113,113,0.2)' }}>NUEVO</span>
        )}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SIDEBAR (Desktop)
══════════════════════════════════════════════════════════════════════════ */
export function Sidebar({ active, onNav, year, years, setYear, onSignOut, isAdmin }) {
  const [showLogout, setShowLogout] = useState(false);

  return (
    <aside className="ft-sidebar">
      {/* Brand */}
      <div style={{ padding:'20px 18px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <LogoMark size={30} />
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#e2e8f0',
              letterSpacing:'-0.4px', lineHeight:1 }}>FinTrack</div>
            <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>
              Control de gastos
            </div>
          </div>
        </div>
      </div>

      {/* Year selector */}
      <div style={{ padding:'0 18px 14px' }}>
        <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10,
          padding:'7px 10px', border:'1px solid rgba(255,255,255,0.06)',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:11, color:'#475569', fontWeight:500 }}>Año</span>
          <YearSelector year={year} years={years} setYear={setYear} />
        </div>
      </div>

      {/* Divider */}
      <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'0 18px 10px' }} />

      {/* Nav */}
      <nav style={{ flex:1, padding:'0 10px', overflowY:'auto' }}>
        {[...NAVS, ...(isAdmin ? [ADMIN_NAV] : [])].map(n => {
          const isActive = active === n.id;
          return (
            <button key={n.id} onClick={() => onNav(n.id)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:10,
              padding:'9px 12px', borderRadius:10, border:'none', marginBottom:2,
              background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
              color: isActive ? '#818cf8' : '#64748b',
              fontSize:13, fontWeight: isActive ? 600 : 500,
              cursor:'pointer', transition:'all 0.12s', textAlign:'left',
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='#94a3b8'; } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#64748b'; } }}>
              <span style={{ flexShrink:0, display:'flex', alignItems:'center' }}>
                <Icon d={n.icon} size={17} />
              </span>
              <span style={{ letterSpacing:'-0.1px' }}>{n.label}</span>
              {isActive && (
                <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%',
                  background:'#818cf8', flexShrink:0 }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Novedades */}
      <NotificationSidebarRow />

      {/* Profile */}
      <ProfileSection />

      {/* Logout */}
      <div style={{ padding:'8px 16px 16px' }}>
        <button onClick={() => setShowLogout(true)} style={{
          width:'100%', padding:'9px 12px', borderRadius:10,
          border:'1px solid rgba(248,113,113,0.15)',
          background:'rgba(248,113,113,0.06)',
          color:'#f87171', fontSize:12, fontWeight:600,
          cursor:'pointer', transition:'all 0.15s',
          display:'flex', alignItems:'center', gap:8, justifyContent:'center',
        }}
        onMouseEnter={e => { e.currentTarget.style.background='rgba(248,113,113,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.background='rgba(248,113,113,0.06)'; }}>
          <Icon d={ICONS.logout} size={14} />
          Cerrar sesión
        </button>
      </div>

      {showLogout && <LogoutModal onConfirm={() => { setShowLogout(false); onSignOut(); }} onCancel={() => setShowLogout(false)} />}
    </aside>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TOP BAR (Mobile header)
══════════════════════════════════════════════════════════════════════════ */
export function TopBar({ year, years, setYear, syncing, onSignOut, onNav }) {
  const { profile } = useStore();
  const [showLogout, setShowLogout] = useState(false);
  const [showMenu,   setShowMenu]   = useState(false);
  const today = new Date().toLocaleDateString('es-AR', {
    weekday:'long', day:'numeric', month:'long',
  });

  return (
    <>
      <header className="ft-mobile-header" style={{
        padding:'10px 16px',
        paddingTop:'calc(env(safe-area-inset-top, 0px) + 10px)',
        background:'rgba(9,9,15,0.94)',
        backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        position:'fixed', top:0, left:0, right:0, zIndex:50,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          {/* Profile / branding */}
          <div style={{ position:'relative', minWidth:0 }}>
            <div onClick={() => setShowMenu(m => !m)} style={{
              display:'flex', alignItems:'center', gap:9, cursor:'pointer',
            }}>
              <div style={{
                width:32, height:32, borderRadius:'50%',
                background:'rgba(99,102,241,0.15)',
                border:'2px solid rgba(129,140,248,0.3)',
                overflow:'hidden', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                  : <span style={{ fontSize:14,fontWeight:700,color:'#818cf8' }}>
                      {(profile?.display_name || '?')[0].toUpperCase()}
                    </span>
                }
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:14,fontWeight:700,color:'#e2e8f0',
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                  letterSpacing:'-0.3px' }}>
                  {profile?.display_name || 'FinTrack'}
                </div>
                <div style={{ fontSize:10,color:'#475569',textTransform:'capitalize',
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                  {today}
                </div>
              </div>
            </div>
            {showMenu && (
              <>
                <div onClick={() => setShowMenu(false)} style={{ position:'fixed',inset:0,zIndex:200 }} />
                <div style={{ position:'absolute',top:'calc(100% + 8px)',left:0,zIndex:201,
                  background:'#1c2030',border:'1px solid rgba(255,255,255,0.1)',
                  borderRadius:12,padding:6,minWidth:180,
                  boxShadow:'0 12px 40px rgba(0,0,0,0.6)' }}>
                  <button onClick={() => { setShowMenu(false); onNav?.('perfil'); }} style={{
                    width:'100%',display:'flex',alignItems:'center',gap:10,
                    padding:'10px 12px',borderRadius:8,border:'none',
                    background:'transparent',color:'#e2e8f0',fontSize:13,
                    fontWeight:600,cursor:'pointer',textAlign:'left',
                  }}>
                    <Icon d={ICONS.perfil} size={15} /> Mi Perfil
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right controls */}
          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
            <YearSelector year={year} years={years} setYear={setYear} compact />
            <NotificationBell />
            <button onClick={() => setShowLogout(true)} style={{
              padding:'6px 9px', borderRadius:8,
              border:'1px solid rgba(248,113,113,0.2)',
              background:'rgba(248,113,113,0.08)',
              color:'#f87171', fontSize:10, fontWeight:600, cursor:'pointer',
              display:'flex', alignItems:'center', gap:4,
            }}>
              <Icon d={ICONS.logout} size={12} />
            </button>
          </div>
        </div>
        {syncing && (
          <div style={{ marginTop:4, display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:6,height:6,borderRadius:'50%',background:'#818cf8',
              animation:'pulse 1.5s infinite' }} />
            <span style={{ fontSize:9,color:'#818cf8',fontWeight:600,
              letterSpacing:'0.3px' }}>SINCRONIZANDO</span>
          </div>
        )}
      </header>

      {/* Desktop top bar (inside main content) */}
      <div className="ft-topbar" style={{
        padding:'20px 24px 8px',
        justifyContent:'space-between',
        alignItems:'center',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <p style={{ fontSize:12, color:'#475569', textTransform:'capitalize', margin:0 }}>
            {new Date().toLocaleDateString('es-AR', { weekday:'long',day:'numeric',month:'long',year:'numeric' })}
          </p>
          {syncing && (
            <span style={{ fontSize:10,color:'#818cf8',fontWeight:600,
              display:'flex',alignItems:'center',gap:4 }}>
              <span style={{ display:'inline-block',width:6,height:6,borderRadius:'50%',
                background:'#818cf8',animation:'pulse 1.5s infinite' }}/>
              Sincronizando
            </span>
          )}
        </div>
      </div>

      {showLogout && <LogoutModal onConfirm={() => { setShowLogout(false); onSignOut(); }} onCancel={() => setShowLogout(false)} />}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MOBILE NAV (bottom tab bar)
══════════════════════════════════════════════════════════════════════════ */
export function MobileNav({ active, onNav, isAdmin }) {
  const mobileNavs = NAVS.filter(n => n.id !== 'perfil');

  return (
    <nav className="ft-mobile-nav" style={{
      position:'fixed', bottom:0, left:0, right:0,
      background:'rgba(9,9,15,0.96)',
      backdropFilter:'blur(24px)',
      borderTop:'1px solid rgba(255,255,255,0.07)',
      justifyContent:'space-around',
      padding:'6px 0',
      paddingBottom:'calc(env(safe-area-inset-bottom, 6px) + 6px)',
      zIndex:100,
    }}>
      {[...mobileNavs, ...(isAdmin ? [ADMIN_NAV] : [])].map(n => {
        const isActive = active === n.id;
        return (
          <button key={n.id} onClick={() => onNav(n.id)} style={{
            background:'none', border:'none',
            display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            cursor:'pointer', padding:'5px 8px', borderRadius:10,
            color: isActive ? '#818cf8' : '#475569',
            transition:'color 0.15s',
            minWidth:40,
          }}>
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'center',
              width:36, height:28, borderRadius:8,
              background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
              transition:'background 0.15s',
            }}>
              <Icon d={n.icon} size={18} />
            </div>
            <span style={{ fontSize:9, fontWeight: isActive ? 700 : 500,
              letterSpacing:'0.3px' }}>
              {n.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
