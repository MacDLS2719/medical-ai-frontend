import React, { useState } from 'react';
import { ALL_COUNTRIES } from '../../../data/countries';
import { MEDICAL_SPECIALTIES } from '../../../data/specialty';
import { MEDICAL_SUBSPECIALTIES } from '../../../data/subspeciality';
import { 
  BrainCircuit, 
  Users, 
  ShieldCheck, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight,
  ChevronDown 
} from 'lucide-react';
import iaHeaderImg from '../../../assets/imgs/mivor-icon.webp';
import DoctorLocationMap from '../../../components/common/DoctorLocationMap';

export default function Step2Professional({ formData, updateFormData, onNext, onPrev }) {
  const [bio, setBio] = useState(formData.bio || '');

  const selectedCountryObj = ALL_COUNTRIES.find((c) => c.name === formData.country) || 
                             ALL_COUNTRIES.find((c) => c.name === 'Colombia') || 
                             ALL_COUNTRIES[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'bio') {
      if (value.length <= 300) {
        setBio(value);
        updateFormData({ [name]: value });
      }
    } else {
      updateFormData({ [name]: value });
    }
  };

  const handleLocationChange = ({ latitude, longitude }) => {
    updateFormData({ latitude, longitude });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-3 xl:gap-5 items-start w-full">
      {/* Sidebar Izquierda */}
      <aside className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 flex-col gap-2.5">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm space-y-2.5">
          <div className="flex flex-col items-center text-center">
            <div className="w-40 h-40 rounded-xl overflow-hidden mb-1.5 shadow-sm bg-slate-50">
              <img src={iaHeaderImg} alt="IA Médica MIVOR" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xs xl:text-sm font-black text-[#0B1E48] leading-tight">
              La <span className="text-[#0052FF]">inteligencia artificial</span> que acompaña tu práctica médica.
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
              Ahorra tiempo, toma mejores decisiones y ofrece una atención excepcional.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm flex items-start gap-2">
              <div className="p-1 rounded-lg bg-blue-50 text-[#0052FF] shrink-0">
                <BrainCircuit size={14} />
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-[#0B1E48]">IA clínica avanzada</h4>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Resúmenes inteligentes y apoyo en decisiones.</p>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm flex items-start gap-2">
              <div className="p-1 rounded-lg bg-blue-50 text-[#0052FF] shrink-0">
                <Users size={14} />
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-[#0B1E48]">Gestiona tus pacientes</h4>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Historiales, consultas y pruebas en un solo lugar.</p>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm flex items-start gap-2">
              <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <ShieldCheck size={14} />
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-[#0B1E48]">Seguro y confidencial</h4>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Cumplimos con estándares de privacidad.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-2">
          <HelpCircle className="text-[#0052FF] shrink-0" size={16} />
          <div className="text-[10px]">
            <p className="font-bold text-[#0B1E48]">¿Necesitas ayuda?</p>
            <p className="text-slate-500">soporte@vitalia.com</p>
          </div>
        </div>
      </aside>

      {/* Formulario Principal */}
      <main className="w-full flex-1 bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-sm min-w-0">
        <form onSubmit={handleSubmit} className="space-y-2">
          
          {/* Encabezado Principal */}
          <div>
            <h2 className="text-xs sm:text-sm font-black text-[#0B1E48]">Información profesional</h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500">Cuéntanos más sobre tu práctica médica.</p>
          </div>

          {/* Fila 1: Especialidad, Subespecialidad, Colegiado, Colegio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700 mb-0.5">Especialidad principal</label>
              <div className="relative">
                <select
                  name="specialty"
                  required
                  value={formData.specialty || ''}
                  onChange={(e) => {
                    handleChange(e);
                    updateFormData({ subspecialty: '' });
                  }}
                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none bg-white appearance-none transition-all cursor-pointer pr-6 truncate"
                >
                  <option value="" disabled>Selecciona una especialidad</option>
                  {MEDICAL_SPECIALTIES.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700 mb-0.5">Subespecialidad <span className="text-slate-400 font-normal">(opc)</span></label>
              <div className="relative">
                <select
                  name="subspecialty"
                  value={formData.subspecialty || ''}
                  onChange={handleChange}
                  disabled={!formData.specialty || !MEDICAL_SUBSPECIALTIES[formData.specialty]}
                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none bg-white appearance-none transition-all cursor-pointer pr-6 truncate disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">Selecciona una subespecialidad</option>
                  {formData.specialty && MEDICAL_SUBSPECIALTIES[formData.specialty] && MEDICAL_SUBSPECIALTIES[formData.specialty].map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700 mb-0.5">N.º de colegiado</label>
              <input
                type="text"
                name="colegiatedNumber"
                required
                placeholder="Número de colegiado"
                value={formData.colegiatedNumber || ''}
                onChange={handleChange}
                className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700 mb-0.5">Colegio profesional</label>
              <input
                type="text"
                name="professionalCollege"
                required
                placeholder="Nombre del colegio"
                value={formData.professionalCollege || ''}
                onChange={handleChange}
                className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Fila 2: País, Experiencia, Código Postal, Teléfono, Sitio Web */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <div>
              <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700 mb-0.5">País del colegio</label>
              <div className="relative">
                <select
                  name="collegeCountry"
                  required
                  value={formData.collegeCountry || formData.country || 'Colombia'}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none bg-white appearance-none transition-all cursor-pointer pr-6 truncate"
                >
                  {ALL_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700 mb-0.5">Años de experiencia</label>
              <div className="relative">
                <select
                  name="experienceYears"
                  required
                  value={formData.experienceYears || ''}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none bg-white appearance-none transition-all cursor-pointer pr-6"
                >
                  <option value="" disabled>Ej: 5 años</option>
                  {Array.from({ length: 101 }, (_, i) => (
                    <option key={i} value={i}>
                      {i} {i === 1 ? 'año' : 'años'}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700 mb-0.5">Código postal</label>
              <input
                type="text"
                name="zipCode"
                placeholder="Ej: 110111"
                value={formData.zipCode || ''}
                onChange={handleChange}
                className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700 mb-0.5">Teléfono de consulta</label>
              <div className="flex gap-1">
                <div className="relative shrink-0">
                  <select
                    name="consultationPhoneCode"
                    value={formData.consultationPhoneCode || formData.phoneCode || selectedCountryObj.dialCode}
                    onChange={handleChange}
                    className="h-full pl-1 pr-3 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[10px] text-slate-700 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none transition-all"
                  >
                    {ALL_COUNTRIES.map((c) => (
                      <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
                        {c.flag} {c.dialCode}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="absolute right-0.5 top-2 text-slate-400 pointer-events-none" />
                </div>

                <input
                  type="tel"
                  name="consultationPhone"
                  placeholder="300 123 4567"
                  value={formData.consultationPhone || ''}
                  onChange={handleChange}
                  className="w-full min-w-0 px-2 py-1 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700 mb-0.5">Sitio web <span className="text-slate-400 font-normal">(opc)</span></label>
              <input
                type="url"
                name="website"
                placeholder="www.tusitio.com"
                value={formData.website || ''}
                onChange={handleChange}
                className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Sección Inferior Layout Dividido */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1 items-start">
            
            {/* Columna Izquierda: Sobre ti + Dirección */}
            <div className="md:col-span-7 flex flex-col space-y-2">
              {/* Sobre ti */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700">Sobre ti <span className="text-slate-400 font-normal">(opcional)</span></label>
                  <span className="text-[9px] text-slate-400">{bio.length}/300</span>
                </div>
                <textarea
                  name="bio"
                  rows={2}
                  placeholder="Cuéntanos brevemente sobre tu trayectoria profesional..."
                  value={bio}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none transition-all resize-none placeholder:text-slate-400"
                />
              </div>

              {/* Dirección profesional */}
              <div className="space-y-1.5">
                <div>
                  <h3 className="text-xs font-bold text-[#0B1E48]">Dirección profesional y ubicación</h3>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Ingresa los datos de tu consultorio. El mapa ubicará automáticamente el punto.
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Nombre de la clínica</label>
                    <input
                      type="text"
                      name="clinicName"
                      placeholder="Ej: Centro San Rafael"
                      value={formData.clinicName || ''}
                      onChange={handleChange}
                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Dirección consultorio</label>
                    <input
                      type="text"
                      name="address"
                      placeholder="Ej: Cra 15 # 93-60, Cons 402"
                      value={formData.address || ''}
                      onChange={handleChange}
                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Ciudad</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="Ej: Bogotá, Medellín..."
                      value={formData.city || ''}
                      onChange={handleChange}
                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Mapa Limpio + Mensaje Informativo Abajo */}
            <div className="md:col-span-5 flex flex-col justify-start">
              <span className="block text-[10px] sm:text-[11px] font-bold text-[#0B1E48] mb-1">📍 Ubicación en el mapa</span>
              
              {/* Cuadro Mapa Completamente Limpio */}
              <div className="w-full h-[165px] sm:h-[175px] xl:h-[185px] rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
                <DoctorLocationMap
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  address={formData.address}
                  city={formData.city}
                  country={formData.country || 'Colombia'}
                  onChange={handleLocationChange}
                  readOnly={false}
                  height="100%"
                  title=""
                />
              </div>

              {/* Mensaje Informativo del Punto de Atención Fuera del Mapa */}
              <p className="text-[9.5px] text-slate-500 mt-1.5 leading-snug">
                <strong className="text-[#0B1E48]">Punto de atención médica:</strong> El mapa se centra automáticamente según la ciudad y dirección. Puedes arrastrar o hacer clic en el pin para ajustar.
              </p>
            </div>

          </div>

          {/* Botones de Navegación Inferiores */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onPrev}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft size={14} />
              <span>Volver</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-1 px-5 py-1.5 bg-[#0052FF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/10 transition-all cursor-pointer shrink-0"
            >
              <span>Continuar</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}