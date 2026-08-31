import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Users, 
  ShieldCheck, 
  HelpCircle, 
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
  ArrowRight 
} from 'lucide-react';
import iaBanner from '../../../assets/Imges_Paciente.png';

export default function Step1Personal({ formData, updateFormData, onNext }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    updateFormData({ [name]: type === 'checkbox' ? checked : value });
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
    <div className="flex-1 flex gap-8">
      {/* Sidebar Izquierda - Paso 1 */}
      <aside className="w-72 shrink-0 flex flex-col justify-between py-2">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-extrabold text-blue-950 leading-tight">Únete a<br /><span className="text-blue-600">Vital IA</span></h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">La plataforma de IA médica hecha para profesionales como tú.</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shrink-0"><BrainCircuit size={20} /></div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">IA clínica avanzada</h4>
                <p className="text-xs text-slate-500 mt-0.5">Resúmenes inteligentes, análisis y apoyo en decisiones.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0"><Users size={20} /></div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Gestiona tus pacientes</h4>
                <p className="text-xs text-slate-500 mt-0.5">Historiales completos, pruebas y consultas en un lugar.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0"><ShieldCheck size={20} /></div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Seguro y confidencial</h4>
                <p className="text-xs text-slate-500 mt-0.5">Cumplimos los más altos estándares de privacidad.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/60 flex items-center gap-3">
          <HelpCircle className="text-blue-600 shrink-0" size={24} />
          <div className="text-xs">
            <p className="font-bold text-slate-700">¿Necesitas ayuda?</p>
            <p className="text-blue-600 font-medium">soporte@vitalia.com</p>
          </div>
        </div>
      </aside>

      {/* Formulario Central - Paso 1 */}
      <main className="flex-1 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Crea tu cuenta profesional</h1>
          <p className="text-sm text-slate-500 mt-1">El proceso es rápido, seguro y 100% confidencial.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bloque 1: Datos Personales */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-blue-600">1. Datos personales</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nombre</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="Ingresa tu nombre"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Apellidos</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="Ingresa tus apellidos"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fecha de nacimiento</label>
                <div className="relative">
                  <input
                    type="text"
                    name="birthDate"
                    placeholder="DD / MM / AAAA"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white transition-all"
                  />
                  <Calendar size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">País de residencia</label>
                <div className="relative">
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white appearance-none transition-all cursor-pointer"
                  >
                    <option value="Colombia">Colombia</option>
                    <option value="España">España</option>
                    <option value="México">México</option>
                    <option value="Argentina">Argentina</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Correo electrónico</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Teléfono</label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs shrink-0">
                    <span>🇪🇸</span>
                    <span className="text-slate-500 font-medium">+34</span>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="600 123 456"
                    value={formData.phone}
                    onChange={handleChange}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Idioma preferido</label>
                <div className="relative">
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white appearance-none transition-all cursor-pointer"
                  >
                    <option value="Español">Español</option>
                    <option value="Inglés">Inglés</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 2: Crea tu contraseña */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-blue-600">2. Crea tu contraseña</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Crea una contraseña segura</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    placeholder="Crea una contraseña segura"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirma tu contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    placeholder="Repite tu contraseña"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Mínimo 8 caracteres, incluye mayúsculas, minúsculas, números y símbolos.
            </p>
          </div>

          {/* Bloque 3: Verificación profesional */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-blue-600">3. Verificación profesional</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200/60 flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-purple-100/70 text-purple-600 shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-800">Documento de identidad</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">DNI, pasaporte o documento oficial</p>
                  
                  <label className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 bg-white border border-blue-200 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-50 cursor-pointer shadow-sm transition-all">
                    <Upload size={14} />
                    <span>{formData.identityDoc ? formData.identityDoc.name : 'Subir archivo'}</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileChange(e, 'identityDoc')}
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1.5">JPG, PNG o PDF. Máx, 10MB</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200/60 flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-blue-100/70 text-blue-600 shrink-0">
                  <Award size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-800">Certificado de colegiación</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Certificado vigente de tu colegio médico</p>
                  
                  <label className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 bg-white border border-blue-200 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-50 cursor-pointer shadow-sm transition-all">
                    <Upload size={14} />
                    <span>{formData.colegiationCert ? formData.colegiationCert.name : 'Subir archivo'}</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileChange(e, 'colegiationCert')}
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1.5">JPG, PNG o PDF. Máx, 10MB</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <ShieldCheck size={16} className="text-blue-600 shrink-0" />
              <span>Tu información está protegida y será verificada de forma segura.</span>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>
                He leído y acepto los{' '}
                <a href="#" className="text-blue-600 font-semibold hover:underline">Términos de servicio</a> y la{' '}
                <a href="#" className="text-blue-600 font-semibold hover:underline">Política de privacidad</a>.
              </span>
            </label>

            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer shrink-0"
            >
              <span>Continuar</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </main>

      {/* Sidebar Derecha - Banner Exclusivo del Paso 1 */}
      <aside className="w-80 shrink-0 bg-gradient-to-b from-blue-50/50 to-indigo-50/30 border border-slate-200/60 rounded-3xl p-6 flex flex-col justify-between overflow-hidden">
        <div className="relative">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-6 shadow-sm border border-white">
            <img src={iaBanner} alt="IA Médica" className="w-full h-full object-cover" />
          </div>

          <h3 className="text-xl font-black text-slate-900 leading-snug">
            La <span className="text-blue-600">inteligencia artificial</span> que acompaña tu práctica médica.
          </h3>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            Ahorra tiempo, toma mejores decisiones y ofrece una atención excepcional a cada paciente.
          </p>

          <div className="mt-6 space-y-3.5 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700 font-medium">
              <div className="p-1 rounded-lg bg-purple-100 text-purple-600"><BrainCircuit size={16} /></div>
              <span>Inteligencia que entiende tu contexto clínico</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 font-medium">
              <div className="p-1 rounded-lg bg-blue-100 text-blue-600"><ShieldCheck size={16} /></div>
              <span>Información confiable y basada en evidencia</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 font-medium">
              <div className="p-1 rounded-lg bg-emerald-100 text-emerald-600"><TrendingUp size={16} /></div>
              <span>Análisis que te ayuda a decidir mejor</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 font-medium">
              <div className="p-1 rounded-lg bg-rose-100 text-rose-600"><Heart size={16} /></div>
              <span>Herramientas diseñadas para médicos como tú</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}