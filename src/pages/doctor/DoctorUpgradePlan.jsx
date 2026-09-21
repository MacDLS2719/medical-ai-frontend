import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Loader2, AlertCircle, Crown, ArrowRight,
  Stethoscope, Building2, Star
} from 'lucide-react';

const PLAN_CONFIG = {
  'professional': {
    badge: { label: '¡MÁS ELEGIDO', color: 'bg-blue-600', textColor: 'text-white' },
    borderColor: 'border-blue-600',
    shadow: 'shadow-lg shadow-blue-500/10',
    icon: <Stethoscope size={24} className="text-blue-600" />,
    featuresIconColor: 'text-blue-500',
    ctaText: 'Seleccionar plan profesional',
    displayTitle: 'PLAN PROFESIONAL',
    subtitle: 'Para médicos y profesionales sanitarios',
    extraDescription: 'Herramienta avanzada para apoyar tu práctica clínica diaria.'
  },
  'premium': {
    badge: null,
    borderColor: 'border-slate-200',
    shadow: 'hover:shadow',
    icon: <Building2 size={24} className="text-teal-600" />,
    featuresIconColor: 'text-teal-500',
    ctaText: 'Seleccionar plan premium',
    displayTitle: 'PLAN PREMIUM',
    subtitle: 'Para organizaciones sanitarias',
    extraDescription: 'Soluciones a medida para clínicas, hospitales e instituciones.'
  },
};

const FEATURES_PROFESIONAL = [
  'Uso ilimitado de MIVOR.ai',
  'Consultas avanzadas con inteligencia artificial',
  'Acceso completo a evidencia médica actualizada',
  'Consulta de avances en tratamientos y farmacología',
  'Creación de alertas médicas personalizadas',
  'Gestión y videoconsultas de pacientes',
  'Herramientas profesionales para la práctica médica'
];

const FEATURES_PREMIUM = [
  'Acceso para múltiples profesionales',
  'Gestión centralizada de usuarios',
  'Herramientas adaptadas a instituciones',
  'Integración en entornos sanitarios',
  'Formación y soporte especializado',
  'Soluciones personalizadas según necesidades'
];

