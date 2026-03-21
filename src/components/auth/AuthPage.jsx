import { useState } from 'react';
import { authService } from '@/services/auth';
import { inputStyle, cardStyle } from '@/utils/styles';

export function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email:'', password:'', name:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (mode === 'login') {
        await authService.signIn({ email: form.email, password: form.password });
      } else {
        await authService.signUp({ email: form.email, password: form.password, displayName: form.name });
        setError('Revisá tu email para confirmar la cuenta');
      }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh',background:'#0a0a12',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ width:'100%',maxWidth:380 }}>
        <div style={{ textAlign:'center',marginBottom:32 }}>
          <div style={{ fontSize:40,marginBottom:8 }}>💰</div>
          <h1 style={{ fontSize:24,fontWeight:800,color:'#e8e8f0' }}>FinTrack</h1>
          <p style={{ fontSize:13,color:'#5c5c72' }}>Control inteligente de gastos</p>
        </div>
        <div style={{ ...cardStyle, padding:24 }}>
          <h2 style={{ fontSize:16,fontWeight:700,color:'#e8e8f0',marginBottom:20 }}>
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div style={{ marginBottom:12 }}>
                <label style={{ display:'block',fontSize:11,fontWeight:600,color:'#6c6c84',marginBottom:5 }}>Nombre</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Tu nombre" required />
              </div>
            )}
            <div style={{ marginBottom:12 }}>
              <label style={{ display:'block',fontSize:11,fontWeight:600,color:'#6c6c84',marginBottom:5 }}>Email</label>
              <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="tu@email.com" required />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block',fontSize:11,fontWeight:600,color:'#6c6c84',marginBottom:5 }}>Contraseña</label>
              <input style={inputStyle} type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>
            {error && <div style={{ padding:'8px 12px',borderRadius:10,fontSize:12,marginBottom:12,background:'rgba(240,96,112,0.12)',color:'#f06070',border:'1px solid rgba(240,96,112,0.2)' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ width:'100%',padding:12,borderRadius:12,border:'none',background:'#7c6cf0',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',opacity:loading?0.6:1 }}>
              {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
          <div style={{ textAlign:'center',marginTop:16 }}>
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }} style={{ background:'none',border:'none',color:'#7c6cf0',fontSize:13,fontWeight:600,cursor:'pointer' }}>
              {mode === 'login' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
