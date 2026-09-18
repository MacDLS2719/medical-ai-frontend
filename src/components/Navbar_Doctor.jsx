import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  Bell, 
  ShieldAlert, 
  Crown, 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Search, 
  Globe, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import mivorIconImg from '../assets/imgs/mivor-icon.webp'; 

export default function NavbarDoctor() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determinar el estado de suscripción
  const isFree = !user?.subscription || user?.subscription?.slug === 'free-plan' || user?.subscription?.price === 0;

  useEffect(() => {
    if (user) {
      const fetchUnread = async () => {
        try {
          const url = import.meta.env.VITE_API_URL + `/notifications/unread/count?user_id=${user.id}`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setUnreadCount(data.data.count);
            }
          }
        } catch (error) {
          console.error("Failed to fetch notifications count", error);
        }
      };
      fetchUnread();
    }
  }, [user]);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/doctor/dashboard', label: 'Inicio', icon: Home },
    { to: '/doctor/patients', label: 'Mis pacientes', icon: Users },
    { to: '/doctor/agenda', label: 'Mi agenda', icon: Calendar },
    { to: '/doctor/analyses', label: 'Mis análisis', icon: FileText },
    { to: '/doctors/search', label: 'Encuentra un médico', icon: Search },
  ];

  return (
    <>
      <nav className="glass-card sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-100 bg-white/90 backdrop-blur-md shadow-xs">
        
        {/* 1. Logo, Marca y Botón Hamburguesa móvil */}
        <div className="flex items-center gap-3">
          {user && (
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}

          <Link to="/doctor/dashboard" className="flex items-center gap-2.5 group cursor-pointer">
            <img 
              src={mivorIconImg} 
              alt="MIVOR Icon" 
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-sm" 
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl sm:text-3xl text-[#0B1E48] tracking-tight leading-none">
                MIVOR<span className="text-cyan-500">.ai</span>
              </span>
              <span className="hidden sm:block text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                Better Health. Brighter Lives.
              </span>
            </div>
          </Link>
        </div>
        
        {/* 2. Enlaces de Navegación Central (Escritorio grande) */}
        {user && (
          <div className="hidden xl:flex items-center gap-1 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-200/65">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive(link.to) 
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                      : 'text-slate-600 hover:text-blue-600 hover:bg-white'
                  }`}
                >
                  <Icon size={16} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* 3. Acciones Derecha (Suscripción, Idioma, Notificaciones y Perfil) */}
        {user && (
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Badge de Suscripción */}
            {isFree ? (
              <Link to="/plans" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors">
                <ShieldAlert size={14} className="text-amber-500" />
                <span>Plan Gratuito</span>
              </Link>
            ) : (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-semibold text-blue-700">
                <Crown size={14} className="text-yellow-500" />
                <span>PRO</span>
              </div>
            )}

            {/* Selector de Idioma */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold bg-slate-50 cursor-pointer">
              <Globe size={15} className="text-slate-500" />
              <span>{i18n.language?.toUpperCase() || 'ES'}</span>
              <ChevronDown size={13} className="text-slate-400" />
            </div>

            {/* Notificaciones */}
            <div className="relative">
              <Link to="/notifications" className="relative flex items-center justify-center p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer text-slate-600" aria-label="Notificaciones">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </Link>
            </div>

            {/* Perfil del Usuario */}
            <Link to="/doctor/profile" className="flex items-center gap-2 bg-blue-50/50 hover:bg-blue-50 pl-1.5 pr-2.5 py-1 rounded-2xl transition-colors cursor-pointer border border-blue-100/60">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white shadow-xs shrink-0">
                <img 
                  src={user.avatar || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop"} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">{user.name}</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">{user.role || 'Médico'}</span>
              </div>
              <ChevronDown size={13} className="text-slate-400 ml-0.5 hidden sm:block" />
            </Link>
            
            {/* Botón Salir */}
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-full transition-colors text-slate-400 hover:text-red-500 cursor-pointer"
              title={t('navbar.changeRole', 'Cerrar sesión')}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </nav>

      {/* Menú Desplegable Móvil */}
      {user && mobileMenuOpen && (
        <div className="xl:hidden absolute top-[65px] left-0 w-full bg-white border-b border-slate-200 shadow-xl z-40 p-4 space-y-2 animate-fadeIn">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-1">Navegación principal</div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive(link.to)
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
          
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between px-3">
            <span className="text-xs text-slate-500 font-semibold">Estado de cuenta:</span>
            {isFree ? (
              <Link to="/plans" className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                Plan Gratuito (Mejorar)
              </Link>
            ) : (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                Suscripción PRO
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}