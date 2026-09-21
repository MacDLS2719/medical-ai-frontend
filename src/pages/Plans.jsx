import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Check, Zap, BookOpen, Bell, Brain, ArrowLeft, Shield, RefreshCw, Globe,
  Stethoscope, Building2, User, Star, Loader2, AlertCircle, CheckCircle2, Crown, ArrowRight
} from 'lucide-react';

const PLANS_CONFIG = [
  {
    id: 'free',
    name: 'GRATUITO',
    displayTitle: 'GRATUITO',
    subtitle: 'Para personas que quieren empezar',
    description: 'Descubre todo lo que MIVOR.ai puede hacer por ti, con acceso limitado y sin coste.',
    price: '0 €',
    period: 'Siempre disponible',
    badge: null,
    icon: <User size={24} className="text-blue-600" />,
    featuresIconColor: 'text-blue-500',
    borderColor: 'border-slate-200',
    isPro: false,
    isPremium: false,
    features: [
      'Consultas limitadas con MIVOR.ai',
      'Comprensión de información médica de forma sencilla',
      'Acceso limitado a avances médicos y farmacológicos',
      'Organización básica de información de salud',
      'Acceso desde cualquier dispositivo'
    ],
    footerNote: 'Para mantener el servicio gratuito, puedes recibir ocasionalmente publicidad adaptada.'
  },
  {
    id: 'professional',
    name: 'PROFESIONAL',
    displayTitle: 'PROFESIONAL',
    subtitle: 'Para médicos y profesionales sanitarios',
    description: 'Una herramienta avanzada, diseñada para apoyar tu práctica clínica diaria.',
    price: 'XX €',
    period: '/mes',
    badge: { label: 'MÁS ELEGIDO', color: 'bg-blue-600', textColor: 'text-white' },
    icon: <Stethoscope size={24} className="text-blue-600" />,
    featuresIconColor: 'text-blue-500',
    borderColor: 'border-blue-600',
    shadow: 'shadow-xl shadow-blue-500/15',
    isPro: true,
    isPremium: false,
    features: [
      'Uso ilimitado de MIVOR.ai',
      'Consultas avanzadas con inteligencia artificial',
      'Acceso completo a evidencia médica actualizada',
      'Consulta de avances en tratamientos y farmacología',
      'Creación de alertas médicas personalizadas',
      'Gestión de pacientes',
      'Videoconsultas con pacientes',
      'Herramientas profesionales para la práctica médica'
    ],
    footerNote: 'Sin limites de uso'
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    displayTitle: 'PREMIUM',
    subtitle: 'Para organizaciones sanitarias',
    description: 'Soluciones personalizadas para clínicas, hospitales, universidades y otras instituciones.',
    price: 'Solución a medida',
    period: 'Contacta con nuestro equipo',
    badge: null,
    icon: <Building2 size={24} className="text-teal-600" />,
    featuresIconColor: 'text-teal-600',
    borderColor: 'border-slate-200',
    isPro: false,
    isPremium: true,
    features: [
      'Acceso para múltiples profesionales',
      'Gestión centralizada de usuarios',
      'Herramientas adaptadas a instituciones',
      'Integración en entornos sanitarios',
      'Formación y soporte especializado',
      'Soluciones personalizadas según necesidades'
    ],
    footerNote: '¿Quieres implementar MIVOR.ai en tu organización? Nuestro equipo analizará tus necesidades y preparará una propuesta personalizada.'
  }
];

const BENEFITS = [
  { icon: Zap, title: 'Tiempo real', desc: 'Transcripción de voz instantánea con IA avanzada' },
  { icon: BookOpen, title: '6 bibliotecas', desc: 'PubMed, Cochrane, EuropePMC, OpenFDA y más' },
  { icon: Bell, title: 'Alertas inteligentes', desc: 'Recibe avisos automáticos de nuevas investigaciones' },
  { icon: Brain, title: 'IA médica', desc: 'Resúmenes y análisis generados por inteligencia artificial' },
];

