import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  MessageSquareHeart,
  Headphones,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  Users,
} from 'lucide-react';

export default function SidebarVerificador() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);

  // Cierra el menú móvil al cambiar de ruta
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (!user || user.role !== 'verifier') return null;

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 text-xs font-bold ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/80'
        : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
    }`;

  return (
    <>
      {/* ── Botón hamburguesa flotante (sólo móvil) ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir menú de verificador"
        className="
          fixed bottom-6 right-6 z-50
          md:hidden
          p-3.5 rounded-full
          bg-indigo-600 text-white
          shadow-xl shadow-indigo-500/30
          flex items-center justify-center
          transition-transform active:scale-95
          cursor-pointer
        "
      >
        {isOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
      </button>

      {/* ── Backdrop (móvil) ── */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden transition-opacity"
        />
      )}

      {/* ── Sidebar principal ── */}
      <aside
        className={`
          fixed md:sticky top-0 left-0
          w-64
          border-r border-white/40
          shadow-[4px_0_24px_rgba(0,0,0,0.02)]
          z-40
          bg-white/95 md:bg-white/70
          backdrop-blur-md
          flex flex-col justify-between
          transition-transform duration-300 ease-in-out
          h-full max-h-screen
          p-4 pt-16 md:pt-4
          overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* ── Encabezado del verificador ── */}
        <div className="space-y-6">
          {/* Badge de rol */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-300/40 shrink-0">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900 leading-tight">Panel Verificador</p>
              <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">MIVOR · Oficial</p>
            </div>
          </div>

          {/* ── Sección principal ── */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 px-3">
              Panel principal
            </p>
            <ul className="space-y-1">

              {/* Dashboard resumen */}
              <li>
                <NavLink to="/verification/detail" className={navLinkClass}>
                  <LayoutDashboard size={18} strokeWidth={2} />
                  <span>Panel de control</span>
                </NavLink>
              </li>

              {/* Verificación de médicos */}
              <li>
                <NavLink to="/verification/detail" className={navLinkClass}>
                  <Users size={18} strokeWidth={2} />
                  <span>Verificación de médicos</span>
                </NavLink>
              </li>

            </ul>
          </div>

          {/* Separador */}
          <hr className="border-slate-200/60" />

          {/* ── Sección Soporte MIVOR ── */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 px-3">
              Soporte MIVOR
            </p>
            <ul className="space-y-1">

              {/* Conversaciones de soporte por usuario */}
              <li>
                <NavLink to="/verifier/support-conversations" className={navLinkClass}>
                  <MessageSquareHeart size={18} strokeWidth={2} />
                  <span>Conversaciones de soporte</span>
                </NavLink>
              </li>

            </ul>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="mt-6 pt-4 shrink-0 pb-12 md:pb-0 space-y-3">

          {/* Información del usuario */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-[11px] shrink-0">
                VF
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || 'Verificador Oficial'}
                </p>
                <p className="text-[10px] text-indigo-600 font-semibold">
                  Verificador · MIVOR
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-1.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>

          {/* Soporte */}
          <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Headphones size={20} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">¿Necesitas ayuda?</h4>
                <p className="text-[10px] text-slate-500 leading-tight">Soporte 24/7 disponible.</p>
              </div>
            </div>
            <a
              href="mailto:soporte@mivor.com"
              className="block w-full py-2 text-center bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              soporte@mivor.com
            </a>
          </div>

          <div className="mt-2 text-center">
            <span className="text-[10px] font-serif italic text-slate-400 block tracking-wide">
              Juntos por una medicina más humana y eficiente.
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
