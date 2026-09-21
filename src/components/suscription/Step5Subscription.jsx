import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, AlertCircle, Stethoscope, Building2, Star, ShieldCheck, BookOpen, Users, HeartHandshake } from 'lucide-react';

const PLAN_CONFIG = {
  'professional': {
    badge: { label: '¡MÁS ELEGIDO', color: 'bg-blue-600', textColor: 'text-white' },
    borderColor: 'border-blue-600',
    shadow: 'shadow-lg shadow-blue-500/10',
    icon: <Stethoscope size={24} className="text-blue-600" />,
    featuresIconColor: 'text-blue-500',
    ctaText: 'Comenzar prueba profesional →',
    displayTitle: 'PLAN PROFESIONAL',
    subtitle: 'Para médicos y profesionales sanitarios',
    extraDescription: 'Herramienta avanzada para apoyar tu práctica clínica diaria.'
  },
  'premium': {
    badge: null,
    borderColor: 'border-slate-200',
    shadow: 'hover:shadow-md',
    icon: <Building2 size={24} className="text-teal-600" />,
    featuresIconColor: 'text-teal-500',
    ctaText: 'Contactar con MIVOR.ai →',
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
        const filteredPlans = data.filter(plan => {
          const nameLower = plan.name?.trim().toLowerCase();
          return nameLower === 'professional' || nameLower === 'premium';
        });
        
        setPlans(filteredPlans);

        if (!selectedPlanId && filteredPlans.length > 0) {
          setSelectedPlanId(filteredPlans[0].id);
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
    if (!selected) return;

    updateFormData({
      subscriptionPlanId: selected.id,
      subscriptionPlanSlug: selected.slug,
      subscriptionPlanName: selected.name,
      subscriptionPlanPrice: selected.price,
      subscriptionPlanCurrency: selected.currency || 'USD',
    });
    onNext(selected.id);
  };

  const noPlansAvailable = !loading && plans.length === 0;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 bg-slate-50/50">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 items-center pb-12">

        {/* Encabezado Principal compacto */}
        <div className="text-center space-y-1.5 max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Elige el plan que mejor se adapta a ti
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Accede a herramientas inteligentes para tu práctica clínica y conecta con profesionales verificados.
          </p>
          {apiError && (
            <div className="inline-flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-2.5 py-1 mt-1">
              <AlertCircle size={12} />
              No se pudieron cargar los planes del servidor.
            </div>
          )}
        </div>

        {/* Grid de Planes */}
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 py-10 text-xs">
            <Loader2 size={18} className="animate-spin text-blue-500" />
            <span>Cargando planes disponibles...</span>
          </div>
        ) : noPlansAvailable ? (
          <div className="flex flex-col items-center gap-2 text-slate-500 py-10">
            <AlertCircle size={24} className="text-rose-400" />
            <p className="text-xs font-semibold text-slate-700">No hay planes disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-4xl items-start">
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const nameKey = plan.name?.trim().toLowerCase();
              const config = PLAN_CONFIG[nameKey] || {
                badge: null,
                borderColor: 'border-slate-200',
                shadow: 'hover:shadow',
                icon: <Stethoscope size={24} className="text-blue-600" />,
                featuresIconColor: 'text-blue-500',
                ctaText: 'Seleccionar plan →',
                displayTitle: plan.name,
                subtitle: plan.description || 'Plan de suscripción',
                extraDescription: ''
              };

              const isPremium = nameKey === 'premium';
              const featuresToRender = isPremium ? FEATURES_PREMIUM : FEATURES_PROFESIONAL;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative p-5 sm:p-6 rounded-2xl border-2 transition-all duration-150 cursor-pointer flex flex-col bg-white ${config.borderColor} ${isSelected ? 'ring-2 ring-blue-500/20 ' + config.shadow : 'hover:border-slate-300'}`}
                >
                  {/* Badge "Más Elegido" */}
                  {config.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${config.badge.color} ${config.badge.textColor} text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap inline-flex items-center gap-1`}>
                      <Star size={10} fill="white" />
                      {config.badge.label}
                    </div>
                  )}

                  {/* Encabezado de la Tarjeta */}
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

                  {/* Descripción adicional */}
                  {config.extraDescription && (
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      {config.extraDescription}
                    </p>
                  )}

                  {/* Precio / Solución a medida */}
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

                  {/* Botón CTA */}
                  <div className="mb-4">
                    <button type="button" className={`w-full py-2.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer ${isSelected ? (isPremium ? 'bg-teal-800 text-white shadow-md' : 'bg-[#0052FF] text-white shadow-md hover:bg-blue-700') : (isPremium ? 'bg-teal-50 text-teal-900 hover:bg-teal-100' : 'bg-slate-100 text-slate-800 hover:bg-slate-200')}`}>
                      {config.ctaText}
                    </button>
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
        )}

        {/* Tarjetas Informativas Inferiores más compactas */}
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
            <ShieldCheck size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-bold text-slate-900">Datos protegidos</h4>
              <p className="text-[10px] text-slate-500 leading-tight">Máximos estándares de seguridad.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
            <BookOpen size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-bold text-slate-900">Info fiable</h4>
              <p className="text-[10px] text-slate-500 leading-tight">Basada en evidencia médica.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
            <Users size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-bold text-slate-900">A tu lado</h4>
              <p className="text-[10px] text-slate-500 leading-tight">Hecho por profesionales.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
            <HeartHandshake size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-bold text-slate-900">Futuro saludable</h4>
              <p className="text-[10px] text-slate-500 leading-tight">Innovación para tu práctica.</p>
            </div>
          </div>
        </div>

        {/* Botones de Navegación del Wizard */}
        <div className="w-full max-w-4xl flex items-center justify-between pt-4 border-t border-slate-200/60 mt-2">
          <button
            type="button"
            onClick={onPrev}
            className="flex items-center gap-1.5 px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Volver</span>
          </button>

          <button
            type="submit"
            disabled={!selectedPlanId || loading || isSubmitting}
            className="flex items-center gap-1.5 px-8 py-2.5 bg-[#0052FF] hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
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