export default function DoctorUpgradePlan() {
  const { user, loginAsDoctor } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    fetch(`${apiUrl}/doctor-profile/subscription-plans`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        const paidPlans = data.filter(p => !p.is_free);
        const filteredPlans = paidPlans.filter(plan => {
          const nameLower = plan.name?.trim().toLowerCase();
          return nameLower === 'professional' || nameLower === 'premium' || nameLower === 'pro';
        });
        
        setPlans(filteredPlans.length > 0 ? filteredPlans : paidPlans);
        if (filteredPlans.length > 0) {
          setSelectedPlanId(filteredPlans[0].id);
        } else if (paidPlans.length > 0) {
          setSelectedPlanId(paidPlans[0].id);
        }
      })
      .catch(() => setApiError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async () => {
    if (!selectedPlanId) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${apiUrl}/doctor-profile/upgrade-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, plan_id: selectedPlanId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al cambiar el plan');
      }

      const selected = plans.find(p => p.id === selectedPlanId);
      if (selected && loginAsDoctor && user) {
        loginAsDoctor({ ...user, subscription: selected });
      }

      setSuccess(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Pantalla de éxito
  if (success) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-50/50 min-h-screen">
        <div className="max-w-sm w-full p-8 bg-white rounded-3xl border border-emerald-100 text-center space-y-5 shadow-lg">
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">¡Plan actualizado!</h2>
          <p className="text-xs text-slate-500 leading-relaxed">Tu suscripción ha sido activada correctamente. Ya tienes acceso a todas las funciones de tu nuevo plan.</p>
          <button
            onClick={() => navigate('/doctor/profile')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#0052FF] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <span>Ver mi perfil completo</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full p-4 md:p-6 bg-slate-50/50 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">

        {/* Cabecera compacta */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Mejorar mi plan</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5"> Accede a herramientas inteligentes para tu práctica clínica y conecta con profesionales verificados.</p>
          </div>
        </div>

        {/* Alertas de Error */}
        {apiError && (
          <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            <AlertCircle size={16} className="shrink-0" />
            <span>No se pudieron cargar los planes. Verifica tu conexión al servidor.</span>
          </div>
        )}

        {submitError && (
          <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            <AlertCircle size={16} className="shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Grid de Planes */}
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 py-16 justify-center text-xs">
            <Loader2 size={18} className="animate-spin text-blue-500" />
            <span>Cargando planes disponibles...</span>
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-slate-500 py-16">
            <AlertCircle size={24} className="text-rose-400" />
            <p className="text-xs font-semibold text-slate-700">No hay planes disponibles en este momento.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const nameKey = plan.name?.trim().toLowerCase() === 'pro' ? 'professional' : plan.name?.trim().toLowerCase();
                const config = PLAN_CONFIG[nameKey] || PLAN_CONFIG['professional'];

                const isPremium = nameKey === 'premium';
                const featuresToRender = isPremium ? FEATURES_PREMIUM : FEATURES_PROFESIONAL;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative p-5 sm:p-6 rounded-2xl border-2 transition-all duration-150 cursor-pointer flex flex-col bg-white ${config.borderColor} ${isSelected ? 'ring-2 ring-blue-500/20 ' + config.shadow : 'hover:border-slate-300'}`}
                  >
                    {/* Badge */}
                    {config.badge && (
                      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${config.badge.color} ${config.badge.textColor} text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap inline-flex items-center gap-1`}>
                        <Star size={10} fill="white" />
                        {config.badge.label}
                      </div>
                    )}

                    {/* Encabezado Tarjeta */}
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        {config.icon}
                      </div>
                      <div>
                        <h3 className={`text-base sm:text-lg font-extrabold ${isPremium ? 'text-teal-800' : 'text-blue-900'} tracking-tight`}>
                          {config.displayTitle}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {config.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Descripción */}
                    {config.extraDescription && (
                      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                        {config.extraDescription}
                      </p>
                    )}

                    {/* Precio */}
                    {isPremium ? (
                      <div className="bg-teal-50 rounded-xl p-3 mb-3 border border-teal-100 text-center">
                        <p className="text-sm sm:text-base font-extrabold text-teal-950">Solución a medida</p>
                        <p className="text-[11px] text-teal-700">Contacta con nuestro equipo</p>
                      </div>
                    ) : (
                      <div className="mb-1 flex items-baseline gap-1 justify-center bg-slate-50 py-2.5 rounded-xl border border-slate-100">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tighter">
                          ${Number(plan.price).toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          /{plan.billing_interval === 'month' ? 'mes' : plan.billing_interval}
                        </span>
                      </div>
                    )}

                    {!isPremium && <p className="text-center text-[10px] text-slate-400 mb-3 font-medium">Sin límites de uso</p>}

                    {/* Botón estado de selección dentro de la tarjeta */}
                    <div className="mb-4">
                      <div className={`w-full py-2.5 rounded-xl text-center text-xs font-bold transition-all ${
                        isSelected 
                          ? (isPremium ? 'bg-teal-800 text-white shadow-md' : 'bg-[#0052FF] text-white shadow-md') 
                          : (isPremium ? 'bg-teal-50 text-teal-900' : 'bg-slate-100 text-slate-800')
                      }`}>
                        {isSelected ? '✓ Plan seleccionado' : 'Seleccionar plan'}
                      </div>
                    </div>

                    {/* Características */}
                    <div className={`space-y-2 flex-1 pt-3 border-t border-slate-100 text-xs ${isPremium ? 'text-teal-900' : 'text-slate-700'}`}>
                      {featuresToRender.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2
                            size={14}
                            className={`shrink-0 mt-0.5 ${isPremium ? 'text-teal-600' : config.featuresIconColor}`}
                          />
                          <span className="font-medium leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Nota inferior Premium */}
                    {isPremium && (
                      <div className="mt-4 pt-3 border-t border-teal-100 flex items-start gap-2.5 text-[11px] bg-white p-2.5 rounded-lg border border-teal-50">
                        <Building2 size={18} className="text-teal-600 shrink-0 mt-0.5"/>
                        <p className="text-teal-800 leading-snug">
                          ¿Quieres implementar MIVOR.ai en tu organización? Analizamos tus necesidades.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Botón de confirmación final */}
            <div className="flex justify-end pt-4 border-t border-slate-200/60">
              <button
                onClick={handleUpgrade}
                disabled={!selectedPlanId || submitting}
                className="flex items-center gap-2 px-8 py-2.5 bg-[#0052FF] hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Crown size={15} className="text-yellow-300" />
                    <span>Confirmar y mejorar plan</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}