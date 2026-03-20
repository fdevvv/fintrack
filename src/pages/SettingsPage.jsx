import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input, Select, MoneyInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fromCents, toCents } from '@/utils/money';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const { profile, updateProfile } = useAuthStore();
  const [form, setForm] = useState({
    display_name: profile?.display_name || '',
    preferred_currency: profile?.preferred_currency || 'ARS',
    monthly_income: profile?.monthly_income_cents
      ? String((profile.monthly_income_cents / 100).toFixed(2))
      : '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        display_name: form.display_name,
        preferred_currency: form.preferred_currency,
        monthly_income_cents: form.monthly_income ? toCents(form.monthly_income) : 0,
      });
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">Perfil</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Nombre"
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
            />
            <Select
              label="Moneda principal"
              value={form.preferred_currency}
              onChange={(e) => setForm((f) => ({ ...f, preferred_currency: e.target.value }))}
            >
              <option value="ARS">ARS (Peso Argentino)</option>
              <option value="USD">USD (Dólar)</option>
            </Select>
            <MoneyInput
              label="Ingreso mensual (opcional, para cálculos de balance)"
              currency={form.preferred_currency}
              value={form.monthly_income}
              onChange={(v) => setForm((f) => ({ ...f, monthly_income: v }))}
            />
            <Button type="submit" loading={saving}>
              Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">Cuenta</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Email: <span className="font-medium text-gray-700">{profile?.email}</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Para cambiar tu contraseña, usá la opción de recuperar contraseña en la pantalla de login.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
