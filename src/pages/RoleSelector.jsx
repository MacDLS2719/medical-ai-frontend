import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Activity } from 'lucide-react';

export default function RoleSelector() {
  const { user, loginAsPatient, loginAsDoctor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'patient') {
        navigate('/patient/notifications');
      } else {
        navigate('/search');
      }
    }
  }, [user, navigate]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
      <div className="max-w-2xl w-full text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">MedAI</span>
        </h1>
        <p className="text-lg text-slate-600">Por favor selecciona tu rol para acceder a la plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <button
          onClick={loginAsPatient}
          className="group glass-card rounded-3xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:scale-105 hover:shadow-blue-500/20 cursor-pointer border-2 border-transparent hover:border-blue-400/30"
        >
          <div className="bg-blue-100 text-blue-600 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
            <User size={48} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Soy Paciente</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Busca información médica filtrada automáticamente según tus patologías registradas.
          </p>
        </button>

        <button
          onClick={loginAsDoctor}
          className="group glass-card rounded-3xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:scale-105 hover:shadow-purple-500/20 cursor-pointer border-2 border-transparent hover:border-purple-400/30"
        >
          <div className="bg-purple-100 text-purple-600 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
            <Activity size={48} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Soy Médico</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Realiza búsquedas libres y sin restricciones en PubMed, Cochrane y ClinicalTrials.
          </p>
        </button>
      </div>
    </div>
  );
}
