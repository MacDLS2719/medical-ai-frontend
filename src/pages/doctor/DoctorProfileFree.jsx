import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Shield, 
  Camera, 
  Edit3, 
  Crown, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  Activity, 
  ArrowUpRight,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Key,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Stethoscope,
  Hash,
  Save
} from 'lucide-react';

export default function DoctorProfileFree() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('datos');

  // -------------------------------------------------------
  // ESTADO: perfil cargado desde backend
  // -------------------------------------------------------
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // -------------------------------------------------------
  // ESTADO: cambio de contraseña
  // -------------------------------------------------------
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState(null);

  // -------------------------------------------------------
  // FETCH PERFIL REAL
  // -------------------------------------------------------
  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const url = `${import.meta.env.VITE_API_URL}/doctor-profile?user_id=${user.id}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('No se pudo cargar el perfil');
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error(err);
      setLoadError('No se pudo cargar tu información. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // CAMBIO DE CONTRASEÑA
  // -------------------------------------------------------
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMessage(null);

    if (pwForm.next !== pwForm.confirm) {
      setPwMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    if (pwForm.next.length < 8) {
      setPwMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    setPwSaving(true);
    try {
      const url = `${import.meta.env.VITE_API_URL}/profile/change-password`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          current_password: pwForm.current,
          new_password: pwForm.next,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al cambiar la contraseña.');
      }
      setPwMessage({ type: 'success', text: 'Contraseña cambiada correctamente.' });
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwMessage({ type: 'error', text: err.message });
    } finally {
      setPwSaving(false);
    }
  };

  // -------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------
  const displayName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : (user?.name || 'Doctor');

  const displayField = (value, fallback = '—') =>
    value && String(value).trim() ? String(value).trim() : fallback;

  // -------------------------------------------------------
  // LOADING / ERROR
  // -------------------------------------------------------
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500">
        <Loader2 size={28} className="animate-spin mr-3" />
        <span className="text-sm font-medium">Cargando tu perfil…</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full p-4 md:p-6 bg-slate-50/50 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Cabecera ─────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mi perfil</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Consulta tu información. Para editar tu perfil completo, mejora tu plan.
          </p>
        </div>

        {/* ── Error de carga ───────────────────────────── */}
        {loadError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl">
            <AlertCircle size={18} className="shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────── */}
        <div className="flex items-center gap-6 border-b border-slate-200/80 text-xs md:text-sm font-bold">
          <button
            onClick={() => setActiveTab('datos')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'datos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User size={18} />
            <span>Mis datos</span>
          </button>
          <button
            onClick={() => setActiveTab('seguridad')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'seguridad'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield size={18} />
            <span>Seguridad</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════
            TAB: MIS DATOS
        ═══════════════════════════════════════════════ */}
        {activeTab === 'datos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── COLUMNA IZQUIERDA ─── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Tarjeta de presentación */}
              <div className="glass-card p-6 rounded-3xl border border-slate-200/80 shadow-xs bg-white/90 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-100 flex items-center justify-center">
                      {(profile?.avatar || profile?.photo_url || profile?.profile_image || user?.avatar) ? (
                        <img
                          src={profile?.avatar || profile?.photo_url || profile?.profile_image || user?.avatar}
                          alt="Avatar Doctor"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full bg-slate-100 text-slate-400 p-1">
                          <User size={30} className="text-slate-400 stroke-[1.5]" />
                          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-tight -mt-0.5">Sin foto</span>
                        </div>
                      )}
                    </div>
                    <button
                      disabled
                      className="absolute bottom-0 right-0 p-1.5 bg-slate-400 text-white rounded-full shadow-md cursor-not-allowed opacity-75"
                      title="Función PRO (Subir foto)"
                    >
                      <Camera size={12} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-base font-extrabold text-slate-900">{displayName}</h2>
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200 flex items-center gap-1">
                        <Crown size={10} className="text-amber-500" />
                        Plan Gratuito
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{displayField(profile?.specialty, 'Especialidad no indicada')}</p>
                    <p className="text-[11px] text-slate-400">
                      {displayField(profile?.email, user?.email || '—')}
                    </p>
                  </div>
                </div>

                {/* CTA edición PRO */}
                <button
                  onClick={() => navigate('/doctor/upgrade-plan')}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 cursor-pointer hover:opacity-90 transition-all active:scale-95"
                >
                  <Edit3 size={14} />
                  Editar (PRO)
                </button>
              </div>

              {/* ── Datos personales ── */}
              <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs bg-white/90 backdrop-blur-md space-y-6">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Datos personales</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field icon={<User size={15} />} label="Nombre" value={displayField(profile?.first_name)} />
                  <Field icon={<User size={15} />} label="Apellidos" value={displayField(profile?.last_name)} colSpan="md:col-span-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field icon={<Mail size={15} />} label="Correo electrónico" value={displayField(profile?.email, user?.email)} />
                  <Field icon={<Phone size={15} />} label="Teléfono" value={displayField(profile?.phone)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field icon={<Calendar size={15} />} label="Fecha de nacimiento" value={displayField(profile?.date_of_birth)} />
                  <Field icon={<MapPin size={15} />} label="País de residencia" value={displayField(profile?.residence_country || profile?.country)} />
                  <Field icon={<MapPin size={15} />} label="Ciudad" value={displayField(profile?.city)} />
                </div>
              </div>

              {/* ── Datos profesionales ── */}
              <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs bg-white/90 backdrop-blur-md space-y-6">
                <div className="flex items-center gap-2">
                  <Stethoscope size={16} className="text-blue-600" />
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Información profesional</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field icon={<Stethoscope size={15} />} label="Especialidad" value={displayField(profile?.specialty)} />
                  <Field icon={<Hash size={15} />} label="Nº de Colegiado" value={displayField(profile?.medical_license || profile?.professional_registration_number)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field icon={<FileText size={15} />} label="Colegio profesional" value={displayField(profile?.professional_college)} />
                  <Field icon={<Calendar size={15} />} label="Años de experiencia" value={displayField(profile?.years_of_experience)} />
                </div>

                {profile?.bio && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600">Descripción profesional</label>
                    <div className="px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      {profile.bio}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── COLUMNA DERECHA ─── */}
            <div className="space-y-6">

              {/* Plan actual */}
              <div className="glass-card p-6 rounded-3xl border border-amber-200/60 shadow-xs bg-amber-50/40 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-extrabold rounded-full border border-amber-200">
                    Plan Actual
                  </span>
                  <span className="text-xs font-bold text-slate-400">Gratuito</span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Cuenta Gratuita</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Pásate al plan PRO para desbloquear agenda, videoconsultas y perfil completo.
                  </p>
                </div>

                <div className="space-y-2">
                  <FeatureRow done text="Perfil básico visible" />
                  <FeatureRow done={false} text="Edición completa del perfil" />
                  <FeatureRow done={false} text="Gestión de agenda" />
                  <FeatureRow done={false} text="Videoconsultas ilimitadas" />
                </div>

                <button
                  onClick={() => navigate('/doctor/upgrade-plan')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <Crown size={15} className="text-yellow-300" />
                  Mejorar plan
                </button>
              </div>

              {/* Actividad */}
              <div className="glass-card p-6 rounded-3xl border border-slate-200/80 shadow-xs bg-white/90 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Tu actividad</h4>
                  <Activity size={16} className="text-blue-600" />
                </div>

                <div className="space-y-2.5">
                  <StatRow icon={<Sparkles size={15} className="text-amber-500" />} label="Consultas a la IA" value="—" />
                  <StatRow icon={<FileText size={15} className="text-blue-500" />} label="Análisis realizados" value="—" />
                  <StatRow icon={<CheckCircle2 size={15} className="text-emerald-500" />} label="Informes generados" value="—" />
                </div>

                <button
                  onClick={() => navigate('/doctor/upgrade-plan')}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  <span>Desbloquear estadísticas</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TAB: SEGURIDAD
        ═══════════════════════════════════════════════ */}
        {activeTab === 'seguridad' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Cambio de contraseña */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs bg-white/90 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-6">
                  <Key size={18} className="text-blue-600" />
                  <h3 className="text-sm font-extrabold text-slate-800">Cambiar contraseña</h3>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <PasswordField
                    label="Contraseña actual"
                    id="pw-current"
                    value={pwForm.current}
                    show={showPw.current}
                    onChange={(v) => setPwForm(f => ({ ...f, current: v }))}
                    onToggle={() => setShowPw(s => ({ ...s, current: !s.current }))}
                  />
                  <PasswordField
                    label="Nueva contraseña"
                    id="pw-next"
                    value={pwForm.next}
                    show={showPw.next}
                    onChange={(v) => setPwForm(f => ({ ...f, next: v }))}
                    onToggle={() => setShowPw(s => ({ ...s, next: !s.next }))}
                    hint="Mínimo 8 caracteres"
                  />
                  <PasswordField
                    label="Confirmar nueva contraseña"
                    id="pw-confirm"
                    value={pwForm.confirm}
                    show={showPw.confirm}
                    onChange={(v) => setPwForm(f => ({ ...f, confirm: v }))}
                    onToggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                  />

                  {pwMessage && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
                      pwMessage.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      {pwMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      <span>{pwMessage.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    {pwSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    Guardar contraseña
                  </button>
                </form>
              </div>
            </div>

            {/* Info de cuenta */}
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-3xl border border-slate-200/80 shadow-xs bg-white/90 backdrop-blur-md space-y-4">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-blue-600" />
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Tu cuenta</h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Correo</span>
                    <span className="font-bold text-slate-800 truncate max-w-[140px]">{displayField(profile?.email, user?.email)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Rol</span>
                    <span className="font-bold text-slate-800 capitalize">Doctor</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Plan</span>
                    <span className="font-bold text-amber-600">Gratuito</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/plans')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200"
                >
                  <Crown size={14} className="text-yellow-500" />
                  Mejorar plan
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Componentes auxiliares ──────────────────────────────

function Field({ icon, label, value, colSpan = '' }) {
  return (
    <div className={`space-y-1.5 ${colSpan}`}>
      <label className="text-[11px] font-bold text-slate-500">{label}</label>
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
        <span className="text-slate-400 shrink-0">{icon}</span>
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function FeatureRow({ done, text }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {done
        ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
        : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0" />}
      <span className={done ? 'text-slate-700 font-medium' : 'text-slate-400'}>{text}</span>
    </div>
  );
}

function StatRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between text-xs text-slate-600 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
      <span className="flex items-center gap-2 font-medium">{icon}{label}</span>
      <span className="font-extrabold text-slate-900">{value}</span>
    </div>
  );
}

function PasswordField({ label, id, value, show, onChange, onToggle, hint }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[11px] font-bold text-slate-600">{label}</label>
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}