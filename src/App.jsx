import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from './stores/useStore';
import { useUiStore } from './stores/uiStore';
import { useAuth } from './hooks/auth/useAuth';
import { Sidebar, MobileNav, TopBar } from './components/layout/Layout';
import { AuthPage } from './components/auth/AuthPage';
import { Toast } from './components/ui/Shared';
import { NotificationsPanel } from './components/ui/NotificationBell';
import { UpdatePrompt } from './components/ui/UpdatePrompt';
import { OnboardingGuide } from './components/onboarding/OnboardingGuide';

const DashPage      = lazy(() => import('./pages/DashPage').then(m => ({ default: m.DashPage })));
const AddPage       = lazy(() => import('./pages/AddPage').then(m => ({ default: m.AddPage })));
const ListPage      = lazy(() => import('./pages/ListPage').then(m => ({ default: m.ListPage })));
const ImportPage    = lazy(() => import('./pages/ImportPage').then(m => ({ default: m.ImportPage })));
const GastosPage    = lazy(() => import('./pages/GastosPage').then(m => ({ default: m.GastosPage })));
const DolarPage     = lazy(() => import('./pages/DolarPage').then(m => ({ default: m.DolarPage })));
const ConfigPage    = lazy(() => import('./pages/ConfigPage').then(m => ({ default: m.ConfigPage })));
const AdminPage     = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const MesDetailPage = lazy(() => import('./pages/MesDetailPage').then(m => ({ default: m.MesDetailPage })));
const ProfilePage   = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));

const PAGE_ROUTES = {
  dash:   '/panel',
  add:    '/agregar',
  list:   '/movimientos',
  gastos: '/mes',
  imp:    '/importar',
  dolar:  '/dolar',
  cfg:    '/configuracion',
  perfil: '/perfil',
  admin:  '/admin',
};
const ROUTE_PAGES = Object.fromEntries(Object.entries(PAGE_ROUTES).map(([k, v]) => [v, k]));

