import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Phone, 
  Globe, 
  Stethoscope, 
  IdCard, 
  Database, 
  FileText, 
  Headphones, 
  ArrowRight,
  Info,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';


import doctorHeroImg from '../../assets/imgs/doctor-hero.webp';
import mivorIconImg from '../../assets/imgs/mivor-icon.webp'; 

import { ALL_COUNTRIES } from '../../data/countries';
import { MEDICAL_SPECIALTIES } from '../../data/specialty';

export default function DoctorCreateFree() {
  const { loginAsDoctor } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    professionalRegistrationNumber: '',
    specialty: '',
    country: '',
    phoneCode: '+34',
    phone: '',
    email: '',
    password: '',
    acceptedTerms: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.acceptedTerms) {
      setError('Debes aceptar los Términos de servicio y la Política de privacidad.');
      setIsSubmitting(false);
      return;
    }

    const nameParts = formData.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    if (!firstName || !lastName) {
      setError('Por favor, ingresa tu nombre y al menos un apellido.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      first_name: firstName,
      last_name: lastName,
      professional_registration_number: formData.professionalRegistrationNumber.trim(),
      specialty: formData.specialty.trim(),
      residence_country: formData.country,
      phone: `${formData.phoneCode} ${formData.phone.trim()}`,
      email: formData.email.trim(),
      password: formData.password || null,
      language: 'es'
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        throw new Error('La URL de la API (VITE_API_URL) no está configurada en las variables de entorno.');
      }

      const response = await fetch(`${apiUrl}/doctor-profile/register/free`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const responseData = await response.json();
        const doctorUser = {
          id: responseData.user_id || responseData.id || Date.now(),
          role: 'doctor',
          name: `Dr. ${payload.first_name} ${payload.last_name}`.trim(),
          email: payload.email
        };
        loginAsDoctor(doctorUser);
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/doctor/profile');
        }, 2000);
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Error al registrar el perfil gratuito.');
      }
    } catch (err) {
      console.error('Error in free doctor registration:', err);
      setError(err.message || 'Error al crear la cuenta gratuita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={44} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Registro Exitoso!</h2>
          <p className="text-slate-500 mb-6 text-sm">
            Tu cuenta con el plan gratuito ha sido creada correctamente. Te estamos redirigiendo a tu panel...
          </p>
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200/60 flex items-center justify-center p-4 sm:p-6 md:py-10 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 relative my-auto">

        <button 
          type="button" 
          onClick={() => navigate('/')} 
          className="absolute top-4 right-4 z-30 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Cerrar"
        >
          <X size={22} />
        </button>

        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between z-10">
          <div>
            {/* Logo: Icono desde imagen + Texto codificado */}
            <div className="flex items-center gap-3 mb-6">
              <img 
                src={mivorIconImg} 
                alt="MIVOR Icon" 
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-sm" 
              />
              
              <div className="leading-none">
                {/* Nombre principal en tamaño grande */}
                <span className="font-extrabold text-3xl sm:text-4xl text-[#0B1E48] tracking-tight">
                  MIVOR<span className="text-cyan-500">.ai</span>
                </span>
                
                {/* Subtítulo proporcionalmente más visible */}
                <span className="block text-[10px] sm:text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">
                  BETTER HEALTH. BRIGHTER LIVES.
                </span>
              </div>
            </div>

            {/* Títulos */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1E48] mb-1.5 tracking-tight">
              Acceso para profesionales médicos
            </h1>
            <p className="text-xs sm:text-sm font-bold text-[#1E293B] mb-1">
              Para probar MIVOR.ai necesitamos verificar que eres médico.
            </p>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Completa los siguientes datos para obtener acceso a la versión de prueba y recibir ejemplos y recomendaciones adaptadas a tu especialidad.
            </p>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Campos del Formulario */}
            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* Nombre y Apellidos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre y apellidos</label>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100/80 text-indigo-900 flex items-center justify-center shrink-0">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs sm:text-sm focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                    placeholder="Ej.: María López García"
                  />
                </div>
              </div>

              {/* Número de colegiado */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Número de colegiado</label>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100/80 text-indigo-900 flex items-center justify-center shrink-0">
                    <IdCard size={18} />
                  </div>
                  <div className="relative w-full">
                    <input
                      type="text"
                      name="professionalRegistrationNumber"
                      required
                      value={formData.professionalRegistrationNumber}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 pr-9 rounded-xl bg-slate-50/70 border border-slate-200 text-xs sm:text-sm focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                      placeholder="Ej.: 282850102"
                    />
                    <Info size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Especialidad médica */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Especialidad médica</label>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100/80 text-indigo-900 flex items-center justify-center shrink-0">
                    <Stethoscope size={18} />
                  </div>
                  <select
                    name="specialty"
                    required
                    value={formData.specialty}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs sm:text-sm focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-700"
                  >
                    <option value="" disabled>Selecciona tu especialidad</option>
                    {MEDICAL_SPECIALTIES.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* País donde ejerce */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">País donde ejerce</label>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100/80 text-indigo-900 flex items-center justify-center shrink-0">
                    <Globe size={18} />
                  </div>
                  <select
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs sm:text-sm focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-700"
                  >
                    <option value="" disabled>Selecciona tu país</option>
                    {ALL_COUNTRIES.map(c => (
                      <option key={c.code} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100/80 text-indigo-900 flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div className="flex w-full gap-2">
                    <select
                      name="phoneCode"
                      value={formData.phoneCode}
                      onChange={handleChange}
                      className="px-2 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs font-medium focus:bg-white focus:border-cyan-500 outline-none text-slate-700"
                    >
                      <option value="" disabled>Cód.</option>
                      {ALL_COUNTRIES.map(c => (
                        <option key={`code-${c.code}`} value={c.dialCode}>{c.flag} {c.dialCode}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs sm:text-sm focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                      placeholder="612 34 56 78"
                    />
                  </div>
                </div>
              </div>

              {/* Email profesional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email profesional</label>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100/80 text-indigo-900 flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs sm:text-sm focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                    placeholder="Ej.: nombre@tuclinica.com"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100/80 text-indigo-900 flex items-center justify-center shrink-0">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs sm:text-sm focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Checkbox de Términos */}
              <div className="pt-1 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="acceptedTerms"
                  name="acceptedTerms"
                  required
                  checked={formData.acceptedTerms}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <label htmlFor="acceptedTerms" className="text-xs text-slate-600 leading-snug cursor-pointer select-none">
                  He leído y acepto los <a href="#" className="underline text-cyan-600 hover:text-cyan-700">Términos de servicio</a> y la <a href="#" className="underline text-cyan-600 hover:text-cyan-700">Política de privacidad</a>.
                </label>
              </div>

              {/* Botón Submit */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 rounded-2xl text-white font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:opacity-95 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <span>Verificar y probar MIVOR.ai</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Legal footer */}
          <div className="mt-5 flex items-start gap-2 text-[10px] sm:text-[11px] text-slate-400 leading-snug">
            <Lock size={13} className="shrink-0 mt-0.5 text-slate-400" />
            <p>
              Tus datos serán tratados de forma segura y utilizados únicamente para verificar tu perfil profesional y gestionar tu acceso a la versión de prueba. No se compartirán con terceros.
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA: VISIBLE EN TABLETS Y DESKTOPS (md:flex) */}
        {/* 🔹 CAMBIO 1: justify-start en lugar de justify-between */}
        <div className="hidden md:flex md:col-span-6 relative bg-gradient-to-b from-slate-50 via-blue-50/30 to-blue-100/50 flex-col justify-start overflow-hidden border-l border-slate-100">
          
          {/* 1. IMAGEN HERO CON DEGRADADO EXCLUSIVAMENTE EN SU BORDE INFERIOR */}
          <div className="relative w-full h-[420px] lg:h-[400px] overflow-hidden shrink-0">
            <img 
              src={doctorHeroImg} 
              alt="Profesionales Médicos" 
              className="w-full h-full object-cover object-top"
            />
            
            {/* Transición de degradado suave colocada exactamente al final de la imagen */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent pointer-events-none" />
          </div>

          {/* 2. BLOQUE DE TARJETAS DE BENEFICIOS */}
          {/* 🔹 CAMBIO 2: Se eliminan flex-1 y justify-center para evitar que floten en el centro */}
          <div className="px-6 lg:px-8 space-y-3 relative z-10 -mt-6 py-2">
            
            <div className="flex items-center gap-3.5 bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-sm hover:shadow-md border border-white/80 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#0B1E48]">Información fiable y verificada</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">De fuentes médicas de prestigio.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-sm hover:shadow-md border border-white/80 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50">
                <Database size={22} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#0B1E48]">Basada en evidencia científica</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">Guías clínicas, estudios y organismos oficiales.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-sm hover:shadow-md border border-white/80 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50">
                <FileText size={22} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#0B1E48]">Siempre con referencias originales</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">Para que puedas consultar la fuente.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-sm hover:shadow-md border border-white/80 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50">
                <Headphones size={22} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#0B1E48]">Siempre a tu lado</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">Soporte cuando lo necesites.</p>
              </div>
            </div>

          </div>

          {/* 3. RE-LLAMADO A MARCA Y TEXTO ESTILIZADO (LOGO Y TEXTO MÁS GRANDES) */}
          {/* 🔹 CAMBIO 3: mt-4 o mt-auto ajusta el pegado hacia el final de las tarjetas sin crear huecos gigantes */}
          <div className="p-5 flex flex-col items-center text-center space-y-3 relative z-10 shrink-0 mt-2">
            
            {/* Re-llamado del Icono + Nombre MIVOR */}
            <div className="flex items-center gap-3">
              <img 
                src={mivorIconImg} 
                alt="MIVOR Icon" 
                className="w-18 h-18 object-contain drop-shadow-md" 
              />
              <span className="font-extrabold text-2xl sm:text-3xl text-[#0B1E48] tracking-tight">
                MIVOR<span className="text-cyan-500">.ai</span>
              </span>
            </div>

            {/* Frase en cursiva estilizada */}
            <div className="relative inline-block text-center mt-1">
              <p className="font-serif italic text-[#0e527d] font-bold text-sm sm:text-base leading-relaxed -rotate-2 tracking-wide">
                Juntos por una medicina <br />
                más humana y eficiente.
              </p>
              <div className="w-4/5 h-[2px] bg-gradient-to-r from-transparent via-[#0e527d]/60 to-transparent mx-auto mt-1.5 rounded-full" />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}