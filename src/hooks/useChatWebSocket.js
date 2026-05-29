import { useEffect, useRef, useState, useCallback } from 'react';

const WS_BASE = process.env.REACT_APP_API_BASE_URL
  ? process.env.REACT_APP_API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://').replace('/api/v1', '') + '/ws/chat'
  : 'ws://localhost:8000/ws/chat';

export function useChatWebSocket(roomId, onMessage) {
  const wsRef        = useRef(null);
  const [connected, setConnected] = useState(false);
  const reconnectRef = useRef(null);
  const mountedRef   = useRef(false);

  // onMessage ला ref मध्ये ठेवतो - stale closure टाळण्यासाठी
  const onMessageRef = useRef(onMessage);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  const connect = useCallback(() => {
    if (!roomId) return;
    if (!mountedRef.current) return; // unmount झाला असेल तर connect नको

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // आधीच open/connecting असेल तर नवीन connection नको
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
       wsRef.current.readyState === WebSocket.CONNECTING)
    ) return;

    const ws = new WebSocket(`${WS_BASE}/${roomId}/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) {
        // StrictMode मुळे unmount झालं - connection बंद करा
        ws.close();
        return;
      }
      setConnected(true);
    };

    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(e.data);
        onMessageRef.current(data);
      } catch {}
    };

    ws.onclose = (e) => {
      if (!mountedRef.current) return; // intentional close - reconnect नको
      setConnected(false);
      // 3 seconds नंतर reconnect
      reconnectRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [roomId]);

  useEffect(() => {
    mountedRef.current = true;

    // थोडा delay देतो StrictMode च्या double-invoke साठी
    const timer = setTimeout(() => {
      if (mountedRef.current) connect();
    }, 50);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // reconnect trigger होऊ नये
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const sendMessage     = useCallback((content) => send({ action: 'message', content }), [send]);
  const sendTyping      = useCallback((typing)  => send({ action: 'typing', typing }), [send]);
  const sendPrescription = useCallback((prescriptionId, content) =>
    send({ action: 'prescription', prescription_id: prescriptionId, content }), [send]);
  const markRead        = useCallback(() => send({ action: 'mark_read' }), [send]);

  return { connected, sendMessage, sendTyping, sendPrescription, markRead };
}