import { Navigate, RouteObject } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Workspaces from './pages/Workspaces';
import WorkspaceSetup from './pages/WorkspaceSetup';
import Dashboard from './pages/Dashboard';
import Copilot from './pages/Copilot';
import Connections from './pages/Connections';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Billing from './pages/Billing';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('accessToken');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export const routes: RouteObject[] = [
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    path: '/workspaces',
    element: <PrivateRoute><Workspaces /></PrivateRoute>,
  },
  {
    path: '/workspaces/:id/setup',
    element: <PrivateRoute><WorkspaceSetup /></PrivateRoute>,
  },
  {
    path: '/dashboard',
    element: <PrivateRoute><Dashboard /></PrivateRoute>,
  },
  {
    path: '/copilot',
    element: <PrivateRoute><Copilot /></PrivateRoute>,
  },
  {
    path: '/connections',
    element: <PrivateRoute><Connections /></PrivateRoute>,
  },
  {
    path: '/alerts',
    element: <PrivateRoute><Alerts /></PrivateRoute>,
  },
  {
    path: '/settings',
    element: <PrivateRoute><Settings /></PrivateRoute>,
  },
  {
    path: '/billing',
    element: <PrivateRoute><Billing /></PrivateRoute>,
  },
];
