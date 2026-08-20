import { BellRing } from 'lucide-react';

export default function PatientNotifications() {
  return (
    <div className="flex-1 p-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl">
            <BellRing size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Notificaciones</h1>
            <p className="text-slate-500 mt-1">Alertas según tus patologías registradas</p>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="bg-slate-100 text-slate-400 p-6 rounded-full mb-4">
            <BellRing size={48} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No hay notificaciones nuevas</h3>
          <p className="text-slate-500 max-w-md">
            Te avisaremos cuando haya información relevante o alertas importantes sobre tus condiciones médicas.
          </p>
        </div>
      </div>
    </div>
  );
}
