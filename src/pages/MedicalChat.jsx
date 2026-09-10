import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageCircle, RefreshCw, Search, User, Trash2, 
  Video, Loader2, Mic, Send, Square, X, Plus, UserPlus, MapPin, Stethoscope, ArrowLeft, Users, ShieldAlert
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
  const [availableContacts, setAvailableContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all'); // 'all' | 'doctor' | 'patient'
  const [showContactSelector, setShowContactSelector] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [errorConversations, setErrorConversations] = useState(null);

  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'calling' | 'ringing' | 'in-call'
  const [callData, setCallData] = useState(null);

  const messagesEndRef = useRef(null);
  const { isRecording, recordingDuration, startRecording, stopRecording, cancelRecording, formatDuration } = useAudioRecorder();

  const isDoctor = user?.role === 'doctor';

  // Gestión de eventos en tiempo real con WebSockets
  const handleWsMessage = useCallback((wsData) => {
    const action = wsData.action || wsData.type;

    if (action === 'INCOMING_CALL' || action === 'video_call_invite') {
      setCallData(wsData);
      setCallStatus('ringing');
    } else if (action === 'CALL_ACCEPTED' || action === 'video_call_accepted') {
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
    if (user?.id) {
      fetchConversations();
      fetchAvailableContacts();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user?.id) return;
    setIsLoadingConversations(true);
    setErrorConversations(null);
    try {
      const data = await medicalChatService.getConversations(user.id);
      setConversations(data);
      if (data.length > 0 && !conversation && !showContactSelector) {
        selectConversation(data[0]);
      }
    } catch (err) {
      console.error('Error al cargar conversaciones:', err);
      setErrorConversations('No se pudieron cargar las conversaciones. Verifica la conexión.');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchAvailableContacts = async () => {
    if (!user?.id) return;
    setIsLoadingContacts(true);
    try {
      const contacts = await medicalChatService.getAvailableContacts(user.id);
      setAvailableContacts(contacts);
    } catch (err) {
      console.error('Error al cargar contactos disponibles:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const selectConversation = async (conv) => {
    setConversation(conv);
    setShowContactSelector(false);
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

  const handleStartChatWithContact = async (contact) => {
    if (!user?.id || !contact?.user_id) return;
    setIsStartingChat(true);
    try {
      // Determinamos patient_id y doctor_id de la conversación
      let patientId, doctorId;
      if (contact.role === 'doctor') {
        patientId = user.id;
        doctorId = contact.user_id;
      } else if (contact.role === 'patient') {
        patientId = contact.user_id;
        doctorId = user.id;
      } else {
        patientId = isDoctor ? contact.user_id : user.id;
        doctorId = isDoctor ? user.id : contact.user_id;
      }

      const newConv = await medicalChatService.createConversation(patientId, doctorId);
      
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === newConv.id);
        if (exists) return prev;
        return [newConv, ...prev];
      });

      await selectConversation(newConv);
    } catch (err) {
      console.error('Error al iniciar chat con el contacto:', err);
      alert('No se pudo iniciar el chat con el usuario seleccionado.');
    } finally {
      setIsStartingChat(false);
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
    if (user?.id === conv.patient_id) {
      return conv.doctor_name || 'Médico';
    } else {
      return conv.patient_name || 'Paciente';
    }
  };

  const getOtherUserId = (conv) => {
    if (!conv) return null;
    return user?.id === conv.patient_id ? conv.doctor_id : conv.patient_id;
  };

  // Filtrado de contactos por término de búsqueda y por rol
  const filteredContacts = availableContacts.filter((contact) => {
    if (filterRole !== 'all' && contact.role !== filterRole) return false;

    const q = contactSearch.toLowerCase();
    const fullName = (contact.full_name || '').toLowerCase();
    const first = (contact.first_name || '').toLowerCase();
    const last = (contact.last_name || '').toLowerCase();
    const spec = (contact.specialty || '').toLowerCase();
    const city = (contact.city || '').toLowerCase();
    const docNum = (contact.document_number || '').toLowerCase();

    return fullName.includes(q) || first.includes(q) || last.includes(q) || spec.includes(q) || city.includes(q) || docNum.includes(q);
  });

  return (
    <div className="flex-1 flex flex-col p-3 md:p-8 animate-in fade-in duration-500 min-h-screen relative">
      
      {/* MODAL DE VIDEOLLAMADA */}
      <VideoCallModal
        callStatus={callStatus}
        callData={callData}
        userName={user?.name}
        onAccept={() => {
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

      {/* ENCABEZADO SUPERIOR */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-teal-100 text-teal-600 p-2.5 md:p-3 rounded-2xl shadow-sm">
            <MessageCircle size={24} className="md:w-7 md:h-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-slate-800">
              {isDoctor ? 'Chat con Pacientes' : 'Chat Médico'}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 hidden sm:block">
              {isDoctor ? 'Busca a tus pacientes y mantén comunicación directa en tiempo real' : 'Comunicación directa en tiempo real entre doctor y paciente'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchConversations();
            fetchAvailableContacts();
          }}
          disabled={isLoadingConversations || isLoadingContacts}
          className="p-2 md:p-2.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer border border-slate-200 bg-white shadow-xs"
        >
          <RefreshCw size={18} className={(isLoadingConversations || isLoadingContacts) ? 'animate-spin' : ''} />
          <span className="text-xs md:text-sm font-medium hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {/* CONTENEDOR PRINCIPAL RESPONSIVE */}
      <div className="flex-1 glass-card rounded-2xl md:rounded-3xl flex overflow-hidden border border-white/60 shadow-xl relative min-h-[500px] h-[calc(100vh-11rem)]">
        
        {/* BARRA LATERAL: LISTA DE CONVERSACIONES (Oculta en móviles al ver un chat activo) */}
        <div
          className={`${
            conversation && !showContactSelector ? 'hidden md:flex' : 'flex'
          } w-full md:w-[340px] border-r border-slate-200 bg-white/80 flex-col flex-shrink-0`}
        >
          <div className="p-3.5 md:p-4 border-b border-slate-200 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isDoctor ? 'Mis Pacientes' : 'Mis Chats'}
              </span>
              <button
                onClick={() => {
                  setShowContactSelector(true);
                  setConversation(null);
                }}
                className="text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus size={14} />
                <span>{isDoctor ? 'Buscar Paciente' : 'Nuevo Chat'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3">
              <Search size={18} className="text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder={isDoctor ? 'Buscar paciente...' : 'Buscar chat...'}
                className="flex-1 bg-transparent border-none outline-none py-2 text-xs md:text-sm text-slate-700"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 p-6">
                <Loader2 size={24} className="animate-spin text-teal-500" />
                <span className="text-sm">Cargando conversaciones...</span>
              </div>
            )}

            {!isLoadingConversations && errorConversations && (
              <div className="p-4 text-center text-red-500 text-sm">
                {errorConversations}
              </div>
            )}

            {!isLoadingConversations && !errorConversations && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-3 my-auto">
                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                  <UserPlus size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">Sin conversaciones activas</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isDoctor
                      ? 'Selecciona a un paciente o colega registrado para iniciar un mensaje.'
                      : 'Selecciona a un médico registrado para iniciar una consulta.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowContactSelector(true)}
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
                >
                  {isDoctor ? 'Ver directorio de usuarios →' : 'Ver médicos disponibles →'}
                </button>
              </div>
            )}

            {conversations.map((conv) => {
              const isActive = conversation?.id === conv.id && !showContactSelector;
              return (
                <div
                  key={conv.id}
                  className={`w-full p-3.5 md:p-4 border-b border-slate-100 transition-all ${
                    isActive ? 'bg-teal-50 border-l-4 border-l-teal-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button onClick={() => selectConversation(conv)} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isActive ? 'bg-teal-600 text-white' : 'bg-teal-100 text-teal-600'}`}>
                        <User size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 truncate text-sm">{getOtherUserName(conv)}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Conversación #{conv.id}</p>
                      </div>
                    </button>
                    <button onClick={() => handleDeleteConversation(conv.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ÁREA PRINCIPAL: VISTA DE DIRECTORIO O CHAT ACTIVO (Oculta en móvil si no hay chat ni selector) */}
        <div
          className={`${
            !conversation && !showContactSelector ? 'hidden md:flex' : 'flex'
          } flex-1 flex-col min-w-0 bg-white/40`}
        >
          {/* VISTA 1: DIRECTORIO DE CONTACTOS (PACIENTES O MÉDICOS) */}
          {(showContactSelector || (!conversation && conversations.length === 0)) ? (
            <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
              
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-teal-600 font-semibold text-xs md:text-sm mb-1">
                    {isDoctor ? <Users size={18} /> : <Stethoscope size={18} />}
                    <span>Directorio de Usuarios Registrados</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800">
                    {isDoctor ? 'Contacta a tus pacientes o colegas' : 'Escribe directamente a un profesional'}
                  </h2>
                  <p className="text-slate-500 text-xs md:text-sm mt-0.5">
                    Selecciona cualquier usuario registrado en la plataforma para iniciar una conversación.
                  </p>
                </div>

                {conversations.length > 0 && (
                  <button
                    onClick={() => {
                      setShowContactSelector(false);
                      if (conversations.length > 0) selectConversation(conversations[0]);
                    }}
                    className="self-start sm:self-auto text-xs md:text-sm text-slate-600 hover:text-teal-600 flex items-center gap-1.5 font-medium cursor-pointer bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs"
                  >
                    <ArrowLeft size={16} />
                    <span>Volver a chats</span>
                  </button>
                )}
              </div>

              {/* BARRA DE BÚSQUEDA Y PESTAÑAS DE ROL */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-xs max-w-md flex-1">
                  <Search size={18} className="text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Buscar por nombre, especialidad o documento..."
                    className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm text-slate-700"
                  />
                  {contactSearch && (
                    <button onClick={() => setContactSearch('')} className="text-slate-400 hover:text-slate-600">
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold self-start sm:self-auto">
                  <button
                    onClick={() => setFilterRole('all')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      filterRole === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Todos ({availableContacts.length})
                  </button>
                  <button
                    onClick={() => setFilterRole('doctor')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      filterRole === 'doctor' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Médicos ({availableContacts.filter(c => c.role === 'doctor').length})
                  </button>
                  <button
                    onClick={() => setFilterRole('patient')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      filterRole === 'patient' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Pacientes ({availableContacts.filter(c => c.role === 'patient').length})
                  </button>
                </div>
              </div>

              {/* LISTADO / GRID DE CONTACTOS */}
              {isLoadingContacts ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 py-12">
                  <Loader2 size={32} className="animate-spin text-teal-500" />
                  <span className="text-sm">Cargando directorio de usuarios...</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 py-12 text-center">
                  <User size={40} className="text-slate-300" />
                  <p className="text-slate-600 font-medium text-sm">No se encontraron usuarios</p>
                  <p className="text-xs text-slate-400">Intenta buscar con otro término de búsqueda o cambia el filtro.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.user_id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-xs hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl font-bold flex items-center justify-center text-base flex-shrink-0 ${
                          contact.role === 'patient' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'
                        }`}>
                          {contact.first_name?.[0] || 'U'}{contact.last_name?.[0] || ''}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-800 text-sm md:text-base truncate">
                            {contact.full_name || `${contact.first_name} ${contact.last_name}`}
                          </h3>
                          
                          {contact.role === 'patient' ? (
                            <span className="inline-block mt-1 bg-blue-50 text-blue-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                              Paciente
                            </span>
                          ) : (
                            <span className="inline-block mt-1 bg-teal-50 text-teal-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-teal-200">
                              {contact.specialty || 'Médico Registrado'}
                            </span>
                          )}

                          {(contact.city || contact.country || contact.document_number) && (
                            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                              <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                              <span className="truncate">
                                {contact.role === 'patient' 
                                  ? (contact.document_number ? `Doc: ${contact.document_number}` : 'Paciente registrado')
                                  : [contact.city, contact.country].filter(Boolean).join(', ')}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartChatWithContact(contact)}
                        disabled={isStartingChat}
                        className={`w-full font-medium text-xs py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 ${
                          contact.role === 'patient'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-teal-600 hover:bg-teal-700 text-white'
                        }`}
                      >
                        {isStartingChat ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <MessageCircle size={16} />
                            <span>Iniciar Chat</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ) : !conversation ? (
            /* VISTA 2: NINGÚN CHAT SELECCIONADO (ESCRITORIO) */
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <MessageCircle size={56} className="mb-4 text-slate-300" />
              <h2 className="text-lg font-semibold text-slate-600 mb-2">Selecciona una conversación para empezar</h2>
              <p className="text-xs text-slate-400 mb-6 max-w-sm">
                Elige un chat de la lista o busca entre los usuarios registrados para iniciar un mensaje.
              </p>
              <button
                onClick={() => setShowContactSelector(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus size={16} />
                <span>Ver directorio de usuarios</span>
              </button>
            </div>
          ) : (
            /* VISTA 3: MENSAJES DEL CHAT ACTIVO */
            <>
              {/* HEADER DEL CHAT ACTIVO */}
              <div className="p-3.5 md:p-4 bg-white/80 border-b border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Botón Volver en Móviles */}
                  <button
                    onClick={() => setConversation(null)}
                    className="md:hidden p-2 -ml-1 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title="Volver a la lista de chats"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold flex-shrink-0">
                    <User size={22} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-slate-800 text-sm md:text-base truncate">{getOtherUserName(conversation)}</h2>
                    <p className="text-[11px] md:text-xs text-slate-400 truncate">Conversación #{conversation.id}</p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      const otherName = getOtherUserName(conversation);
                      const result = await medicalChatService.startVideoCall(conversation.id, user.id);
                      setCallData({ 
                        room_name: result.room_name, 
                        room_url: result.room_url,
                        target_name: otherName
                      });
                      setCallStatus('calling');
                    } catch (err) {
                      console.error('Error al iniciar videollamada:', err);
                      alert('No se pudo iniciar la videollamada.');
                    }
                  }}
                  className="p-2 md:p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer flex items-center gap-2 border border-slate-200 bg-white flex-shrink-0"
                  title="Iniciar videollamada"
                >
                  <Video size={18} className="text-blue-600" />
                  <span className="text-xs font-semibold hidden sm:inline text-slate-700">Videollamada</span>
                </button>
              </div>

              {/* CUERPO DE MENSAJES */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
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
                        <div className={`flex gap-2.5 md:gap-3 ${isMe ? 'flex-row-reverse max-w-[88%] md:max-w-[75%]' : 'flex-row max-w-[88%] md:max-w-[75%]'}`}>
                          <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            <User size={16} className="md:w-4 md:h-4" />
                          </div>
                          <div className={`px-4 md:px-5 py-3 md:py-3.5 rounded-2xl ${isMe ? 'bg-teal-600 text-white rounded-tr-xs' : 'bg-white text-slate-700 rounded-tl-xs border border-slate-200 shadow-xs'}`}>
                            {isAudio ? (
                              <AudioPlayer
                                fileUrl={msg.attachments[0].file_url || `${API_URL.replace('/api', '')}/archivos/${msg.attachments[0].file_path}`}
                                duration={msg.attachments[0].duration}
                                isMe={isMe}
                              />
                            ) : (
                              <p className="whitespace-pre-wrap text-xs md:text-sm leading-relaxed">{msg.message}</p>
                            )}
                            <span className={`text-[10px] block mt-1 text-right ${isMe ? 'text-teal-200' : 'text-slate-400'}`}>
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

              {/* INPUT DE MENSAJE Y AUDIO */}
              <div className="p-3 md:p-4 bg-white/80 border-t border-slate-200">
                <form onSubmit={handleSend} className="flex items-center gap-2 md:gap-3 bg-slate-50 border border-slate-200 p-1.5 md:p-2 rounded-2xl">
                  {isRecording ? (
                    <div className="flex-1 flex items-center justify-between px-3 h-11 md:h-12">
                      <span className="text-xs md:text-sm font-semibold text-slate-600 animate-pulse flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                        Grabando audio: {formatDuration(recordingDuration)}
                      </span>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={cancelRecording} className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                          <X size={18} />
                        </button>
                        <button type="button" onClick={handleAudioSend} className="bg-red-500 text-white p-2 rounded-xl hover:bg-red-600 transition-colors cursor-pointer">
                          <Square size={14} fill="currentColor" />
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
                        className="flex-1 bg-transparent border-none outline-none px-3 text-slate-700 h-10 md:h-12 text-xs md:text-sm"
                      />
                      <button type="button" onClick={startRecording} className="p-2.5 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer" title="Grabar audio">
                        <Mic size={18} />
                      </button>
                      <button type="submit" disabled={!input.trim()} className="bg-teal-600 text-white p-2.5 md:p-3 rounded-xl disabled:opacity-50 hover:bg-teal-700 transition-colors cursor-pointer">
                        {isUploadingAudio ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
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