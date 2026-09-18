import React, { useState } from 'react';
import { 
  Star, 
  Info, 
  User, 
  Building2, 
  Video, 
  FileText, 
  Eye, 
  Upload, 
  Pencil, 
  ArrowLeft, 
  ArrowRight, 
  Image as ImageIcon 
} from 'lucide-react';

export default function Step4OptionalProfile({ formData, updateFormData, onNext, onPrev }) {
  const [profilePhoto, setProfilePhoto] = useState(formData.profilePhoto || null);
  const [clinicImages, setClinicImages] = useState(formData.clinicImages || []);
  const [presentationVideo, setPresentationVideo] = useState(formData.presentationVideo || null);

  const handleFileUpload = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;

    if (key === 'clinicImages') {
      const updated = [...clinicImages, file];
      setClinicImages(updated);
      updateFormData({ clinicImages: updated });
    } else {
      if (key === 'profilePhoto') setProfilePhoto(file);
      if (key === 'presentationVideo') setPresentationVideo(file);
      updateFormData({ [key]: file });
    }
  };

  const handleSkip = () => {
    onNext();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-5 md:p-6 bg-slate-50/50">
      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-5 items-start">
        
        {/* Contenido Central - Paso Opcional */}
        <main className="w-full flex-1 space-y-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] font-bold mb-1.5">
              <Star size={13} className="fill-indigo-600" />
              <span>OPCIONAL</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Completa tu perfil profesional
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Ayuda a tus pacientes a conocerte mejor. Añade información adicional si deseas ofrecer una experiencia más cercana y personalizada.
            </p>
          </div>

          {/* Banner Informativo */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3 text-xs text-blue-900 shadow-sm">
            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Este paso es opcional y no afecta a la aprobación de tu cuenta.</p>
              <p className="text-slate-600 text-[11px] mt-0.5">Puedes completarlo ahora o actualizarlo más adelante desde tu panel.</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Card 1: Foto profesional */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-800">Foto profesional</h3>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500 uppercase">Opcional</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Añade una foto profesional para que los pacientes puedan reconocerte.</p>
                </div>
              </div>
              <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-all shrink-0">
                <Upload size={14} />
                <span>{profilePhoto ? profilePhoto.name.slice(0, 12) + '...' : 'Subir foto'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'profilePhoto')} />
              </label>
            </div>

            {/* Card 2: Imágenes de tu clínica o consulta */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 shrink-0">
                  <Building2 size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-800">Imágenes de tu clínica o consulta</h3>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500 uppercase">Opcional</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Comparte imágenes de tu consulta, instalaciones o equipo profesional.</p>
                </div>
              </div>
              <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-all shrink-0">
                <Upload size={14} />
                <span>Añadir imágenes</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileUpload(e, 'clinicImages')} />
              </label>
            </div>

            {/* Card 3: Vídeo de presentación */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 shrink-0">
                  <Video size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-800">Vídeo de presentación</h3>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500 uppercase">Opcional</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Sube un breve vídeo presentándote y cuéntales a tus pacientes sobre ti.</p>
                </div>
              </div>
              <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-all shrink-0">
                <Upload size={14} />
                <span>{presentationVideo ? presentationVideo.name.slice(0, 12) + '...' : 'Subir vídeo'}</span>
                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'presentationVideo')} />
              </label>
            </div>

            {/* Card 4: Información adicional */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-800">Información adicional</h3>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500 uppercase">Opcional</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Añade información sobre tu experiencia, idiomas, áreas de interés, etc.</p>
                </div>
              </div>
              <button
                type="button"
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer shrink-0"
              >
                <Pencil size={14} />
                <span>Completar</span>
              </button>
            </div>

            {/* Card 5: Vista previa de tu perfil */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 shrink-0">
                  <Eye size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-800">Vista previa de tu perfil</h3>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500 uppercase">Opcional</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Así es como verán los pacientes tu perfil con la información que añadas.</p>
                </div>
              </div>
              <button
                type="button"
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer shrink-0"
              >
                <Eye size={14} />
                <span>Ver vista previa</span>
              </button>
            </div>
          </div>

          {/* Botones de Navegación y Omitir */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onPrev}
              className="flex items-center gap-1.5 px-4 py-2 border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Volver</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition-all cursor-pointer px-2"
              >
                Omitir por ahora
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2 bg-[#0052FF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span>Continuar a suscripción</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </main>

        {/* Sidebar Derecha - Banner del Perfil (Mismo tamaño y estilo del paso anterior) */}
        <aside className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4 text-center">
            
            {/* Ilustración de Perfil Profesional Ampliada */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mx-auto shadow-md border-2 border-slate-100 ring-4 ring-blue-50/50">
              <img 
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop" 
                alt="Doctor Profile Preview" 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                Tu perfil, tu mejor carta de presentación
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Conecta con más pacientes y genera confianza mostrando quién eres y dónde trabajas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 text-left">
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-3 transition-all hover:bg-slate-50">
                <User size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Foto profesional</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Haz que los pacientes te reconozcan.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-3 transition-all hover:bg-slate-50">
                <ImageIcon size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Imágenes de tu consulta</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Muéstrales tu espacio y equipo.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-3 transition-all hover:bg-slate-50">
                <Video size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Vídeo de presentación</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Cuéntales quién eres y tu enfoque.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nota informativa inferior */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3">
            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-slate-600">
              <span className="font-bold text-slate-700">Esta información es opcional</span> y podrás completarla cuando quieras desde tu perfil.
            </p>
          </div>
        </aside>

      </form>
    </div>
  );
}