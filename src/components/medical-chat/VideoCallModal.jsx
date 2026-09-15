import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, Loader2, ExternalLink } from 'lucide-react';
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
  // Controls whether the Daily.co iframe is shown or the join-room button
  const [hasJoined, setHasJoined] = useState(false);

  // Reset hasJoined whenever a new call starts
  useEffect(() => {
    if (callStatus !== 'in-call') {
      setHasJoined(false);
    }
  }, [callStatus]);

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
  const isInCall = callStatus === 'in-call';

  return (
    <div className={`fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center ${isInCall ? 'p-0 md:p-3' : 'p-4'} animate-in fade-in duration-300`}>
      <div
        className={`bg-slate-900 border border-slate-800 w-full ${isInCall ? 'max-w-[98vw] h-[95vh]' : 'max-w-2xl min-h-[520px]'} rounded-3xl overflow-hidden shadow-2xl flex flex-col relative`}
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

        {/* ESTADO: EN LLAMADA (VISTA DIVIDIDA: VIDEO DAILY + CHAT A LA DERECHA) */}
        {isInCall && (
          <div className="flex-1 flex flex-col md:flex-row h-full min-h-0 overflow-hidden">

            {/* LADO IZQUIERDO: SALA DAILY.CO */}
            <div className="flex-1 flex flex-col h-full bg-slate-950 relative min-w-0 border-r border-slate-800">

              {/* PANTALLA DE INGRESO — antes de unirse a la sala */}
              {!hasJoined ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center bg-gradient-to-b from-slate-950 to-slate-900">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-blue-600 shadow-xl shadow-teal-500/30">
                    <Video size={44} className="text-white" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      Videoconferencia lista
                    </h3>
                    <p className="text-slate-400 text-sm">
                      La sala con {callData?.caller_name || callData?.target_name || 'tu contacto'} está disponible
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                    {/* Botón principal para entrar en iframe embebido */}
                    <button
                      onClick={() => setHasJoined(true)}
                      className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-teal-500/30 cursor-pointer"
                    >
                      <Video size={22} />
                      Ingresar a videoconferencia
                    </button>

                    {/* Alternativa: abrir en pestaña nueva */}
                    {roomUrl && (
                      <a
                        href={roomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
                      >
                        <ExternalLink size={16} />
                        Abrir en nueva pestaña
                      </a>
                    )}
                  </div>

                  {/* Colgar desde pantalla de ingreso */}
                  <button
                    onClick={onEnd}
                    className="mt-2 flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors cursor-pointer"
                  >
                    <PhoneOff size={16} />
                    Finalizar llamada
                  </button>
                </div>
              ) : (
                /* IFRAME DAILY.CO — visible tras hacer click en "Ingresar" */
                <div className="flex-1 relative bg-slate-950" style={{ minHeight: '350px' }}>
                  {roomUrl ? (
                    <iframe
                      src={roomUrl}
                      allow="camera; microphone; fullscreen; display-capture; autoplay"
                      style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0 }}
                      title="Videollamada médica — Daily.co"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                      <Loader2 size={36} className="animate-spin text-teal-500" />
                      <p className="text-slate-300 font-medium">Conectando videollamada...</p>
                    </div>
                  )}

                  {/* Indicador de usuario */}
                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur px-3.5 py-1.5 rounded-xl text-xs text-slate-200 border border-slate-700/80 z-10">
                    {userName || 'Tú'}
                  </div>
                </div>
              )}

              {/* CONTROLES — solo visibles cuando se unió al iframe */}
              {hasJoined && (
                <div className="p-3 md:p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4 shrink-0">
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
              )}
            </div>

            {/* LADO DERECHO: CHAT EN TIEMPO REAL CON REGISTRO */}
            {children && (
              <div className="w-full md:w-[420px] lg:w-[460px] shrink-0 h-full bg-white flex flex-col overflow-hidden">
                {children}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
