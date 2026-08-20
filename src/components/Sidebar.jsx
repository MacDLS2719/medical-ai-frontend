import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, MessageSquareText } from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <aside className="w-64 glass-card border-r border-t-0 border-b-0 border-l-0 border-white/40 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 bg-white/60 flex flex-col transition-all duration-300 relative">
      <div className="flex-1 py-6 px-4">
        <div className="mb-6 px-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Menú Principal</p>
        </div>
        <ul className="space-y-2">
          {user.role === 'patient' && (
            <li>
              <NavLink
                to="/patient/notifications"
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-medium ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200'
                      : 'text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm border border-transparent'
                  }`
                }
              >
                <div className={`p-1.5 rounded-lg transition-colors ${
                    /* We can simplify logic inside since isActive is handled by string interpolation above, 
                       but React Router NavLink className can be a function. 
                       Since we can't easily pass isActive to inner children, we can use group-hover for the inactive state */
                    'bg-transparent'
                  }`}>
                  <Bell size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                </div>
                <span>Notificaciones</span>
              </NavLink>
            </li>
          )}

          {user.role === 'patient' && (
            <li>
              <NavLink
                to="/chat"
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-medium ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700 shadow-sm border border-indigo-200'
                      : 'text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm border border-transparent'
                  }`
                }
              >
                <div className="p-1.5 rounded-lg bg-transparent">
                  <MessageSquareText size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                </div>
                <span>Asistente IA</span>
              </NavLink>
            </li>
          )}

          {user.role === 'doctor' && (
            <li>
              <NavLink
                to="/search"
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-medium ${
                    isActive
                      ? 'bg-purple-100 text-purple-700 shadow-sm border border-purple-200'
                      : 'text-slate-600 hover:bg-white hover:text-purple-600 hover:shadow-sm border border-transparent'
                  }`
                }
              >
                <div className="p-1.5 rounded-lg bg-transparent">
                  <Search size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                </div>
                <span>Buscador</span>
              </NavLink>
            </li>
          )}

          {user.role === 'doctor' && (
            <li>
              <NavLink
                to="/chat"
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-medium ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700 shadow-sm border border-indigo-200'
                      : 'text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm border border-transparent'
                  }`
                }
              >
                <div className="p-1.5 rounded-lg bg-transparent">
                  <MessageSquareText size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                </div>
                <span>Asistente IA</span>
              </NavLink>
            </li>
          )}
        </ul>
      </div>
    </aside>
  );
}
