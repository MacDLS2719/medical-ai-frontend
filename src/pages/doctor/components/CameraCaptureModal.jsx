import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  X, 
  RotateCw, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  Sparkles,
  ShieldCheck,
  SwitchCamera
} from 'lucide-react';

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);

  // Detener la cámara y liberar recursos
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Iniciar la cámara
  const startCamera = useCallback(async () => {
    setError(null);
    setIsStartingCamera(true);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador o dispositivo no soporta acceso a la cámara.');
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permiso denegado. Permite el acceso a la cámara en tu navegador para tomar la foto.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No se encontró ninguna cámara disponible en tu dispositivo.');
      } else {
        setError('No se pudo acceder a la cámara. Por favor intenta subir el archivo directamente.');
      }
    } finally {
      setIsStartingCamera(false);
    }
  }, [facingMode, stopCamera]);

  // Manejo de apertura / cierre del modal
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setError(null);
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Alternar entre cámara trasera y frontal
  const handleToggleFacingMode = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Capturar fotograma actual
  const handleCapture = () => {
    if (!videoRef.current) return;

    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext('2d');
    
    // Si la cámara es frontal ('user'), podemos voltear horizontalmente para reflejar como espejo
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  // Retomar foto
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  // Confirmar y entregar al formulario
  const handleConfirm = () => {
    if (!capturedImage) return;

    // Calcular tamaño aproximado
    const sizeInBytes = Math.round((capturedImage.length * 3) / 4);
    const sizeInKb = (sizeInBytes / 1024).toFixed(1);

    onCapture({
      base64: capturedImage,
      name: `tarjeta_profesional_${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      size: `${sizeInKb} KB`,
      isImage: true,
      previewUrl: capturedImage
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700/60 max-w-lg w-full overflow-hidden flex flex-col relative max-h-[90vh]">
        
        {/* Cabecera del modal */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Tomar fotografía del certificado
              </h3>
              <p className="text-[10px] text-slate-400">
                Tarjeta profesional o carnet colegiado
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar cámara"
          >
            <X size={18} />
          </button>
        </div>

        {/* Área del visor / video */}
        <div className="relative bg-black flex-1 min-h-[340px] sm:min-h-[400px] flex items-center justify-center overflow-hidden">
          
          {/* Efecto flash al tomar la foto */}
          {flashEffect && (
            <div className="absolute inset-0 bg-white z-30 opacity-90 transition-opacity duration-200 pointer-events-none" />
          )}

          {/* Estado de error */}
          {error ? (
            <div className="p-6 text-center max-w-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle size={26} />
              </div>
              <p className="text-xs text-rose-300 font-medium leading-relaxed">
                {error}
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>Reintentar</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Subir archivo en su lugar
                </button>
              </div>
            </div>
          ) : capturedImage ? (
            // Vista previa de la foto capturada
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedImage}
                alt="Fotografía capturada"
                className="max-h-[380px] sm:max-h-[420px] w-auto max-w-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                <ShieldCheck size={13} />
                <span>Foto capturada con éxito</span>
              </div>
            </div>
          ) : (
            // Video en vivo
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
              />

              {/* Marco guía para encuadrar la tarjeta */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-full max-w-[340px] aspect-[1.586/1] border-2 border-dashed border-cyan-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] relative flex items-center justify-center">
                  <div className="absolute -top-3 bg-cyan-500 text-slate-950 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                    Encuadra la tarjeta o documento
                  </div>
                  <div className="text-center p-2">
                    <p className="text-[11px] text-white/90 font-medium drop-shadow-md">
                      Asegúrate que el texto sea legible y no haya reflejos
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de alternar cámara (frontal / trasera) */}
              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="absolute top-3 right-3 z-20 bg-slate-900/70 hover:bg-slate-900 text-white p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-transform active:scale-95 cursor-pointer"
                title="Cambiar de cámara"
              >
                <SwitchCamera size={16} />
              </button>

              {/* Loader de inicio */}
              {isStartingCamera && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <span>Iniciando cámara...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Barra de control inferior */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center">
          {capturedImage ? (
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
              >
                <RotateCw size={14} />
                <span>Repetir foto</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                <Check size={14} />
                <span>Usar esta fotografía</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={handleCapture}
                disabled={!!error || isStartingCamera}
                className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-white/20 p-1 border-2 border-white/60 hover:border-cyan-400 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Tomar fotografía"
              >
                <div className="w-full h-full rounded-full bg-white group-hover:bg-cyan-400 transition-colors flex items-center justify-center shadow-lg">
                  <Camera size={22} className="text-slate-900" />
                </div>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
