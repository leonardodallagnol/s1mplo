import { ReactNode } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-dark-gray bg-void-black">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {actions}
        <Link to="/alerts" className="relative text-gray-400 hover:text-white transition-colors">
          <Bell size={20} />
        </Link>
      </div>
    </header>
  );
}
