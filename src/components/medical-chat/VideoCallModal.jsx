import React, { useEffect, useState } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Loader2, 
  ExternalLink,
  Monitor,
  UserPlus,
  MoreHorizontal
} from 'lucide-react';
import { callSoundPlayer } from '../../utils/callSoundPlayer';

export default function VideoCallModal({
  callStatus = 'idle', // 'idle' | 'calling' | 'ringing' | 'in-call'
  callData = null,
  userName = '',
  onAccept,
  onReject,
  onCancel,
  onEnd,
  children
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Timer para llamada activa
  useEffect(() => {
    let interval = null;
    if (callStatus === 'in-call') {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);

  // Reset al cambiar estado
  useEffect(() => {
    if (callStatus !== 'in-call') {
      setHasJoined(false);
    }
  }, [callStatus]);

  // Sonido de llamada
  useEffect(() => {
    if (callStatus === 'calling') {
      callSoundPlayer.playOutgoingRing();
    } else if (callStatus === 'ringing') {
      callSoundPlayer.playIncomingRing();
    } else {
      callSoundPlayer.stop();
    }

    return () => {
      callSoundPlayer.stop();
    };
  }, [callStatus]);

  if (callStatus === 'idle') return null;

  const roomUrl = callData?.room_url || null;
  const isInCall = callStatus === 'in-call';

  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const contactName = callData?.caller_name || callData?.target_name || 'Paciente';

  return (
    <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center ${isInCall ? 'p-2 md:p-4' : 'p-4'} animate-in fade-in duration-300 font-sans`}>
      <div
        className={`bg-[#F8FAFC] border border-slate-200/80 w-full ${isInCall ? 'max-w-[1600px] h-[95vh]' : 'max-w-2xl min-h-[520px]'} rounded-3xl overflow-hidden shadow-2xl flex flex-col relative`}
      >
        {/* ESTADO: LLAMADA ENTRANTE */}
        {callStatus === 'ringing' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950/40">
            <div className="relative mb-8">
              <div className="w-28 h-28 rounded-full bg-teal-500/20 animate-ping absolute inset-0" />
              <div className="w-28 h-28 rounded-full bg-teal-500/30 animate-pulse absolute -inset-2" />
              <div className="w-28 h-28 rounded-full bg-teal-600 flex items-center justify-center text-white relative z-10 shadow-lg shadow-teal-500/30">
                <Phone size={48} className="animate-bounce" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">
              {callData?.caller_name || 'Contacto'} te está llamando
            </h3>
            <p className="text-teal-300 text-sm font-medium mb-10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping inline-block"></span>
              Videollamada médica entrante...
            </p>

            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={onReject}
                  className="bg-red-600 hover:bg-red-700 text-white p-5 rounded-full transition-all duration-300 hover:scale-110 shadow-lg shadow-red-600/40 cursor-pointer"
                  title="Rechazar llamada"
                >
                  <PhoneOff size={28} />
                </button>
                <span className="text-xs text-slate-400 font-medium">Rechazar</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={onAccept}
                  className="bg-teal-500 hover:bg-teal-600 text-white p-5 rounded-full transition-all duration-300 hover:scale-110 shadow-lg shadow-teal-500/40 cursor-pointer animate-pulse"
                  title="Contestar llamada"
                >
                  <Phone size={28} />
                </button>
                <span className="text-xs text-teal-400 font-medium">Contestar</span>
              </div>
            </div>
          </div>
        )}

        {/* ESTADO: LLAMANDO (MARCANDO SALIENTE) */}
        {callStatus === 'calling' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950/40">
            <div className="relative mb-8">
              <div className="w-28 h-28 rounded-full bg-blue-500/20 animate-ping absolute inset-0" />
              <div className="w-28 h-28 rounded-full bg-blue-500/30 animate-pulse absolute -inset-2" />
              <div className="w-28 h-28 rounded-full bg-blue-600 flex items-center justify-center text-white relative z-10 shadow-lg shadow-blue-500/30">
                <Video size={48} className="animate-pulse" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">
              Llamando a {callData?.target_name || 'Usuario'}...
            </h3>
            <p className="text-blue-300 text-sm font-medium mb-10 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-400" />
              Marcando... Esperando respuesta
            </p>

            <button
              onClick={onCancel}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-full font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-red-600/30 flex items-center gap-3 cursor-pointer"
            >
              <PhoneOff size={20} />
              <span>Cancelar llamada</span>
            </button>
          </div>
        )}

        {/* ESTADO: EN LLAMADA */}
        {isInCall && (
          <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-[#F8FAFC]">
            
            {/* ENCABEZADO SUPERIOR DE LA CONSULTA */}
            <div className="bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center gap-3">
                <h2 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
                  Consulta con {contactName}
                </h2>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 rounded-full border border-slate-200/60 text-xs font-bold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{formatTimer(timerSeconds)}</span>
                </div>
              </div>
            </div>

            {/* CONTENIDO PRINCIPAL: VIDEO + CHAT */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">

              {/* COLUMNA IZQUIERDA: ÁREA DE VIDEO & CONTROLES */}
              <div className="flex-1 flex flex-col h-full p-4 md:p-6 overflow-hidden min-w-0">

                {/* CONTENEDOR DE VIDEO LIMPIO (SALA DAILY.CO) */}
                <div className="relative w-full flex-1 rounded-3xl overflow-hidden border border-slate-200/80 shadow-md bg-slate-900 min-h-[300px]">
                  
                  {/* IFRAME DAILY.CO O PANTALLA DE INGRESO */}
                  {hasJoined && roomUrl ? (
                    <iframe
                      src={roomUrl}
                      allow="camera; microphone; fullscreen; display-capture; autoplay"
                      style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0 }}
                      title="Videollamada médica — Daily.co"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 text-center text-white">
                      <div className="w-20 h-20 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4 text-blue-400 shadow-lg shadow-blue-500/10">
                        <Video size={40} />
                      </div>
                      <h3 className="text-xl font-extrabold mb-1 tracking-tight">Videoconferencia médica en vivo</h3>
                      <p className="text-xs text-slate-400 max-w-sm mb-6">
                        La sala con {contactName} está lista. Haz clic abajo para ingresar.
                      </p>
                      <button
                        onClick={() => setHasJoined(true)}
                        className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all cursor-pointer hover:scale-[1.02]"
                      >
                        Ingresar a la consulta en vivo
                      </button>
                    </div>
                  )}
                </div>

                {/* BARRA DE CONTROLES INFERIOR */}
                <div className="mt-4 py-3 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-center gap-4 sm:gap-7 flex-wrap shrink-0">
                  {/* Silenciar */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isMuted ? 'bg-red-500 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200/60'
                      }`}
                    >
                      {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <span className="text-[11px] font-semibold text-slate-600">Silenciar</span>
                  </div>

                  {/* Detener vídeo */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => setIsVideoOff(!isVideoOff)}
                      className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isVideoOff ? 'bg-red-500 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200/60'
                      }`}
                    >
                      {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>
                    <span className="text-[11px] font-semibold text-slate-600">Detener vídeo</span>
                  </div>

                  {/* Compartir pantalla */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => setIsScreenSharing(!isScreenSharing)}
                      className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isScreenSharing ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200/60'
                      }`}
                    >
                      <Monitor size={20} />
                    </button>
                    <span className="text-[11px] font-semibold text-slate-600">Compartir pantalla</span>
                  </div>

                  {/* Finalizar consulta (Botón Rojo Central) */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={onEnd}
                      className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <PhoneOff size={22} />
                    </button>
                    <span className="text-[11px] font-extrabold text-red-600">Finalizar consulta</span>
                  </div>

                  {/* Añadir participante */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200/60 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <UserPlus size={20} />
                    </button>
                    <span className="text-[11px] font-semibold text-slate-600">Añadir participante</span>
                  </div>

                  {/* Más opciones */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200/60 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    <span className="text-[11px] font-semibold text-slate-600">Más opciones</span>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: CHAT LIMPIO */}
              {children && (
                <div className="w-full md:w-[380px] lg:w-[440px] shrink-0 h-full bg-white flex flex-col overflow-hidden border-l border-slate-200/80">
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {children}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
