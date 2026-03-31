import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from './stores/useStore';
import { useUiStore } from './stores/uiStore';
import { useAuth } from './hooks/auth/useAuth';
import { Sidebar, MobileNav, TopBar } from './components/layout/Layout';
import { AuthPage } from './components/auth/AuthPage';
import { Toast } from './components/ui/Shared';
import { DashPage } from './pages/DashPage';
import { AddPage } from './pages/AddPage';
import { ListPage } from './pages/ListPage';
import { ImportPage } from './pages/ImportPage';
import { GastosPage } from './pages/GastosPage';
import { DolarPage } from './pages/DolarPage';
import { ConfigPage } from './pages/ConfigPage';
import { AdminPage } from './pages/AdminPage';
import { MesDetailPage } from './pages/MesDetailPage';

const PAGE_ROUTES = {
  dash:   '/panel',
  add:    '/agregar',
  list:   '/movimientos',
  gastos: '/mes',
  imp:    '/importar',
  dolar:  '/dolar',
  cfg:    '/configuracion',
  admin:  '/admin',
};
const ROUTE_PAGES = Object.fromEntries(Object.entries(PAGE_ROUTES).map(([k, v]) => [v, k]));

export default function App() {
  const { session, authLoading, signOut } = useAuth();
  const { page, setPage, year, years, setYear, loadAll, profile } = useStore();
  const { syncing, toast, clearToast } = useUiStore();
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
  };

  useEffect(() => {
    if (session) loadAll();
  }, [session, year]);

  if (authLoading) {
    return (
      <div style={{ minHeight:'100vh',background:'#0a0a12',display:'flex',alignItems:'center',justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div className="ft-spinner" />
          <div style={{ fontSize:13,color:'#5c5c72',marginTop:12 }}>Cargando...</div>
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
      case 'admin': return <AdminPage />;
      default: return <DashPage />;
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ft-spinner { width:32px;height:32px;border:3px solid rgba(124,108,240,0.2);border-top-color:#7c6cf0;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto; }

        /* Mobile first */
        .ft-app { min-height:100vh; background:#0a0a12; font-family:'DM Sans',system-ui,sans-serif; }
        .ft-sidebar { display:none; }
        .ft-topbar { display:none; }
        .ft-mobile-nav { display:flex; }
        .ft-main { padding-bottom:72px; }

        /* Desktop: sidebar + centered content */
        @media (min-width: 768px) {
          .ft-app { display:flex; }
          .ft-sidebar { display:flex; flex-direction:column; width:220px; min-height:100vh; position:fixed; left:0; top:0; background:#08080f; border-right:1px solid rgba(255,255,255,0.05); z-index:50; }
          .ft-topbar { display:flex; }
          .ft-mobile-header { display:none !important; }
          .ft-mobile-nav { display:none !important; }
          .ft-main { margin-left:220px; flex:1; padding:0 24px 24px; }
          .ft-main .ft-page { max-width:1000px; margin:0 auto; }
        }

        @media (min-width: 1200px) {
          .ft-sidebar { width:240px; }
          .ft-main { margin-left:240px; }
        }
      `}</style>

      <div className="ft-app">
        <Sidebar active={page} onNav={handleNav} year={year} years={years} setYear={setYear} onSignOut={signOut} isAdmin={profile?.email === 'foschi246@gmail.com'} />

        <div className="ft-main">
          {/* Mobile header */}
          <TopBar year={year} years={years} setYear={setYear} syncing={syncing} onSignOut={signOut} />
          <div className="ft-page">
            {renderPage()}
          </div>
        </div>

        <MobileNav active={page} onNav={handleNav} isAdmin={profile?.email === 'foschi246@gmail.com'} />
        <Toast toast={toast} onClear={clearToast} />
      </div>
    </>
  );
}
