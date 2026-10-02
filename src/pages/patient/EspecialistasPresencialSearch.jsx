import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Loader2, MapPin, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// In-person search: Leaflet map centered on the patient's live location
// (browser geolocation, not persisted), showing nearby hospitals/clinics.
// No longer lists our own affiliated doctors (Facu, 2026-09-23) — this
// screen is purely a hospitals/clinics finder now.
const RADIUS_OPTIONS = [5, 10, 25, 50];

// Etiquetas directas para los tipos de establecimiento
const AMENITY_LABELS = {
  hospital: 'Hospital',
  clinic: 'Clínica',
  doctors: 'Médicos',
  pharmacy: 'Farmacia',
};
const amenityLabel = (amenity) => AMENITY_LABELS[amenity] || 'Otro establecimiento';

// Bigger than the external-place pin — same teardrop family, size
// marks importance. 0.95 * 0.9 of the original 44x55.
const PATIENT_PIN_SCALE = 0.855;
const PATIENT_PIN_W = 44 * PATIENT_PIN_SCALE;
const PATIENT_PIN_H = 55 * PATIENT_PIN_SCALE;

// Bottom-aligned so the pin tip sits exactly on the icon anchor.
const pinImg = (src) =>
  `<img src="${src}" alt="" draggable="false" style="width:100%;height:100%;object-fit:contain;object-position:center bottom;display:block" />`;

let patientIconCache = null;
function patientIcon() {
  if (patientIconCache) return patientIconCache;
  const w = PATIENT_PIN_W, h = PATIENT_PIN_H;
  const html = `
    <div class="patient-pin-bob" style="position:relative;width:${w}px;height:${h}px;filter:drop-shadow(0 3px 6px rgba(0,0,0,.35))">
      ${pinImg('/images/pins/patient.png')}
    </div>
  `;
  patientIconCache = L.divIcon({ html, className: '', iconSize: [w, h], iconAnchor: [w / 2, h], tooltipAnchor: [18, -36] });
  return patientIconCache;
}

// Colors match the pin images (pharmacy changed to yellow as requested)
const EXTERNAL_AMENITY_COLOR = {
  hospital: '#EE2537',
  clinic: '#027FFF',
  pharmacy: '#a208ea', // Color para farmacias
};
const DEFAULT_EXTERNAL_COLOR = '#EE2537';
const PATIENT_COLOR = '#05B165';

const EXTERNAL_PIN_IMG = {
  hospital: '/images/pins/hospital.png',
  clinic: '/images/pins/clinic.png',
  pharmacy: '/images/pins/farmacia.png', 
};

const EXTERNAL_PIN_W = 26 * 1.05;
const EXTERNAL_PIN_H = 32 * 1.05;
// Extra per-kind scale on top of the base external pin size.
const EXTERNAL_PIN_SCALE = { hospital: 1.05 };

const externalIconCache = new Map();
function externalPinIcon(amenity) {
  const key = amenity || 'default';
  if (externalIconCache.has(key)) return externalIconCache.get(key);
  const src = EXTERNAL_PIN_IMG[amenity] || EXTERNAL_PIN_IMG.hospital;
  const scale = EXTERNAL_PIN_SCALE[amenity] || 1;
  const w = EXTERNAL_PIN_W * scale, h = EXTERNAL_PIN_H * scale;
  const html = `
    <div style="position:relative;width:${w}px;height:${h}px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">
      ${pinImg(src)}
    </div>
  `;
  const icon = L.divIcon({ html, className: '', iconSize: [w, h], iconAnchor: [w / 2, h], tooltipAnchor: [11, -20] });
  externalIconCache.set(key, icon);
  return icon;
}

const ExternalPlacePreviewCard = ({ p, t }) => {
  const displayName = p.name && p.name.trim() !== '' ? p.name : amenityLabel(p.amenity);
  const categoryLabel = amenityLabel(p.amenity);

  return (
    <div className="w-48">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: EXTERNAL_AMENITY_COLOR[p.amenity] || DEFAULT_EXTERNAL_COLOR }} />
        <p className="font-bold text-brand-dark text-sm truncate">{displayName}</p>
      </div>
      <p className="text-[15px] text-gray-800 mt-0.5">{categoryLabel}</p>
      {p.address ? (
        <p className="text-[11px] text-gray-400 mt-1.5">
          {p.address}
          <span className="block italic mt-0.5">{t('presencial_click_to_copy')}</span>
        </p>
      ) : (
        <p className="text-[11px] text-gray-400 mt-1.5">{t('presencial_no_address')}</p>
      )}
    </div>
  );
};

