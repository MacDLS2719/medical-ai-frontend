import React, { useState } from 'react';
import { ALL_COUNTRIES } from '../../../data/countries';
import { 
  BrainCircuit, 
  Users, 
  ShieldCheck, 
  TrendingUp, 
  Heart, 
  Calendar, 
  Mail, 
  ChevronDown, 
  Lock, 
  Eye, 
  EyeOff, 
  FileText, 
  Award, 
  Upload, 
  ArrowRight,
  User,
  MapPin,
  Headphones,
  Globe
} from 'lucide-react';
import iaBanner from '../../../assets/imgs/mivor-icon.webp';
import mivorIconImg from '../../../assets/imgs/mivor-icon.webp';

export default function Step1Personal({ formData, updateFormData, onNext }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const selectedCountryObj = ALL_COUNTRIES.find((c) => c.name === formData.country) || 
                             ALL_COUNTRIES.find((c) => c.name === 'Colombia') || 
                             ALL_COUNTRIES[0];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    updateFormData({ [name]: type === 'checkbox' ? checked : value });
  };

  const handleCountryChange = (e) => {
    const selected = ALL_COUNTRIES.find((c) => c.name === e.target.value);
    if (selected) {
      updateFormData({
        country: selected.name,
        phoneCode: selected.dialCode,
      });
    }
  };

  const handleFileChange = (e, field) => {
    if (e.target.files && e.target.files[0]) {
      updateFormData({ [field]: e.target.files[0] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      alert('Debes aceptar los Términos de servicio y la Política de privacidad.');
      return;
    }
    onNext();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-5 bg-[#F8FAFC] rounded-3xl font-sans min-h-0 lg:max-h-[92vh] flex flex-col justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-5 items-stretch h-full overflow-hidden">
        
        {/* Sidebar Izquierda (Columna 3/12) */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col justify-between py-1 overflow-y-auto max-h-full pr-1">
          <div className="space-y-2.5">
            <div>
              <div className="flex flex-col items-center text-center">
                <h2 className="text-lg xl:text-4xl font-extrabold text-[#0B1E48] leading-tight tracking-tight mb-0.5 text-center">
                  Únete a
                </h2>
                <div className="flex items-center justify-center gap-2">
                  <img 
                    src={mivorIconImg} 
                    alt="MIVOR Icon" 
                    className="w-12 h-12 xl:w-16 xl:h-16 object-contain drop-shadow-md" 
                  />
                  <span className="font-extrabold text-lg xl:text-4xl text-[#0B1E48] tracking-tight">
                    MIVOR<span className="text-cyan-500">.ai</span>
                  </span>
                </div>
              </div>
              <p className="text-[10px] xl:text-[15px] text-slate-500 mt-0.5 leading-snug">
                La plataforma de IA médica hecha para profesionales como tú.
              </p>
            </div>

            {/* Tarjetas informativas adaptadas */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-[#0052FF] shrink-0">
                  <BrainCircuit size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0B1E48]">IA clínica avanzada</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-tight">Resúmenes inteligentes, análisis y apoyo en decisiones médicas.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-[#0052FF] shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0B1E48]">Gestiona tus pacientes</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-tight">Historias completas, pruebas, medicación y consultas en un solo lugar.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0B1E48]">Seguro y confidencial</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-tight">Cumplimos con los más altos estándares de seguridad y privacidad para proteger tus datos médicos.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque inferior alineado */}
          <div className="space-y-3 pt-2.5 border-t border-slate-200/50 mt-2 shrink-0">
            {/* Tarjeta de ayuda más grande */}
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-[#0052FF] shrink-0">
                <Headphones size={20} />
              </div>
              <div className="text-xs">
                <p className="font-bold text-[#0B1E48]">¿Necesitas ayuda?</p>
                <p className="text-[#0052FF] font-semibold text-xs">soporte@mivor.ai</p>
              </div>
            </div>

            {/* Texto estilo manuscrito con subrayado */}
            <div className="text-center pt-1">
              <span className="relative inline-block font-['Dancing_Script',cursive] italic text-lg font-bold text-[#1E2B58]">
                Juntos por una salud mejor
                {/* Subrayado verde/turquesa bajo la palabra 'por' */}
                <span className="absolute bottom-0 left-[22%] w-[32%] h-[2.5px] bg-[#2DD4BF] rounded-full"></span>
              </span>
            </div>
          </div>
        </aside>

        {/* Formulario Central (Columna 6/12) */}
        <main className="lg:col-span-6 w-full flex flex-col justify-between overflow-y-auto max-h-full pr-1">
          <div>
            <div className="lg:hidden mb-3 text-center flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <img 
                  src={mivorIconImg} 
                  alt="MIVOR Icon" 
                  className="w-8 h-8 object-contain drop-shadow-md" 
                />
                <span className="font-extrabold text-lg text-[#0B1E48] tracking-tight">
                  MIVOR<span className="text-cyan-500">.ai</span>
                </span>
              </div>
              <h1 className="text-base font-black text-[#0B1E48] tracking-tight">Crea tu cuenta profesional</h1>
            </div>

            <div className="hidden lg:block mb-2">
              <h1 className="text-lg xl:text-xl font-black text-[#0B1E48] tracking-tight">Crea tu cuenta profesional</h1>
              <p className="text-[10px] xl:text-[11px] text-slate-500 mt-0.5">El proceso es rápido, seguro y 100% confidencial.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              {/* Bloque 1: Datos Personales */}
              <div className="bg-white rounded-2xl p-3 xl:p-3.5 border border-slate-100 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <User size={15} className="text-[#0052FF]" />
                  <h3 className="text-[10px] xl:text-[11px] font-extrabold text-[#0052FF] uppercase tracking-wider">1. Datos personales</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Nombre</label>
                    <div className="relative">
                      <User size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        name="firstName"
                        required
                        placeholder="Ingresa tu nombre"
                        value={formData.firstName || ''}
                        onChange={handleChange}
                        className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-[#0052FF] outline-none bg-slate-50/30 hover:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Apellidos</label>
                    <div className="relative">
                      <User size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        name="lastName"
                        required
                        placeholder="Ingresa tus apellidos"
                        value={formData.lastName || ''}
                        onChange={handleChange}
                        className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-[#0052FF] outline-none bg-slate-50/30 hover:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Fecha de nacimiento</label>
                    <div className="relative flex items-center">
                      <input
                        type="date"
                        name="birth_date"
                        value={formData.birth_date || ''}
                        onChange={handleChange}
                        className="w-full pl-2 pr-6 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-[#0052FF] outline-none bg-slate-50/30 hover:bg-white transition-all cursor-pointer text-slate-800 relative z-10 opacity-100 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                      <Calendar size={13} className="absolute right-2 text-slate-400 pointer-events-none z-0" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">País de residencia</label>
                    <div className="relative">
                      <MapPin size={13} className="absolute left-2.5 top-2.5 text-slate-400 z-10" />
                      <select
                        name="country"
                        value={formData.country || selectedCountryObj.name}
                        onChange={handleCountryChange}
                        className="w-full pl-7 pr-6 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-[#0052FF] outline-none bg-slate-50/30 hover:bg-white appearance-none transition-all cursor-pointer text-slate-800"
                      >
                        {ALL_COUNTRIES.map((c) => (
                          <option key={c.code} value={c.name}>
                            {c.flag} {c.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Correo electrónico</label>
                    <div className="relative">
                      <Mail size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="tu@email.com"
                        value={formData.email || ''}
                        onChange={handleChange}
                        className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-[#0052FF] outline-none bg-slate-50/30 hover:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Teléfono</label>
                    <div className="flex gap-1.5">
                      <div className="relative shrink-0">
                        <select
                          name="phoneCode"
                          value={formData.phoneCode || selectedCountryObj.dialCode}
                          onChange={handleChange}
                          className="h-full pl-1.5 pr-4 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-[#0052FF] outline-none hover:bg-white transition-all"
                        >
                          {ALL_COUNTRIES.map((c) => (
                            <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
                              {c.flag} {c.dialCode}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-1 top-2.5 text-slate-400 pointer-events-none" />
                      </div>

                      <input
                        type="tel"
                        name="phone"
                        placeholder="600 123 456"
                        value={formData.phone || ''}
                        onChange={handleChange}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-[#0052FF] outline-none bg-slate-50/30 hover:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Idioma preferido</label>
                    <div className="relative">
                      <Globe size={13} className="absolute left-2.5 top-2.5 text-slate-400 z-10" />
                      <select
                        name="language"
                        value={formData.language || 'Español'}
                        onChange={handleChange}
                        className="w-full pl-7 pr-6 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-[#0052FF] outline-none bg-slate-50/30 hover:bg-white appearance-none transition-all cursor-pointer text-slate-800"
                      >
                        <option value="Español">Español</option>
                        <option value="Inglés">Inglés</option>
                      </select>
                      <ChevronDown size={13} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Crea tu contraseña */}
              <div className="bg-white rounded-2xl p-3 xl:p-3.5 border border-slate-100 shadow-sm space-y-1.5">
                <div className="flex items-center gap-2">
                  <Lock size={15} className="text-[#0052FF]" />
                  <h3 className="text-[10px] xl:text-[11px] font-extrabold text-[#0052FF] uppercase tracking-wider">2. Crea tu contraseña</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Crea una contraseña segura</label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        placeholder="Contraseña"
                        value={formData.password || ''}
                        onChange={handleChange}
                        className="w-full pl-7 pr-6 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-[#0052FF] outline-none bg-slate-50/30 hover:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Confirma tu contraseña</label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        required
                        placeholder="Repite tu contraseña"
                        value={formData.confirmPassword || ''}
                        onChange={handleChange}
                        className="w-full pl-7 pr-6 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-[#0052FF] outline-none bg-slate-50/30 hover:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[9px] xl:text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full border border-slate-300 text-slate-500 flex items-center justify-center text-[8px] font-bold shrink-0">i</span>
                  Mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos.
                </p>
              </div>

              {/* Bloque 3: Verificación profesional */}
              <div className="bg-white rounded-2xl p-3 xl:p-3.5 border border-slate-100 shadow-sm space-y-1.5">
                <div className="flex items-center gap-2">
                  <Award size={15} className="text-[#0052FF]" />
                  <h3 className="text-[10px] xl:text-[11px] font-extrabold text-[#0052FF] uppercase tracking-wider">3. Verificación profesional</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Documento */}
                  <div className="px-2.5 py-1.5 rounded-xl bg-slate-50/60 border border-slate-200/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1 rounded-lg bg-blue-100/60 text-[#0052FF] shrink-0">
                        <FileText size={15} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-bold text-[#0B1E48] truncate">Documento de identidad</h4>
                        <p className="text-[8px] xl:text-[9px] text-slate-400 truncate">DNI, pasaporte u oficial</p>
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-blue-200 text-[#0052FF] text-[10px] font-semibold rounded-lg hover:bg-blue-50 cursor-pointer shadow-sm transition-all shrink-0">
                      <Upload size={10} />
                      <span className="truncate max-w-[70px]">{formData.identityDoc ? 'Subido' : 'Subir'}</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileChange(e, 'identityDoc')}
                      />
                    </label>
                  </div>

                  {/* Colegiación */}
                  <div className="px-2.5 py-1.5 rounded-xl bg-slate-50/60 border border-slate-200/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1 rounded-lg bg-blue-100/60 text-[#0052FF] shrink-0">
                        <Award size={15} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-bold text-[#0B1E48] truncate">Certificado colegiación</h4>
                        <p className="text-[8px] xl:text-[9px] text-slate-400 truncate">Certificado colegio médico</p>
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-blue-200 text-[#0052FF] text-[10px] font-semibold rounded-lg hover:bg-blue-50 cursor-pointer shadow-sm transition-all shrink-0">
                      <Upload size={10} />
                      <span className="truncate max-w-[70px]">{formData.colegiationCert ? 'Subido' : 'Subir'}</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileChange(e, 'colegiationCert')}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 pt-0.5">
                  <ShieldCheck size={13} className="text-[#0052FF] shrink-0" />
                  <span className="text-[9px] xl:text-[10px]">Tu información está protegida y será verificada de forma segura.</span>
                </div>
              </div>

              {/* Footer Submit (Botón Continuar siempre visible) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                <label className="flex items-start sm:items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={!!formData.termsAccepted}
                    onChange={handleChange}
                    className="w-3.5 h-3.5 mt-0.5 sm:mt-0 rounded border-slate-300 text-[#0052FF] focus:ring-[#0052FF] cursor-pointer shrink-0"
                  />
                  <span className="text-[9px] xl:text-[10px] text-slate-600">
                    He leído y acepto los{' '}
                    <a href="#" className="text-[#0052FF] font-semibold hover:underline">Términos de servicio</a> y la{' '}
                    <a href="#" className="text-[#0052FF] font-semibold hover:underline">Política de privacidad</a>.
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2 bg-[#0052FF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
                >
                  <span>Continuar</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* Sidebar Derecha (Columna 3/12) */}
        <aside className="hidden lg:flex lg:col-span-3 bg-white border border-slate-100 rounded-3xl p-3.5 xl:p-4 flex-col justify-between overflow-y-auto max-h-full shadow-sm">
          <div>
            {/* La altura de la imagen se mantiene intacta */}
            <div className="h-36 xl:h-60 rounded-2xl overflow-hidden mb-2 flex items-center justify-center bg-slate-50">
              <img src={iaBanner} alt="IA Médica MIVOR" className="w-full h-full object-cover object-center" />
            </div>

            {/* Título más compacto */}
            <h3 className="text-base xl:text-lg font-black text-[#0B1E48] leading-tight">
              Inteligencia artificial <br />
              para una medicina <br />
              <span className="text-[#0052FF]">más humana.</span>
            </h3>
            
            {/* Descripción ajustada */}
            <p className="text-[11px] xl:text-xs text-slate-500 mt-1 leading-snug">
              Ahorra tiempo, toma mejores decisiones y ofrece una atención excepcional a cada paciente.
            </p>

            {/* Lista con iconos y textos más reducidos */}
            <div className="mt-2.5 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <div className="p-1 rounded-md bg-blue-50 text-[#0052FF] shrink-0">
                  <BrainCircuit size={14} />
                </div>
                <span className="text-[11px] xl:text-xs text-slate-800 font-semibold">
                  Inteligencia que entiende tu contexto clínico
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <div className="p-1 rounded-md bg-blue-50 text-[#0052FF] shrink-0">
                  <ShieldCheck size={14} />
                </div>
                <span className="text-[11px] xl:text-xs text-slate-800 font-semibold">
                  Información confiable y basada en evidencia
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <div className="p-1 rounded-md bg-[#E6F8F6] text-emerald-600 shrink-0">
                  <TrendingUp size={14} />
                </div>
                <span className="text-[11px] xl:text-xs text-slate-800 font-semibold">
                  Análisis que te ayuda a decidir mejor
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <div className="p-1 rounded-md bg-pink-50 text-pink-500 shrink-0">
                  <Heart size={14} />
                </div>
                <span className="text-[11px] xl:text-xs text-slate-800 font-semibold">
                  Herramientas diseñadas para médicos como tú
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center mt-2 shrink-0">
            <p className="text-[8px] xl:text-[9px] tracking-widest text-slate-400 font-extrabold uppercase">
              Better Health. Brighter Lives.
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}