import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/workspaces');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-acid-green font-bold text-3xl tracking-wider">S1MPLO</span>
          <p className="text-gray-400 text-sm mt-2">Copiloto de performance com IA</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-off-black border border-dark-gray rounded-card p-8 space-y-5"
        >
          <h2 className="text-xl font-semibold text-white">Entrar na conta</h2>

          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="voce@agencia.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" loading={loading} size="lg">
            Entrar
          </Button>

          <p className="text-center text-sm text-gray-600">
            Não tem conta?{' '}
            <Link to="/register" className="text-acid-green hover:underline">
              Criar conta — 14 dias grátis
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
