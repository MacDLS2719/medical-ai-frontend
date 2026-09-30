import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  MessageSquareText,
  CalendarCheck,
  Search,
  Menu,
  X
} from 'lucide-react';

export default function SidebarPaciente() {
  const { user } = useAuth();
  const { t } = useTranslation();
  // Estado para controlar si el menú está abierto en móvil
  const [isOpen, setIsOpen] = useState(false);

  if (!user || user.role !== 'patient') return null;

  // Clases base comunes para los enlaces de navegación
  const linkBaseClass = "group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-medium border";

  return (
    <>
      {/* Botón flotante derecho para dispositivos móviles */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed right-4 bottom-4 z-50 bg-blue-600 text-white p-3.5 rounded-full shadow-xl shadow-blue-500/40 hover:bg-blue-700 transition-all cursor-pointer flex items-center justify-center"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop oscuro para móvil cuando está abierto (hace clic fuera para cerrar) */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Barra Lateral / Sidebar */}
      <aside className={`
        w-64 glass-card border-r border-white/40 z-40 bg-white/90 md:bg-white/60
        flex flex-col transition-all duration-300 ease-in-out
        fixed md:static inset-y-0 left-0 
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        shadow-[4px_0_24px_rgba(0,0,0,0.05)] md:shadow-none
      `}>
        <div className="flex-1 py-6 px-4">
          {/* =====================================================
              TITULO MENU
          ===================================================== */}
          <div className="mb-6 px-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0">
              {t('sidebar.mainMenu', 'Menú Principal')}
            </p>
            {/* Botón de cerrar solo visible en móvil dentro del panel */}
            <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          {/* =====================================================
              OPCIONES (RUTAS ORIGINALES)
          ===================================================== */}
          <ul className="space-y-2">

            {/* BUSCAR MÉDICO (Azul en lugar de morado) */}
            <li>
              <NavLink
                to="/patient/search"
                onClick={() => setIsOpen(false)} // Cierra al navegar en móvil
                className={({ isActive }) =>
                  `${linkBaseClass} ${isActive
                    ? 'bg-blue-600 text-white shadow-md border-blue-600' // Activo: Fondo azul, texto blanco
                    : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600 border-transparent' // Inactivo: Hover azul claro
                  }`
                }
              >
                <div className="p-1.5 rounded-lg bg-transparent">
                  <Search size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                </div>
                <span>{t('sidebar.searchDoctor', 'Buscar Médico')}</span>
              </NavLink>
            </li>

            {/* PACIENTE: MIS CITAS (Mantiene azul, mejor contraste) */}
            <li>
              <NavLink
                to="/patient/appointments"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `${linkBaseClass} ${isActive
                    ? 'bg-blue-600 text-white shadow-md border-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600 border-transparent'
                  }`
                }
              >
                <div className="p-1.5 rounded-lg bg-transparent">
                  <CalendarCheck size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                </div>
                <span>{t('sidebar.myAppointments', 'Mis Citas')}</span>
              </NavLink>
            </li>

            {/* CHAT INTERNO (Azul en lugar de teal) */}
            <li>
              <NavLink
                to="/medical-chat"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `${linkBaseClass} ${isActive
                    ? 'bg-blue-600 text-white shadow-md border-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600 border-transparent'
                  }`
                }
              >
                <div className="p-1.5 rounded-lg bg-transparent">
                  <MessageSquareText size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                </div>
                <span>{t('sidebar.internalChat', 'Chat Médico')}</span>
              </NavLink>
            </li>

          </ul>
        </div>
      </aside>
    </>
  );
}