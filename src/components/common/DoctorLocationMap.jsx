import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

// Configuración de iconos de Leaflet para evitar problemas de assets en Vite
const customMarkerIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente interno para manejar clics en el mapa
function MapClickHandler({ onLocationSelect, disabled }) {
  useMapEvents({
    click(e) {
      if (!disabled && onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

// Componente interno para centrar el mapa suavemente y recalcular tamaño
function MapViewUpdater({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.0 });
    }
  }, [center, zoom, map]);

  return null;
}

export default function DoctorLocationMap({
  latitude,
  longitude,
  address = '',
  city = '',
  country = 'Colombia',
  onChange,
  readOnly = false,
  height = '100%'
}) {
  const [searching, setSearching] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [geoSuccess, setGeoSuccess] = useState(null);
  const markerRef = useRef(null);
  const lastSearchQueryRef = useRef('');

  // Parsear valores
  const currentLat = latitude !== undefined && latitude !== null && latitude !== '' ? parseFloat(latitude) : null;
  const currentLng = longitude !== undefined && longitude !== null && longitude !== '' ? parseFloat(longitude) : null;
  const hasCoordinates = currentLat !== null && currentLng !== null && !isNaN(currentLat) && !isNaN(currentLng);

  // Centro por defecto según país
  const defaultCenter = useMemo(() => {
    if (country?.toLowerCase().includes('españa') || country?.toLowerCase().includes('spain')) {
      return [40.4168, -3.7038]; // Madrid
    }
    if (country?.toLowerCase().includes('méxico') || country?.toLowerCase().includes('mexico')) {
      return [19.4326, -99.1332]; // CDMX
    }
    return [4.7110, -74.0721]; // Bogotá
  }, [country]);

  const mapCenter = hasCoordinates ? [currentLat, currentLng] : defaultCenter;
  const mapZoom = hasCoordinates ? 15 : 6;

  // Auto-geocodificación automática cuando el usuario escribe o cambia la Ciudad / Dirección
  useEffect(() => {
    if (readOnly) return;
    const queryParts = [address?.trim(), city?.trim(), country?.trim()].filter(Boolean);
    const query = queryParts.join(', ');

    if (queryParts.length === 0 || query === lastSearchQueryRef.current) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      lastSearchQueryRef.current = query;
      setSearching(true);
      setGeoError(null);

      try {
        const encoded = encodeURIComponent(query);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`, {
          headers: { 'Accept-Language': 'es' }
        });
        const data = await res.json();

        if (data && data.length > 0) {
          const found = data[0];
          const lat = parseFloat(found.lat);
          const lon = parseFloat(found.lon);
          if (onChange) {
            onChange({
              latitude: parseFloat(lat.toFixed(6)),
              longitude: parseFloat(lon.toFixed(6))
            });
          }
          setGeoSuccess(`Ubicación aproximada: ${city || address}`);
          setTimeout(() => setGeoSuccess(null), 3500);
        } else if (city?.trim()) {
          const cityQuery = encodeURIComponent(`${city.trim()}, ${country.trim()}`);
          const cityRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${cityQuery}&limit=1`, {
            headers: { 'Accept-Language': 'es' }
          });
          const cityData = await cityRes.json();
          if (cityData && cityData.length > 0) {
            const found = cityData[0];
            const lat = parseFloat(found.lat);
            const lon = parseFloat(found.lon);
            if (onChange) {
              onChange({
                latitude: parseFloat(lat.toFixed(6)),
                longitude: parseFloat(lon.toFixed(6))
              });
            }
            setGeoSuccess(`Ubicado en ciudad: ${city}`);
            setTimeout(() => setGeoSuccess(null), 3500);
          }
        }
      } catch (err) {
        console.warn('Geocoding search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 900);

    return () => clearTimeout(timeoutId);
  }, [address, city, country, readOnly]);

  const handleMarkerDragEnd = () => {
    if (readOnly || !onChange) return;
    const marker = markerRef.current;
    if (marker != null) {
      const latlng = marker.getLatLng();
      onChange({
        latitude: parseFloat(latlng.lat.toFixed(6)),
        longitude: parseFloat(latlng.lng.toFixed(6))
      });
      setGeoSuccess('Punto exacto confirmado');
      setTimeout(() => setGeoSuccess(null), 2500);
    }
  };

  const handleMapClick = (lat, lng) => {
    if (readOnly || !onChange) return;
    onChange({
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6))
    });
    setGeoSuccess('Punto fijado en el mapa');
    setTimeout(() => setGeoSuccess(null), 2500);
  };

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 bg-white relative flex flex-col">
      {/* Alertas informativas opcionales */}
      {geoError && (
        <div className="absolute top-2 left-2 right-2 z-30 px-3 py-1.5 bg-amber-50/90 backdrop-blur-xs border border-amber-200 text-amber-800 text-[10px] font-medium rounded-lg flex items-center gap-2 shadow-sm">
          <AlertCircle size={13} className="text-amber-600 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {geoSuccess && (
        <div className="absolute top-2 left-2 right-2 z-30 px-3 py-1.5 bg-emerald-50/90 backdrop-blur-xs border border-emerald-200 text-emerald-800 text-[10px] font-medium rounded-lg flex items-center gap-2 shadow-sm">
          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
          <span>{geoSuccess}</span>
        </div>
      )}

      {/* Contenedor del Mapa Leaflet puro */}
      <div className="relative w-full h-full flex-1">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={!readOnly}
          style={{ height: '100%', width: '100%', zIndex: 10 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewUpdater center={mapCenter} zoom={hasCoordinates ? 15 : 12} />

          <MapClickHandler onLocationSelect={handleMapClick} disabled={readOnly} />

          {hasCoordinates && (
            <Marker
              ref={markerRef}
              position={[currentLat, currentLng]}
              icon={customMarkerIcon}
              draggable={!readOnly}
              eventHandlers={{
                dragend: handleMarkerDragEnd
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-800">
                    {address || city ? `${address} ${city ? `(${city})` : ''}` : 'Ubicación del Consultorio'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Lat: {currentLat.toFixed(5)}, Lng: {currentLng.toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Overlay de carga al geocodificar */}
        {searching && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-md border border-blue-100 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-blue-600" />
              <span>Buscando ubicación...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}