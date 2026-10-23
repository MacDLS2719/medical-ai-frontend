import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Phone, 
  Globe, 
  Stethoscope, 
  Database, 
  FileText, 
  Headphones, 
  ArrowRight,
  X,
  Camera,
  UploadCloud,
  Trash2,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GoogleProfileModal from './components/GoogleProfileModal';
import CameraCaptureModal from './components/CameraCaptureModal';

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
    linkgoogle: '',
    specialty: '',
    country: '',
    phoneCode: '+34',
    phone: '',
    email: '',
    password: '',
    acceptedTerms: false,
    google_profile_data: null,
    google_photos: [],
  });

  const [certificate, setCertificate] = useState(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleApplyGoogleProfile = (googleData) => {
    const photos = googleData.photos ||
      (googleData.images ? googleData.images.map((img) => img.image_url) : []);

    setFormData(prev => ({
      ...prev,
      linkgoogle: googleData.google_maps_url || prev.linkgoogle,
      google_profile_data: googleData,
      google_photos: photos,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo seleccionado supera el límite permitido de 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const sizeInKb = (file.size / 1024).toFixed(1);

      setCertificate({
        base64: event.target.result,
        name: file.name,
        mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
        size: `${sizeInKb} KB`,
        isImage: isImg,
        isPdf: isPdf,
        previewUrl: isImg ? event.target.result : null
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (capturedData) => {
    setCertificate(capturedData);
    setError(null);
  };

  const handleRemoveCertificate = () => {
    setCertificate(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      linkgoogle: formData.linkgoogle.trim() || null,
      specialty: formData.specialty.trim(),
      residence_country: formData.country,
      phone: `${formData.phoneCode} ${formData.phone.trim()}`,
      email: formData.email.trim(),
      password: formData.password || null,
      language: 'es',
      google_profile_data: formData.google_profile_data || null,
      google_photos: formData.google_photos?.length > 0 ? formData.google_photos : null,
      certificate_base64: certificate?.base64 || null,
      certificate_filename: certificate?.name || null,
      certificate_mime_type: certificate?.mimeType || null,
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
    // 🔹 AJUSTE CONTENEDOR GENERAL: Ocupa la pantalla sin desbordar y centra verticalmente
    <div className="h-screen w-screen bg-slate-200/60 flex items-center justify-center p-2 sm:p-4 overflow-hidden font-sans">
      
      {/* 🔹 AJUSTE TARJETA PRINCIPAL: Altura máxima controlada (92vh) para forzar que quepa en primera vista */}
      <div className="w-full max-w-5xl h-full max-h-[880px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 relative">

        <button 
          type="button" 
          onClick={() => navigate('/')} 
          className="absolute top-4 right-4 z-30 text-slate-400 hover:text-slate-600 transition-colors bg-white/80 p-1.5 rounded-full shadow-xs"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        {/* ================= COLUMNA IZQUIERDA: FORMULARIO CON SCROLL PROPIO ================= */}
        <div className="md:col-span-6 p-5 sm:p-7 flex flex-col justify-between z-10 overflow-y-auto max-h-full">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={mivorIconImg} 
                alt="MIVOR Icon" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-sm" 
              />
              <div className="leading-none">
                <span className="font-extrabold text-2xl sm:text-3xl text-[#0B1E48] tracking-tight">
                  MIVOR<span className="text-cyan-500">.ai</span>
                </span>
                <span className="block text-[9px] sm:text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">
                  BETTER HEALTH. BRIGHTER LIVES.
                </span>
              </div>
            </div>

            {/* Títulos */}
            <h1 className="text-lg sm:text-xl font-extrabold text-[#0B1E48] mb-1 tracking-tight">
              Acceso para profesionales médicos
            </h1>
            <p className="text-xs font-bold text-[#1E293B] mb-1">
              Para probar MIVOR.ai necesitamos verificar que eres médico.
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 mb-4 leading-relaxed">
              Completa los datos para obtener acceso a la versión de prueba y recibir recomendaciones adaptadas a tu especialidad.
            </p>

            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Campos del Formulario */}
            <form onSubmit={handleSubmit} className="space-y-2.5">
              
              {/* Nombre y Apellidos */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Nombre y apellidos</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100/80 text-indigo-900 flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                    placeholder="Ej.: María López García"
                  />
                </div>
              </div>

              {/* Enlace de Google */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="block text-[11px] font-bold text-slate-700">Enlace de Google <span className="text-slate-400 font-normal">(opcional)</span></label>
                  {formData.linkgoogle && formData.linkgoogle.trim().length > 5 && (
                    <button
                      type="button"
                      onClick={() => setIsGoogleModalOpen(true)}
                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 transition-colors"
                    >
                      <Globe size={11} />
                      <span>Ver perfil Google</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100/80 text-indigo-900 flex items-center justify-center shrink-0">
                    <Globe size={16} />
                  </div>
                  <div className="flex w-full gap-2">
                    <input
                      type="url"
                      name="linkgoogle"
                      value={formData.linkgoogle}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                      placeholder="https://maps.app.goo.gl/..."
                    />
                  </div>
                </div>
                {formData.google_profile_data && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                    <span>Aplicado: <strong>{formData.google_profile_data.business_name || 'Perfil'}</strong></span>
                  </div>
                )}
              </div>

              {/* Especialidad médica */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Especialidad médica</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100/80 text-indigo-900 flex items-center justify-center shrink-0">
                    <Stethoscope size={16} />
                  </div>
                  <select
                    name="specialty"
                    required
                    value={formData.specialty}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-700"
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
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">País donde ejerce</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100/80 text-indigo-900 flex items-center justify-center shrink-0">
                    <Globe size={16} />
                  </div>
                  <select
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-700"
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
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Teléfono</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100/80 text-indigo-900 flex items-center justify-center shrink-0">
                    <Phone size={16} />
                  </div>
                  <div className="flex w-full gap-2">
                    <select
                      name="phoneCode"
                      value={formData.phoneCode}
                      onChange={handleChange}
                      className="px-2 py-1.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs font-medium focus:bg-white focus:border-cyan-500 outline-none text-slate-700"
                    >
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
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                      placeholder="612 34 56 78"
                    />
                  </div>
                </div>
              </div>

              {/* Email profesional */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Email profesional</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100/80 text-indigo-900 flex items-center justify-center shrink-0">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                    placeholder="Ej.: nombre@tuclinica.com"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Contraseña</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100/80 text-indigo-900 flex items-center justify-center shrink-0">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Tarjeta Profesional o Certificado Médico */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <FileCheck size={13} className="text-cyan-600" />
                    <span>Tarjeta profesional o certificado</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-normal">Para verificar tu colegiatura</span>
                </div>

                {!certificate ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-2.5 hover:border-cyan-400 transition-colors">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-cyan-700 hover:border-cyan-400 text-xs font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                      >
                        <UploadCloud size={14} className="text-cyan-600" />
                        <span>Subir archivo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCameraModalOpen(true)}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-cyan-50/80 border border-cyan-200 text-cyan-700 hover:bg-cyan-100 text-xs font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                      >
                        <Camera size={14} className="text-cyan-600" />
                        <span>Tomar foto</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center mt-1.5">
                      Formatos soportados: PDF, JPG, PNG o fotografía directa
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-2 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {certificate.isImage && certificate.previewUrl ? (
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-emerald-300 bg-white shrink-0 shadow-2xs">
                          <img
                            src={certificate.previewUrl}
                            alt="Certificado"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 shadow-2xs">
                          <FileText size={18} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-bold text-slate-800 truncate max-w-[170px] sm:max-w-[210px]">
                            {certificate.name}
                          </span>
                          <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span>{certificate.size}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">Adjunto correctamente</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsCameraModalOpen(true)}
                        title="Tomar otra foto"
                        className="p-1 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-white transition-colors cursor-pointer"
                      >
                        <Camera size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Cambiar archivo"
                        className="p-1 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-white transition-colors cursor-pointer"
                      >
                        <UploadCloud size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveCertificate}
                        title="Eliminar"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Checkbox de Términos */}
              <div className="pt-1 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="acceptedTerms"
                  name="acceptedTerms"
                  required
                  checked={formData.acceptedTerms}
                  onChange={handleChange}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <label htmlFor="acceptedTerms" className="text-[11px] text-slate-600 leading-snug cursor-pointer select-none">
                  Acepto los <a href="#" className="underline text-cyan-600">Términos de servicio</a> y la <a href="#" className="underline text-cyan-600">Política de privacidad</a>.
                </label>
              </div>

              {/* Botón Submit */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:opacity-95 transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <span>Verificar y probar MIVOR.ai</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Legal footer */}
          <div className="mt-3 flex items-start gap-1.5 text-[10px] text-slate-400 leading-snug">
            <Lock size={12} className="shrink-0 mt-0.5" />
            <p>Tus datos están seguros y protegidos exclusivamente para validar tu membresía profesional.</p>
          </div>
        </div>

        {/* ================= COLUMNA DERECHA: CON SCROLL PROPIO (overflow-y-auto) ================= */}
        <div className="hidden md:flex md:col-span-6 relative bg-gradient-to-b from-slate-50 via-blue-50/30 to-blue-100/50 flex-col justify-between overflow-y-auto max-h-full border-l border-slate-100">
          
          <div>
            {/* 1. IMAGEN HERO MÁS COMPACTA PARA QUE QUEPA EN PRIMERA VISTA */}
            <div className="relative w-full h-[220px] lg:h-[300px] overflow-hidden shrink-0">
              <img 
                src={doctorHeroImg} 
                alt="Profesionales Médicos" 
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent pointer-events-none" />
            </div>

            {/* 2. BLOQUE DE TARJETAS DE BENEFICIOS */}
            <div className="px-5 lg:px-6 space-y-2.5 relative z-10 mt-8">
              
              <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm p-2.5 rounded-2xl shadow-xs border border-white/80">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0B1E48]">Información fiable y verificada</h4>
                  <p className="text-[10px] text-slate-500 font-medium">De fuentes médicas de prestigio.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm p-2.5 rounded-2xl shadow-xs border border-white/80">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Database size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0B1E48]">Basada en evidencia científica</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Guías clínicas, estudios y organismos oficiales.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm p-2.5 rounded-2xl shadow-xs border border-white/80">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0B1E48]">Siempre con referencias originales</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Para que puedas consultar la fuente directa.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm p-2.5 rounded-2xl shadow-xs border border-white/80">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Headphones size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0B1E48]">Siempre a tu lado</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Soporte cuando lo necesites.</p>
                </div>
              </div>

            </div>
          </div>

          {/* 3. FOOTER / FRASE INSPIRACIONAL */}
          <div className="p-4 flex flex-col items-center text-center space-y-2 relative z-10 shrink-0 mt-2">
            <div className="flex items-center gap-2">
              <img 
                src={mivorIconImg} 
                alt="MIVOR Icon" 
                className="w-10 h-10 object-contain drop-shadow-sm" 
              />
              <span className="font-extrabold text-xl text-[#0B1E48] tracking-tight">
                MIVOR<span className="text-cyan-500">.ai</span>
              </span>
            </div>
            <p className="font-serif italic text-[#0e527d] font-bold text-xs sm:text-sm leading-snug">
              Juntos por una medicina más humana y eficiente.
            </p>
          </div>

        </div>

      </div>

      <GoogleProfileModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        initialUrl={formData.linkgoogle || ''}
        onApplyProfile={handleApplyGoogleProfile}
      />

      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}