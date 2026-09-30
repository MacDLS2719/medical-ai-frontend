import React, { useState } from 'react';
import { MapPin, ShieldCheck, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Valida si el usuario ya tiene registros en patient_locations.
 * Si ya tiene info, pasa directamente sin mostrar el modal.
 * Si no tiene, muestra el modal para pedir geolocalización y guardarla.
 */
const LocationConsentGate = ({ children, userId = 1 }) => {
  // 'checking' | 'ready' | 'idle' (muestra modal) | 'requesting' | 'error'
  const [status, setStatus] = useState('checking');
  const [errorMsg, setErrorMsg] = useState('');
  const [patientPos, setPatientPos] = useState(null);

  React.useEffect(() => {
    // Validar si el usuario ya cuenta con un registro en patient_locations
    fetch(`${API_URL}/patient-locations?user_id=${userId}`)
      .then(res => res.json())
      .then(data => {
        // Asumiendo que el endpoint devuelve un objeto con lat/lng o un array con registros
        const locationData = Array.isArray(data) ? data[0] : data;
        
        if (locationData && (locationData.latitude || locationData.lat) && (locationData.longitude || locationData.lng)) {
          const lat = locationData.latitude || locationData.lat;
          const lng = locationData.longitude || locationData.lng;
          setPatientPos({ lat, lng });
          setStatus('ready'); // Ya tiene info, pasa derecho
        } else {
          setStatus('idle'); // No tiene info, mostrar modal
        }
      })
      .catch(err => {
        console.warn('[LocationConsentGate] No se encontró registro previo, mostrando modal:', err);
        setStatus('idle'); // Si falla o no existe, requerir el permiso por modal
      });
  }, [userId]);

  const handleContinue = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Tu navegador no soporta geolocalización.');
      setStatus('error');
      return;
    }

    setStatus('requesting');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;

        // Guardar en backend (patient_locations)
        try {
          await fetch(`${API_URL}/health-places/prefetch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, user_id: userId }),
          });
        } catch (e) {
          console.warn('[LocationConsentGate] No se pudo guardar la ubicación:', e);
        }

        setPatientPos({ lat, lng });
        setStatus('ready');
      },
      (err) => {
        let msg = 'No pudimos obtener tu ubicación.';
        if (err.code === 1) msg = 'Bloqueaste el permiso de ubicación. Habilítalo en tu navegador e intenta de nuevo.';
        if (err.code === 3) msg = 'La solicitud de ubicación tardó demasiado. Inténtalo de nuevo.';
        setErrorMsg(msg);
        setStatus('error');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  // Mientras revisa el backend, puedes mostrar un loader limpio o un contenedor vacío para evitar parpadeos
  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-xs text-slate-500 font-medium">Verificando configuración...</p>
        </div>
      </div>
    );
  }

  // Si ya tiene ubicación (por backend o recién capturada), pasa a la siguiente ventana
  if (status === 'ready' && patientPos) {
    if (typeof children === 'function') {
      return children(patientPos);
    }
    return children;
  }

  // Si no tiene registro, se muestra el modal de solicitud de ubicación
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />

        {status === 'requesting' ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Obteniendo tu ubicación…</h3>
            <p className="text-sm text-slate-500">Por favor acepta el permiso en tu navegador.</p>
          </>
        ) : status === 'error' ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Error de ubicación</h3>
            <p className="text-sm text-slate-500 mb-6">{errorMsg}</p>
            <button
              onClick={handleContinue}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition-all active:scale-95 cursor-pointer"
            >
              Reintentar <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapPin size={32} />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Permiso de Ubicación</h3>
            <p className="text-sm text-slate-500 mb-6">
              Para mostrarte hospitales, clínicas y farmacias cercanas, necesitamos acceder a tu ubicación actual. Tu privacidad es importante para nosotros.
            </p>

            <div className="flex items-center gap-2 mb-6 bg-teal-50 text-teal-700 px-4 py-2 rounded-xl text-xs font-medium text-left">
              <ShieldCheck size={16} className="shrink-0" />
              <span>Tus datos de ubicación están protegidos y solo se usan para esta búsqueda.</span>
            </div>

            <button
              onClick={handleContinue}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition-all active:scale-95 cursor-pointer"
            >
              Continuar y Buscar <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LocationConsentGate;