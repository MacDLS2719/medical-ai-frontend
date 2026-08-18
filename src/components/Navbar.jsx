import { useAuth } from '../context/AuthContext';
import { LogOut, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="glass-card sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/30">
          <Stethoscope size={24} />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-800">MedAI</span>
      </div>
      
      {user && (
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-slate-800">{user.name}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{user.role}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 hover:text-red-500 cursor-pointer"
            title="Cambiar de Rol"
          >
            <LogOut size={20} />
          </button>
        </div>
      )}
    </nav>
  );
}
