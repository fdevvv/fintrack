import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn({ email: form.email, password: form.password });
        toast.success('Bienvenido de vuelta');
      } else {
        await signUp({
          email: form.email,
          password: form.password,
          displayName: form.displayName,
        });
        toast.success('Cuenta creada. Revisá tu email para confirmar.');
      }
    } catch (err) {
      toast.error(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 mb-4">
            <TrendingUp size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FinTrack</h1>
          <p className="text-sm text-gray-500 mt-1">Control inteligente de gastos</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Nombre"
                type="text"
                value={form.displayName}
                onChange={update('displayName')}
                placeholder="Tu nombre"
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={update('password')}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              {mode === 'login'
                ? '¿No tenés cuenta? Registrate'
                : '¿Ya tenés cuenta? Iniciá sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
