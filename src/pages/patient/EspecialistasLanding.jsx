import React from 'react';
import {
  MapPin, Video, ShieldCheck, Calendar, Users, ArrowLeft, ArrowRight,
  Clock, Search,
} from 'lucide-react';

// Importación directa de las imágenes asegurando la ruta correcta desde src/pages/patient/components/
import imgEncontrar from '../../assets/imgs/encontrar.png';
import imgVideoCall from '../../assets/imgs/video-call.png';

const EspecialistasLanding = ({ onBack, onSelectVideo, onSelectPresencial, onMyAppointments }) => {
  return (
    <div className="w-full min-h-full h-auto overflow-y-auto bg-slate-50 pb-28 pt-4 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Barra superior compacta */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {onMyAppointments && (
          <button
            onClick={onMyAppointments}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4" /> My Appointments
          </button>
        )}
      </div>

      {/* Título y subtítulo más compactos */}
      <div className="mb-5 text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight mb-1">
          Connect with specialist doctors
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
          Choose the option that best fits your needs and get fast, quality medical care.
        </p>
      </div>

      {/* Tarjetas de Opciones (Presencial vs Video) en formato más compacto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        
        {/* Opción 1: Presencial */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-md relative flex flex-col justify-between">
          <span className="absolute top-4 left-4 w-9 h-9 rounded-full bg-blue-50 text-blue-600 text-sm font-extrabold flex items-center justify-center z-10">1</span>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 min-w-0 order-2 sm:order-1">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug pl-11 mb-1.5">
                I want a nearby clinic or hospital where a doctor can see me in person
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-3 pl-11">
                See the hospitals and clinics closest to your location on the map.
              </p>
              <ul className="space-y-1.5 pl-11 sm:pl-0">
                <li className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <MapPin size={15} className="text-blue-600 shrink-0" /> Locations near you
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <Search size={15} className="text-blue-600 shrink-0" /> No need to pick a specialty
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <ShieldCheck size={15} className="text-blue-600 shrink-0" /> Verified data for your area
                </li>
              </ul>
            </div>

            {/* Imagen ilustrativa */}
            <div className="w-full sm:w-44 md:w-52 h-40 shrink-0 rounded-xl overflow-hidden bg-slate-50/50 flex items-center justify-center order-1 sm:order-2 self-center">
              <img
                src={imgEncontrar}
                alt="In person clinic"
                className="w-full h-full object-contain p-1"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>

          <button
            onClick={onSelectPresencial}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-600 hover:text-white shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            Find hospitals and pharmacies <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Opción 2: Videollamada */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-md relative flex flex-col justify-between">
          <span className="absolute top-4 left-4 w-9 h-9 rounded-full bg-blue-50 text-blue-600 text-sm font-extrabold flex items-center justify-center z-10">2</span>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 min-w-0 order-2 sm:order-1">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug pl-11 mb-1.5">
                I want a quick video call appointment
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-3 pl-11">
                Talk to a specialist doctor by video call as soon as possible, wherever you are.
              </p>
              <ul className="space-y-1.5 pl-11 sm:pl-0">
                <li className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <Video size={15} className="text-blue-600 shrink-0" /> Immediate online care
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <Clock size={15} className="text-blue-600 shrink-0" /> No travel, no waiting
                </li>
                <li className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <ShieldCheck size={15} className="text-blue-600 shrink-0" /> Verified doctors
                </li>
              </ul>
            </div>

            {/* Imagen ilustrativa */}
            <div className="w-full sm:w-44 md:w-52 h-40 shrink-0 rounded-xl overflow-hidden bg-slate-50/50 flex items-center justify-center order-1 sm:order-2 self-center">
              <img
                src={imgVideoCall}
                alt="Video call"
                className="w-full h-full object-contain p-1"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>

          <button
            onClick={onSelectVideo}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-600 hover:text-white shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            Access video calls <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Tarjeta de Seguridad y Confidencialidad Compacta */}
      <div className="bg-white rounded-xl p-3 sm:p-4 flex items-center gap-3 border border-slate-100 shadow-xs mb-6">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <ShieldCheck size={18} />
        </div>
        <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
          <span className="font-bold text-slate-800">Safe and confidential care.</span> All doctors are verified and your information is protected.
        </p>
      </div>

      {/* Sección inferior: ¿Cómo funciona? más pequeña */}
      <h4 className="text-center text-xs sm:text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">How does it work?</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto mb-6">
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Find and book</p>
            <p className="text-[11px] text-slate-500">Search and book easily.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Get care</p>
            <p className="text-[11px] text-slate-500">Connect by video call.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EspecialistasLanding;