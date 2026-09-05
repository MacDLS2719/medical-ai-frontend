import React from 'react';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff } from 'lucide-react';

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

  if (callStatus === 'idle') return null;

  // Daily.co devuelve una URL directa lista para iframe — no necesitamos construirla
  const roomUrl = callData?.room_url || null;
  const roomName = callData?.room_name || '';

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col"
           style={{ minHeight: '500px' }}>

        {/* ESTADO: LLAMADA ENTRANTE */}
        {callStatus === 'ringing' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-teal-500/20 animate-ping absolute inset-0" />
              <div className="w-24 h-24 rounded-full bg-teal-600 flex items-center justify-center text-white relative z-10">
                <Phone size={40} className="animate-bounce" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {callData?.caller_name || 'Alguien'} te está llamando
            </h3>
            <p className="text-slate-400 text-sm mb-8">Videollamada médica entrante</p>
            
            <div className="flex items-center gap-6">
              <button
                onClick={onReject}
                className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transition-all hover:scale-105"
              >
                <PhoneOff size={24} />
              </button>
              <button
                onClick={onAccept}
                className="bg-teal-500 hover:bg-teal-600 text-white p-4 rounded-full transition-all hover:scale-105"
              >
                <Phone size={24} />
              </button>
            </div>
          </div>
        )}

        {/* ESTADO: EN LLAMADA o LLAMANDO (con room) */}
        {(callStatus === 'in-call' || callStatus === 'calling') && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-slate-900 relative" style={{ minHeight: '420px' }}>
              {roomUrl ? (
                <>
                  <iframe
                    src={roomUrl}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                    style={{ width: '100%', height: '100%', border: 'none', minHeight: '420px' }}
                    title="Videollamada médica — Daily.co"
                  />
                  {callStatus === 'calling' && (
                    <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center pointer-events-none">
                      <div className="bg-slate-800/90 backdrop-blur rounded-2xl px-6 py-4 text-center border border-slate-600">
                        <div className="w-12 h-12 rounded-full bg-blue-600/20 animate-ping mx-auto mb-3" />
                        <p className="text-white font-semibold text-sm">Sala lista — esperando que acepten...</p>
                        <p className="text-slate-400 text-xs mt-1">Sala: {roomName}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full bg-blue-600/20 animate-ping absolute inset-0" />
                    <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white relative z-10">
                      <Video size={40} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Iniciando llamada...</h3>
                  <p className="text-slate-400 text-sm mb-8">Conectando con el servidor</p>
                </div>
              )}


              {/* Tu nombre en la esquina */}
              <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-lg text-xs text-slate-300 border border-slate-700 z-10">
                {userName || 'Tú'}
              </div>
            </div>

            {/* BARRA DE CONTROLES */}
            <div className="p-4 bg-slate-800 border-t border-slate-700 flex items-center justify-center gap-4 relative">
               {callStatus === 'calling' && (
                 <button
                   onClick={onCancel}
                   className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 z-10 pointer-events-auto"
                 >
                   <PhoneOff size={18} />
                   <span>Cancelar llamada</span>
                 </button>
               )}
               {callStatus === 'in-call' && (
                 <>
                   <button
                     onClick={() => setIsMuted(!isMuted)}
                     className={`p-3 rounded-full transition-colors ${
                       isMuted ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                     }`}
                   >
                     {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                   </button>

                   <button
                     onClick={() => setIsVideoOff(!isVideoOff)}
                     className={`p-3 rounded-full transition-colors ${
                       isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                     }`}
                   >
                     {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                   </button>

                   <button
                     onClick={onEnd}
                     className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold transition-all flex items-center gap-2"
                   >
                     <PhoneOff size={20} />
                     <span>Colgar</span>
                   </button>
                 </>
               )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
