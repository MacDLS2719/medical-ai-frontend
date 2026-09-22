import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Loader2, AlertCircle, Crown, ArrowRight,
  Stethoscope, Building2, Star, X, CreditCard, Shield, Lock
} from 'lucide-react';

// ──────────────────────────────────────────────────────────
// Configuración visual de planes
// ──────────────────────────────────────────────────────────
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

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// ──────────────────────────────────────────────────────────
// Helper: cargar Paddle.js dinámicamente
// ──────────────────────────────────────────────────────────
function loadPaddleScript() {
  return new Promise((resolve, reject) => {
    if (window.Paddle) {
      resolve(window.Paddle);
      return;
    }
    const existing = document.getElementById('paddle-js');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Paddle));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = 'paddle-js';
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = () => resolve(window.Paddle);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ──────────────────────────────────────────────────────────
// Modal de Checkout de Paddle
// ──────────────────────────────────────────────────────────
function PaddleCheckoutModal({ plan, checkoutData, onClose, onSuccess }) {
  const checkoutRef = useRef(null);
  const paddleInitialized = useRef(false);

  const isPremium = plan?.name?.trim().toLowerCase() === 'premium';

  useEffect(() => {
    if (paddleInitialized.current || !checkoutData) return;

    async function initPaddleCheckout() {
      try {
        const Paddle = await loadPaddleScript();

        // Inicializar Paddle con el token de cliente y entorno
        const environment = checkoutData.environment || 'sandbox';
        const token = checkoutData.client_token;

        Paddle.Initialize({
          token,
          environment,
          eventCallback: (event) => {
            if (
              event.name === 'checkout.completed' ||
              event.name === 'checkout.customer.created'
            ) {
              // Pequeño delay para que Paddle termine de procesar
              setTimeout(() => {
                onSuccess?.();
              }, 1500);
            }
          },
        });

        paddleInitialized.current = true;

        // Abrir el checkout inline dentro del contenedor
        const openParams = {
          items: [
            {
              priceId: checkoutData.price_id,
              quantity: 1,
            },
          ],
          settings: {
            displayMode: 'inline',
            frameTarget: 'paddle-checkout-container',
            frameInitialHeight: 450,
            frameStyle:
              'width: 100%; min-width: 312px; background-color: transparent; border: none;',
            theme: 'light',
            locale: 'es',
          },
        };

        // Pre-rellenar el customer si lo tenemos
        if (checkoutData.paddle_customer_id) {
          openParams.customer = { id: checkoutData.paddle_customer_id };
        }

        Paddle.Checkout.open(openParams);
      } catch (err) {
        console.error('[Paddle] Error al inicializar checkout:', err);
      }
    }

    initPaddleCheckout();
  }, [checkoutData, onSuccess]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-300"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh]">

        {/* ── Columna izquierda: Resumen del plan ── */}
        <div className={`flex-shrink-0 w-full md:w-72 lg:w-80 p-6 flex flex-col gap-5 ${isPremium ? 'bg-teal-950' : 'bg-[#0A1628]'} text-white`}>

          {/* Botón cerrar (mobile) */}
          <button
            onClick={onClose}
            className="md:hidden absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>

          {/* Encabezado */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown size={16} className="text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
                {isPremium ? 'Plan Premium' : 'Plan Profesional'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold leading-tight text-white">
              {isPremium ? 'Para organizaciones' : 'Para médicos'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isPremium
                ? 'Soluciones a medida para tu institución'
                : 'Potencia tu práctica clínica con IA médica'}
            </p>
          </div>

          {/* Precio */}
          {!isPremium && checkoutData?.amount > 0 && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tighter">
                  ${Number(checkoutData.amount).toFixed(2)}
                </span>
                <span className="text-sm text-slate-400">/mes</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Facturación mensual · Sin permanencia
              </p>
            </div>
          )}

          {/* Features */}
          <div className="space-y-2.5 flex-1">
            {(isPremium ? FEATURES_PREMIUM : FEATURES_PROFESIONAL).map((feat, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 size={14} className={`shrink-0 mt-0.5 ${isPremium ? 'text-teal-400' : 'text-blue-400'}`} />
                <span className="text-xs text-slate-300 leading-snug font-medium">{feat}</span>
              </div>
            ))}
          </div>

          {/* Badges de seguridad */}
          <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Shield size={12} className="text-emerald-400" />
              <span className="text-[10px] text-slate-400">Pago 100% seguro con Paddle</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock size={12} className="text-emerald-400" />
              <span className="text-[10px] text-slate-400">Cancela cuando quieras</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard size={12} className="text-emerald-400" />
              <span className="text-[10px] text-slate-400">Todas las tarjetas aceptadas</span>
            </div>
          </div>
        </div>

        {/* ── Columna derecha: Paddle Inline Checkout ── */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <h3 className="text-base font-extrabold text-slate-900">Completa tu pago</h3>
            <button
              onClick={onClose}
              className="hidden md:flex w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} className="text-slate-600" />
            </button>
          </div>

          {/* Contenedor del checkout de Paddle */}
          <div className="flex-1 overflow-auto p-2 md:p-4">
            <div
              ref={checkoutRef}
              className="paddle-checkout-container w-full min-h-[420px]"
              id="paddle-checkout-container"
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
            <p className="text-[10px] text-slate-400">
              Al continuar aceptas los{' '}
              <a href="#" className="underline hover:text-slate-600">Términos de servicio</a>
            </p>
            <img
              src="https://paddle-static-assets-production.s3.amazonaws.com/partner-icons/paddle.svg"
              alt="Powered by Paddle"
              className="h-4 opacity-50"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Componente Principal
// ──────────────────────────────────────────────────────────
export default function DoctorUpgradePlan() {
  const { user, loginAsDoctor } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  // Checkout
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Éxito
  const [success, setSuccess] = useState(false);

  // ── Cargar planes ──────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/doctor-profile/subscription-plans`)
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

  // ── Precargar Paddle.js ────────────────────────────────
  useEffect(() => {
    loadPaddleScript().catch(() => {
      console.warn('[Paddle] Script no cargado aún');
    });
  }, []);

  // ── Abrir checkout Paddle ──────────────────────────────
  const handleCheckout = useCallback(async () => {
    if (!selectedPlanId || !user?.id) return;

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const res = await fetch(
        `${API_URL}/paddle/checkout?user_id=${user.id}&plan_id=${selectedPlanId}`,
        { method: 'POST' }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al preparar el pago');
      }

      const data = await res.json();
      setCheckoutData(data);
      setShowModal(true);
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  }, [selectedPlanId, user?.id]);

  // ── Éxito del pago ─────────────────────────────────────
  const handlePaymentSuccess = useCallback(() => {
    setShowModal(false);
    setCheckoutData(null);

    const selected = plans.find(p => p.id === selectedPlanId);
    if (selected && loginAsDoctor && user) {
      loginAsDoctor({ ...user, subscription: selected });
    }

    setSuccess(true);
  }, [plans, selectedPlanId, loginAsDoctor, user]);

  // ── Pantalla de éxito ──────────────────────────────────
  if (success) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-50/50 min-h-screen">
        <div className="max-w-sm w-full p-8 bg-white rounded-3xl border border-emerald-100 text-center space-y-5 shadow-lg">
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">¡Plan activado!</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tu suscripción ha sido activada correctamente. Ya tienes acceso a todas las funciones de tu nuevo plan.
          </p>
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

  // ── Render principal ───────────────────────────────────
  return (
    <>
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
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Mejorar mi plan
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Accede a herramientas inteligentes para tu práctica clínica y conecta con profesionales verificados.
              </p>
            </div>
          </div>

          {/* Alertas de error */}
          {apiError && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              <AlertCircle size={16} className="shrink-0" />
              <span>No se pudieron cargar los planes. Verifica tu conexión al servidor.</span>
            </div>
          )}

          {checkoutError && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              <AlertCircle size={16} className="shrink-0" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* Grid de planes */}
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500 py-16 justify-center text-xs">
              <Loader2 size={18} className="animate-spin text-blue-500" />
              <span>Cargando planes disponibles...</span>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-slate-500 py-16">
              <AlertCircle size={24} className="text-rose-400" />
              <p className="text-xs font-semibold text-slate-700">
                No hay planes disponibles en este momento.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const nameKey =
                    plan.name?.trim().toLowerCase() === 'pro'
                      ? 'professional'
                      : plan.name?.trim().toLowerCase();
                  const config = PLAN_CONFIG[nameKey] || PLAN_CONFIG['professional'];

                  const isPremium = nameKey === 'premium';
                  const featuresToRender = isPremium
                    ? FEATURES_PREMIUM
                    : FEATURES_PROFESIONAL;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative p-5 sm:p-6 rounded-2xl border-2 transition-all duration-150 cursor-pointer flex flex-col bg-white ${config.borderColor} ${
                        isSelected
                          ? 'ring-2 ring-blue-500/20 ' + config.shadow
                          : 'hover:border-slate-300'
                      }`}
                    >
                      {/* Badge */}
                      {config.badge && (
                        <div
                          className={`absolute -top-3 left-1/2 -translate-x-1/2 ${config.badge.color} ${config.badge.textColor} text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap inline-flex items-center gap-1`}
                        >
                          <Star size={10} fill="white" />
                          {config.badge.label}
                        </div>
                      )}

                      {/* Encabezado tarjeta */}
                      <div className="flex items-center gap-3.5 mb-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                          {config.icon}
                        </div>
                        <div>
                          <h3
                            className={`text-base sm:text-lg font-extrabold ${
                              isPremium ? 'text-teal-800' : 'text-blue-900'
                            } tracking-tight`}
                          >
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
                          <p className="text-sm sm:text-base font-extrabold text-teal-950">
                            Solución a medida
                          </p>
                          <p className="text-[11px] text-teal-700">
                            Contacta con nuestro equipo
                          </p>
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

                      {!isPremium && (
                        <p className="text-center text-[10px] text-slate-400 mb-3 font-medium">
                          Sin límites de uso
                        </p>
                      )}

                      {/* Estado de selección */}
                      <div className="mb-4">
                        <div
                          className={`w-full py-2.5 rounded-xl text-center text-xs font-bold transition-all ${
                            isSelected
                              ? isPremium
                                ? 'bg-teal-800 text-white shadow-md'
                                : 'bg-[#0052FF] text-white shadow-md'
                              : isPremium
                              ? 'bg-teal-50 text-teal-900'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {isSelected ? '✓ Plan seleccionado' : 'Seleccionar plan'}
                        </div>
                      </div>

                      {/* Características */}
                      <div
                        className={`space-y-2 flex-1 pt-3 border-t border-slate-100 text-xs ${
                          isPremium ? 'text-teal-900' : 'text-slate-700'
                        }`}
                      >
                        {featuresToRender.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2
                              size={14}
                              className={`shrink-0 mt-0.5 ${
                                isPremium ? 'text-teal-600' : config.featuresIconColor
                              }`}
                            />
                            <span className="font-medium leading-snug">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Nota inferior Premium */}
                      {isPremium && (
                        <div className="mt-4 pt-3 border-t border-teal-100 flex items-start gap-2.5 text-[11px] bg-white p-2.5 rounded-lg border border-teal-50">
                          <Building2 size={18} className="text-teal-600 shrink-0 mt-0.5" />
                          <p className="text-teal-800 leading-snug">
                            ¿Quieres implementar MIVOR.ai en tu organización? Analizamos tus necesidades.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botón de confirmación */}
              <div className="flex justify-end pt-4 border-t border-slate-200/60">
                <button
                  onClick={handleCheckout}
                  disabled={!selectedPlanId || checkoutLoading}
                  className="flex items-center gap-2 px-8 py-2.5 bg-[#0052FF] hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Preparando pago...</span>
                    </>
                  ) : (
                    <>
                      <Crown size={15} className="text-yellow-300" />
                      <span>Confirmar y pagar con Paddle</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Checkout Paddle */}
      {showModal && checkoutData && (
        <PaddleCheckoutModal
          plan={plans.find(p => p.id === selectedPlanId)}
          checkoutData={checkoutData}
          onClose={() => {
            setShowModal(false);
            setCheckoutData(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}