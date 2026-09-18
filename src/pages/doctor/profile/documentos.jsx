import { useRef } from 'react';
import {
  FileText, Award, CheckCircle2, UploadCloud, Trash2, Loader2
} from 'lucide-react';

export default function DocumentosVerificacion({
  mediaList, identityDoc, colegiationCert,
  selectedMediaType, setSelectedMediaType,
  uploadMedia, handleDeleteMedia,
  uploadingGallery, getMediaUrl
}) {
  const galleryInputRef = useRef(null);
  const identityInputRef = useRef(null);
  const colegiationInputRef = useRef(null);

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200/80 shadow-sm space-y-5">
      <div>
        <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider">Documentos y Verificación</h3>
        <p className="text-[10px] text-slate-500 mt-0.5">Gestión de archivos de soporte legal y multimedia.</p>
      </div>

      {/* Documentación oficial */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documentación oficial</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${identityDoc ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">Documento de Identidad</p>
                <span className={`text-[10px] font-semibold block ${identityDoc ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {identityDoc ? 'Cargado correctamente' : 'Pendiente por subir'}
                </span>
              </div>
            </div>
            {identityDoc ? (
              <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
            ) : (
              <>
                <button 
                  onClick={() => identityInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm shrink-0"
                >
                  Subir
                </button>
                <input
                  type="file"
                  ref={identityInputRef}
                  onChange={(e) => uploadMedia(e.target.files[0], 'identity_doc', false)}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
              </>
            )}
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${colegiationCert ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                <Award size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">Certificado de Colegiación</p>
                <span className={`text-[10px] font-semibold block ${colegiationCert ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {colegiationCert ? 'Cargado correctamente' : 'Pendiente por subir'}
                </span>
              </div>
            </div>
            {colegiationCert ? (
              <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
            ) : (
              <>
                <button 
                  onClick={() => colegiationInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm shrink-0"
                >
                  Subir
                </button>
                <input
                  type="file"
                  ref={colegiationInputRef}
                  onChange={(e) => uploadMedia(e.target.files[0], 'colegiation_cert', false)}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Galería */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Galería de fotos y videos</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Anexa imágenes o videos de tu centro médico.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedMediaType}
              onChange={(e) => setSelectedMediaType(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none bg-white font-medium focus:border-blue-500 transition-colors"
            >
              <option value="gallery">Imagen clínica</option>
              <option value="video">Video presentación</option>
            </select>
            <button
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploadingGallery}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {uploadingGallery ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
              Anexar
            </button>
            <input
              type="file"
              ref={galleryInputRef}
              onChange={(e) => uploadMedia(e.target.files[0], selectedMediaType, false)}
              accept="image/*,video/*"
              className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {mediaList
            .filter(m => m.media_type !== 'identity_doc' && m.media_type !== 'colegiation_cert' && m.media_type !== 'profile_picture')
            .map((media) => (
              <div key={media.id} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                {media.media_type === 'video' || media.mime_type?.includes('video') ? (
                  <video src={getMediaUrl(media.file_url)} className="w-full h-full object-cover" />
                ) : (
                  <img src={getMediaUrl(media.file_url)} alt="Media" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => handleDeleteMedia(media.id)} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm" title="Eliminar archivo">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}