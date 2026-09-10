import React, { useEffect } from 'react';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, Loader2 } from 'lucide-react';
import { callSoundPlayer } from '../utils/callSoundPlayer';

export default function VideoCallModal({
  callStatus,
  callData,
  userName,
  onAccept,
  onReject,
  onCancel,
  onEnd
}) {
  const [isMuted, setIsMuted] = React.useState(false);
  const [isVideoOff, setIsVideoOff] = React.useState(false);

  // Manejo de sonido de llamadas entrantes y salientes
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

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div
        className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col relative"
        style={{ minHeight: '520px' }}
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
              Llamando a {callData?.target_name || 'Médico'}...
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

        {/* ESTADO: EN LLAMADA (VIDEO SALA DAILY.CO) */}
        {callStatus === 'in-call' && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-slate-950 relative min-h-[440px]">
              {roomUrl ? (
                <iframe
                  src={roomUrl}
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                  style={{ width: '100%', height: '100%', border: 'none', minHeight: '440px' }}
                  title="Videollamada médica — Daily.co"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                  <Loader2 size={36} className="animate-spin text-teal-500" />
                  <p className="text-slate-300 font-medium">Conectando videollamada...</p>
                </div>
              )}

              {/* Nombre de usuario activo */}
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur px-3.5 py-1.5 rounded-xl text-xs text-slate-200 border border-slate-700/80 z-10">
                {userName || 'Tú'}
              </div>
            </div>

            {/* CONTROLES DE LA LLAMADA */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                  isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                }`}
                title={isMuted ? 'Desactivar silencio' : 'Silenciar'}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                  isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                }`}
                title={isVideoOff ? 'Encender cámara' : 'Apagar cámara'}
              >
                {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
              </button>

              <button
                onClick={onEnd}
                className="bg-red-600 hover:bg-red-700 text-white px-7 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer"
              >
                <PhoneOff size={20} />
                <span>Colgar</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
