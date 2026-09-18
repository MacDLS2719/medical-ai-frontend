import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

// Características por slug del plan (enriquecen los datos del backend)
const PLAN_FEATURES = {
  'free-plan': ['Hasta 50 pacientes', 'Agenda médica básica', 'Soporte por email'],
  'free': ['Hasta 50 pacientes', 'Agenda médica básica', 'Soporte por email'],
  'basic': ['Hasta 50 pacientes', 'Agenda médica básica', 'Soporte por email'],
  'pro': ['Pacientes ilimitados', 'IA Clínica Avanzada', 'Recordatorios SMS', 'Soporte prioritario'],
  'premium': ['Todo lo del plan Pro', 'Telemedicina integrada', 'Asistente IA 24/7', 'Marca blanca'],
  'default': ['Acceso completo a la plataforma', 'Soporte incluido'],
};

const PLAN_BADGE = {
  'pro': { label: '⭐ Recomendado', color: 'from-blue-600 to-blue-500' },
  'premium': { label: '👑 Premium', color: 'from-purple-600 to-purple-500' },
};

export default function Step5Subscription({ formData, updateFormData, onNext, onPrev, isSubmitting = false }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(formData.subscriptionPlanId || null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    fetch(`${apiUrl}/doctor-profile/subscription-plans`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar planes');
        return res.json();
      })
      .then((data) => {
        const paidPlans = data.filter(plan => !plan.is_free);
        setPlans(paidPlans);
        // Seleccionar el primer plan si no hay selección previa
        if (!selectedPlanId && paidPlans.length > 0) {
          setSelectedPlanId(paidPlans[0].id);
        }
      })
      .catch(() => {
        setApiError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selected = plans.find((p) => p.id === selectedPlanId);
    // Guardar el plan en formData y luego llamar al registro
    updateFormData({
      subscriptionPlanId: selectedPlanId,
      subscriptionPlanSlug: selected?.slug || null,
      subscriptionPlanName: selected?.name || null,
    });
    // onNext aqui es handleRegisterDoctor en DoctorCreate
    onNext(selectedPlanId);
  };

  const getFeaturesForPlan = (plan) => {
    return PLAN_FEATURES[plan.slug] || PLAN_FEATURES['default'];
  };

  // Estado de error sin planes disponibles
  const noPlansAvailable = !loading && plans.length === 0;

  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-5 md:p-6 bg-slate-50/50">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 items-center">

        <div className="text-center space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Elige el plan ideal para tu práctica
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto">
            Selecciona una suscripción para continuar. Puedes cambiarla en cualquier momento desde tu perfil.
          </p>
          {apiError && (
            <div className="inline-flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5">
              <AlertCircle size={13} />
              No se pudieron cargar los planes. Verifica tu conexión al servidor.
            </div>
          )}
        </div>

        {/* Grid de Planes */}
        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 py-16">
            <Loader2 size={22} className="animate-spin text-blue-500" />
            <span className="text-sm">Cargando planes disponibles...</span>
          </div>
        ) : noPlansAvailable ? (
          <div className="flex flex-col items-center gap-3 text-slate-500 py-16">
            <AlertCircle size={28} className="text-rose-400" />
            <p className="text-sm font-semibold text-slate-700">No hay planes disponibles</p>
            <p className="text-xs text-slate-500">Contacta al administrador para activar los planes de suscripción.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-2">
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const badge = PLAN_BADGE[plan.slug];
              const features = getFeaturesForPlan(plan);

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative p-6 rounded-3xl border-2 transition-all duration-200 cursor-pointer flex flex-col bg-white ${
                    isSelected
                      ? 'border-blue-600 shadow-xl shadow-blue-500/10 scale-[1.03] z-10'
                      : 'border-slate-100 hover:border-blue-200 hover:shadow-md'
                  }`}
                >
                  {/* Badge */}
                  {badge && (
                    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r ${badge.color} text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap`}>
                      {badge.label}
                    </div>
                  )}

                  {/* Encabezado */}
                  <div className="mb-4">
                    <h3 className={`text-lg font-bold ${isSelected ? 'text-blue-600' : 'text-slate-800'}`}>
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 min-h-[2rem] leading-relaxed">
                      {plan.description || 'Plan de suscripción médica.'}
                    </p>
                  </div>

                  {/* Precio */}
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      ${Number(plan.price).toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      /{plan.billing_interval === 'month' ? 'mes' : plan.billing_interval}
                    </span>
                  </div>

                  {/* Features */}
                  <div className="space-y-2.5 flex-1">
                    {features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2
                          size={15}
                          className={`shrink-0 mt-0.5 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`}
                        />
                        <span className="text-xs text-slate-600 font-medium leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div
                    className={`mt-8 py-2.5 rounded-xl text-center text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-50 text-slate-600 border border-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ Plan seleccionado' : 'Seleccionar plan'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Botones de Navegación */}
        <div className="w-full max-w-5xl flex items-center justify-between pt-5 border-t border-slate-200/60 mt-2">
          <button
            type="button"
            onClick={onPrev}
            className="flex items-center gap-1.5 px-5 py-2.5 border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Volver</span>
          </button>

          <button
            type="submit"
            disabled={!selectedPlanId || loading || isSubmitting}
            className="flex items-center gap-1.5 px-8 py-2.5 bg-[#0052FF] hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Registrando...</span>
              </>
            ) : (
              <>
                <span>Crear mi cuenta</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
