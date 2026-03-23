import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function Register() {
  const [form, setForm] = useState({ email: '', name: '', password: '', country: 'BR' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.email, form.name, form.password, form.country);
      navigate('/workspaces');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-acid-green font-bold text-3xl tracking-wider">S1MPLO</span>
          <p className="text-gray-400 text-sm mt-2">14 dias grátis • Acesso Pro completo • Sem cartão</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-off-black border border-dark-gray rounded-card p-8 space-y-5"
        >
          <h2 className="text-xl font-semibold text-white">Criar conta</h2>

          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded px-3 py-2 text-sm text-danger">
              {Array.isArray(error) ? (error as string[]).join(', ') : error}
            </div>
          )}

          <Input
            label="Nome"
            placeholder="Seu nome ou agência"
            value={form.name}
            onChange={set('name')}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="voce@agencia.com"
            value={form.email}
            onChange={set('email')}
            required
          />

          <Input
            label="Senha"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={set('password')}
            minLength={8}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              País
            </label>
            <select
              value={form.country}
              onChange={set('country')}
              className="bg-dark-gray border border-dark-gray rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-acid-green transition-colors"
            >
              <option value="BR">🇧🇷 Brasil</option>
              <option value="AR">🇦🇷 Argentina</option>
              <option value="MX">🇲🇽 México</option>
              <option value="CO">🇨🇴 Colômbia</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>

          <Button type="submit" className="w-full" loading={loading} size="lg">
            Começar grátis — 14 dias
          </Button>

          <p className="text-center text-sm text-gray-600">
            Já tem conta?{' '}
            <Link to="/login" className="text-acid-green hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
