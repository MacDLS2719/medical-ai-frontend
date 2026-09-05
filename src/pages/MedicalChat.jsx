import { useState, useRef, useEffect } from 'react';

import {
  Send,
  User,
  MessageCircle,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Mic,
  Play,
  Pause,
  X,
  Video,
  Square,
  Phone,
  PhoneOff,
  PhoneCall
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';


export default function MedicalChat() {

  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'calling' | 'ringing' | 'in-call'
  const [callData, setCallData] = useState(null); // { room_name, from_user, target_user, conversation_id }

  const messagesEndRef = useRef(null);
  const recordingDurationRef = useRef(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const isCancelledRef = useRef(false);
  const socketRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const API_URL = import.meta.env.VITE_API_URL;


  // ==========================================================
  // WEBSOCKET NATIVO
  // ==========================================================
  useEffect(() => {
    if (!user?.id) return;

    const wsUrl = `${API_URL.replace(/^http/, 'ws')}/ws/${user.id}`;
    let ws;

    try {
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { action, from_user, conversation_id, room_name } = data;

          if (action === 'INCOMING_CALL') {
            setCallData({ from_user, conversation_id, room_name });
            setCallStatus('ringing');
          } else if (action === 'CALL_ACCEPTED') {
            setCallStatus('in-call');
          } else if (action === 'CALL_REJECTED') {
            setCallStatus('idle');
            setCallData(null);
            alert('La llamada fue rechazada o cancelada.');
          }
        } catch (err) {
          console.error('Error procesando evento de WebSocket:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('Conexión de WebSocket no disponible en este momento');
      };
    } catch (e) {
      console.warn('No se pudo establecer WebSocket:', e);
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [user?.id, API_URL]);

  const sendWsMessage = (msgObj) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msgObj));
    }
  };

  // ==========================================================
  // INICIAR Y MANEJAR VIDEOLLAMADA
  // ==========================================================
  const handleVideoCall = async () => {
    if (!conversation || !user?.id) return;
    
    setIsLoading(true);
    try {
      const url = `${API_URL}/conversations/${conversation.id}/video-call?sender_id=${user.id}`;
      const response = await fetch(url, { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Error al crear la videollamada');
      }

      const data = await response.json();
      const targetUser = user.role === 'patient' ? conversation.doctor_id : conversation.patient_id;
      
      setCallData({
        room_name: data.room_name,
        target_user: targetUser,
        conversation_id: conversation.id,
      });
      setCallStatus('calling');
    } catch (error) {
      console.error('Error al iniciar videollamada:', error);
      alert('Error al iniciar la videollamada.');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptCall = () => {
    if (callData?.from_user) {
      sendWsMessage({
        action: 'CALL_ACCEPTED',
        target_user: callData.from_user,
        room_name: callData.room_name
      });
    }
    setCallStatus('in-call');
  };

  const rejectCall = () => {
    if (callData?.from_user) {
      sendWsMessage({
        action: 'CALL_REJECTED',
        target_user: callData.from_user,
        room_name: callData.room_name
      });
    }
    setCallStatus('idle');
    setCallData(null);
  };

  const cancelCall = () => {
    if (callData?.target_user) {
      sendWsMessage({
        action: 'CALL_REJECTED',
        target_user: callData.target_user,
        room_name: callData.room_name
      });
    }
    setCallStatus('idle');
    setCallData(null);
  };

  const endCall = () => {
    setCallStatus('idle');
    setCallData(null);
  };


  // ==========================================================
  // SCROLL
  // ==========================================================

  const scrollToBottom = () => {

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });

  };


  useEffect(() => {

    scrollToBottom();

  }, [messages]);


  // ==========================================================
  // CARGAR CONVERSACIONES
  // ==========================================================

  useEffect(() => {

    if (user?.id) {

      fetchConversations();

    }

  }, [user]);


  const fetchConversations = async () => {

    if (!user?.id) return;

    setIsLoadingConversations(true);

    try {

      const url =
        `${API_URL}/conversations?user_id=${user.id}`;

      const response = await fetch(url);

      if (!response.ok) {

        throw new Error(
          'Error obteniendo conversaciones'
        );

      }

      const data = await response.json();

      setConversations(data);


      if (data.length > 0) {

        if (!conversation) {

          setConversation(data[0]);

          await fetchMessages(data[0].id);

        } else {

          const currentConversation =
            data.find(
              (item) =>
                item.id === conversation.id
            );

          if (currentConversation) {

            setConversation(
              currentConversation
            );

          } else {

            setConversation(data[0]);

            await fetchMessages(
              data[0].id
            );

          }

        }

      } else {

        setConversation(null);

        setMessages([]);

      }

    } catch (error) {

      console.error(
        'Error cargando conversaciones:',
        error
      );

    } finally {

      setIsLoadingConversations(false);

    }

  };


  // ==========================================================
  // SELECCIONAR CONVERSACIÓN
  // ==========================================================

  const selectConversation = async (
    selectedConversation
  ) => {

    setConversation(
      selectedConversation
    );

    setMessages([]);

    await fetchMessages(
      selectedConversation.id
    );

  };


  // ==========================================================
  // CARGAR MENSAJES
  // ==========================================================

  const fetchMessages = async (
    conversationId
  ) => {

    if (
      !conversationId ||
      !user?.id
    ) {
      return;
    }

    setIsLoading(true);

    try {

      const url =
        `${API_URL}/conversations/${conversationId}/messages` +
        `?user_id=${user.id}`;

      const response = await fetch(url);

      if (!response.ok) {

        throw new Error(
          'Error obteniendo mensajes'
        );

      }

      const data =
        await response.json();

      setMessages(data);

    } catch (error) {

      console.error(
        'Error cargando mensajes:',
        error
      );

    } finally {

      setIsLoading(false);

    }

  };


  // ==========================================================
  // ENVIAR MENSAJE
  // ==========================================================

  const handleSend = async (e) => {

    e.preventDefault();

    if (
      !input.trim() ||
      !conversation ||
      !user?.id
    ) {

      return;

    }

    const currentInput =
      input.trim();

    setInput('');


    // --------------------------------------------------------
    // MENSAJE TEMPORAL
    // --------------------------------------------------------

    const tempMsg = {

      id: `temp-${Date.now()}`,

      sender_id: user.id,

      receiver_id:
        user.role === 'patient'
          ? conversation.doctor_id
          : conversation.patient_id,

      message: currentInput,

      created_at:
        new Date().toISOString(),

      is_read: false

    };


    setMessages((prev) => [

      ...prev,

      tempMsg

    ]);


    try {

      const url =
        `${API_URL}/conversations/${conversation.id}/messages` +
        `?sender_id=${user.id}`;


      const response =
        await fetch(url, {

          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            message: currentInput
          })

        });


      if (!response.ok) {

        throw new Error(
          'Error enviando mensaje'
        );

      }


      await fetchMessages(
        conversation.id
      );


      await fetchConversations();


    } catch (error) {

      console.error(
        'Error enviando mensaje:',
        error
      );


      setMessages((prev) =>
        prev.filter(
          (msg) =>
            msg.id !== tempMsg.id
        )
  // GRABACIÓN DE AUDIO (SOPORTE MULTINAVEGADOR: SAFARI, CHROME, FIREFOX, EDGE, MOBILE)
  // ==========================================================

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/wav'
    ];
    for (const type of types) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const finalMime = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });
        stream.getTracks().forEach((track) => track.stop());

        const finalDuration = recordingDurationRef.current;
        if (audioBlob.size > 0 && !isCancelledRef.current) {
          await uploadAudioMessage(audioBlob, finalDuration, finalMime);
        }
      };

      isCancelledRef.current = false;
      mediaRecorder.start(200); // 200ms timeslice para compatibilidad entre navegadores
      setIsRecording(true);
      setRecordingDuration(0);
      recordingDurationRef.current = 0;

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const next = prev + 1;
          recordingDurationRef.current = next;
          return next;
        });
      }, 1000);

    } catch (err) {
      console.error('Error al acceder al micrófono:', err);
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos del navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsRecording(false);
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      isCancelledRef.current = true;
      setIsRecording(false);
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingDuration(0);
      recordingDurationRef.current = 0;
    }
  };

  const formatDuration = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const uploadAudioMessage = async (audioBlob, duration, mimeType = 'audio/webm') => {
    if (!conversation || !user?.id) return;

    setIsUploadingAudio(true);

    let ext = 'webm';
    if (mimeType.includes('mp4') || mimeType.includes('aac')) ext = 'mp4';
    else if (mimeType.includes('ogg')) ext = 'ogg';
    else if (mimeType.includes('wav')) ext = 'wav';

    const fileName = `audio.${ext}`;

    const tempMsgId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempMsgId,
      sender_id: user.id,
      receiver_id:
        user.role === 'patient'
          ? conversation.doctor_id
          : conversation.patient_id,
      message: '[Mensaje de Voz]',
      created_at: new Date().toISOString(),
      is_read: false,
      attachments: [
        {
          id: `temp-att-${Date.now()}`,
          attachment_type: 'audio',
          mime_type: mimeType,
          file_name: fileName,
          file_path: '',
          file_url: URL.createObjectURL(audioBlob),
          duration: duration || 0
        }
      ]
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, fileName);
      formData.append('duration', (duration || 0).toString());

      const url = `${API_URL}/conversations/${conversation.id}/messages/audio?sender_id=${user.id}`;
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Error al subir el mensaje de audio');
      }

      await fetchMessages(conversation.id);
      await fetchConversations();
    } catch (err) {
      console.error('Error subiendo audio:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempMsgId));
      alert(`Error al enviar el mensaje de voz: ${err.message || 'Inténtalo de nuevo.'}`);
    } finally {
      setIsUploadingAudio(false);
    }
  };


  // ==========================================================
  // OBTENER USUARIO OPUESTO
  // ==========================================================

  const getOtherUserId = (
    conv
  ) => {

    if (!conv || !user) {

      return null;

    }

    return user.role === 'patient'
      ? conv.doctor_id
      : conv.patient_id;

  };


  const getOtherUserName = (
    conv
  ) => {

    const otherUserId =
      getOtherUserId(conv);


    if (!otherUserId) {

      return 'Usuario';

    }


    if (
      user?.role === 'patient'
    ) {

      return `Médico #${otherUserId}`;

    }


    return `Paciente #${otherUserId}`;

  };


  // ==========================================================
  // ELIMINAR CONVERSACIÓN
  // ==========================================================

  const handleDeleteConversation = async (
    conversationId
  ) => {

    if (
      !conversationId ||
      !user?.id
    ) {

      return;

    }


    const confirmed =
      window.confirm(
        '¿Estás seguro de que quieres eliminar esta conversación? Se eliminarán también sus mensajes.'
      );


    if (!confirmed) {

      return;

    }


    try {

      const url =
        `${API_URL}/conversations/${conversationId}` +
        `?user_id=${user.id}`;


      const response =
        await fetch(url, {
          method: 'DELETE'
        });


      if (!response.ok) {

        throw new Error(
          'Error eliminando conversación'
        );

      }


      const updatedConversations =
        conversations.filter(
          (conv) =>
            conv.id !== conversationId
        );


      setConversations(
        updatedConversations
      );


      if (
        conversation?.id ===
        conversationId
      ) {

        if (
          updatedConversations.length > 0
        ) {

          const nextConversation =
            updatedConversations[0];


          setConversation(
            nextConversation
          );


          await fetchMessages(
            nextConversation.id
          );

        } else {

          setConversation(null);

          setMessages([]);

        }

      }

    } catch (error) {

      console.error(
        'Error eliminando conversación:',
        error
      );


      alert(
        'No fue posible eliminar la conversación.'
      );

    }

  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="flex-1 flex flex-col p-4 md:p-8 animate-in fade-in duration-500 h-full max-h-screen relative">

      {/* ======================================================
          MODAL LLAMADA ENTRANTE (RINGING)
      ====================================================== */}
      {callStatus === 'ringing' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-6 border border-slate-100">
            <div className="relative">
              <div className="w-24 h-24 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center animate-bounce">
                <PhoneCall size={48} />
              </div>
              <span className="absolute top-0 right-0 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500"></span>
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800">Videollamada Entrante</h3>
              <p className="text-slate-500 text-sm mt-1">
                {user?.role === 'patient' ? 'Tu médico' : 'Tu paciente'} te está llamando...
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 w-full pt-2">
              <button
                onClick={rejectCall}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3.5 px-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 cursor-pointer"
              >
                <PhoneOff size={20} />
                Rechazar
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 px-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 cursor-pointer animate-pulse"
              >
                <Phone size={20} />
                Contestar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          MODAL MARCANDO (CALLING)
      ====================================================== */}
      {callStatus === 'calling' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-6 border border-slate-100">
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center animate-pulse">
              <Video size={48} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800">Llamando...</h3>
              <p className="text-slate-500 text-sm mt-1">Esperando a que la otra persona conteste</p>
            </div>

            <button
              onClick={cancelCall}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3.5 px-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 cursor-pointer"
            >
              <PhoneOff size={20} />
              Cancelar Llamada
            </button>
          </div>
        </div>
      )}


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between mb-6">

        <div className="flex items-center gap-4">

          <div className="bg-teal-100 text-teal-600 p-3 rounded-2xl shadow-sm">

            <MessageCircle
              size={28}
            />

          </div>


          <div>

            <h1 className="text-3xl font-bold text-slate-800">

              Chat Médico

            </h1>


            <p className="text-slate-500 mt-1">

              Comunicación entre médicos y pacientes

            </p>

          </div>

        </div>


        <button
          onClick={
            fetchConversations
          }
          disabled={
            isLoadingConversations
          }
          className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors flex items-center gap-2"
          title="Actualizar conversaciones"
        >

          <RefreshCw
            size={20}
            className={
              isLoadingConversations
                ? 'animate-spin'
                : ''
            }
          />


          <span className="text-sm font-medium hidden sm:inline">

            Actualizar

          </span>

        </button>

      </div>


      {/* ======================================================
          CHAT
      ====================================================== */}

      <div className="flex-1 glass-card rounded-3xl flex overflow-hidden border border-white/60 shadow-xl relative min-h-[500px]">


        {/* ====================================================
            CONVERSACIONES
        ==================================================== */}

        <div className="w-[300px] md:w-[350px] border-r border-slate-200 bg-white/70 flex flex-col">


          <div className="p-4 border-b border-slate-200">

            <div className="flex items-center gap-3 mb-3">

              <MessageCircle
                size={22}
                className="text-teal-600"
              />

              <h2 className="font-bold text-slate-800">

                Conversaciones

              </h2>

            </div>


            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3">

              <Search
                size={18}
                className="text-slate-400"
              />

              <input
                type="text"
                placeholder="Buscar conversación..."
                className="flex-1 bg-transparent border-none outline-none py-2 text-sm text-slate-700"
              />

            </div>

          </div>


          <div className="flex-1 overflow-y-auto">


            {isLoadingConversations &&
              conversations.length === 0 && (

                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">

                  <Loader2
                    size={24}
                    className="animate-spin text-teal-500"
                  />

                  <span>
                    Cargando conversaciones...
                  </span>

                </div>

              )}


            {!isLoadingConversations &&
              conversations.length === 0 && (

                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">

                  <MessageCircle
                    size={40}
                    className="mb-3 text-slate-300"
                  />

                  <p className="font-medium">

                    No tienes conversaciones

                  </p>

                  <p className="text-sm mt-1">

                    Cuando tengas una conversación aparecerá aquí.

                  </p>

                </div>

              )}


            {conversations.map(
              (conv) => {

                const isActive =
                  conversation?.id ===
                  conv.id;


                const otherUserName =
                  getOtherUserName(
                    conv
                  );


                return (

                  <div
                    key={conv.id}
                    className={`w-full p-4 border-b border-slate-100 transition-all ${
                      isActive
                        ? 'bg-teal-50 border-l-4 border-l-teal-600'
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >

                    <div className="flex items-center gap-3">


                      <button
                        onClick={() =>
                          selectConversation(
                            conv
                          )
                        }
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >


                        <div
                          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                            isActive
                              ? 'bg-teal-600 text-white'
                              : 'bg-teal-100 text-teal-600'
                          }`}
                        >

                          <User
                            size={22}
                          />

                        </div>


                        <div className="flex-1 min-w-0">

                          <h3 className="font-semibold text-slate-800 truncate">

                            {otherUserName}

                          </h3>


                          <p className="text-xs text-slate-400 mt-1">

                            Conversación #
                            {conv.id}

                          </p>

                        </div>

                      </button>


                      {/* ELIMINAR */}

                      <button
                        onClick={() =>
                          handleDeleteConversation(
                            conv.id
                          )
                        }
                        className="flex-shrink-0 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar conversación"
                      >

                        <Trash2
                          size={18}
                        />

                      </button>

                    </div>

                  </div>

                );

              }
            )}

          </div>

        </div>


        {/* ====================================================
            CHAT ACTIVO
        ==================================================== */}

        <div className="flex-1 flex flex-col min-w-0">


          {!conversation ? (

            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">

              <MessageCircle
                size={56}
                className="mb-4 text-slate-300"
              />

              <h2 className="text-lg font-semibold text-slate-500">

                Selecciona una conversación

              </h2>


              <p className="text-sm mt-1">

                Selecciona un chat de la lista para comenzar.

              </p>

            </div>

          ) : callStatus === 'in-call' ? (
            <div className="flex-1 flex flex-col w-full h-full relative min-h-[500px] bg-slate-900 rounded-r-3xl overflow-hidden">
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={endCall}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                >
                  <PhoneOff size={18} />
                  Finalizar Llamada
                </button>
              </div>
              <iframe
                src={`https://meet.jit.si/${callData?.room_name || `MedicalChat-${conversation.id}`}#userInfo.displayName="${encodeURIComponent(user?.name || (user?.role === 'patient' ? 'Paciente' : 'Médico'))}"`}
                allow="camera; microphone; display-capture; autoplay; clipboard-write"
                className="w-full h-full border-none rounded-r-3xl min-h-[500px]"
                title="Videollamada Médica"
              />
            </div>
          ) : (

            <>


              {/* HEADER CHAT */}

              <div className="p-4 bg-white/80 border-b border-slate-200 flex items-center gap-3">

                <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">

                  <User
                    size={22}
                  />

                </div>


                <div>

                  <h2 className="font-bold text-slate-800">

                    {getOtherUserName(
                      conversation
                    )}

                  </h2>


                  <p className="text-xs text-slate-400">

                    Conversación #
                    {conversation.id}

                  </p>

                </div>


                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={handleVideoCall}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Iniciar Videollamada (Google Meet)"
                    disabled={isLoading}
                  >
                    <Video size={19} />
                  </button>

                  <button
                    onClick={() => fetchMessages(conversation.id)}
                    className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Actualizar mensajes"
                  >
                    <RefreshCw
                      size={19}
                      className={isLoading ? 'animate-spin' : ''}
                    />
                  </button>
                </div>

              </div>


              {/* MENSAJES */}

              <div className="flex-1 overflow-y-auto p-6 space-y-6">


                {isLoading &&
                  messages.length === 0 && (

                    <div className="flex justify-center items-center h-full text-slate-400 gap-2">

                      <Loader2
                        size={24}
                        className="animate-spin text-teal-500"
                      />

                      <span>

                        Cargando mensajes...

                      </span>

                    </div>

                  )}


                {!isLoading &&
                  messages.length === 0 && (

                    <div className="flex justify-center items-center h-full text-slate-400">

                      No hay mensajes todavía. ¡Envía un mensaje para comenzar!

                    </div>

                  )}


                {messages.map(
                  (msg) => {

                    const isMe =
                      msg.sender_id ===
                      user?.id;


                    return (

                      <div
                        key={msg.id}
                        className={`flex ${
                          isMe
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >

                        <div
                          className={`flex gap-4 ${
                            isMe
                              ? 'flex-row-reverse max-w-[70%]'
                              : 'flex-row max-w-[70%]'
                          }`}
                        >

                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                              isMe
                                ? 'bg-blue-600 text-white'
                                : 'bg-teal-100 text-teal-600 border border-teal-200'
                            }`}
                          >

                            <User
                              size={20}
                            />

                          </div>


                          <div
                            className={`px-6 py-4 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-tr-sm'
                                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                            }`}
                          >

                            <div className="whitespace-pre-wrap">
                              {msg.attachments && msg.attachments.length > 0 && msg.attachments[0].attachment_type === 'audio' ? (
                                <AudioMessage 
                                  fileUrl={msg.attachments[0].file_url || `${API_URL.replace('/api', '')}/archivos/${msg.attachments[0].file_path}`} 
                                  duration={msg.attachments[0].duration} 
                                  isMe={isMe} 
                                />
                              ) : (
                                msg.message
                              )}
                            </div>


                            <div
                              className={`text-[10px] mt-2 text-right ${
                                isMe
                                  ? 'text-blue-200'
                                  : 'text-slate-400'
                              }`}
                            >

                              {new Date(
                                msg.created_at
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }
                              )}

                            </div>

                          </div>

                        </div>

                      </div>

                    );

                  }
                )}


                <div
                  ref={messagesEndRef}
                />

              </div>


              {/* INPUT */}

              <div className="p-4 bg-white/80 border-t border-slate-100 backdrop-blur-md font-sans">

                <form
                  onSubmit={
                    handleSend
                  }
                  className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-400 transition-all shadow-inner"
                >

                  {isRecording ? (
                    <div className="flex-1 flex items-center justify-between px-4 h-12">
                      <div className="flex items-center gap-3">
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <span className="text-sm font-semibold text-slate-600 animate-pulse">
                          Grabando: {formatDuration(recordingDuration)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* CANCEL BUTTON */}
                        <button
                          type="button"
                          onClick={cancelRecording}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Cancelar grabación"
                        >
                          <X size={20} />
                        </button>
                        
                        {/* STOP/SEND BUTTON */}
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-xl transition-all flex items-center justify-center shadow-md cursor-pointer animate-pulse"
                          title="Enviar audio"
                        >
                          <Square size={16} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={input}
                        onChange={(e) =>
                          setInput(
                            e.target.value
                          )
                        }
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-transparent border-none outline-none px-4 text-slate-700 placeholder-slate-400 h-12"
                        disabled={
                          isLoading || isUploadingAudio
                        }
                      />

                      {/* MICROPHONE BUTTON */}
                      <button
                        type="button"
                        onClick={startRecording}
                        disabled={isLoading || isUploadingAudio}
                        className="p-3 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                        title="Grabar mensaje de voz"
                      >
                        <Mic size={20} />
                      </button>

                      {/* SEND BUTTON */}
                      <button
                        type="submit"
                        disabled={
                          !input.trim() ||
                          isLoading ||
                          isUploadingAudio
                        }
                        className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shadow-md cursor-pointer"
                      >
                        {isUploadingAudio ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Send size={20} />
                        )}
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


// ==========================================================
// COMPONENTE AUDIO MESSAGE (REPRODUCTOR PERSONALIZADO)
// ==========================================================

function AudioMessage({ fileUrl, duration, isMe }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);

  useEffect(() => {
    if (duration && isFinite(duration) && duration > 0) {
      setAudioDuration(duration);
    }
  }, [duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    setIsPlaying(false);
    setCurrentTime(0);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [fileUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Error al reproducir audio:", err);
      });
    }
  };

  const handleProgressChange = (e) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-3 py-1 min-w-[200px] md:min-w-[260px] font-sans">
      <audio ref={audioRef} src={fileUrl} preload="metadata" crossOrigin="anonymous" />

      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm flex-shrink-0 cursor-pointer ${
          isMe
            ? 'bg-white text-blue-600 hover:scale-105 hover:bg-slate-50'
            : 'bg-teal-600 text-white hover:scale-105 hover:bg-teal-700'
        }`}
      >
        {isPlaying ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <input
          type="range"
          min="0"
          max={audioDuration || 100}
          value={currentTime}
          onChange={handleProgressChange}
          className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
            isMe
              ? 'bg-blue-400/50 accent-white'
              : 'bg-slate-200 accent-teal-600'
          }`}
          style={{
            background: isMe 
              ? `linear-gradient(to right, #ffffff 0%, #ffffff ${(currentTime / (audioDuration || 1)) * 100}%, rgba(255, 255, 255, 0.3) ${(currentTime / (audioDuration || 1)) * 100}%, rgba(255, 255, 255, 0.3) 100%)`
              : `linear-gradient(to right, #0d9488 0%, #0d9488 ${(currentTime / (audioDuration || 1)) * 100}%, #cbd5e1 ${(currentTime / (audioDuration || 1)) * 100}%, #cbd5e1 100%)`
          }}
        />
        <div
          className={`flex justify-between text-[10px] font-medium ${
            isMe ? 'text-blue-200' : 'text-slate-400'
          }`}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>
    </div>
  );
}