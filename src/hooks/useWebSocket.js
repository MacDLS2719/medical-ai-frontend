import { useEffect, useRef } from 'react';

const getWsUrl = () => {
  const envWs = import.meta.env.VITE_WS_URL;
  if (envWs && envWs.trim() && !envWs.includes('localhost')) {
    return envWs.trim().replace(/\/+$/, '');
  }

  const envApi = import.meta.env.VITE_API_URL;
  if (envApi && envApi.trim()) {
    const rawApi = envApi.trim();
    if (rawApi.startsWith('http://') || rawApi.startsWith('https://')) {
      const wsProtocol = rawApi.startsWith('https') ? 'wss://' : 'ws://';
      const host = rawApi.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      return `${wsProtocol}${host}`;
    }
  }

  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    return `${wsProtocol}${window.location.host}`;
  }

  return 'ws://localhost:8000';
};

export const useWebSocket = (userId, onMessageReceived) => {
  const wsRef = useRef(null);
  const onMessageReceivedRef = useRef(onMessageReceived);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    if (!userId) return;

    const baseUrl = getWsUrl();
    const url = `${baseUrl}/api/ws/${userId}`;
    console.log(`[WS] Conectando usuario ${userId} a ${url}`);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`[WS] Conectado correctamente (user_id=${userId})`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WS] Mensaje recibido:', data);
        if (onMessageReceivedRef.current) {
          onMessageReceivedRef.current(data);
        }
      } catch (err) {
        console.error('[WS] Error parseando mensaje:', err);
      }
    };

    ws.onerror = (error) => {
      console.error(`[WS] Error en WebSocket (user_id=${userId}):`, error);
    };

    ws.onclose = (event) => {
      console.warn(`[WS] Desconectado (user_id=${userId}), code=${event.code}`);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [userId]);

  const sendWsMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('[WS] Enviando mensaje:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WS] No conectado. Estado:', wsRef.current?.readyState, '| Mensaje:', message);
    }
  };

  return { sendWsMessage };
};