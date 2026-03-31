import { useUiStore } from '@/stores/uiStore';
import { UPDATES } from '@/data/updates';

export function NotificationBell() {
  const { notifHasNew, openNotif } = useUiStore();

  return (
    <button
      onClick={openNotif}
      title="Novedades"
      style={{
        position: 'relative', background: 'none', border: 'none',
        cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>🔔</span>
      {notifHasNew && (
        <span style={{
          position: 'absolute', top: 1, right: 1,
          width: 9, height: 9, borderRadius: '50%',
          background: '#f06070', border: '2px solid #08080f',
        }} />
      )}
    </button>
  );
}

export function NotificationsPanel() {
  const { notifOpen, closeNotif } = useUiStore();
  if (!notifOpen) return null;

  return (
    <div
      style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'flex-start',justifyContent:'center',zIndex:10000,padding:'20px 16px',overflowY:'auto' }}
      onClick={closeNotif}
    >
      <div
        style={{ background:'#14141e',borderRadius:16,padding:20,maxWidth:480,width:'100%',border:'1px solid rgba(255,255,255,0.08)',marginTop:40 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ fontSize:20 }}>🔔</span>
            <span style={{ fontSize:16,fontWeight:800,color:'#e8e8f0' }}>Novedades</span>
          </div>
          <button onClick={closeNotif} style={{ background:'none',border:'none',color:'#5c5c72',fontSize:20,cursor:'pointer',lineHeight:1 }}>✕</button>
        </div>

        {UPDATES.length === 0 ? (
          <div style={{ textAlign:'center',padding:'30px 0',color:'#5c5c72',fontSize:13 }}>Sin novedades por ahora.</div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {UPDATES.map((u, idx) => (
              <div key={u.id} style={{ borderRadius:12,border:'1px solid rgba(255,255,255,0.06)',padding:14,background:'rgba(255,255,255,0.02)' }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
                  <span style={{ fontSize:11,color:'#5c5c72' }}>{u.date}</span>
                  {idx === 0 && (
                    <span style={{ fontSize:9,fontWeight:700,color:'#f0a848',background:'rgba(240,168,72,0.12)',padding:'2px 7px',borderRadius:20,letterSpacing:'0.5px' }}>NUEVO</span>
                  )}
                </div>
                <div style={{ fontSize:13,fontWeight:700,color:'#e8e8f0',marginBottom:8 }}>{u.title}</div>
                <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                  {u.items.map((item, i) => (
                    <div key={i} style={{ display:'flex',gap:8,fontSize:12,color:'#a0a0b8',lineHeight:1.5 }}>
                      <span style={{ color:'#f0a848',flexShrink:0,marginTop:1 }}>·</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
