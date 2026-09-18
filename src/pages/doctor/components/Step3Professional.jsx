import React from 'react';
import { 
  User, 
  Calendar, 
  Globe, 
  Mail, 
  Phone, 
  Languages, 
  Stethoscope, 
  FileText, 
  Building2, 
  Award, 
  Star, 
  AlignLeft, 
  CheckCircle2, 
  Pencil, 
  ArrowLeft, 
  ArrowRight, 
  BrainCircuit, 
  Users, 
  ShieldCheck, 
  HelpCircle,
  MapPin
} from 'lucide-react';
import iaHeaderImg from '../../../assets/imgs/mivor-icon.webp';
import DoctorLocationMap from '../../../components/common/DoctorLocationMap';

export default function Step3Professional({ formData, onNext, onPrev, goToStep }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-5 md:p-6 bg-slate-50/50">
      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-5 items-start">
        
        {/* Bloque Izquierdo Principal */}
        <main className="w-full flex-1 space-y-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 rounded-full bg-blue-100 text-blue-600">
                <CheckCircle2 size={18} />
              </span>
              REVISA TU INFORMACIÓN
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Por favor, verifica que todos tus datos sean correctos antes de continuar.
            </p>
          </div>

          {/* Grid de Secciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Datos Personales */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                      <User size={15} />
                    </div>
                    <span>Datos personales</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-all cursor-pointer"
                  >
                    <Pencil size={12} />
                    <span>Editar</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><User size={13} /> Nombre</span>
                    <span className="font-semibold text-slate-800 text-right truncate">
                      {formData.firstName || formData.lastName ? `Dr. ${formData.firstName} ${formData.lastName}` : 'Dr. das das'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><Calendar size={13} /> Nacimiento</span>
                    <span className="font-semibold text-slate-800">{formData.birthDate || '15 / 04 / 1985'}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><Globe size={13} /> País</span>
                    <span className="font-semibold text-slate-800">{formData.country || 'Colombia'}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><Mail size={13} /> Correo</span>
                    <span className="font-semibold text-slate-800 text-right truncate">{formData.email || 'ddsda@xda.co'}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><Phone size={13} /> Teléfono</span>
                    <span className="font-semibold text-slate-800">{formData.phone || '+34 600 123 456'}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><Languages size={13} /> Idioma</span>
                    <span className="font-semibold text-slate-800">{formData.language || 'Español'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Documentos Enviados */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                      <ShieldCheck size={15} />
                    </div>
                    <span>Documentos enviados</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-all cursor-pointer"
                  >
                    <Pencil size={12} />
                    <span>Editar</span>
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  {formData.identityDoc ? (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <div className="truncate">
                        <p className="text-[10px] text-slate-400 font-medium">Documento de identidad</p>
                        <p className="font-semibold text-slate-700 truncate">
                          {formData.identityDoc.name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100 flex items-center gap-2.5 opacity-60">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                      <div className="truncate">
                        <p className="text-[10px] text-slate-400 font-medium">Documento de identidad</p>
                        <p className="font-semibold text-slate-500 truncate">No subido</p>
                      </div>
                    </div>
                  )}

                  {formData.colegiationCert ? (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <div className="truncate">
                        <p className="text-[10px] text-slate-400 font-medium">Certificado de colegiación</p>
                        <p className="font-semibold text-slate-700 truncate">
                          {formData.colegiationCert.name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100 flex items-center gap-2.5 opacity-60">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                      <div className="truncate">
                        <p className="text-[10px] text-slate-400 font-medium">Certificado de colegiación</p>
                        <p className="font-semibold text-slate-500 truncate">No subido</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Información Profesional DIVIDIDA EN 2 COLUMNAS (Texto / Mapa) */}
            <div className="md:col-span-2 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <Stethoscope size={15} />
                  </div>
                  <span>Información profesional</span>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-all cursor-pointer"
                >
                  <Pencil size={12} />
                  <span>Editar</span>
                </button>
              </div>

              {/* Grid Interno: Columna Izquierda (Campos) / Columna Derecha (Mapa) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                
                {/* LADO IZQUIERDO: Datos Profesionales + Descripción */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 flex items-center gap-1 text-[11px]"><Stethoscope size={12} /> Especialidad</span>
                      <p className="font-semibold text-slate-800 truncate">{formData.specialty || 'Dermatología'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 flex items-center gap-1 text-[11px]"><FileText size={12} /> Nº Colegiado</span>
                      <p className="font-semibold text-slate-800 truncate">{formData.colegiatedNumber || 'dsa'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 flex items-center gap-1 text-[11px]"><Building2 size={12} /> Colegio</span>
                      <p className="font-semibold text-slate-800 truncate">{formData.professionalCollege || '511'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 flex items-center gap-1 text-[11px]"><Globe size={12} /> País colegio</span>
                      <p className="font-semibold text-slate-800 truncate">{formData.collegeCountry || 'España'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 flex items-center gap-1 text-[11px]"><Award size={12} /> Experiencia</span>
                      <p className="font-semibold text-slate-800 truncate">{formData.experienceYears || '5 años'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 flex items-center gap-1 text-[11px]"><Star size={12} /> Subespecialidad</span>
                      <p className="font-semibold text-slate-800 truncate">{formData.subspecialty || 'Dermatopatología'}</p>
                    </div>
                  </div>

                  <div className="text-xs pt-2 border-t border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1 text-[11px]"><AlignLeft size={12} /> Descripción</span>
                    <p className="font-medium text-slate-700 mt-0.5 line-clamp-2 text-[11px] leading-relaxed">
                      {formData.bio || 'Especialista en cardiología intervencionista con experiencia en hemodinámica, angioplastia y manejo de enfermedades coronarias.'}
                    </p>
                  </div>
                </div>

                {/* LADO DERECHO: Mapa y Consulta */}
                <div className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1 text-[11px]"><MapPin size={12} /> Consulta</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                      {formData.address ? `${formData.address}${formData.city ? `, ${formData.city}` : ''}` : 'Sin dirección especificada'}
                    </span>
                  </div>

                  <div className="w-full h-36 lg:h-full min-h-[130px] rounded-xl overflow-hidden border border-slate-200">
                    <DoctorLocationMap
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      address={formData.address}
                      city={formData.city}
                      country={formData.country || 'Colombia'}
                      readOnly={true}
                      height="100%"
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Botones de Navegación Siempre Visibles */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onPrev}
              className="flex items-center gap-1.5 px-4 py-2 border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Volver</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>Continuar</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </main>

        {/* Lateral Derecho Fijo - Versión Ampliada y Mejorada */}
        <aside className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4 text-center">
            
            {/* Imagen de Perfil/IA Ampliada */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mx-auto shadow-md border-2 border-slate-100 ring-4 ring-blue-50/50">
              <img src={iaHeaderImg} alt="IA Médica" className="w-full h-full object-cover" />
            </div>

            {/* Títulos y Encabezado con Mayor Tamaño */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                La <span className="text-blue-600">inteligencia artificial</span> que acompaña tu práctica médica.
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ahorra tiempo y ofrece una atención excepcional a cada paciente.
              </p>
            </div>

            {/* Tarjetas Informativas Ampliadas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 text-left">
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-3 transition-all hover:bg-slate-50">
                <BrainCircuit size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">IA clínica avanzada</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Resúmenes e ideas clave.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-3 transition-all hover:bg-slate-50">
                <Users size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Gestión integral</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Pacientes y consultas.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3 transition-all hover:bg-emerald-50/80">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Seguro y confiable</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Protección médica de nivel.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Caja de Ayuda */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
            <HelpCircle className="text-blue-600 shrink-0" size={20} />
            <div className="text-xs">
              <p className="font-bold text-slate-700">¿Necesitas ayuda?</p>
              <p className="text-slate-500 text-[11px]">soporte@vitalia.com</p>
            </div>
          </div>
        </aside>

      </form>
    </div>
  );
}