export default function Plans() {
  const navigate = useNavigate();
  const { user, loginAsDoctor } = useAuth();
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('professional');
  const [showPayModal, setShowPayModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
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
        if (data && data.length > 0) {
          setPlans(data);
        }
      })
      .catch(() => {
        setApiError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const getMatchedBackendPlan = (configId) => {
    if (!plans || plans.length === 0) return null;
    if (configId === 'free') {
      return plans.find(p => p.is_free || p.slug?.toLowerCase() === 'free' || p.slug?.toLowerCase() === 'free-plan' || p.name?.toLowerCase().includes('grat') || p.name?.toLowerCase().includes('free'));
    }
    if (configId === 'professional') {
      return plans.find(p => p.slug?.toLowerCase() === 'professional' || p.slug?.toLowerCase() === 'pro' || p.name?.toLowerCase().includes('prof') || p.name?.toLowerCase().includes('pro'));
    }
    if (configId === 'premium') {
      return plans.find(p => p.slug?.toLowerCase() === 'premium' || p.name?.toLowerCase().includes('prem'));
    }
    return null;
  };

  const isCurrentPlan = (planConfigId) => {
    if (!user?.subscription) return planConfigId === 'free';
    const sub = user.subscription;
    if (sub.is_free || sub.slug === 'free' || sub.slug === 'free-plan' || sub.price === 0) {
      return planConfigId === 'free';
    }
    const s = (sub.slug || sub.name || '').toLowerCase();
    if (planConfigId === 'professional' && (s.includes('prof') || s === 'pro')) {
      return true;
    }
    if (planConfigId === 'premium' && s.includes('prem')) {
      return true;
    }
    return false;
  };

  const formatCard = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const executeUpgrade = async (targetPlan) => {
    if (!targetPlan) {
      alert('Plan no encontrado en el servidor.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${apiUrl}/doctor-profile/upgrade-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, plan_id: targetPlan.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al cambiar el plan');
      }

      if (loginAsDoctor && user) {
        loginAsDoctor({ ...user, subscription: targetPlan });
      }

      setShowPayModal(false);
      setSuccess(true);
    } catch (err) {
      setSubmitError(err.message || 'Error al procesar la actualización del plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectPlan = (planConfigId) => {
    setSelectedPlanId(planConfigId);
    setSubmitError(null);

    if (isCurrentPlan(planConfigId)) {
      return;
    }

    const matched = getMatchedBackendPlan(planConfigId);

    if (planConfigId === 'free') {
      if (window.confirm('¿Deseas cambiar al Plan Gratuito?')) {
        if (matched) {
          executeUpgrade(matched);
        } else {
          const fallbackFree = { id: 1, name: 'Gratuito', slug: 'free', is_free: true, price: 0 };
          if (loginAsDoctor && user) loginAsDoctor({ ...user, subscription: fallbackFree });
          setSuccess(true);
        }
      }
      return;
    }

    setShowPayModal(true);
  };

  const handleSubscribePayment = async () => {
    const matchedPlan = getMatchedBackendPlan(selectedPlanId);
    if (!matchedPlan) {
      setSubmitError('No se pudo identificar el plan en el servidor.');
      return;
    }
    await executeUpgrade(matchedPlan);
  };

  const selectedPlanDetails = PLANS_CONFIG.find(p => p.id === selectedPlanId) || PLANS_CONFIG[1];

  if (success) {
    const activeMatched = getMatchedBackendPlan(selectedPlanId) || selectedPlanDetails;
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full p-8 bg-white rounded-3xl border border-emerald-100 text-center space-y-5 shadow-xl">
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">¡Plan actualizado con éxito!</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tu suscripción a <strong>{activeMatched.name}</strong> ha sido activada correctamente. Ya tienes acceso a todas las funciones disponibles para tu perfil.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate('/medical-search')}
              className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Ir a buscador médico
            </button>
            <button
              onClick={() => navigate('/doctor/profile')}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-[#0052FF] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <span>Ver mi perfil</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col overflow-y-auto" style={{ fontFamily: 'inherit' }}>
      {/* ─── MAIN CONTAINER (RESPONSIVO Y CON ESPACIADO REDUCIDO) ─── */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-7 pb-10 flex-1 flex flex-col">

        {/* Título y subtítulo con espaciado ajustado */}
        <div className="text-center max-w-2xl mx-auto mb-4 sm:mb-5">
          <h1 className="text-slate-900 text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-1">
            Elige el plan que mejor se adapta a ti
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed m-0">
            Herramientas inteligentes para comprender tu información médica y conectar con profesionales.
          </p>
        </div>

        {/* ─── CARDS GRID (3 PLANES) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch mb-6">
          {PLANS_CONFIG.map((plan) => {
            const isCurrent = isCurrentPlan(plan.id);
            const isPro = plan.isPro;
            const isPremium = plan.isPremium;
            const isFree = plan.id === 'free';

            const matchedBackend = getMatchedBackendPlan(plan.id);
            const displayPrice = matchedBackend && matchedBackend.price !== undefined && !isPremium
              ? (matchedBackend.is_free ? '0 €' : `$${Number(matchedBackend.price).toFixed(2)}`)
              : plan.price;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                style={{
                  position: 'relative',
                  background: '#ffffff',
                  border: isCurrent 
                    ? '2px solid #10b981' 
                    : isPro 
                      ? '2px solid #2563eb' 
                      : '1px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '24px 20px',
                  boxShadow: isCurrent
                    ? '0 8px 24px rgba(16,185,129,0.1)'
                    : isPro 
                      ? '0 16px 32px rgba(37,99,235,0.1)' 
                      : '0 2px 8px rgba(0,0,0,0.02)',
                  transform: isPro ? 'scale(1.01)' : 'scale(1)',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {/* Badge superior */}
                {isCurrent ? (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', borderRadius: '999px', padding: '3px 12px', fontSize: '9px', fontWeight: 900, color: '#fff', letterSpacing: '0.08em', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 3px 10px rgba(16,185,129,0.3)' }}>
                    <Check size={10} strokeWidth={3} />
                    TU PLAN ACTUAL
                  </div>
                ) : plan.badge ? (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#2563eb', borderRadius: '999px', padding: '3px 12px', fontSize: '9px', fontWeight: 900, color: '#fff', letterSpacing: '0.08em', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={9} fill="white" />
                    {plan.badge.label}
                  </div>
                ) : null}

                {/* Header Icono y Título */}
                <div className="flex items-center gap-3 mb-2.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPremium ? 'bg-teal-50' : 'bg-blue-50'}`}>
                    {plan.icon}
                  </div>
                  <div>
                    <h3 className={`text-base font-black tracking-tight ${isPremium ? 'text-teal-800' : 'text-blue-950'}`}>
                      {plan.displayTitle}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {plan.subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 mb-4 leading-relaxed min-h-[30px]">
                  {plan.description}
                </p>

                {/* Precio compacto */}
                {isPremium ? (
                  <div className="bg-teal-50 rounded-xl p-2.5 mb-4 border border-teal-100 text-center">
                    <p className="text-sm font-extrabold text-teal-950">{plan.price}</p>
                    <p className="text-[10px] text-teal-700">{plan.period}</p>
                  </div>
                ) : (
                  <div className="mb-4 text-center bg-slate-50 py-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-2xl font-black text-slate-950 tracking-tight">{displayPrice}</span>
                      <span className="text-[11px] text-slate-500 font-medium">{plan.period}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-semibold">{plan.footerNote || 'Siempre disponible'}</span>
                  </div>
                )}

                {/* Botón CTA */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(plan.id);
                  }}
                  disabled={isCurrent || submitting}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all mb-4 flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 cursor-default'
                      : isPro 
                        ? 'bg-[#0052FF] hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 cursor-pointer' 
                        : isPremium 
                          ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-md cursor-pointer'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer'
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <Check size={13} className="text-emerald-600" />
                      <span>✓ Tu plan actual</span>
                    </>
                  ) : isFree ? (
                    'Crear cuenta gratis →'
                  ) : isPro ? (
                    'Comenzar prueba profesional →'
                  ) : (
                    'Contactar con MIVOR.ai →'
                  )}
                </button>

                {/* Lista de Características (más compacta) */}
                <div className="space-y-2 flex-1 pt-3 border-t border-slate-100 text-[11px]">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2
                        size={13}
                        className={`shrink-0 mt-0.5 ${isPremium ? 'text-teal-600' : 'text-blue-600'}`}
                      />
                      <span className="font-medium text-slate-700 leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer minimalista de confianza */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-500 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-1.5">
            <Shield size={14} className="text-blue-600" />
            <span>Datos protegidos y seguros</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-blue-600" />
            <span>Información basada en evidencia</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-emerald-600" />
            <span>Cancela cuando quieras</span>
          </div>
        </div>

      </div>

      {/* ─── PAYMENT MODAL (Checkout) ─── */}
      {showPayModal && selectedPlanDetails && (
        <div
          onClick={() => !submitting && setShowPayModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(10px)', overflowY: 'auto' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '420px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '24px', background: '#fff', boxShadow: '0 30px 60px rgba(15,23,42,0.3)' }}
          >
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #0f172a, #1e40af, #3b82f6)' }} />

            <div style={{ padding: '24px 28px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px' }}>🧬</span>
                    <span style={{ fontWeight: 900, fontSize: '13px', color: '#1e40af' }}>mivor.ai</span>
                  </div>
                  <h2 style={{ margin: 0, fontWeight: 900, fontSize: '18px', color: '#0f172a' }}>Checkout seguro</h2>
                </div>
                <button
                  disabled={submitting}
                  onClick={() => setShowPayModal(false)}
                  style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >×</button>
              </div>

              {submitError && (
                <div className="mb-3 flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Order summary compacto */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '2px' }}>PLAN SELECCIONADO</div>
                  <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '14px' }}>mivor.ai {selectedPlanDetails.name}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: '#1e40af', fontWeight: 900, fontSize: '18px' }}>
                    {getMatchedBackendPlan(selectedPlanId)?.price !== undefined
                      ? (getMatchedBackendPlan(selectedPlanId)?.is_free ? '0 €' : `$${Number(getMatchedBackendPlan(selectedPlanId)?.price).toFixed(2)}`)
                      : selectedPlanDetails.price
                    }
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '10px' }}>{selectedPlanDetails.period}</div>
                </div>
              </div>

              {/* Form inputs compactos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <label style={{ color: '#475569', fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', display: 'block', marginBottom: '4px' }}>CORREO ELECTRÓNICO</label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    placeholder="tu@correo.com"
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '9px 12px', color: '#0f172a', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ color: '#475569', fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', display: 'block', marginBottom: '4px' }}>NÚMERO DE TARJETA</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={e => setCardNumber(formatCard(e.target.value))}
                    maxLength={19}
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '9px 12px', color: '#0f172a', fontSize: '13px', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.08em' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ color: '#475569', fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', display: 'block', marginBottom: '4px' }}>VENCIMIENTO</label>
                    <input type="text" placeholder="MM / AA" maxLength={7}
                      style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '9px 12px', color: '#0f172a', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#475569', fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', display: 'block', marginBottom: '4px' }}>CVC</label>
                    <input type="text" placeholder="•••" maxLength={4}
                      style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '9px 12px', color: '#0f172a', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              {/* Pay CTA */}
              <button
                disabled={submitting}
                style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '14px', background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 60%, #3b82f6 100%)', color: '#fff', boxShadow: '0 6px 20px rgba(30,64,175,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={handleSubscribePayment}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Crown size={15} className="text-yellow-300" />
                    <span>Confirmar y Activar</span>
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <Shield size={11} style={{ color: '#94a3b8' }} />
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>Pagos seguros procesados por PADDLE</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}