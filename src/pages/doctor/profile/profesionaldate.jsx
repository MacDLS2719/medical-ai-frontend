import { Award, Plus, Trash2, Loader2 } from 'lucide-react';

export default function InformacionProfesional({
  profile, formData, handleChange, handleSubmit, saving,
  isEditing, setIsEditing,
  eduData, handleEduChange, handleAddEducation, handleDeleteEducation,
  showEduForm, setShowEduForm
}) {
  return (
    <div className="space-y-4">
      {/* Especialidad y Colegiatura */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider">Especialidad y Colegiatura</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 transition-colors"
          >
            {isEditing ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1">Especialidad principal</label>
              <input type="text" name="specialty" value={formData.specialty} onChange={handleChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1">Nº de colegiado</label>
              <input type="text" name="colegiated_number" value={formData.colegiated_number} onChange={handleChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1">Años de experiencia</label>
              <input type="number" name="years_experience" value={formData.years_experience} onChange={handleChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1">Colegio profesional</label>
              <input type="text" name="professional_college" value={formData.professional_college} onChange={handleChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1">Subespecialidades</label>
              <input type="text" name="subspecialties" value={formData.subspecialties} onChange={handleChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-colors" placeholder="Ej. Cardiología Pediátrica" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1">Idiomas</label>
              <input type="text" name="languages" value={formData.languages} onChange={handleChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div className="sm:col-span-2 flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Guardando...' : 'Guardar especialidad'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Especialidad principal</label>
              <p className="text-xs font-bold text-slate-800">{formData.specialty || 'Sin especificar'}</p>
            </div>
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Nº de colegiado</label>
              <p className="text-xs font-bold text-slate-800">{formData.colegiated_number || 'Sin especificar'}</p>
            </div>
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Años de experiencia</label>
              <p className="text-xs font-bold text-slate-800">{formData.years_experience ? `${formData.years_experience} años` : 'Sin especificar'}</p>
            </div>
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Colegio profesional</label>
              <p className="text-xs font-bold text-slate-800">{formData.professional_college || 'Sin especificar'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Historial de Estudios */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider">Historial de Estudios</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Agrega tus títulos académicos y certificaciones.</p>
          </div>
          <button
            onClick={() => setShowEduForm(!showEduForm)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl transition-all border border-blue-200"
          >
            <Plus size={14} /> Añadir estudio
          </button>
        </div>

        {showEduForm && (
          <form onSubmit={handleAddEducation} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input type="text" name="institution" placeholder="Institución *" value={eduData.institution} onChange={handleEduChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none bg-white" required />
              <input type="text" name="degree" placeholder="Título / Grado *" value={eduData.degree} onChange={handleEduChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none bg-white" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input type="text" name="field_of_study" placeholder="Campo de estudio" value={eduData.field_of_study} onChange={handleEduChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none bg-white" />
              <input type="number" name="start_year" placeholder="Año inicio" value={eduData.start_year} onChange={handleEduChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none bg-white" />
              <input type="number" name="end_year" placeholder="Año fin" value={eduData.end_year} onChange={handleEduChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none bg-white" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowEduForm(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded-xl font-medium">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">Guardar</button>
            </div>
          </form>
        )}

        <div className="space-y-2.5">
          {profile?.educations?.length > 0 ? (
            profile.educations.map((edu) => (
              <div key={edu.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Award size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{edu.degree}</h4>
                    <p className="text-[10px] text-slate-500">{edu.institution} {edu.start_year && `• ${edu.start_year} - ${edu.end_year || 'Presente'}`}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteEducation(edu.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                  title="Eliminar estudio"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-slate-400 text-center py-5 border border-dashed border-slate-200 rounded-xl">
              No has registrado estudios académicos aún.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}