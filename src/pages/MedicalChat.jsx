import { useState, useRef, useEffect } from 'react';

import {
  Send,
  User,
  MessageCircle,
  Loader2,
  RefreshCw,
  Search,
  Trash2
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

  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;


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
      );

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

    <div className="flex-1 flex flex-col p-4 md:p-8 animate-in fade-in duration-500 h-full max-h-screen">


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


                <button
                  onClick={() =>
                    fetchMessages(
                      conversation.id
                    )
                  }
                  className="ml-auto p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                  title="Actualizar mensajes"
                >

                  <RefreshCw
                    size={19}
                    className={
                      isLoading
                        ? 'animate-spin'
                        : ''
                    }
                  />

                </button>

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

                              {msg.message}

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

              <div className="p-4 bg-white/80 border-t border-slate-100 backdrop-blur-md">

                <form
                  onSubmit={
                    handleSend
                  }
                  className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-400 transition-all shadow-inner"
                >

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
                      isLoading
                    }
                  />


                  <button
                    type="submit"
                    disabled={
                      !input.trim() ||
                      isLoading
                    }
                    className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shadow-md cursor-pointer"
                  >

                    <Send
                      size={20}
                    />

                  </button>

                </form>

              </div>

            </>

          )}

        </div>

      </div>

    </div>

  );

}