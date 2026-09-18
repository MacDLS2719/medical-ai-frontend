import React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

export default function DoctorAvailabilityTab() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Disponibilidad y agenda</h3>
      <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
        <div className="p-2 bg-blue-600 text-white rounded-xl">
          <CalendarIcon size={18} />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-900">Próximas citas disponibles</h4>
          <p className="text-xs text-slate-600">El médico cuenta con huecos libres durante esta semana tanto para consultas presenciales como videoconsultas.</p>
        </div>
      </div>
    </div>
  );
}