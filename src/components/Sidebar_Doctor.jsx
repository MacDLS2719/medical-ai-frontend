import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  User,
  Calendar,
  Users,
  FileText,
  Bell,
  Video,
  Box,
  ShieldCheck,
  HelpCircle,
  Headphones,
  Menu,
  X
} from 'lucide-react';

export default function SidebarDoctor() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  // Estado omohendáva pe menú flotante hamburguesa celular-pe guarã
  const [isOpen, setIsOpen] = useState(false);

  // Oñemboty automatically pe menú ojeporu jave peteĩ enlace ruta pyahu
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (!user || user.role !== 'doctor') return null;

  return (
    <>
      {/* Botón Flotante Hamburguesa ojehecháva celular rupive añoite */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir menú de navegación"
        className="
          fixed bottom-6 right-6 z-50
          md:hidden
          p-3.5
          rounded-full
          bg-blue-600 text-white
          shadow-xl shadow-blue-500/30
          flex items-center justify-center
          transition-transform active:scale-95
          cursor-pointer
        "
      >
        {isOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
      </button>

      {/* Fondo oscuro (backdrop) ojehecháva ojeike vove pe menú mobile ári */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden transition-opacity"
        />
      )}

      {/* Componente Sidebar Principal - Padding superior ajustado para evitar que se corte en móviles */}
      <aside className={`
        fixed md:sticky top-0 left-0
        w-64
        glass-card
        border-r border-white/40
        shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        z-40
        bg-white/95 md:bg-white/70
        backdrop-blur-md
        flex
        flex-col
        justify-between
        transition-transform duration-300 ease-in-out
        h-full max-h-screen
        p-4 pt-16 md:pt-4
        overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          
          {/* =====================================================
              SECCIÓN: MI CUENTA
          ===================================================== */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 px-3">
              Mi cuenta
            </p>
            <ul className="space-y-1">
              
              {/* 1. Mi perfil */}
              <li>
                <NavLink
                  to="/doctor/profile"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 text-xs font-bold ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/80'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                    }`
                  }
                >
                  <User size={18} strokeWidth={2} />
                  <span>Mi perfil</span>
                </NavLink>
              </li>

              {/* 2. Mi agenda (Disponibilidad) */}
              <li>
                <NavLink
                  to="/doctor/availability"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 text-xs font-bold ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/80'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                    }`
                  }
                >
                  <Calendar size={18} strokeWidth={2} />
                  <span>Mi agenda</span>
                </NavLink>
              </li>

              {/* 3. Mis pacientes (Citas / Appointments) */}
              <li>
                <NavLink
                  to="/doctor/appointments"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 text-xs font-bold ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/80'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                    }`
                  }
                >
                  <Users size={18} strokeWidth={2} />
                  <span>Mis pacientes</span>
                </NavLink>
              </li>

              {/* 4. Mis análisis */}
              <li>
                <NavLink
                  to="/doctor/analyses"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 text-xs font-bold ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/80'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                    }`
                  }
                >
                  <FileText size={18} strokeWidth={2} />
                  <span>Mis análisis</span>
                </NavLink>
              </li>

              {/* 5. Mis alertas */}
              <li>
                <NavLink
                  to="/search"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 text-xs font-bold ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/80'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                    }`
                  }
                >
                  <Bell size={18} strokeWidth={2} />
                  <span>Mis alertas</span>
                </NavLink>
              </li>

              {/* 6. Videoconsultas (Buscador médico) */}
              <li>
                <NavLink
                  to="/medical-chat"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 text-xs font-bold ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/80'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                    }`
                  }
                >
                  <Video size={18} strokeWidth={2} />
                  <span>Videoconsultas</span>
                </NavLink>
              </li>

              {/* 7. Planes y precios */}
              <li>
                <NavLink
                  to="/plans"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 text-xs font-bold ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/80'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                    }`
                  }
                >
                  <Box size={18} strokeWidth={2} />
                  <span>Planes y precios</span>
                </NavLink>
              </li>

            </ul>
          </div>

          {/* Separador */}
          <hr className="border-slate-200/60 my-3" />

          {/* =====================================================
              SECCIÓN: CONFIGURACIÓN
          ===================================================== */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 px-3">
              Configuración
            </p>
            <ul className="space-y-1">
              
              {/* Notificaciones */}
              <li>
                <NavLink
                  to="/doctor/settings/notifications"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 text-xs font-bold ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/80'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                    }`
                  }
                >
                  <Bell size={18} strokeWidth={2} />
                  <span>Notificaciones</span>
                </NavLink>
              </li>

              {/* Privacidad y seguridad */}
              <li>
                <NavLink
                  to="/doctor/settings/privacy"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 text-xs font-bold ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/80'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                    }`
                  }
                >
                  <ShieldCheck size={18} strokeWidth={2} />
                  <span>Privacidad y seguridad</span>
                </NavLink>
              </li>

              {/* Ayuda y soporte */}
              <li>
                <NavLink
                  to="/support"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 text-xs font-bold ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/80'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                    }`
                  }
                >
                  <HelpCircle size={18} strokeWidth={2} />
                  <span>Ayuda y soporte</span>
                </NavLink>
              </li>

            </ul>
          </div>

        </div>

        {/* =====================================================
            TARJETA INFERIOR: ¿NECESITAS AYUDA?
        ===================================================== */}
        <div className="mt-6 pt-4 shrink-0 pb-12 md:pb-0">
          <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Headphones size={20} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">¿Necesitas ayuda?</h4>
                <p className="text-[10px] text-slate-500 leading-tight">Soporte 24/7 disponible.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.location.href = '/support'}
              className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer text-center"
            >
              Contactar soporte
            </button>
          </div>

          <div className="mt-4 text-center">
            <span className="text-[10px] font-serif italic text-slate-400 block tracking-wide">
              Juntos por una medicina más humana y eficiente.
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}