/**
 * Collaborative editing (Phase 4) - public API
 * WebSocket sync and message types. CRDT merge to be implemented on top of this.
 */

export type {
  CollabMessage,
  CollabMessageKind,
  CollabJoinMessage,
  CollabLeaveMessage,
  CollabFullStateMessage,
  CollabPatchMessage,
  CollabCursorMessage,
  CollabAwarenessMessage,
  CollabConnectionStatus,
  CollabConnectionState,
} from './types';

export { useCollaboration } from './useCollaboration';
export type { UseCollaborationOptions } from './useCollaboration';
