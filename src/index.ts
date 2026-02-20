/**
 * Main library entry point
 * Exports all public APIs
 */

import { injectStyles } from './inject-styles'

injectStyles()

// Components
export { HtmmMap } from './components/HtmmMap';
export type { HtmmMapHandle, HtmmMapProps, HtmmAppearance } from './components/HtmmMap';
export { NodeView } from './components/NodeView';
export { EdgeView } from './components/EdgeView';

// Store
export { useHtmmStore } from './store/htmm-store';
export type { HtmmState, HtmmActions, HtmmStoreInitialOptions } from './store/htmm-store';

// IO
export { parseMindMapXML, loadMindMapFile, loadMindMapURL } from './io/parser';
export { generateMindMapXML, saveMindMapFile, getMindMapBlob } from './io/generator';

// Models
export {
  createNode,
  createRootNode,
  findNodeById,
  findParentNode,
  getNodePath,
  countNodes,
  getNodeDepth,
  isFolded,
  getVisibleChildren,
  getAllChildren,
  hasChildren,
  cloneNode,
  getSiblings,
  getNodeIndex,
  isLeaf,
  getDescendants,
} from './models/MindMapNode';

// Layout
export {
  calculateLayout,
  getBoundingBox,
  getEdgePoints,
} from './layout/layout-engine';
export type { CalculateLayoutOptions, GetNodeDimensions } from './layout/layout-engine';

// Utils
export { getIconEmoji, isValidIcon, getAvailableIcons, ICON_MAP, ICON_CATEGORIES } from './utils/icons';
export {
  exportToPNG,
  exportToSVG,
  exportToPDF,
} from './utils/export';
export type { ExportOptions } from './utils/export';
export {
  printMap,
  enterPrintPreview,
  exitPrintPreview,
  supportsPrint,
  estimatePageCount,
} from './utils/print';
export type { PrintOptions } from './utils/print';

// Types
export type {
  MindMapData,
  MindMapNode,
  LayoutNode,
  EdgeRenderInfo,
  NodePosition,
  NodeStyle,
  EdgeStyle,
  EdgeWidth,
  ArrowType,
  RichContentType,
  FontInfo,
  EdgeInfo,
  CloudInfo,
  IconInfo,
  ArrowLinkInfo,
  RichContentInfo,
  AttributeInfo,
  AttributeLayoutInfo,
  LayoutInfo,
} from './types/mindmap';

export type {
  ActionType,
  Action,
  MindMapAction,
} from './types/actions';

// Collaboration (Phase 4 - WebSocket sync foundation; CRDT merge to be implemented)
export { useCollaboration } from './collab';
export type {
  CollabMessage,
  CollabMessageKind,
  CollabConnectionStatus,
  CollabConnectionState,
  UseCollaborationOptions,
} from './collab';
