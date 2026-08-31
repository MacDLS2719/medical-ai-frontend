import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Activity, 
  UserPlus, 
  ShieldCheck, 
  X, 
  ArrowRight, 
  Stethoscope 
} from 'lucide-react';

function Home() {
  const { loginAsPatient, loginAsDoctor } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [showDoctorModal, setShowDoctorModal] = useState(false);

  const handlePatientClick = () => {
    loginAsPatient();
    navigate('/patient/notifications');
  };

  const handleSelectDemoDoctor = () => {
    loginAsDoctor();
    navigate('/search');
  };

  const handleCreateNewDoctor = () => {
    setShowDoctorModal(false);
    navigate('/doctor/create');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative flex flex-col justify-between">

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/30">
              <Stethoscope size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Medical AI
            </h1>
          </div>

          <nav className="flex gap-6">
            <button
              onClick={handlePatientClick}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer text-sm font-medium"
            >
              {t('roleSelector.iAmPatient', 'Paciente')}
            </button>

            <button
              onClick={() => setShowDoctorModal(true)}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer text-sm font-medium"
            >
              {t('roleSelector.iAmDoctor', 'Médico')}
            </button>
          </nav>

        </div>
      </header>

      {/* Main Hero */}
      <main className="mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center my-auto">

        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-2 text-sm text-blue-400 font-medium">
          <Activity size={16} />
          Inteligencia Artificial Médica
        </span>

        <h2 className="max-w-3xl text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-slate-50">
          Información médica basada en evidencia científica
        </h2>

        <p className="mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
          Consulta información científica rigurosa y actualizada proveniente de PubMed,
          Cochrane y ClinicalTrials.gov.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">

          {/* Patient Button */}
          <button
            type="button"
            onClick={handlePatientClick}
            className="rounded-xl bg-blue-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <User size={18} />
            {t('roleSelector.iAmPatient', 'Soy paciente')}
          </button>

          {/* Doctor Button */}
          <button
            type="button"
            onClick={() => setShowDoctorModal(true)}
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-8 py-3.5 font-semibold text-white hover:bg-slate-800 hover:border-slate-600 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Activity size={18} />
            {t('roleSelector.iAmDoctor', 'Soy médico')}
          </button>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        Medical AI &copy; {new Date().getFullYear()} — Plataforma de Inteligencia Artificial Médica
      </footer>

      {/* Doctor Access Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-800 relative animate-in zoom-in-95 duration-200 text-left">
            
            {/* Close Button */}
            <button
              onClick={() => setShowDoctorModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={t('roleSelector.close', 'Cerrar')}
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-3">
                <Activity size={26} />
              </div>
              <h3 className="text-2xl font-bold text-white">
                {t('roleSelector.doctorModalTitle', 'Acceso Médico')}
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                {t('roleSelector.doctorModalSubtitle', '¿Cómo deseas ingresar a la plataforma médica?')}
              </p>
            </div>

            {/* Modal Options */}
            <div className="space-y-4">
              
              {/* Option 1: Demo / Burned Doctor */}
              <button
                type="button"
                onClick={handleSelectDemoDoctor}
                className="w-full text-left p-5 rounded-2xl border border-slate-800 hover:border-purple-500/50 bg-slate-800/40 hover:bg-purple-950/20 transition-all duration-200 group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">
                        {t('roleSelector.demoDoctor', 'Médico Demo (Predeterminado)')}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {t('roleSelector.demoBadge', 'Acceso Rápido')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {t('roleSelector.demoDoctorDesc', 'Ingresa inmediatamente con el usuario de prueba (Dr. Jane Smith).')}
                    </p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </button>

              {/* Option 2: Create New Doctor */}
              <button
                type="button"
                onClick={handleCreateNewDoctor}
                className="w-full text-left p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/50 bg-slate-800/40 hover:bg-indigo-950/20 transition-all duration-200 group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">
                        {t('roleSelector.newDoctor', 'Crear Nuevo Médico')}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {t('roleSelector.newBadge', 'Nuevo Registro')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {t('roleSelector.newDoctorDesc', 'Registra un nuevo médico con su especialidad, licencia y datos de consulta.')}
                    </p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </button>

            </div>

            {/* Cancel footer */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => setShowDoctorModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
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

export default Home;