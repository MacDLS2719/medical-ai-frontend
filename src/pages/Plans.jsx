import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, BookOpen, Bell, Brain, ArrowLeft, Shield, RefreshCw, Globe } from 'lucide-react';

const PLANS = [
  {
    id: 'basic',
    name: 'Básico',
    badge: null,
    price: '$9.99',
    period: '/mes',
    description: 'Perfecto para empezar a explorar evidencia médica con confianza.',
    accent: '#1e40af',        // azul marino
    accentLight: '#dbeafe',   // azul claro
    accentText: '#1e3a8a',
    features: [
      '20 búsquedas al mes',
      'Acceso a PubMed y Cochrane',
      'Transcripción por voz',
      'Soporte por correo electrónico',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'MÁS POPULAR',
    price: '$24.99',
    period: '/mes',
    description: 'Para profesionales que necesitan evidencia disponible siempre.',
    accent: '#1e40af',
    accentLight: '#dbeafe',
    accentText: '#1e3a8a',
    features: [
      'Búsquedas ilimitadas',
      'Todas las bibliotecas médicas',
      'Transcripción de voz en tiempo real',
      'Alertas médicas personalizadas',
      'Exportar resultados',
      'Soporte prioritario 24/7',
    ],
  },
  {
    id: 'clinic',
    name: 'Clínica',
    badge: 'PARA EQUIPOS',
    price: '$79.99',
    period: '/mes',
    description: 'Solución completa para equipos médicos y clínicas.',
    accent: '#1e40af',
    accentLight: '#dbeafe',
    accentText: '#1e3a8a',
    features: [
      'Todo lo de Pro',
      'Hasta 10 usuarios',
      'Panel de administración',
      'Integraciones EHR / EMR',
      'Informes de uso detallados',
      'Soporte dedicado 24/7',
    ],
  },
];

const BENEFITS = [
  { icon: Zap, title: 'Tiempo real', desc: 'Transcripción de voz instantánea con IA avanzada' },
  { icon: BookOpen, title: '6 bibliotecas', desc: 'PubMed, Cochrane, EuropePMC, OpenFDA y más' },
  { icon: Bell, title: 'Alertas inteligentes', desc: 'Recibe avisos automáticos de nuevas investigaciones' },
  { icon: Brain, title: 'IA médica', desc: 'Resúmenes y análisis generados por inteligencia artificial' },
];

export default function Plans() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');

  const formatCard = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const openModal = (plan) => {
    setSelectedPlan(plan);
    setShowPayModal(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'inherit' }}>

      {/* ─── TOP NAVY HERO ─── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1e40af 100%)',
        padding: '56px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '340px', height: '340px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '860px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '999px', padding: '8px 18px', color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '36px', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
          >
            <ArrowLeft size={15} />
            Volver a búsqueda
          </button>

          {/* Logo pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', padding: '6px 18px', marginBottom: '24px' }}>
            <span style={{ fontSize: '18px' }}>🧬</span>
            <span style={{ fontWeight: 900, fontSize: '15px', color: '#fff', letterSpacing: '0.02em' }}>movir.ai</span>
          </div>

          <h1 style={{ color: '#fff', fontSize: 'clamp(1.8rem, 4.5vw, 3rem)', fontWeight: 900, lineHeight: 1.18, letterSpacing: '-0.02em', margin: '0 0 14px' }}>
            Has alcanzado el límite gratuito
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '16px', maxWidth: '520px', lineHeight: 1.7, margin: '0 0 32px' }}>
            Elige un plan y sigue accediendo a evidencia médica científica de las mejores bibliotecas del mundo, potenciada por IA.
          </p>

          {/* Trust badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {[
              { icon: Shield, label: 'Pagos seguros con Paddle' },
              { icon: RefreshCw, label: 'Cancela cuando quieras' },
              { icon: Globe, label: 'Disponible globalmente' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '999px', padding: '6px 14px' }}>
                <Icon size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT (white) ─── */}
      <div style={{ maxWidth: '1060px', margin: '-40px auto 0', padding: '0 20px 80px', position: 'relative', zIndex: 2 }}>

        {/* ─── BENEFITS STRIP ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '52px' }}>
          {BENEFITS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', transition: 'all 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(30,64,175,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Icon size={20} style={{ color: '#1e40af' }} />
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginBottom: '5px' }}>{title}</div>
              <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* ─── SECTION TITLE ─── */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
            Elige el plan que mejor se adapta a ti
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Sin permanencia. Cambia o cancela en cualquier momento.</p>
        </div>

        {/* ─── PRICING CARDS ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px', alignItems: 'start' }}>
          {PLANS.map((plan) => {
            const isPro = plan.id === 'pro';
            return (
              <div
                key={plan.id}
                style={{
                  position: 'relative',
                  background: isPro ? '#0f172a' : '#fff',
                  border: isPro ? '2px solid #1e40af' : '1px solid #e2e8f0',
                  borderRadius: '24px',
                  padding: '32px 28px',
                  boxShadow: isPro ? '0 20px 50px rgba(30,64,175,0.25)' : '0 2px 12px rgba(0,0,0,0.06)',
                  transform: isPro ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 0.25s',
                  cursor: 'pointer',
                }}
                onClick={() => openModal(plan)}
                onMouseEnter={e => e.currentTarget.style.transform = isPro ? 'scale(1.06)' : 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = isPro ? 'scale(1.03)' : 'scale(1)'}
              >
                {plan.badge && (
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg, #1e40af, #3b82f6)', borderRadius: '999px', padding: '4px 18px', fontSize: '10px', fontWeight: 900, color: '#fff', letterSpacing: '0.1em', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(30,64,175,0.4)' }}>
                    ★ {plan.badge}
                  </div>
                )}

                {/* Plan name + dot */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <span style={{ fontWeight: 800, fontSize: '18px', color: isPro ? '#fff' : '#0f172a' }}>{plan.name}</span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1e40af', boxShadow: '0 0 12px rgba(30,64,175,0.6)' }} />
                </div>

                {/* Price */}
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '40px', fontWeight: 900, color: isPro ? '#fff' : '#0f172a', lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ color: isPro ? 'rgba(255,255,255,0.4)' : '#94a3b8', fontSize: '14px', marginLeft: '4px' }}>{plan.period}</span>
                </div>

                <p style={{ color: isPro ? 'rgba(255,255,255,0.55)' : '#64748b', fontSize: '13px', lineHeight: 1.6, marginBottom: '22px' }}>{plan.description}</p>

                <div style={{ height: '1px', background: isPro ? 'rgba(255,255,255,0.1)' : '#f1f5f9', marginBottom: '22px' }} />

                {/* Features */}
                <ul style={{ listStyle: 'none', margin: '0 0 28px', padding: 0, display: 'flex', flexDirection: 'column', gap: '11px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: isPro ? 'rgba(255,255,255,0.75)' : '#334155', fontSize: '13px' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: isPro ? 'rgba(59,130,246,0.25)' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                        <Check size={11} style={{ color: '#1e40af' }} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    border: isPro ? 'none' : '2px solid #1e40af',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    background: isPro ? 'linear-gradient(135deg, #1e40af, #3b82f6)' : 'transparent',
                    color: isPro ? '#fff' : '#1e40af',
                    boxShadow: isPro ? '0 6px 24px rgba(30,64,175,0.4)' : 'none',
                  }}
                  onMouseEnter={e => { if (!isPro) { e.currentTarget.style.background = '#1e40af'; e.currentTarget.style.color = '#fff'; } else { e.currentTarget.style.opacity = '0.85'; } }}
                  onMouseLeave={e => { if (!isPro) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1e40af'; } else { e.currentTarget.style.opacity = '1'; } }}
                >
                  Elegir {plan.name} →
                </button>
              </div>
            );
          })}
        </div>

        {/* footer note */}
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', marginTop: '40px' }}>
          Precios en USD. IVA puede aplicar según tu país. Al suscribirte aceptas nuestros Términos y Política de Privacidad.
        </p>
      </div>

      {/* ─── PAYMENT MODAL ─── */}
      {showPayModal && selectedPlan && (
        <div
          onClick={() => setShowPayModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(10px)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '440px', borderRadius: '28px', background: '#fff', boxShadow: '0 40px 80px rgba(15,23,42,0.3)', overflow: 'hidden' }}
          >
            {/* Navy top bar */}
            <div style={{ height: '5px', background: 'linear-gradient(90deg, #0f172a, #1e40af, #3b82f6)' }} />

            <div style={{ padding: '32px 32px 36px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '26px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '16px' }}>🧬</span>
                    <span style={{ fontWeight: 900, fontSize: '14px', color: '#1e40af', letterSpacing: '0.02em' }}>movir.ai</span>
                  </div>
                  <h2 style={{ margin: 0, fontWeight: 900, fontSize: '20px', color: '#0f172a', lineHeight: 1.2 }}>Checkout seguro</h2>
                </div>
                <button
                  onClick={() => setShowPayModal(false)}
                  style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1e40af'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#1e40af'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >×</button>
              </div>

              {/* Order summary */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '18px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>PLAN SELECCIONADO</div>
                  <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '15px' }}>movir.ai {selectedPlan.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>Facturado mensualmente · cancela cuando quieras</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: '#1e40af', fontWeight: 900, fontSize: '22px' }}>{selectedPlan.price}</div>
                  <div style={{ color: '#94a3b8', fontSize: '11px' }}>{selectedPlan.period}</div>
                </div>
              </div>

              {/* Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
                {/* Email */}
                <div>
                  <label style={{ color: '#475569', fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>CORREO ELECTRÓNICO</label>
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = '#1e40af'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                {/* Card number */}
                <div>
                  <label style={{ color: '#475569', fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>NÚMERO DE TARJETA</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="1234  5678  9012  3456"
                      value={cardNumber}
                      onChange={e => setCardNumber(formatCard(e.target.value))}
                      maxLength={19}
                      style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '11px 46px 11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.08em', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = '#1e40af'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', pointerEvents: 'none' }}>💳</span>
                  </div>
                </div>
                {/* Exp / CVC */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ color: '#475569', fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>VENCIMIENTO</label>
                    <input type="text" placeholder="MM / AA" maxLength={7}
                      style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = '#1e40af'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#475569', fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>CVC</label>
                    <input type="text" placeholder="•••" maxLength={4}
                      style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '11px 14px', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = '#1e40af'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>
              </div>

              {/* Pay CTA */}
              <button
                style={{ width: '100%', padding: '15px', borderRadius: '15px', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '15px', background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 60%, #3b82f6 100%)', color: '#fff', boxShadow: '0 8px 28px rgba(30,64,175,0.35)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(30,64,175,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(30,64,175,0.35)'; }}
                onClick={() => alert('¡Integración con Paddle próximamente! 🚀')}
              >
                🔒 Suscribirse — {selectedPlan.price}{selectedPlan.period}
              </button>

              {/* Footer */}
              <div style={{ textAlign: 'center', marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Shield size={12} style={{ color: '#94a3b8' }} />
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Pagos procesados por <strong style={{ color: '#475569' }}>PADDLE</strong> · SSL 256-bit</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
