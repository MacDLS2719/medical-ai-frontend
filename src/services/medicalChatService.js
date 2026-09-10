import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const medicalChatService = {
  // Obtener la lista de conversaciones del usuario
  async getConversations(userId) {
    const response = await axios.get(`${API_URL}/conversations`, {
      params: { user_id: userId }
    });
    return response.data;
  },

  // Obtener contactos disponibles según el rol del usuario (médicos para pacientes, pacientes para médicos)
  async getAvailableContacts(currentUserId) {
    const response = await axios.get(`${API_URL}/conversations/contacts`, {
      params: { current_user_id: currentUserId }
    });
    return response.data;
  },

  // Obtener la lista de médicos disponibles para chatear (retrocompatibilidad)
  async getAvailableDoctors(currentUserId) {
    const response = await axios.get(`${API_URL}/conversations/doctors`, {
      params: currentUserId ? { current_user_id: currentUserId } : {}
    });
    return response.data;
  },

  // Crear o recuperar una conversación entre paciente y médico
  async createConversation(patientId, doctorId) {
    const response = await axios.post(`${API_URL}/conversations`, {
      patient_id: patientId,
      doctor_id: doctorId
    });
    return response.data;
  },

  // Obtener los mensajes de una conversación específica
  async getMessages(conversationId, userId) {
    const response = await axios.get(`${API_URL}/conversations/${conversationId}/messages`, {
      params: { user_id: userId }
    });
    return response.data;
  },

  // Enviar un mensaje de texto
  async sendMessage(conversationId, senderId, message) {
    const response = await axios.post(
      `${API_URL}/conversations/${conversationId}/messages`,
      { message },
      { params: { sender_id: senderId } }
    );
    return response.data;
  },


  // Enviar una nota de voz / audio
  async sendAudioMessage(conversationId, senderId, audioBlob, duration, mimeType) {
    const formData = new FormData();
    formData.append('sender_id', senderId);
    
    // Determinar la extensión según el mimeType
    const extension = mimeType?.includes('mp4') ? 'm4a' : 'webm';
    formData.append('audio', audioBlob, `voice_note.${extension}`);
    formData.append('duration', duration);

    const response = await axios.post(
      `${API_URL}/conversations/${conversationId}/messages/audio`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  },

  // Eliminar una conversación
  async deleteConversation(conversationId, userId) {
    const response = await axios.delete(`${API_URL}/conversations/${conversationId}`, {
      params: { user_id: userId }
    });
    return response.data;
  },

  // Iniciar una solicitud de videollamada
  async startVideoCall(conversationId, callerId) {
    const response = await axios.post(
      `${API_URL}/conversations/${conversationId}/video-call`,
      {},                                    // body vacío
      { params: { sender_id: callerId } }    // sender_id como query param
    );
    return response.data;
  }
};