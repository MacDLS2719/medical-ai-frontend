import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  UserCircle, Save, Loader2, CheckCircle2, AlertCircle, Camera, 
  Plus, Trash2, MapPin, Stethoscope, Briefcase, GraduationCap, 
  Image as ImageIcon, Film, FileText, UploadCloud
} from 'lucide-react';

export default function DoctorProfile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  
  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'education', 'gallery'
  const [galleryMediaType, setGalleryMediaType] = useState('profile_picture'); // 'profile_picture', 'gallery', 'video', 'certificate'

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    specialty: '',
    bio: '',
    experience: '',
    address: '',
    latitude: '',
    longitude: ''
  });

  const [eduData, setEduData] = useState({
    institution: '',
    degree: '',
    field_of_study: '',
    start_year: '',
    end_year: '',
    description: ''
  });
  const [showEduForm, setShowEduForm] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const url = import.meta.env.VITE_API_URL + `/doctor-profile?user_id=${user.id}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          specialty: data.specialty || '',
          bio: data.bio || '',
          experience: data.experience || '',
          address: data.address || '',
          latitude: data.latitude || '',
          longitude: data.longitude || ''
        });
      }
    } catch (error) {
      console.error("Error fetching doctor profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleEduChange = (e) => setEduData({ ...eduData, [e.target.name]: e.target.value });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    const updateData = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] !== '') {
        updateData[key] = key === 'latitude' || key === 'longitude' ? parseFloat(formData[key]) : formData[key];
      }
    });

    try {
      const url = import.meta.env.VITE_API_URL + `/doctor-profile?user_id=${user.id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        showMessage('success', 'Perfil actualizado exitosamente');
      } else {
        showMessage('error', 'Error al actualizar perfil');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showMessage('error', 'Error de red');
    } finally {
      setSaving(false);
    }
  };

  const uploadMedia = async (file, mediaType, isProfilePic = false) => {
    if (!file) return;
    
    isProfilePic ? setUploadingImage(true) : setUploadingGallery(true);
    const formDataObj = new FormData();
    formDataObj.append('media_type', mediaType);
    formDataObj.append('file', file);

    try {
      const url = import.meta.env.VITE_API_URL + `/doctor-profile/media?user_id=${user.id}`;
      const response = await fetch(url, {
        method: 'POST',
        body: formDataObj
      });
      if (response.ok) {
        await fetchProfile();
        showMessage('success', 'Archivo subido correctamente');
      } else {
        showMessage('error', 'Error al subir archivo');
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showMessage('error', 'Error de red al subir archivo');
    } finally {
      isProfilePic ? setUploadingImage(false) : setUploadingGallery(false);
    }
  };

  const handleImageUpload = (e) => uploadMedia(e.target.files[0], 'profile_picture', true);
  const handleGalleryUpload = (e) => uploadMedia(e.target.files[0], galleryMediaType, false);

  const handleDeleteMedia = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este archivo?')) return;
    try {
      const url = import.meta.env.VITE_API_URL + `/doctor-profile/media/${id}?user_id=${user.id}`;
      const response = await fetch(url, { method: 'DELETE' });
      if (response.ok) await fetchProfile();
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };

  const handleAddEducation = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = import.meta.env.VITE_API_URL + `/doctor-profile/education?user_id=${user.id}`;
      const eduPayload = {
        ...eduData,
        start_year: eduData.start_year ? parseInt(eduData.start_year) : null,
        end_year: eduData.end_year ? parseInt(eduData.end_year) : null
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eduPayload)
      });
      if (response.ok) {
        await fetchProfile();
        setShowEduForm(false);
        setEduData({ institution: '', degree: '', field_of_study: '', start_year: '', end_year: '', description: '' });
      }
    } catch (error) {
      console.error("Error adding education:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEducation = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este estudio?')) return;
    try {
      const url = import.meta.env.VITE_API_URL + `/doctor-profile/education/${id}?user_id=${user.id}`;
      const response = await fetch(url, { method: 'DELETE' });
      if (response.ok) await fetchProfile();
    } catch (error) {
      console.error("Error deleting education:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!profile) return <div className="flex-1 p-8 text-center text-slate-500">Error cargando perfil del médico.</div>;

  const apiBase = import.meta.env.VITE_API_URL.replace('/api', '');
  const profilePics = profile.media?.filter(m => m.media_type === 'profile_picture') || [];
  const galleryMedia = profile.media?.filter(m => m.media_type !== 'profile_picture') || [];
  
  const latestProfilePic = profilePics.length > 0 ? profilePics[profilePics.length - 1] : null;
  const fallbackPic = galleryMedia.find(m => m.media_type === 'gallery' || m.mime_type?.includes('image'));
  const avatarToUse = latestProfilePic || fallbackPic;
  const avatarUrl = avatarToUse ? `${apiBase}${avatarToUse.file_url}` : null;

  return (
    <div className="flex-1 p-4 md:p-8 animate-in fade-in duration-500 bg-slate-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Banner Header */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-90"></div>
          
          <div className="relative z-10 pt-16 md:pt-4 md:pl-4 flex flex-col md:flex-row items-center gap-6 w-full">
            <div 
              className="w-36 h-36 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white relative group cursor-pointer shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingImage ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                  <UserCircle size={80} strokeWidth={1} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={32} />
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

            <div className="relative z-10 text-center md:text-left flex-1 md:mt-20">
              <h1 className="text-3xl font-bold text-slate-800">Dr. {profile.first_name} {profile.last_name}</h1>
              <p className="text-blue-600 font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                <Stethoscope size={18} />
                {profile.specialty || 'Sin especialidad registrada'}
              </p>
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-600 justify-center md:justify-start">
                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
                  <Briefcase size={14} /> CMP: {profile.medical_license}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
                  <MapPin size={14} /> {profile.address || 'Sin dirección'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'} animate-in slide-in-from-top-4`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-2 gap-2 hide-scrollbar">
          {[
            { id: 'personal', label: 'Información Personal', icon: UserCircle },
            { id: 'education', label: 'Educación', icon: GraduationCap },
            { id: 'gallery', label: 'Multimedia', icon: ImageIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 min-h-[400px]">
          
          {/* PERSONAL TAB */}
          {activeTab === 'personal' && (
            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nombres</label>
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Apellidos</label>
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Especialidad Principal</label>
                <input type="text" name="specialty" value={formData.specialty} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Biografía</label>
                <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} placeholder="Escribe un breve resumen sobre ti..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Experiencia Profesional</label>
                <textarea name="experience" value={formData.experience} onChange={handleChange} rows={3} placeholder="Menciona tu experiencia destacada..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <MapPin className="text-blue-500" size={20} /> Ubicación de Atención
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Dirección</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Latitud</label>
                      <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Longitud</label>
                      <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70">
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          )}

          {/* EDUCATION TAB */}
          {activeTab === 'education' && (
            <div className="animate-in fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">Historial Académico</h2>
                <button onClick={() => setShowEduForm(!showEduForm)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium rounded-xl transition-colors">
                  <Plus size={18} /> Agregar
                </button>
              </div>

              {showEduForm && (
                <form onSubmit={handleAddEducation} className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Institución *</label>
                      <input type="text" name="institution" value={eduData.institution} onChange={handleEduChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Título *</label>
                      <input type="text" name="degree" value={eduData.degree} onChange={handleEduChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Campo de Estudio</label>
                    <input type="text" name="field_of_study" value={eduData.field_of_study} onChange={handleEduChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Año Inicio</label>
                      <input type="number" name="start_year" value={eduData.start_year} onChange={handleEduChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Año Fin</label>
                      <input type="number" name="end_year" value={eduData.end_year} onChange={handleEduChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                    <button type="button" onClick={() => setShowEduForm(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                    <button type="submit" disabled={saving} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/30">Guardar Estudio</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.educations?.length > 0 ? (
                  profile.educations.map((edu) => (
                    <div key={edu.id} className="p-5 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 transition-all group relative flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                        <GraduationCap size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{edu.degree}</h4>
                        <p className="text-slate-600 text-sm mt-1">{edu.institution}</p>
                        <p className="text-slate-400 text-sm mt-1">
                          {edu.field_of_study && <span>{edu.field_of_study} • </span>}
                          {edu.start_year || 'N/A'} - {edu.end_year || 'Presente'}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteEducation(edu.id)}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <GraduationCap size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">Aún no has registrado tu educación.</p>
                    <p className="text-slate-400 text-sm mt-1">Agrega tus títulos y certificaciones para dar más confianza a tus pacientes.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div className="animate-in fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h2 className="text-xl font-bold text-slate-800">Galería Multimedia</h2>
                
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <select 
                    value={galleryMediaType}
                    onChange={(e) => setGalleryMediaType(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="profile_picture">Foto General (Perfil)</option>
                    <option value="gallery">Otra Foto</option>
                    <option value="video">Video</option>
                    <option value="certificate">Certificado</option>
                  </select>
                  
                  <button 
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploadingGallery}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-70"
                  >
                    {uploadingGallery ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                    Subir Archivo
                  </button>
                  <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*,video/mp4,video/webm" className="hidden" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleryMedia.length > 0 ? (
                  galleryMedia.map((media) => (
                    <div key={media.id} className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video shadow-sm hover:shadow-md transition-shadow">
                      {media.media_type === 'video' || media.mime_type?.includes('video') ? (
                        <video src={`${apiBase}${media.file_url}`} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={`${apiBase}${media.file_url}`} alt={media.media_type} className="w-full h-full object-cover" />
                      )}
                      
                      <div className="absolute top-0 left-0 w-full p-3 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-start">
                        <span className="text-white text-xs font-semibold px-2 py-1 bg-black/40 rounded-lg backdrop-blur-sm capitalize">
                          {media.media_type === 'gallery' ? 'Galería' : media.media_type === 'video' ? 'Video' : 'Certificado'}
                        </span>
                        <button 
                          onClick={() => handleDeleteMedia(media.id)}
                          className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                    <ImageIcon size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">Tu galería está vacía.</p>
                    <p className="text-slate-400 text-sm mt-1">Sube fotos de tu consultorio o videos de presentación.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
