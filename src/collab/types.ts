/**
 * Collaborative editing - wire protocol and CRDT-related types
 * Phase 4 foundation: WebSocket message shapes for multi-user sync.
 */

import type { MindMapData } from '../types/mindmap';

/** Kind of sync message */
export type CollabMessageKind =
  | 'join'
  | 'leave'
  | 'full_state'
  | 'patch'
  | 'cursor'
  | 'awareness';

/** Join the room; server may reply with full_state */
export interface CollabJoinMessage {
  kind: 'join';
  roomId: string;
  clientId: string;
  userLabel?: string;
}

/** Leave the room */
export interface CollabLeaveMessage {
  kind: 'leave';
  roomId: string;
  clientId: string;
}

/** Full map state (e.g. server snapshot or initial broadcast) */
export interface CollabFullStateMessage {
  kind: 'full_state';
  roomId: string;
  data: MindMapData;
  clientId?: string;
}

/** Incremental patch (CRDT op or OT op); shape TBD by implementation */
export interface CollabPatchMessage {
  kind: 'patch';
  roomId: string;
  clientId: string;
  /** Opaque patch payload; e.g. CRDT updates or OT operations */
  payload: unknown;
  /** Optional vector clock or version for ordering */
  version?: number;
}

/** Cursor / selection position for presence */
export interface CollabCursorMessage {
  kind: 'cursor';
  roomId: string;
  clientId: string;
  nodeId?: string | null;
  x?: number;
  y?: number;
}

/** Awareness (online users, names, etc.) */
export interface CollabAwarenessMessage {
  kind: 'awareness';
  roomId: string;
  clientId: string;
  payload: Record<string, unknown>;
}

export type CollabMessage =
  | CollabJoinMessage
  | CollabLeaveMessage
  | CollabFullStateMessage
  | CollabPatchMessage
  | CollabCursorMessage
  | CollabAwarenessMessage;

/** Connection state for UI */
export type CollabConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface CollabConnectionState {
  status: CollabConnectionStatus;
  roomId: string | null;
  clientId: string | null;
  error: string | null;
}
