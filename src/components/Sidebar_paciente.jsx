import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  MessageSquareText,
  CalendarCheck,
} from 'lucide-react';

export default function SidebarPaciente() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user || user.role !== 'patient') return null;

  return (
    <aside className="
      w-64
      glass-card
      border-r
      border-t-0
      border-b-0
      border-l-0
      border-white/40
      shadow-[4px_0_24px_rgba(0,0,0,0.02)]
      z-40
      bg-white/60
      flex
      flex-col
      transition-all
      duration-300
      relative
    ">
      <div className="flex-1 py-6 px-4">
        {/* =====================================================
            TITULO MENU
        ===================================================== */}
        <div className="mb-6 px-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            {t('sidebar.mainMenu')}
          </p>
        </div>

        {/* =====================================================
            OPCIONES
        ===================================================== */}
        <ul className="space-y-2">

          {/* ===================================================
              PACIENTE: MIS CITAS
          =================================================== */}
          <li>
            <NavLink
              to="/patient/appointments"
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-medium ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200'
                    : 'text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm border border-transparent'
                }`
              }
            >
              <div className="p-1.5 rounded-lg bg-transparent">
                <CalendarCheck size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
              </div>
              <span>{t('sidebar.myAppointments')}</span>
            </NavLink>
          </li>

          {/* ===================================================
              CHAT INTERNO
          =================================================== */}
          <li>
            <NavLink
              to="/medical-chat"
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-medium ${
                  isActive
                    ? 'bg-teal-100 text-teal-700 shadow-sm border border-teal-200'
                    : 'text-slate-600 hover:bg-white hover:text-teal-600 hover:shadow-sm border border-transparent'
                }`
              }
            >
              <div className="p-1.5 rounded-lg bg-transparent">
                <MessageSquareText size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
              </div>
              <span>{t('sidebar.internalChat')}</span>
            </NavLink>
          </li>

        </ul>
      </div>
    </aside>
  );
}