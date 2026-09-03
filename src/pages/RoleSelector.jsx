import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Activity, 
  UserCheck, 
  UserPlus, 
  X, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';

export default function RoleSelector() {
  const { user, loginAsPatient, loginAsDoctor, loginAsVerifier } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [showDoctorModal, setShowDoctorModal] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'patient') {
        navigate('/patient/notifications');
      } else if (user.role === 'verifier') {
        navigate('/verification/detail');
      } else {
        navigate('/doctor/profile');
      }
    }
  }, [user, navigate]);

  const handleSelectDemoDoctor = () => {
    loginAsDoctor(); // Logs in with hardcoded Dr. Jane Smith
  };

  const handleCreateNewDoctor = () => {
    setShowDoctorModal(false);
    navigate('/doctor/create');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700 relative">
      <div className="max-w-2xl w-full text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          {t('roleSelector.welcome')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">MedAI</span>
        </h1>
        <p className="text-lg text-slate-600">{t('roleSelector.selectRole')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        
        {/* Patient Card */}
        <button
          type="button"
          onClick={loginAsPatient}
          className="group glass-card rounded-3xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:scale-105 hover:shadow-blue-500/20 cursor-pointer border-2 border-transparent hover:border-blue-400/30"
        >
          <div className="bg-blue-100 text-blue-600 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
            <User size={48} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">{t('roleSelector.iAmPatient')}</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {t('roleSelector.patientDescription')}
          </p>
        </button>

        {/* Doctor Card */}
        <button
          type="button"
          onClick={() => setShowDoctorModal(true)}
          className="group glass-card rounded-3xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:scale-105 hover:shadow-purple-500/20 cursor-pointer border-2 border-transparent hover:border-purple-400/30"
        >
          <div className="bg-purple-100 text-purple-600 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
            <Activity size={48} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">{t('roleSelector.iAmDoctor')}</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {t('roleSelector.doctorDescription')}
          </p>
        </button>

        {/* Verifier Card */}
        <button
          type="button"
          onClick={loginAsVerifier}
          className="group glass-card rounded-3xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/20 cursor-pointer border-2 border-transparent hover:border-indigo-400/30"
        >
          <div className="bg-indigo-100 text-indigo-600 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
            <ShieldCheck size={48} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Verificador</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Ingresa como verificador oficial para evaluar y validar la documentación médica.
          </p>
        </button>

      </div>

      {/* Doctor Access Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button
              onClick={() => setShowDoctorModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title={t('roleSelector.close', 'Cerrar')}
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 mb-3">
                <Activity size={26} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {t('roleSelector.doctorModalTitle', 'Acceso Médico')}
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                {t('roleSelector.doctorModalSubtitle', '¿Cómo deseas ingresar a la plataforma médica?')}
              </p>
            </div>

            {/* Modal Options */}
            <div className="space-y-4">
              
              {/* Option 1: Demo / Burned Doctor */}
              <button
                type="button"
                onClick={handleSelectDemoDoctor}
                className="w-full text-left p-5 rounded-2xl border-2 border-slate-100 hover:border-purple-500/40 bg-slate-50/50 hover:bg-purple-50/30 transition-all duration-200 group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-purple-100 text-purple-600 group-hover:scale-105 transition-transform">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-800">
                        {t('roleSelector.demoDoctor', 'Médico Demo (Predeterminado)')}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                        {t('roleSelector.demoBadge', 'Acceso Rápido')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {t('roleSelector.demoDoctorDesc', 'Ingresa inmediatamente con el usuario de prueba (Dr. Jane Smith).')}
                    </p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </button>

              {/* Option 2: Create New Doctor */}
              <button
                type="button"
                onClick={handleCreateNewDoctor}
                className="w-full text-left p-5 rounded-2xl border-2 border-slate-100 hover:border-indigo-500/40 bg-slate-50/50 hover:bg-indigo-50/30 transition-all duration-200 group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600 group-hover:scale-105 transition-transform">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-800">
                        {t('roleSelector.newDoctor', 'Crear Nuevo Médico')}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                        {t('roleSelector.newBadge', 'Nuevo Registro')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {t('roleSelector.newDoctorDesc', 'Registra un nuevo médico con su especialidad, licencia y datos de consulta.')}
                    </p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </button>

            </div>

            {/* Cancel footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowDoctorModal(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                {t('roleSelector.close', 'Cerrar')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

