import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { UserCircle, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    birth_date: '',
    specialty: '',
    address: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const url = import.meta.env.VITE_API_URL + `/profile?user_id=${user.id}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          gender: data.gender || '',
          birth_date: data.birth_date ? data.birth_date.split('T')[0] : '',
          specialty: data.specialty || '',
          address: data.address || '',
          latitude: data.latitude || '',
          longitude: data.longitude || ''
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    // Prepare data to send (remove empty fields)
    const updateData = {};
    if (formData.first_name) updateData.first_name = formData.first_name;
    if (formData.last_name) updateData.last_name = formData.last_name;
    if (formData.address !== '') updateData.address = formData.address;
    if (formData.latitude !== '') updateData.latitude = parseFloat(formData.latitude);
    if (formData.longitude !== '') updateData.longitude = parseFloat(formData.longitude);
    
    if (formData.gender) updateData.gender = formData.gender;
    if (formData.birth_date) updateData.birth_date = formData.birth_date;

    try {
      const url = import.meta.env.VITE_API_URL + `/profile?user_id=${user.id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setMessage({ type: 'success', text: t('profile.successMessage') });
      } else {
        setMessage({ type: 'error', text: t('profile.errorMessage') });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: 'error', text: t('profile.saveError') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 p-8 text-center text-slate-500">
        {t('profile.loadError')}
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-slate-100 text-slate-600 p-3 rounded-2xl">
            <UserCircle size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{t('profile.title')}</h1>
            <p className="text-slate-500 mt-1">{t('profile.subtitle')}</p>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8 bg-white/70">
          
          {message && (
            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('profile.firstName')}</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('profile.lastName')}</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('profile.email')}</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('profile.document')}</label>
                  <input
                    type="text"
                    value={profile.document_number || t('profile.notRegistered')}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('profile.gender')}</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">{t('profile.selectGender')}</option>
                    <option value="Masculino">{t('profile.male')}</option>
                    <option value="Femenino">{t('profile.female')}</option>
                    <option value="Otro">{t('profile.other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('profile.birthDate')}</label>
                  <input
                    type="date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

            {/* Location Fields (Common for both) */}
            <div className="pt-2 border-t border-slate-100 mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('profile.locationInfo', 'Ubicación')}</h3>
              <div className="grid grid-cols-1 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('profile.address', 'Dirección')}</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={t('profile.addressPlaceholder', 'Ej: Calle Principal 123, Ciudad')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('profile.latitude', 'Latitud')}</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="Ej: -12.04318"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('profile.longitude', 'Longitud')}</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="Ej: -77.02824"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                <span>{saving ? t('profile.saving') : t('profile.saveChanges')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