const EspecialistasPresencialSearch = ({ apiUrl, onBack, initialPos }) => {
  const { t } = useTranslation();

  const [patientPos, setPatientPos] = useState(initialPos || null);
  const [locating, setLocating] = useState(!initialPos);
  const [locateError, setLocateError] = useState('');

  const [radiusKm, setRadiusKm] = useState(10);

  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);

  const copyAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      // clipboard permission denied
    }
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setLocateError(t('presencial_no_geo'));
      setLocating(false);
      return;
    }
    setLocating(true);
    setLocateError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPatientPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        fetch(`${apiUrl}/health-places/prefetch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, user_id: 1 })
        }).catch(console.warn);
      },
      () => {
        setLocateError(t('presencial_locate_denied'));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!initialPos) {
      locate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPos]);

  useEffect(() => {
    if (!patientPos) return;
    let cancelled = false;
    setNearbyError(false);
    const params = new URLSearchParams({
      lat: String(patientPos.lat),
      lng: String(patientPos.lng),
      radius_km: String(radiusKm),
    });
    const toPlaces = (data) => (data || []).map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, name: p.name, amenity: p.kind, address: p.address }));

    fetch(`${apiUrl}/health-places?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setNearbyPlaces(toPlaces(data));
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn('Could not load cached nearby health places:', e);
      });

    setNearbyLoading(true);
    fetch(`${apiUrl}/health-places/refresh?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setNearbyPlaces(toPlaces(data));
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn('Could not refresh nearby health places:', e);
        setNearbyError(true);
      })
      .finally(() => {
        if (!cancelled) setNearbyLoading(false);
      });

    return () => { cancelled = true; };
  }, [apiUrl, patientPos, radiusKm]);

  return (
    <div className="min-h-screen bg-base pb-24 font-sans px-5 pt-4">
      <style>{`
        .leaflet-tooltip.doctor-tooltip {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 12px 14px;
          box-shadow: 0 12px 24px rgba(15,23,42,.12);
          opacity: 1 !important;
          white-space: normal;
        }
        .leaflet-tooltip-right.doctor-tooltip::before { border-right-color: #fff; }
        .leaflet-tooltip-left.doctor-tooltip::before { border-left-color: #fff; }
        .leaflet-tooltip-top.doctor-tooltip::before { border-top-color: #fff; }
        .leaflet-tooltip-bottom.doctor-tooltip::before { border-bottom-color: #fff; }
      `}</style>

      <div className="max-w-screen-lg mx-auto">
        <div className="flex items-center justify-between gap-2 mb-3">
          <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-brand-dark transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t('land_back')}
          </button>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <MapPin className="text-brand-purple" size={22} />
          <h2 className="text-xl font-extrabold text-brand-dark">Hospitales y clínicas cercanos</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">Hospitales y clínicas cerca de tu ubicación. Pasa el cursor sobre un marcador para ver sus detalles.</p>

        {locating && !patientPos && (
          <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-soft text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-brand-purple animate-spin" />
            <p className="text-sm text-gray-500">{t('presencial_locating')}</p>
          </div>
        )}

        {!locating && locateError && !patientPos && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-brand-dark mb-1">{t('presencial_locate_blocked_title')}</p>
              <p className="text-sm text-gray-500 mb-5">{locateError}</p>
              <div className="flex gap-2">
                <button
                  onClick={onBack}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600"
                >
                  {t('land_back')}
                </button>
                <button
                  onClick={locate}
                  className="flex-1 py-2.5 rounded-xl bg-brand-purple text-white text-sm font-bold hover:opacity-90 transition-all"
                >
                  {t('presencial_retry')}
                </button>
              </div>
            </div>
          </div>
        )}

        {patientPos && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                {t('presencial_radius_label')}
              </label>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="bg-white border border-gray-200 rounded-xl py-1.5 px-3 text-sm text-brand-dark focus:outline-none focus:border-brand-blue"
              >
                {RADIUS_OPTIONS.map((km) => (
                  <option key={km} value={km}>{km} km</option>
                ))}
              </select>
              {nearbyLoading && <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />}
              {nearbyError && (
                <span className="text-[11px] text-amber-600">{t('presencial_nearby_error')}</span>
              )}

              <div className="flex-1" />
              <button
                onClick={locate}
                disabled={locating}
                className="flex items-center gap-1.5 text-xs font-bold text-brand-purple bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                Actualizar Ubicación
              </button>
            </div>

            <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-soft mb-3 relative" style={{ height: 460 }}>
              <MapContainer center={[patientPos.lat, patientPos.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[patientPos.lat, patientPos.lng]} icon={patientIcon()} />

                {nearbyPlaces.map((p) => (
                  <Marker
                    key={p.id}
                    position={[p.lat, p.lng]}
                    icon={externalPinIcon(p.amenity)}
                    eventHandlers={p.address ? { click: () => copyAddress(p.address) } : undefined}
                  >
                    <Tooltip direction="auto" className="doctor-tooltip" opacity={1} interactive>
                      <ExternalPlacePreviewCard p={p} t={t} />
                    </Tooltip>
                  </Marker>
                ))}
              </MapContainer>

              <div
                className="absolute left-3 bottom-3 z-[1000] rounded-xl px-3 py-2 text-[11px] text-gray-600 flex items-center gap-3 bg-white/95 border border-gray-200 shadow-sm"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: PATIENT_COLOR }} /> {t('presencial_you')}
                </span>
                {['hospital', 'clinic', 'pharmacy'].map((amenity) => (
                  nearbyPlaces.some((p) => p.amenity === amenity) && (
                    <span key={amenity} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: EXTERNAL_AMENITY_COLOR[amenity] }} /> {amenityLabel(amenity)}
                    </span>
                  )
                ))}
              </div>
            </div>

            {!nearbyLoading && nearbyPlaces.length === 0 && !nearbyError && (
              <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 text-center text-sm text-gray-500 mb-3">
                {t('presencial_empty')}
              </div>
            )}
          </>
        )}
      </div>

      {addressCopied && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[2000] bg-brand-dark text-white text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-lg">
          {t('presencial_address_copied')}
        </div>
      )}
    </div>
  );
};

export default EspecialistasPresencialSearch;