export default function App() {
  const { session, authLoading, signOut } = useAuth();
  const { page, setPage, year, years, setYear, loadAll, profile, setUserId } = useStore();
  const { syncing, toast, clearToast, notifHasNew, openNotif } = useUiStore();
  const [showBanner, setShowBanner] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // URL → estado al cargar o usar back/forward
  useEffect(() => {
    if (/^\/mes\/\d{4}-\d{2}$/.test(location.pathname)) return; // detail page, no cambia la tab activa
    const p = ROUTE_PAGES[location.pathname] || 'dash';
    if (p !== page) setPage(p);
  }, [location.pathname]);

  // Navegación: actualiza estado + URL
  const handleNav = (p) => {
    setPage(p);
    navigate(PAGE_ROUTES[p] || '/');
    navigator.serviceWorker?.getRegistration().then(r => r?.update()).catch(() => {});
  };

  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id);
      loadAll();
    }
  }, [session?.user?.id, year]);

  // Mostrar guía de onboarding si el usuario no la completó todavía
  useEffect(() => {
    if (!profile) return;
    if (!profile.onboarding_completed) setShowGuide(true);
  }, [profile?.id]);

  // Banner de nuevas actualizaciones al entrar a la app
  useEffect(() => {
    if (!session || !notifHasNew) return;
    const timer = setTimeout(() => setShowBanner(true), 1500);
    return () => clearTimeout(timer);
  }, [session]);

  if (authLoading) {
    return (
      <div style={{ minHeight:'100vh', background:'#09090f', display:'flex',
        alignItems:'center', justifyContent:'center' }}>
        <style>{`
          @keyframes ftBarSlide {
            0%   { width: 0%;   opacity: 0.6; }
            60%  { width: 80%;  opacity: 1; }
            100% { width: 100%; opacity: 0.5; }
          }
          @keyframes ftLogoPulse {
            0%, 100% { opacity: 0.9;  transform: scale(1); }
            50%       { opacity: 1;   transform: scale(1.03); }
          }
          .ft-splash-logo { animation: ftLogoPulse 2.2s ease-in-out infinite; }
          .ft-splash-bar  { animation: ftBarSlide 1.6s cubic-bezier(.4,0,.2,1) infinite; }
        `}</style>
        <div style={{ textAlign:'center', display:'flex', flexDirection:'column',
          alignItems:'center', gap:20 }}>
          <div className="ft-splash-logo" style={{
            width:60, height:60, borderRadius:18,
            background:'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 40px rgba(99,102,241,0.4), 0 0 80px rgba(99,102,241,0.15)',
          }}>
            <svg width="32" height="32" viewBox="0 0 30 30" fill="none">
              <rect x="3"  y="18" width="6" height="9"  rx="2" fill="white" opacity="0.85"/>
              <rect x="12" y="11" width="6" height="16" rx="2" fill="white"/>
              <rect x="21" y="4"  width="6" height="23" rx="2" fill="white" opacity="0.85"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily:"'Inter',system-ui,sans-serif", fontSize:22,
              fontWeight:800, color:'#e2e8f0', letterSpacing:'-0.5px' }}>
              FinTrack
            </div>
            <div style={{ fontFamily:"'Inter',system-ui,sans-serif", fontSize:12,
              color:'#475569', marginTop:4, letterSpacing:'0.2px' }}>
              Control de gastos
            </div>
          </div>
          <div style={{ width:140, height:2, background:'rgba(255,255,255,0.06)',
            borderRadius:99, overflow:'hidden' }}>
            <div className="ft-splash-bar" style={{ height:'100%',
              background:'linear-gradient(90deg, #6366f1, #818cf8, #a5b4fc)',
              borderRadius:99 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!session) return <AuthPage />;

  const renderPage = () => {
    const mesMatch = location.pathname.match(/^\/mes\/(\d{4}-\d{2})$/);
    if (mesMatch) return <MesDetailPage month={mesMatch[1]} />;
    switch (page) {
      case 'dash': return <DashPage />;
      case 'add': return <AddPage />;
      case 'list': return <ListPage />;
      case 'gastos': return <GastosPage />;
      case 'imp': return <ImportPage />;
      case 'dolar': return <DolarPage />;
      case 'cfg': return <ConfigPage />;
      case 'perfil': return <ProfilePage />;
      case 'admin': return profile?.email === 'foschi246@gmail.com' ? <AdminPage /> : <DashPage />;
      default: return <DashPage />;
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ftPageIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

        .ft-spinner {
          width:28px; height:28px;
          border:2.5px solid rgba(129,140,248,0.15);
          border-top-color:#818cf8;
          border-radius:50%;
          animation:spin 0.7s linear infinite;
          margin:0 auto;
        }
        .ft-page-enter { animation: ftPageIn 0.16s ease-out both; }

        /* ── Mobile first ── */
        .ft-app {
          min-height:100vh;
          background:#09090f;
          font-family:'Inter',system-ui,-apple-system,sans-serif;
        }
        .ft-sidebar      { display:none; }
        .ft-topbar       { display:none; }
        .ft-mobile-nav   { display:flex; }
        .ft-main {
          padding-bottom:96px;
          padding-top:calc(env(safe-area-inset-top, 0px) + 58px);
        }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .ft-app { display:flex; }
          .ft-sidebar {
            display:flex; flex-direction:column;
            width:230px; min-height:100vh;
            position:fixed; left:0; top:0;
            background:#0c0d14;
            border-right:1px solid rgba(255,255,255,0.06);
            z-index:50;
          }
          .ft-topbar           { display:flex; }
          .ft-mobile-header    { display:none !important; }
          .ft-mobile-nav       { display:none !important; }
          .ft-main             { margin-left:230px; flex:1; padding:0 28px 32px; }
          .ft-main .ft-page    { max-width:980px; margin:0 auto; }
        }

        @media (min-width: 1280px) {
          .ft-sidebar { width:248px; }
          .ft-main    { margin-left:248px; }
        }
      `}</style>

      <div className="ft-app">
        <Sidebar active={page} onNav={handleNav} year={year} years={years} setYear={setYear} onSignOut={signOut} isAdmin={profile?.email === 'foschi246@gmail.com'} />

        <div className="ft-main">
          {/* Mobile header */}
          <TopBar year={year} years={years} setYear={setYear} syncing={syncing} onSignOut={signOut} onNav={handleNav} />
          <div className="ft-page">
            <div key={page + location.pathname} className="ft-page-enter">
              <Suspense fallback={<div className="ft-spinner" style={{ margin:'40px auto' }} />}>
                {renderPage()}
              </Suspense>
            </div>
          </div>
        </div>

        <MobileNav active={page} onNav={handleNav} isAdmin={profile?.email === 'foschi246@gmail.com'} />
        <Toast toast={toast} onClear={clearToast} />

        {/* Banner de actualización */}
        {showBanner && (
          <div style={{ position:'fixed',bottom:90,left:'50%',transform:'translateX(-50%)',
            zIndex:9000,display:'flex',alignItems:'center',gap:10,
            background:'#161824',
            border:'1px solid rgba(251,191,36,0.25)',
            borderRadius:14,padding:'10px 16px',
            boxShadow:'0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(251,191,36,0.1)',
            maxWidth:'92vw',whiteSpace:'nowrap',
            animation:'slideUp 0.25s ease-out',
          }}>
            <span style={{ fontSize:16 }}>🔔</span>
            <span style={{ fontSize:13,fontWeight:600,color:'#fbbf24' }}>¡Hay novedades!</span>
            <button onClick={() => { openNotif(); setShowBanner(false); }} style={{
              background:'linear-gradient(135deg,#d97706,#fbbf24)',border:'none',
              borderRadius:8,color:'#0a0a0f',fontSize:12,fontWeight:700,
              padding:'5px 12px',cursor:'pointer',
            }}>Ver</button>
            <button onClick={() => setShowBanner(false)} style={{
              background:'none',border:'none',color:'#475569',fontSize:18,
              cursor:'pointer',padding:'0 2px',lineHeight:1,
            }}>×</button>
          </div>
        )}

        <NotificationsPanel />
        <UpdatePrompt />
        {showGuide && <OnboardingGuide onClose={() => setShowGuide(false)} />}
      </div>
    </>
  );
}
