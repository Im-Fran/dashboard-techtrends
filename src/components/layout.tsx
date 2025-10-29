import {Outlet, Link, useLocation} from "react-router";
import { Home, BarChart3, Table } from "lucide-react";

export const Layout = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Inicio', icon: Home },
    { path: '/tabla', label: 'Tabla', icon: Table },
    { path: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold">TechTrends Dashboard</h1>
          <p className="text-blue-100 text-sm mt-1">Análisis de ventas</p>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`inline-flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  isActive(path)
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-300 text-center py-6 mt-12 border-t border-gray-800">
        <p>&copy; {new Date().getFullYear()} TechTrends Dashboard. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
