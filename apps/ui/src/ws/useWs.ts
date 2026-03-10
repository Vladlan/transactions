import { useEffect, useRef, useState, useCallback } from "react";
import { WsClient } from "./client";

const WS_URL = import.meta.env.VITE_WS_URL ?? `ws://${window.location.host}/ws`;

export function useWs() {
  const clientRef = useRef<WsClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = new WsClient(WS_URL);
    clientRef.current = client;
    setIsConnected(client.connected);
    const unsub = client.onConnectionChange(setIsConnected);
    return () => {
      unsub();
      client.destroy();
      clientRef.current = null;
    };
  }, []);

  const request = useCallback(
    <T = unknown>(action: string, params?: Record<string, unknown>): Promise<T> => {
      if (!clientRef.current) {
        return Promise.reject(new Error("WebSocket not initialized"));
      }
      return clientRef.current.request<T>(action, params);
    },
    [],
  );

  return { request, isConnected };
}
