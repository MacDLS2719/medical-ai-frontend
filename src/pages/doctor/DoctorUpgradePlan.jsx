import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Loader2, AlertCircle, Crown, ArrowRight
} from 'lucide-react';

const PLAN_FEATURES = {
  'free-plan': ['Hasta 50 pacientes', 'Agenda médica básica', 'Soporte por email'],
  'free':      ['Hasta 50 pacientes', 'Agenda médica básica', 'Soporte por email'],
  'basic':     ['Hasta 50 pacientes', 'Agenda médica básica', 'Soporte por email'],
  'pro':       ['Pacientes ilimitados', 'IA Clínica Avanzada', 'Recordatorios SMS', 'Soporte prioritario'],
  'premium':   ['Todo lo del plan Pro', 'Telemedicina integrada', 'Asistente IA 24/7', 'Marca blanca'],
  'default':   ['Acceso completo a la plataforma', 'Soporte incluido'],
};

const PLAN_BADGE = {
  'pro':     { label: '⭐ Recomendado', color: 'from-blue-600 to-blue-500' },
  'premium': { label: '👑 Premium',     color: 'from-purple-600 to-purple-500' },
};

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
        setPlans(paidPlans);
        if (paidPlans.length > 0) setSelectedPlanId(paidPlans[0].id);
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
        body: JSON.stringify({ user_id: user.id, plan_id: selectedPlanId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al cambiar el plan');
      }

      const result = await res.json();

      // Actualizar el user en el contexto con la nueva suscripción
      const selected = plans.find(p => p.id === selectedPlanId);
      if (selected && loginAsDoctor) {
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
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-50/50">
        <div className="max-w-sm w-full glass-card p-8 rounded-3xl border border-emerald-100 text-center space-y-5">
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">¡Plan actualizado!</h2>
          <p className="text-sm text-slate-500">Tu suscripción ha sido activada. Ahora tienes acceso a todas las funciones de tu nuevo plan.</p>
          <button
            onClick={() => navigate('/doctor/profile')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all"
          >
            Ver mi perfil completo
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full p-4 md:p-6 bg-slate-50/50 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Cabecera */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mejorar mi plan</h1>
            <p className="text-sm text-slate-500 mt-0.5">Selecciona el plan que mejor se adapta a tu práctica médica.</p>
          </div>
        </div>

        {/* Error de carga */}
        {apiError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl">
            <AlertCircle size={18} className="shrink-0" />
            <span>No se pudieron cargar los planes. Verifica tu conexión al servidor.</span>
          </div>
        )}

        {/* Error de envío */}
        {submitError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl">
            <AlertCircle size={18} className="shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Grid de Planes */}
        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 py-20 justify-center">
            <Loader2 size={22} className="animate-spin text-blue-500" />
            <span className="text-sm">Cargando planes disponibles...</span>
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-slate-500 py-20">
            <AlertCircle size={28} className="text-rose-400" />
            <p className="text-sm font-semibold text-slate-700">No hay planes disponibles en este momento.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const badge = PLAN_BADGE[plan.slug];
                const features = PLAN_FEATURES[plan.slug] || PLAN_FEATURES['default'];

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative p-6 rounded-3xl border-2 transition-all duration-200 cursor-pointer flex flex-col bg-white ${
                      isSelected
                        ? 'border-blue-600 shadow-xl shadow-blue-500/10 scale-[1.02] z-10'
                        : 'border-slate-100 hover:border-blue-200 hover:shadow-md'
                    }`}
                  >
                    {badge && (
                      <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r ${badge.color} text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap`}>
                        {badge.label}
                      </div>
                    )}

                    <div className="mb-4">
                      <h3 className={`text-lg font-bold ${isSelected ? 'text-blue-600' : 'text-slate-800'}`}>
                        {plan.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 min-h-[2rem] leading-relaxed">
                        {plan.description || 'Plan de suscripción médica.'}
                      </p>
                    </div>

                    <div className="mb-6 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900">
                        ${Number(plan.price).toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        /{plan.billing_interval === 'month' ? 'mes' : plan.billing_interval}
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 size={15} className={`shrink-0 mt-0.5 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`} />
                          <span className="text-xs text-slate-600 font-medium leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>

                    <div className={`mt-8 py-2.5 rounded-xl text-center text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-50 text-slate-600 border border-slate-100'
                    }`}>
                      {isSelected ? '✓ Plan seleccionado' : 'Seleccionar plan'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón de confirmación */}
            <div className="flex justify-end pt-4 border-t border-slate-200/60">
              <button
                onClick={handleUpgrade}
                disabled={!selectedPlanId || submitting}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /><span>Procesando...</span></>
                ) : (
                  <><Crown size={16} className="text-yellow-300" /><span>Confirmar y mejorar plan</span></>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
