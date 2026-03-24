import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { CopilotPanel } from '../ai/CopilotPanel';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-void-black">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <CopilotPanel />
    </div>
  );
}
