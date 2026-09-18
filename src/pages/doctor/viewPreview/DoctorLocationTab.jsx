import React from 'react';
import { MapPin, Globe, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for leaflet marker icon missing in some React setups
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function DoctorLocationTab({ profile, locationText }) {
  const hasCoordinates = profile?.latitude && profile?.longitude;
  const position = hasCoordinates ? [profile.latitude, profile.longitude] : null;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Ubicación y contacto</h3>
        {hasCoordinates && (
          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${profile.latitude},${profile.longitude}`} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Navigation size={12} />
            Cómo llegar
          </a>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4 text-xs text-slate-600">
          {locationText && (
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-0.5">Dirección del consultorio</p>
                <p className="font-medium">{locationText}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-2.5">
            <Globe size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-0.5">Idiomas de atención</p>
              <p className="font-medium">Español, Inglés</p>
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-6 space-y-2">
            <p className="font-bold text-slate-800 text-xs">Información de la consulta</p>
            <p className="text-[11px] leading-relaxed">Dispone de acceso adaptado para pacientes con movilidad reducida y sala de espera privada.</p>
          </div>
        </div>

        {/* CONTENEDOR DEL MAPA */}
        <div className="h-64 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner bg-slate-50 relative z-0">
          {hasCoordinates ? (
            <MapContainer center={position} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%", zIndex: 0 }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={position}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-slate-800 m-0">Consultorio Médico</p>
                    <p className="text-[10px] text-slate-500 m-0">{locationText}</p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
              <MapPin size={32} className="mb-2 opacity-20" />
              <p className="text-xs font-bold text-slate-600">Mapa no disponible</p>
              <p className="text-[10px]">El médico no ha proporcionado coordenadas exactas de su ubicación.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}