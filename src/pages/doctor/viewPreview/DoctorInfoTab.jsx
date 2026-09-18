import React from 'react';
import { ImageIcon, Stethoscope, Award, MapPin, Video, BookOpen } from 'lucide-react';

export default function DoctorInfoTab({ profile, bio, specialty, professionalCollege, collegiatedNumber, locationText, mediaFiles }) {
  const educations = profile?.educations || [];
  return (
    <div className="space-y-5">
      {/* Sobre mí y archivos multimedia en dos columnas */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Columna Izquierda: Sobre mí */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Sobre mí</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{bio}</p>
          </div>

          {/* Columna Derecha: Archivos multimedia e instalaciones */}
          <div className="space-y-3 pt-1 lg:pt-0 lg:border-l lg:border-slate-100 lg:pl-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon size={14} className="text-blue-600" /> Archivos e instalaciones
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">{mediaFiles.length} archivos</span>
            </div>

            {mediaFiles.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {mediaFiles.map((media, index) => (
                  <div key={index} className="relative rounded-2xl overflow-hidden h-28 bg-slate-100 border border-slate-200 group">
                    <img 
                      src={media.file_url} 
                      alt={`Multimedia ${index + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <span className="text-[10px] text-white font-medium truncate block capitalize">
                        {media.media_type ? media.media_type.replace('_', ' ') : 'Imagen clínica'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs text-slate-400">
                El médico no ha cargado archivos multimedia adicionales todavía.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Información profesional en 2 columnas y 2 filas (Grid 2x2) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Información profesional</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          
          {/* Fila 1 - Columna 1: Especialidad */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Stethoscope size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Especialidad</span>
              <p className="text-xs font-semibold text-slate-800 truncate">{specialty}</p>
            </div>
          </div>

          {/* Fila 1 - Columna 2: Colegio profesional */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Award size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Colegio profesional</span>
              <p className="text-xs font-semibold text-slate-800 truncate">{professionalCollege}</p>
              {collegiatedNumber && <span className="text-[10px] text-slate-400 block">Nº Col: {collegiatedNumber}</span>}
            </div>
          </div>

          {/* Fila 2 - Columna 1: Ubicación */}
          {locationText && (
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <MapPin size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ubicación de consulta</span>
                <p className="text-xs font-semibold text-slate-800 truncate">{locationText}</p>
              </div>
            </div>
          )}

          {/* Fila 2 - Columna 2: Modalidad */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Video size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Modalidad de consulta</span>
              <p className="text-xs font-semibold text-slate-800 truncate">Presencial y online</p>
            </div>
          </div>

        </div>
      </div>

      {/* Educación y Formación */}
      {educations.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={14} className="text-blue-600" /> Educación y Formación
          </h3>
          <div className="space-y-3 pt-1">
            {educations.map((edu, index) => (
              <div key={index} className="flex gap-3 items-start relative pb-3">
                {/* Línea conectora */}
                {index !== educations.length - 1 && (
                  <div className="absolute left-1.5 top-5 bottom-0 w-px bg-slate-200"></div>
                )}
                <div className="w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-500 mt-1 shrink-0 z-10"></div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-xs font-bold text-slate-900">{edu.degree}</p>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                      {edu.start_year || ''} {edu.end_year ? `- ${edu.end_year}` : (edu.start_year ? '- Actualidad' : '')}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-600">{edu.institution}</p>
                  {edu.description && (
                    <p className="text-[10px] text-slate-500 mt-1">{edu.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}