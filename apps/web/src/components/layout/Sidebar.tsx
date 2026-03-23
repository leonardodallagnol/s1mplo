import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Plug,
  Bell,
  Settings,
  LogOut,
  Bot,
  ChevronDown,
  Users,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../hooks/useAuth';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/copilot', icon: Bot, label: 'Copiloto IA' },
  { to: '/connections', icon: Plug, label: 'Conexões' },
  { to: '/alerts', icon: Bell, label: 'Alertas' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-60 h-screen flex flex-col bg-void-black border-r border-dark-gray">
      {/* Logo */}
      <div className="p-6 border-b border-dark-gray">
        <span className="text-acid-green font-bold text-xl tracking-wider">S1MPLO</span>
      </div>

      {/* Workspace selector */}
      <NavLink
        to="/workspaces"
        className="flex items-center gap-2 px-4 py-3 mx-3 mt-3 rounded bg-dark-gray/50 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <Users size={14} />
        <span className="flex-1 truncate">Gerenciar clientes</span>
        <ChevronDown size={14} />
      </NavLink>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors',
                isActive
                  ? 'text-acid-green bg-acid-green/10 border-l-2 border-acid-green'
                  : 'text-gray-400 hover:text-white hover:bg-dark-gray/50',
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-dark-gray">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded bg-acid-green/20 flex items-center justify-center text-acid-green text-xs font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-600 truncate">{user?.subscription?.plan}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-600 hover:text-danger transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
