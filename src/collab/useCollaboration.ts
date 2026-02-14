/**
 * useCollaboration - WebSocket-based collaboration hook (Phase 4 foundation)
 * Connects to a sync server, sends and receives messages. CRDT merge is left to a future implementation.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CollabConnectionState,
  CollabMessage,
  CollabFullStateMessage,
} from './types';

export interface UseCollaborationOptions {
  /** WebSocket URL (e.g. wss://example.com/collab) */
  url: string | null;
  /** Room id to join */
  roomId: string | null;
  /** Callback when server sends full state (e.g. load into store) */
  onFullState?: (data: CollabFullStateMessage['data']) => void;
  /** Callback for any incoming message (for custom handling / patches) */
  onMessage?: (message: CollabMessage) => void;
  /** Whether to connect when url and roomId are set */
  enabled?: boolean;
}

const DEFAULT_CLIENT_ID = () => `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export function useCollaboration(options: UseCollaborationOptions): {
  connectionState: CollabConnectionState;
  connect: () => void;
  disconnect: () => void;
  send: (message: Omit<CollabMessage, 'roomId' | 'clientId'>) => void;
} {
  const {
    url,
    roomId,
    onFullState,
    onMessage,
    enabled = true,
  } = options;

  const [connectionState, setConnectionState] = useState<CollabConnectionState>({
    status: 'disconnected',
    roomId: null,
    clientId: null,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(DEFAULT_CLIENT_ID());
  const onFullStateRef = useRef(onFullState);
  const onMessageRef = useRef(onMessage);
  onFullStateRef.current = onFullState;
  onMessageRef.current = onMessage;

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
    setConnectionState((s) => ({
      ...s,
      status: 'disconnected',
      roomId: null,
      clientId: null,
      error: null,
    }));
  }, []);

  const connect = useCallback(() => {
    if (!url || !roomId || !enabled) return;
    disconnect();
    setConnectionState((s) => ({ ...s, status: 'connecting', error: null }));
    const clientId = clientIdRef.current;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      setConnectionState((s) => ({
        ...s,
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to create WebSocket',
      }));
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState((s) => ({
        ...s,
        status: 'connected',
        roomId,
        clientId,
        error: null,
      }));
      ws.send(
        JSON.stringify({
          kind: 'join',
          roomId,
          clientId,
        } as CollabMessage)
      );
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string) as CollabMessage;
        if (message.kind === 'full_state' && 'data' in message) {
          onFullStateRef.current?.(message.data);
        }
        onMessageRef.current?.(message);
      } catch {
        // ignore malformed
      }
    };

    ws.onerror = () => {
      setConnectionState((s) => ({
        ...s,
        status: 'error',
        error: 'WebSocket error',
      }));
    };

    ws.onclose = () => {
      wsRef.current = null;
      setConnectionState((s) => ({
        ...s,
        status: 'disconnected',
        roomId: null,
        clientId: null,
      }));
    };
  }, [url, roomId, enabled, disconnect]);

  useEffect(() => {
    if (enabled && url && roomId) {
      connect();
    }
    return () => disconnect();
  }, [enabled, url, roomId, connect, disconnect]);

  const send = useCallback(
    (message: Omit<CollabMessage, 'roomId' | 'clientId'>) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN || !roomId) return;
      const clientId = clientIdRef.current;
      wsRef.current.send(
        JSON.stringify({
          ...message,
          roomId,
          clientId,
        } as CollabMessage)
      );
    },
    [roomId]
  );

  return {
    connectionState,
    connect,
    disconnect,
    send,
  };
}
