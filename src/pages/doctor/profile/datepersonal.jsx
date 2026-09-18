import { useState, useRef } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Lock, Camera, Edit3,
  CheckCircle2, AlertCircle, Loader2, Save, Trash2, EyeOff, ChevronDown, ChevronUp, Briefcase
} from 'lucide-react';
import DoctorLocationMap from '../../../components/common/DoctorLocationMap';

export default function DatosPersonales({
  profile, formData, setFormData, handleChange, handleSubmit, 
  saving, uploadingImage, avatarUrl, uploadMedia
}) {
  const fileInputRef = useRef(null);
  const [showMap, setShowMap] = useState(false);
  // Estados para controlar el modo edición de cada sección
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingPass, setIsEditingPass] = useState(false);
  const [isEditingMap, setIsEditingMap] = useState(false);

  return (
    <div className="space-y-3">
      
      {/* 1. CABECERA COMPACTA DEL PERFIL Y BIOGRAFÍA */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`relative w-12 h-12 rounded-full bg-blue-50 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-bold text-base overflow-hidden shrink-0 group ${isEditingPhoto ? 'cursor-pointer' : 'opacity-90'}`}
            onClick={() => isEditingPhoto && fileInputRef.current?.click()}
          >
            {uploadingImage ? (
              <Loader2 className="animate-spin text-blue-600" size={16} />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <span>{formData.first_name?.[0] || 'D'}{formData.last_name?.[0] || 'R'}</span>
            )}
            {isEditingPhoto && (
              <div className="absolute right-0 bottom-0 p-0.5 bg-blue-600 text-white rounded-full translate-x-1/4 translate-y-1/4 group-hover:bg-blue-700 transition-colors">
                <Camera size={10} />
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => uploadMedia(e.target.files[0], 'profile_picture', true)}
            accept="image/*"
            className="hidden"
          />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-blue-950">
                Dr. {formData.first_name || 'Nombre'} {formData.last_name || 'Apellidos'}
              </h2>
              {profile?.verification_status === 'verified' ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 size={9} /> Verificado
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                  <AlertCircle size={9} /> Pendiente
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-slate-500">{formData.specialty || 'Medicina general'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEditingPhoto(!isEditingPhoto)}
            className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold ${isEditingPhoto ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
          >
            <Edit3 size={12} /> {isEditingPhoto ? 'Editando' : 'Editar foto'}
          </button>
        </div>
      </div>

      {/* 2. CONTENEDOR PRINCIPAL EN GRID DE 2 COLUMNAS (DATOS PERSONALES + CONTRASEÑA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* COLUMNA IZQUIERDA: INFORMACIÓN PERSONAL (8 Columnas) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
              <User className="text-blue-600" size={14} /> Información personal
            </h3>
            <button 
              onClick={() => setIsEditingInfo(!isEditingInfo)}
              className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold ${isEditingInfo ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
            >
              <Edit3 size={12} /> {isEditingInfo ? 'Editando' : 'Editar'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Nombre</label>
              <div className="relative">
                <User size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input disabled={!isEditingInfo} type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} className="w-full text-[11px] font-medium text-slate-800 bg-slate-50/50 p-1.5 pl-7 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-70 disabled:bg-slate-100" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Apellidos</label>
              <div className="relative">
                <User size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input disabled={!isEditingInfo} type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} className="w-full text-[11px] font-medium text-slate-800 bg-slate-50/50 p-1.5 pl-7 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-70 disabled:bg-slate-100" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Especialidad principal</label>
              <div className="relative">
                <Briefcase size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input disabled={!isEditingInfo} type="text" name="specialty" value={formData.specialty || ''} onChange={handleChange} className="w-full text-[11px] font-medium text-slate-800 bg-slate-50/50 p-1.5 pl-7 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-70 disabled:bg-slate-100" placeholder="Medicina general" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">F. Nacimiento</label>
              <div className="relative">
                <Calendar size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input disabled={!isEditingInfo} type="date" name="birth_date" value={formData.birth_date || ''} onChange={handleChange} className="w-full text-[11px] font-medium text-slate-800 bg-slate-50/50 p-1.5 pl-7 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-70 disabled:bg-slate-100" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">País</label>
              <div className="relative">
                <MapPin size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input disabled={!isEditingInfo} type="text" name="country" value={formData.country || ''} onChange={handleChange} className="w-full text-[11px] font-medium text-slate-800 bg-slate-50/50 p-1.5 pl-7 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 disabled:opacity-70 disabled:bg-slate-100" placeholder="Ej. España" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Ciudad</label>
              <input disabled={!isEditingInfo} type="text" name="city" value={formData.city || ''} onChange={handleChange} className="w-full text-[11px] font-medium text-slate-800 bg-slate-50/50 p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 disabled:opacity-70 disabled:bg-slate-100" placeholder="Ej. Madrid" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Teléfono</label>
              <div className="relative">
                <Phone size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input disabled={!isEditingInfo} type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full text-[11px] font-medium text-slate-800 bg-slate-50/50 p-1.5 pl-7 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 disabled:opacity-70 disabled:bg-slate-100" placeholder="+34 600..." />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Correo electrónico</label>
              <div className="relative">
                <Mail size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input disabled={!isEditingInfo} type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full text-[11px] font-medium text-slate-800 bg-slate-50/50 p-1.5 pl-7 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 disabled:opacity-70 disabled:bg-slate-100" placeholder="ejemplo@email.com" />
              </div>
            </div>
            <div className="sm:col-span-3">
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Descripción profesional breve</label>
              <textarea 
                disabled={!isEditingInfo}
                name="professional_description" 
                value={formData.professional_description || formData.bio || ''} 
                onChange={handleChange} 
                className="w-full text-[11px] font-medium text-slate-800 bg-slate-50/50 p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-16 placeholder-slate-400 disabled:opacity-70 disabled:bg-slate-100" 
                placeholder="Mi compromiso es ofrecer una medicina cercana..."
              />
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: CONTRASEÑA (4 Columnas) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <Lock className="text-blue-600" size={14} /> Contraseña
              </h3>
              <button 
                onClick={() => setIsEditingPass(!isEditingPass)}
                className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold ${isEditingPass ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
              >
                <Edit3 size={12} /> {isEditingPass ? 'Editando' : 'Editar'}
              </button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Actual</label>
              <div className="relative">
                <Lock size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input disabled={!isEditingPass} type="password" placeholder="••••••••" className="w-full text-[11px] font-medium text-slate-800 bg-slate-50/50 p-1.5 pl-7 pr-7 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-70 disabled:bg-slate-100" />
                <EyeOff size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Nueva</label>
              <div className="relative">
                <Lock size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input disabled={!isEditingPass} type="password" placeholder="••••••••" className="w-full text-[11px] font-medium text-slate-800 bg-slate-50/50 p-1.5 pl-7 pr-7 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-70 disabled:bg-slate-100" />
                <EyeOff size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. MAPA DE UBICACIÓN DESPLEGABLE (ACORDEÓN) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className="w-full flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-blue-600" />
            <span className="text-[11px] font-bold text-slate-800">
              Ubicación geográfica (Consultorio / Clínica)
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              {showMap ? '(Ocultar mapa)' : '(Ver o configurar mapa)'}
            </span>
          </div>
          {showMap ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </button>

        {showMap && (
          <div className="p-3 border-t border-slate-100 animate-fadeIn space-y-3">
            <div className="flex justify-end">
              <button 
                onClick={() => setIsEditingMap(!isEditingMap)}
                className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold ${isEditingMap ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
              >
                <Edit3 size={12} /> {isEditingMap ? 'Editando mapa' : 'Editar mapa'}
              </button>
            </div>
            <DoctorLocationMap
              latitude={formData.latitude}
              longitude={formData.longitude}
              address={formData.address}
              city={formData.city}
              country={formData.country || 'Colombia'}
              onChange={({ latitude, longitude }) => setFormData(prev => ({ ...prev, latitude, longitude }))}
              readOnly={!isEditingMap}
              height="140px"
            />
          </div>
        )}
      </div>

      {/* 4. BARRA INFERIOR INDEPENDIENTE: BOTONES DE ACCIÓN (ELIMINAR Y GUARDAR) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex items-center justify-between">
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 font-bold text-xs rounded-lg hover:bg-red-50 transition-colors">
          <Trash2 size={14} /> Eliminar cuenta
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Guardar cambios
        </button>
      </div>

    </div>
  );
}