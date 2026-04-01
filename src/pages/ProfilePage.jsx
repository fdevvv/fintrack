import { useState, useRef } from 'react';
import { useStore } from '@/stores/useStore';
import { useAuth } from '@/hooks/auth/useAuth';
import { useUiStore } from '@/stores/uiStore';
import { profileService } from '@/services/profile.service';
import { supabase } from '@/services/supabase';
import { Mn } from '@/utils/money';
import { ST, Inp, Btn } from '@/components/ui/Shared';
import { inputStyle } from '@/utils/styles';

export function ProfilePage() {
  const { profile, updateProfile, transactions, categories } = useStore();
  const { session } = useAuth();
  const { showToast } = useUiStore();

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileRef = useRef(null);

  const handleAvatar = async (file) => {
    if (!file) return;
    setAvatarLoading(true);
    try {
      const url = await profileService.uploadAvatar(file);
      await updateProfile({ avatar_url: url + '?t=' + Date.now() });
      showToast('✓ Foto actualizada');
    } catch { showToast('Error subiendo foto', true); }
    finally { setAvatarLoading(false); }
  };

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await updateProfile({ display_name: trimmed });
      showToast('✓ Nombre actualizado');
      setEditingName(false);
    } catch { showToast('Error', true); }
  };

  // Stats
  const memberSince = session?.user?.created_at
    ? new Date(session.user.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const yearExpenses = transactions.filter(t => t.type === 'expense');
  const totalGastos = yearExpenses.reduce((s, t) => s + (t.amount_cents || 0), 0);
  const ownCategories = categories.filter(c => !c.is_default).length;

  const stats = [
    { label: 'Miembro desde', value: memberSince, color: '#7c6cf0' },
    { label: 'Gastos este año', value: Mn.fmt(totalGastos), color: '#f06070' },
    { label: 'Movimientos', value: yearExpenses.length, color: '#2dd4a8' },
    { label: 'Rubros creados', value: ownCategories, color: '#f0a848' },
  ];

  const initials = (profile?.display_name || profile?.email || '?')[0].toUpperCase();

  return (
    <div style={{ padding: '0 16px', maxWidth: 600, margin: '0 auto' }}>
      <ST color="#7c6cf0">Mi Perfil</ST>

      {/* Avatar + nombre + email */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { if (e.target.files?.[0]) handleAvatar(e.target.files[0]); }} />

        <div onClick={() => !avatarLoading && fileRef.current?.click()} style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(124,108,240,0.15)', border: '3px solid rgba(124,108,240,0.3)',
          overflow: 'hidden', cursor: avatarLoading ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', opacity: avatarLoading ? 0.6 : 1, flexShrink: 0,
        }}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 42, color: '#a8a0f8' }}>{initials}</span>
          }
          <div style={{
            position: 'absolute', bottom: 4, right: 4,
            width: 26, height: 26, borderRadius: '50%', background: '#7c6cf0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: '#fff', border: '2px solid #0a0a12',
          }}>
            {avatarLoading ? '⟳' : '📷'}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          {editingName ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                autoFocus
                style={{ ...inputStyle, padding: '6px 10px', fontSize: 16, textAlign: 'center' }} />
              <button onClick={saveName} style={{ background: '#2dd4a8', border: 'none', color: '#0a0a12', fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>✓</button>
              <button onClick={() => setEditingName(false)} style={{ background: 'none', border: 'none', color: '#5c5c72', fontSize: 14, cursor: 'pointer' }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#e8e8f0' }}>{profile?.display_name || 'Sin nombre'}</span>
              <button onClick={() => { setName(profile?.display_name || ''); setEditingName(true); }}
                style={{ background: 'none', border: 'none', color: '#7c6cf0', fontSize: 13, cursor: 'pointer', padding: 2, opacity: 0.7 }}>✏️</button>
            </div>
          )}
          <div style={{ fontSize: 12, color: '#5c5c72', marginTop: 4 }}>
            {profile?.email || session?.user?.email}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#5c5c72', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Cambiar contraseña */}
      <ST color="#f06070">Seguridad</ST>
      <p style={{ fontSize: 11, color: '#5c5c72', marginBottom: 14, lineHeight: 1.5 }}>
        Cambiá tu contraseña de acceso a la app.
      </p>
      <Inp label="Nueva contraseña" value={newPass} onChange={setNewPass} placeholder="Mínimo 6 caracteres" type="password" />
      <Inp label="Confirmar contraseña" value={confirmPass} onChange={setConfirmPass} placeholder="Repetí la contraseña" type="password" />
      <Btn color="#f06070" disabled={passLoading} onClick={async () => {
        if (!newPass || newPass.length < 6) { showToast('Mínimo 6 caracteres', true); return; }
        if (newPass !== confirmPass) { showToast('Las contraseñas no coinciden', true); return; }
        setPassLoading(true);
        try {
          const { error } = await supabase.auth.updateUser({ password: newPass });
          if (error) throw error;
          showToast('✓ Contraseña actualizada');
          setNewPass(''); setConfirmPass('');
        } catch (e) { showToast(e.message || 'Error', true); }
        finally { setPassLoading(false); }
      }}>
        {passLoading ? 'Guardando...' : 'Cambiar contraseña'}
      </Btn>

      <div style={{ height: 80 }} />
    </div>
  );
}
