import React, { useEffect, useRef, useState } from 'react';
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
  MoreHorizontal,
  Radio
} from 'lucide-react';
import { callSoundPlayer } from '../../utils/callSoundPlayer';

export default function VideoCallModal({
  callStatus = 'idle', // 'idle' | 'calling' | 'ringing' | 'in-call'
  callData = null,
  userName = '',
  senderId,
  onAccept,
  onReject,
  onCancel,
  onEnd,
  onProcessRecording,
  children
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRecordingCall, setIsRecordingCall] = useState(false);
  const [audioSignalDetected, setAudioSignalDetected] = useState(false);
  const [isProcessingRecording, setIsProcessingRecording] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const analyserRef = useRef(null);
  const captureRef = useRef({ display: null, microphone: null, audioContext: null });

  const releaseCapture = () => {
    captureRef.current.display?.getTracks().forEach((track) => track.stop());
    captureRef.current.microphone?.getTracks().forEach((track) => track.stop());
    captureRef.current.audioContext?.close().catch(() => {});
    captureRef.current = { display: null, microphone: null, audioContext: null };
    analyserRef.current = null;
    recorderRef.current = null;
    setIsRecordingCall(false);
    setAudioSignalDetected(false);
  };

  const stopCallRecording = () => new Promise((resolve) => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      releaseCapture();
      resolve(null);
      return;
    }

    recorder.addEventListener('stop', () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      chunksRef.current = [];
      releaseCapture();
      resolve(blob.size ? blob : null);
    }, { once: true });
    recorder.stop();
  });

  const startCallRecording = async () => {
    setRecordingError('');
    try {
      if (!navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) {
        throw new Error('Este navegador no permite capturar audio de la llamada. Usa Chrome o Edge en HTTPS o localhost.');
      }

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Este navegador no soporta la mezcla de audio necesaria para grabar la llamada.');
      }

      const audioContext = new AudioContextClass();
      captureRef.current = { display: null, microphone: null, audioContext };
      const resumeAudioContext = audioContext.resume().catch(() => null);
      const displayPromise = navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
        systemAudio: 'include',
      });
      const display = await displayPromise;
      await resumeAudioContext;
      if (audioContext.state !== 'running') {
        throw new Error('El navegador pausó la captura de audio. Permite el audio del sitio y vuelve a iniciar la transcripción.');
      }

      captureRef.current = { display, microphone: null, audioContext };
      const displayAudioTracks = display.getAudioTracks();
      if (!displayAudioTracks.length) {
        throw new Error('El navegador no compartió audio. Elige “Pestaña de Chrome”, activa “Compartir audio de la pestaña” y luego pulsa “Compartir”. No elijas Ventana ni Pantalla.');
      }

      let microphone = null;
      try {
        microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        console.warn('[VideoCall] No se pudo capturar el micrófono; se grabará el audio de la pestaña.', error);
      }

      captureRef.current = { display, microphone, audioContext };
      const destination = audioContext.createMediaStreamDestination();
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -45;
      compressor.knee.value = 24;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      const gain = audioContext.createGain();
      gain.gain.value = 1.25;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;

      audioContext.createMediaStreamSource(new MediaStream(displayAudioTracks)).connect(compressor);
      if (microphone?.getAudioTracks().length) {
        audioContext.createMediaStreamSource(microphone).connect(compressor);
      }
      compressor.connect(gain);
      gain.connect(destination);
      gain.connect(analyser);
      analyserRef.current = analyser;

      const preferredMimeType = ['audio/webm;codecs=opus', 'audio/webm'].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(destination.stream, preferredMimeType ? { mimeType: preferredMimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      });
      recorder.addEventListener('error', (event) => {
        setRecordingError(event.error?.message || 'Falló la captura de audio.');
      });
      recorder.start(1000);
      setIsRecordingCall(true);
    } catch (error) {
      releaseCapture();
      setRecordingError(error.message || 'No se pudo iniciar la grabación.');
    }
  };

  const handleEndCall = async () => {
    if (recorderRef.current) {
      setIsProcessingRecording(true);
      try {
        const recording = await stopCallRecording();
        if (recording && onProcessRecording) {
          await onProcessRecording(recording);
        }
      } catch (error) {
        console.error('[VideoCall] Error procesando la grabación:', error);
        window.alert(error?.response?.data?.detail || error.message || 'No se pudo procesar la grabación.');
      } finally {
        setIsProcessingRecording(false);
      }
    }
    onEnd?.();
  };

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

  useEffect(() => {
    const analyser = analyserRef.current;
    if (!isRecordingCall || !analyser) {
      setAudioSignalDetected(false);
      return undefined;
    }

    const samples = new Float32Array(analyser.fftSize);
    const interval = window.setInterval(() => {
      analyser.getFloatTimeDomainData(samples);
      const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
      setAudioSignalDetected(rms > 0.006);
    }, 300);

    return () => window.clearInterval(interval);
  }, [isRecordingCall]);

  // Reset al cambiar estado
  useEffect(() => {
    if (callStatus !== 'in-call') {
      setHasJoined(false);
      if (recorderRef.current) {
        const recorder = recorderRef.current;
        if (recorder.state !== 'inactive') {
          recorder.addEventListener('stop', async () => {
            const recording = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
            chunksRef.current = [];
            captureRef.current.display?.getTracks().forEach((track) => track.stop());
            captureRef.current.microphone?.getTracks().forEach((track) => track.stop());
            captureRef.current.audioContext?.close().catch(() => {});
            captureRef.current = { display: null, microphone: null, audioContext: null };
            analyserRef.current = null;
            recorderRef.current = null;
            setIsRecordingCall(false);

            if (recording.size && onProcessRecording) {
              setIsProcessingRecording(true);
              try {
                await onProcessRecording(recording);
              } catch (error) {
                console.error('[VideoCall] Error guardando grabación al finalizar la llamada:', error);
                window.alert(error?.response?.data?.detail || error.message || 'No se pudo guardar la grabación.');
              } finally {
                setIsProcessingRecording(false);
              }
            }
          }, { once: true });
          recorder.stop();
        }
      }
    }
  }, [callStatus, onProcessRecording]);

  useEffect(() => () => {
    captureRef.current.display?.getTracks().forEach((track) => track.stop());
    captureRef.current.microphone?.getTracks().forEach((track) => track.stop());
    captureRef.current.audioContext?.close().catch(() => {});
  }, []);

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
              <div className="flex-1 flex flex-col p-2 md:p-6 overflow-hidden min-w-0 min-h-[45%] md:min-h-0">

                {/* CONTENEDOR DE VIDEO LIMPIO (SALA DAILY.CO) */}
                <div className="relative w-full flex-1 rounded-3xl overflow-hidden border border-slate-200/80 shadow-md bg-slate-900 min-h-[200px] md:min-h-[300px]">
                  
                  {/* IFRAME DAILY.CO O PANTALLA DE INGRESO */}
                  {hasJoined && roomUrl ? (
                    <iframe
                      src={roomUrl}
                      allow="camera; microphone; fullscreen; display-capture; autoplay"
                      style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0 }}
                      title="Videollamada médica — Daily.co"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-4 md:p-6 text-center text-white">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4 text-blue-400 shadow-lg shadow-blue-500/10">
                        <Video className="w-8 h-8 md:w-10 md:h-10" />
                      </div>
                      <h3 className="text-lg md:text-xl font-extrabold mb-1 tracking-tight">Videoconferencia en vivo</h3>
                      <p className="text-[10px] md:text-xs text-slate-400 max-w-sm mb-4 md:mb-6">
                        La sala con {contactName} está lista. Haz clic abajo para ingresar.
                      </p>
                      <button
                        onClick={() => setHasJoined(true)}
                        className="px-6 py-2.5 md:px-8 md:py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all cursor-pointer hover:scale-[1.02]"
                      >
                        Ingresar a la consulta
                      </button>
                    </div>
                  )}
                </div>

                {/* BARRA DE CONTROLES INFERIOR */}
                <div className="mt-2 md:mt-4 py-2 px-2 md:py-3 md:px-4 bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-center gap-2 sm:gap-7 flex-wrap shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={startCallRecording}
                      disabled={isRecordingCall || isProcessingRecording || !hasJoined || !senderId || !callData?.conversation_id}
                      title="Selecciona la pestaña de la llamada y comparte su audio para transcribirla"
                      aria-label="Transcribir videoconferencia"
                      className={`w-10 h-10 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isRecordingCall ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200/60'}`}
                    >
                      {isProcessingRecording ? <Loader2 size={18} className="animate-spin" /> : <Radio size={18} />}
                    </button>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600">
                      {isProcessingRecording ? 'Procesando' : isRecordingCall ? 'Grabando' : 'Transcribir llamada'}
                    </span>
                  </div>

                  {/* Silenciar */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`w-10 h-10 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isMuted ? 'bg-red-500 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200/60'
                      }`}
                    >
                      {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <span className="hidden sm:block text-[11px] font-semibold text-slate-600">Silenciar</span>
                  </div>

                  {/* Detener vídeo */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => setIsVideoOff(!isVideoOff)}
                      className={`w-10 h-10 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isVideoOff ? 'bg-red-500 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200/60'
                      }`}
                    >
                      {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
                    </button>
                    <span className="hidden sm:block text-[11px] font-semibold text-slate-600">Vídeo</span>
                  </div>

                  {/* Compartir pantalla */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => setIsScreenSharing(!isScreenSharing)}
                      className={`w-10 h-10 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isScreenSharing ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200/60'
                      }`}
                    >
                      <Monitor size={18} />
                    </button>
                    <span className="hidden sm:block text-[11px] font-semibold text-slate-600">Compartir</span>
                  </div>

                  {/* Finalizar consulta (Botón Rojo Central) */}
                  <div className="flex flex-col items-center gap-1 mx-2 sm:mx-0">
                    <button
                      onClick={handleEndCall}
                      disabled={isProcessingRecording}
                      className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <PhoneOff size={22} />
                    </button>
                    <span className="hidden sm:block text-[11px] font-extrabold text-red-600">Finalizar</span>
                  </div>

                  {/* Añadir participante */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      className="w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200/60 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <UserPlus size={18} />
                    </button>
                    <span className="hidden sm:block text-[11px] font-semibold text-slate-600">Añadir</span>
                  </div>

                  {/* Más opciones */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      className="w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200/60 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    <span className="hidden sm:block text-[11px] font-semibold text-slate-600">Opciones</span>
                  </div>
                </div>
                {recordingError && (
                  <p role="alert" className="mt-2 text-center text-xs text-red-600">{recordingError}</p>
                )}
                {isRecordingCall && (
                  <p className="mt-2 text-center text-xs text-slate-500">
                    {audioSignalDetected
                      ? 'Audio detectado. Al colgar se enviará automáticamente para transcripción.'
                      : 'Grabando; todavía no se detecta voz. Habla o confirma que Daily comparte el audio de la pestaña.'}
                  </p>
                )}
                {!isRecordingCall && !isProcessingRecording && (
                  <p className="mt-2 text-center text-xs text-slate-500">
                    Pulsa “Transcribir llamada”, elige la pestaña de Daily y activa “Compartir audio de la pestaña”.
                  </p>
                )}
              </div>

              {/* COLUMNA DERECHA: CHAT */}
              <div className="flex-1 md:flex-none w-full md:w-[380px] lg:w-[440px] shrink-0 bg-white flex flex-col overflow-hidden border-t md:border-t-0 md:border-l border-slate-200/80 min-h-[45%] md:min-h-0">
                {children ? (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {children}
                  </div>
                ) : (
                  /* Placeholder mientras se carga la conversación */
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg className="animate-spin w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">Cargando chat de la consulta...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
