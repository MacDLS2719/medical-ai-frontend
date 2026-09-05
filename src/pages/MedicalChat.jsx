import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageCircle, RefreshCw, Search, User, Trash2, 
  Video, Loader2, Mic, Send, Square, X 
} from 'lucide-react';

import { medicalChatService } from '../services/medicalChatService';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import VideoCallModal from '../components/VideoCallModal';
import AudioPlayer from '../components/AudioPlayer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function MedicalChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [errorConversations, setErrorConversations] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'calling' | 'ringing' | 'in-call'
  const [callData, setCallData] = useState(null);

  const messagesEndRef = useRef(null);
  const { isRecording, recordingDuration, startRecording, stopRecording, cancelRecording, formatDuration } = useAudioRecorder();

  // Gestión de eventos en tiempo real con WebSockets
  const handleWsMessage = useCallback((wsData) => {
    const action = wsData.action || wsData.type;

    if (action === 'INCOMING_CALL' || action === 'video_call_invite') {
      // wsData ya trae room_name y room_url de Daily.co desde el backend
      setCallData(wsData);
      setCallStatus('ringing');
    } else if (action === 'CALL_ACCEPTED' || action === 'video_call_accepted') {
      // Actualizar callData con room_url/room_name si vienen en el mensaje
      setCallData((prev) => ({
        ...prev,
        ...(wsData.room_name && { room_name: wsData.room_name }),
        ...(wsData.room_url  && { room_url:  wsData.room_url  }),
      }));
      setCallStatus('in-call');
    } else if (
      action === 'CALL_REJECTED' || action === 'video_call_rejected' ||
      action === 'CALL_ENDED'   || action === 'video_call_ended' ||
      action === 'CALL_CANCELLED'
    ) {
      setCallStatus('idle');
      setCallData(null);
    } else if (action === 'new_message') {
      setMessages((prev) => {
        if (prev.length > 0 || wsData.conversation_id) {
          return [...prev, wsData.message];
        }
        return prev;
      });
    }
  }, []);

  const { sendWsMessage } = useWebSocket(user?.id, handleWsMessage);

  useEffect(() => {
    fetchConversations();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user?.id) {
      console.warn('[MedicalChat] fetchConversations: user.id no disponible', user);
      return;
    }
    setIsLoadingConversations(true);
    setErrorConversations(null);
    try {
      console.log('[MedicalChat] Cargando conversaciones para user.id:', user.id);
      const data = await medicalChatService.getConversations(user.id);
      console.log('[MedicalChat] Conversaciones recibidas:', data);
      setConversations(data);
      if (data.length > 0 && !conversation) {
        selectConversation(data[0]);
      }
    } catch (err) {
      console.error('Error al cargar conversaciones:', err);
      setErrorConversations('No se pudieron cargar las conversaciones. Verifica la conexión.');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const selectConversation = async (conv) => {
    setConversation(conv);
    setIsLoading(true);
    try {
      const msgs = await medicalChatService.getMessages(conv.id, user.id);
      setMessages(msgs);
    } catch (err) {
      console.error('Error al obtener mensajes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !conversation) return;

    const textToSend = input;
    setInput('');
    try {
      const newMsg = await medicalChatService.sendMessage(conversation.id, user.id, textToSend);
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
    }
  };

  const handleAudioSend = async () => {
    const audioData = await stopRecording();
    if (!audioData || !conversation) return;

    setIsUploadingAudio(true);
    try {
      const newMsg = await medicalChatService.sendAudioMessage(
        conversation.id,
        user.id,
        audioData.audioBlob,
        audioData.duration,
        audioData.mimeType
      );
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error('Error al subir el audio:', err);
      alert('No se pudo enviar la nota de voz.');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleDeleteConversation = async (convId) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta conversación?')) return;
    try {
      await medicalChatService.deleteConversation(convId, user.id);
      const updated = conversations.filter((c) => c.id !== convId);
      setConversations(updated);
      if (conversation?.id === convId) {
        if (updated.length > 0) selectConversation(updated[0]);
        else {
          setConversation(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Error al eliminar la conversación:', err);
    }
  };

  const getOtherUserName = (conv) => {
    if (!conv) return 'Usuario';
    return user?.role === 'patient'
      ? conv.doctor_name || 'Médico'
      : conv.patient_name || 'Paciente';
  };

  const getOtherUserId = (conv) => {
    if (!conv) return null;
    return user?.role === 'patient' ? conv.doctor_id : conv.patient_id;
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 animate-in fade-in duration-500 h-full max-h-screen relative">
      
      {/* MODAL DE VIDEOLLAMADA */}
      <VideoCallModal
        callStatus={callStatus}
        callData={callData}
        userName={user?.name}
        onAccept={() => {
          // Notificar al llamador — incluimos room_url para que también pueda abrir Daily
          sendWsMessage({
            action: 'CALL_ACCEPTED',
            target_user: callData?.from_user,
            room_name: callData?.room_name,
            room_url:  callData?.room_url
          });
          setCallStatus('in-call');
        }}
        onReject={() => {
          sendWsMessage({
            action: 'CALL_REJECTED',
            target_user: callData?.from_user,
            room_name: callData?.room_name
          });
          setCallStatus('idle');
          setCallData(null);
        }}
        onCancel={() => {
          sendWsMessage({
            action: 'CALL_CANCELLED',
            target_user: getOtherUserId(conversation),
            room_name: callData?.room_name
          });
          setCallStatus('idle');
          setCallData(null);
        }}
        onEnd={() => {
          sendWsMessage({
            action: 'CALL_ENDED',
            target_user: callData?.from_user || getOtherUserId(conversation),
            room_name: callData?.room_name
          });
          setCallStatus('idle');
          setCallData(null);
        }}
      />

      {/* HEADER DE LA PÁGINA */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-teal-100 text-teal-600 p-3 rounded-2xl shadow-sm">
            <MessageCircle size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Chat Médico</h1>
            <p className="text-slate-500 mt-1">Comunicación en tiempo real entre doctor y paciente</p>
          </div>
        </div>

        <button
          onClick={fetchConversations}
          disabled={isLoadingConversations}
          className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={20} className={isLoadingConversations ? 'animate-spin' : ''} />
          <span className="text-sm font-medium hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 glass-card rounded-3xl flex overflow-hidden border border-white/60 shadow-xl relative min-h-[500px]">
        
        {/* LISTA DE CONVERSACIONES */}
        <div className="w-[300px] md:w-[350px] border-r border-slate-200 bg-white/70 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Buscar chat..."
                className="flex-1 bg-transparent border-none outline-none py-2 text-sm text-slate-700"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <Loader2 size={24} className="animate-spin text-teal-500" />
                <span className="text-sm">Cargando chats...</span>
              </div>
            )}

            {!isLoadingConversations && errorConversations && (
              <div className="p-4 text-center text-red-500 text-sm">
                {errorConversations}
              </div>
            )}

            {!isLoadingConversations && !errorConversations && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 p-4 text-center">
                <MessageCircle size={32} className="text-slate-300" />
                <span className="text-sm">No tienes conversaciones activas</span>
              </div>
            )}
            {conversations.map((conv) => {
              const isActive = conversation?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  className={`w-full p-4 border-b border-slate-100 transition-all ${
                    isActive ? 'bg-teal-50 border-l-4 border-l-teal-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button onClick={() => selectConversation(conv)} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? 'bg-teal-600 text-white' : 'bg-teal-100 text-teal-600'}`}>
                        <User size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 truncate">{getOtherUserName(conv)}</h3>
                        <p className="text-xs text-slate-400 mt-1">Conversación #{conv.id}</p>
                      </div>
                    </button>
                    <button onClick={() => handleDeleteConversation(conv.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ÁREA DE MENSAJES DE LA CONVERSACIÓN ACTIVA */}
        <div className="flex-1 flex flex-col min-w-0">
          {!conversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageCircle size={56} className="mb-4 text-slate-300" />
              <h2 className="text-lg font-semibold text-slate-500">Selecciona una conversación para empezar</h2>
            </div>
          ) : (
            <>
              {/* ENCABEZADO DEL CHAT */}
              <div className="p-4 bg-white/80 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                    <User size={22} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">{getOtherUserName(conversation)}</h2>
                    <p className="text-xs text-slate-400">Conversación #{conversation.id}</p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      // Guardamos room_name y room_url que devuelve Daily.co
                      const result = await medicalChatService.startVideoCall(conversation.id, user.id);
                      setCallData({ room_name: result.room_name, room_url: result.room_url });
                      setCallStatus('calling');
                    } catch (err) {
                      console.error('Error al iniciar videollamada:', err);
                    }
                  }}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Iniciar videollamada"
                >
                  <Video size={20} />
                </button>
              </div>

              {/* LISTA DE MENSAJES */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                    <Loader2 size={24} className="animate-spin text-teal-500" />
                    <span>Cargando mensajes...</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    const isAudio = msg.attachments?.[0]?.attachment_type === 'audio';

                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-4 ${isMe ? 'flex-row-reverse max-w-[70%]' : 'flex-row max-w-[70%]'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-blue-600 text-white' : 'bg-teal-100 text-teal-600'}`}>
                            <User size={20} />
                          </div>
                          <div className={`px-6 py-4 rounded-2xl ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-slate-700 rounded-tl-sm border border-slate-100 shadow-sm'}`}>
                            {isAudio ? (
                              <AudioPlayer
                                fileUrl={msg.attachments[0].file_url || `${API_URL.replace('/api', '')}/archivos/${msg.attachments[0].file_path}`}
                                duration={msg.attachments[0].duration}
                                isMe={isMe}
                              />
                            ) : (
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
                            )}
                            <span className={`text-[10px] block mt-2 text-right ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* CAMPO DE ENTRADA Y GRABACIÓN */}
              <div className="p-4 bg-white/80 border-t border-slate-100">
                <form onSubmit={handleSend} className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
                  {isRecording ? (
                    <div className="flex-1 flex items-center justify-between px-4 h-12">
                      <span className="text-sm font-semibold text-slate-600 animate-pulse flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                        Grabando: {formatDuration(recordingDuration)}
                      </span>
                      <div className="flex gap-2">
                        <button type="button" onClick={cancelRecording} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <X size={20} />
                        </button>
                        <button type="button" onClick={handleAudioSend} className="bg-red-500 text-white p-2.5 rounded-xl hover:bg-red-600 transition-colors">
                          <Square size={16} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-transparent border-none outline-none px-4 text-slate-700 h-12 text-sm"
                      />
                      <button type="button" onClick={startRecording} className="p-3 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer">
                        <Mic size={20} />
                      </button>
                      <button type="submit" disabled={!input.trim()} className="bg-teal-600 text-white p-3 rounded-xl disabled:opacity-50 hover:bg-teal-700 transition-colors cursor-pointer">
                        {isUploadingAudio ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                      </button>
                    </>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}