/**
 * FreeMind Web Store
 * Central state management using Zustand + Immer
 */

import { createContext, useContext } from 'react';
import { create, useStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { StoreApi } from 'zustand';
import { enableMapSet } from 'immer';
import type { MindMapData, MindMapNode, FontInfo, NodeStyle } from '../types/mindmap';
import { createRootNode, findNodeById, findParentNode, cloneNode, generateNodeId } from '../models/MindMapNode';

// Enable Immer MapSet plugin for Set support
enableMapSet();

/** Internal type for the store instance (Context and multi-instance) */
export type FreeMindStoreApi = StoreApi<FreeMindState & FreeMindActions>;

/**
 * Store state interface
 */
export interface FreeMindState {
  // Data
  mapData: MindMapData | null;
  
  // Selection
  selectedNodeIds: Set<string>;
  
  // Edit mode
  editable: boolean;
  
  // History
  history: MindMapData[];
  historyIndex: number;
  maxHistorySize: number;
  
  // UI state
  zoom: number;
  panX: number;
  panY: number;
  
  // Clipboard
  clipboard: MindMapNode | null;
}

/**
 * Store actions interface
 */
export interface FreeMindActions {
  // Map operations
  loadMap: (data: MindMapData) => void;
  newMap: (rootText?: string) => void;
  
  // Node operations
  addChild: (parentId: string, text?: string) => string | undefined;
  addSibling: (siblingId: string, before?: boolean) => string | undefined;
  deleteNode: (nodeId: string) => void;
  editNode: (nodeId: string, text: string) => void;
  moveNode: (nodeId: string, newParentId: string, index?: number) => void;
  
  // Folding
  toggleFolded: (nodeId: string) => void;
  toggleChildrenFolded: (nodeId: string) => void;
  foldAll: () => void;
  unfoldAll: () => void;
  
  // Styling
  setNodeColor: (nodeId: string, color: string) => void;
  setNodeBackgroundColor: (nodeId: string, color: string) => void;
  setFont: (nodeId: string, font: Partial<FontInfo>) => void;
  setNodeStyle: (nodeId: string, style: NodeStyle) => void;
  
  // Icons
  addIcon: (nodeId: string, iconName: string) => void;
  removeIcon: (nodeId: string, iconName: string) => void;
  clearIcons: (nodeId: string) => void;
  
  // Links
  setLink: (nodeId: string, url: string) => void;
  removeLink: (nodeId: string) => void;
  
  // Arrow Links
  addArrowLink: (sourceId: string, targetId: string, arrowLink?: Partial<import('../types/mindmap').ArrowLinkInfo>) => void;
  removeArrowLink: (sourceId: string, targetId: string) => void;
  updateArrowLink: (sourceId: string, targetId: string, arrowLink: Partial<import('../types/mindmap').ArrowLinkInfo>) => void;
  
  // Cloud
  setCloud: (nodeId: string, color?: string) => void;
  removeCloud: (nodeId: string) => void;
  
  // Selection
  selectNode: (nodeId: string, addToSelection?: boolean) => void;
  deselectAll: () => void;
  
  // Clipboard
  cutNode: (nodeId: string) => void;
  copyNode: (nodeId: string) => void;
  pasteNode: (parentId: string) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  
  // View
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  
  // Config
  setEditable: (editable: boolean) => void;
}

/** Immer middleware: set accepts a producer (state) => void or partial state */
type SetStateInternal = (partial: Partial<FreeMindState & FreeMindActions> | ((s: FreeMindState & FreeMindActions) => void)) => void;
type GetStateInternal = () => FreeMindState & FreeMindActions;

/**
 * Store slice creator - shared by default store and createFreeMindStore()
 */
function createFreeMindStoreSlice(set: SetStateInternal, get: GetStateInternal): FreeMindState & FreeMindActions {
  return {
    // Initial state
    mapData: null,
    selectedNodeIds: new Set(),
    editable: true,
    history: [],
    historyIndex: -1,
    maxHistorySize: 50,
    zoom: 1.0,
    panX: 0,
    panY: 0,
    clipboard: null,
    
    // Map operations
    loadMap: (data) => set((state) => {
      const copy = JSON.parse(JSON.stringify(data)) as MindMapData;
      state.mapData = copy;
      state.selectedNodeIds.clear();
      state.history = [JSON.parse(JSON.stringify(copy)) as MindMapData];
      state.historyIndex = 0;
    }),
    
    newMap: (rootText = 'New Mind Map') => set((state) => {
      const data: MindMapData = {
        version: '1.0.1',
        root: createRootNode(rootText),
      };
      const copy = JSON.parse(JSON.stringify(data)) as MindMapData;
      state.mapData = copy;
      state.selectedNodeIds.clear();
      state.history = [JSON.parse(JSON.stringify(copy)) as MindMapData];
      state.historyIndex = 0;
    }),
    
    // Node operations
    addChild: (parentId, text = '') => {
      let newNodeId: string | undefined;
      set((state) => {
        if (!state.mapData) return;
        
        const parent = findNodeById(state.mapData.root, parentId);
        if (!parent) return;
        
        if (!parent.children) {
          parent.children = [];
        }
        
        const newNode: MindMapNode = {
          id: generateNodeId(),
          text,
          created: Date.now(),
          modified: Date.now(),
          children: [],
        };
        
        // Set position for root's children
        if (parent === state.mapData.root) {
          // Alternate between left and right
          const leftCount = parent.children.filter(c => c.position === 'left').length;
          const rightCount = parent.children.filter(c => c.position === 'right').length;
          newNode.position = leftCount <= rightCount ? 'left' : 'right';
        }
        
        parent.children.push(newNode);
        state.selectedNodeIds.clear();
        state.selectedNodeIds.add(newNode.id);
        newNodeId = newNode.id;
        
        get().pushHistory();
      });
      return newNodeId;
    },
    
    addSibling: (siblingId, before = false) => {
      let newNodeId: string | undefined;
      set((state) => {
        if (!state.mapData) return;
        
        const parent = findParentNode(state.mapData.root, siblingId);
        if (!parent || !parent.children) return;
        
        const siblingIndex = parent.children.findIndex(c => c.id === siblingId);
        if (siblingIndex === -1) return;
        
        const sibling = parent.children[siblingIndex];
        const newNode: MindMapNode = {
          id: generateNodeId(),
          text: '',
          created: Date.now(),
          modified: Date.now(),
          children: [],
          position: sibling.position, // Inherit position
        };
        
        const insertIndex = before ? siblingIndex : siblingIndex + 1;
        parent.children.splice(insertIndex, 0, newNode);
        
        state.selectedNodeIds.clear();
        state.selectedNodeIds.add(newNode.id);
        newNodeId = newNode.id;
        
        get().pushHistory();
      });
      return newNodeId;
    },
    
    deleteNode: (nodeId) => set((state) => {
      if (!state.mapData || state.mapData.root.id === nodeId) return; // Can't delete root
      
      const parent = findParentNode(state.mapData.root, nodeId);
      if (!parent || !parent.children) return;
      
      // Find the index of the node to be deleted
      const nodeIndex = parent.children.findIndex(c => c.id === nodeId);
      if (nodeIndex === -1) return;
      
      // Determine which node to select after deletion
      let newSelectedNodeId: string | null = null;
      
      // 1. Try to select the next sibling (下の兄弟)
      if (parent.children.length > nodeIndex + 1) {
        newSelectedNodeId = parent.children[nodeIndex + 1].id;
      }
      // 2. If no next sibling, try the previous sibling (上の兄弟)
      else if (nodeIndex > 0) {
        newSelectedNodeId = parent.children[nodeIndex - 1].id;
      }
      // 3. If no siblings, select the parent (親ノード)
      else {
        newSelectedNodeId = parent.id;
      }
      
      // Delete the node
      parent.children = parent.children.filter(c => c.id !== nodeId);
      state.selectedNodeIds.delete(nodeId);
      
      // Select the new node
      if (newSelectedNodeId) {
        state.selectedNodeIds.clear();
        state.selectedNodeIds.add(newSelectedNodeId);
      }
      
      get().pushHistory();
    }),
    
    editNode: (nodeId, text) => set((state) => {
      if (!state.mapData) return;
      
      const node = findNodeById(state.mapData.root, nodeId);
      if (!node) return;
      
      node.text = text;
      node.modified = Date.now();
      
      get().pushHistory();
    }),
    
    moveNode: (nodeId, newParentId, index) => set((state) => {
      if (!state.mapData || nodeId === state.mapData.root.id) return;
      
      const oldParent = findParentNode(state.mapData.root, nodeId);
      const newParent = findNodeById(state.mapData.root, newParentId);
      
      if (!oldParent || !newParent || !oldParent.children) return;
      
      // Remove from old parent
      const nodeIndex = oldParent.children.findIndex(c => c.id === nodeId);
      if (nodeIndex === -1) return;
      
      const [node] = oldParent.children.splice(nodeIndex, 1);
      
      // Add to new parent
      if (!newParent.children) {
        newParent.children = [];
      }
      
      const insertIndex = index !== undefined ? index : newParent.children.length;
      newParent.children.splice(insertIndex, 0, node);
      
      get().pushHistory();
    }),
    
    // Folding
    toggleFolded: (nodeId) => set((state) => {
      if (!state.mapData) return;
      
      const node = findNodeById(state.mapData.root, nodeId);
      if (!node) return;
      
      node.folded = !node.folded;
    }),
    
    toggleChildrenFolded: (nodeId) => set((state) => {
      if (!state.mapData) return;
      
      const node = findNodeById(state.mapData.root, nodeId);
      if (!node || !node.children) return;
      
      const allFolded = node.children.every(c => c.folded);
      node.children.forEach(c => {
        c.folded = !allFolded;
      });
    }),
    
    foldAll: () => set((state) => {
      if (!state.mapData) return;
      
      const foldRecursive = (node: MindMapNode) => {
        if (node.children && node.children.length > 0) {
          node.folded = true;
          node.children.forEach(foldRecursive);
        }
      };
      
      foldRecursive(state.mapData.root);
    }),
    
    unfoldAll: () => set((state) => {
      if (!state.mapData) return;
      
      const unfoldRecursive = (node: MindMapNode) => {
        node.folded = false;
        node.children?.forEach(unfoldRecursive);
      };
      
      unfoldRecursive(state.mapData.root);
    }),
    
    // Styling
    setNodeColor: (nodeId, color) => set((state) => {
      if (!state.mapData) return;
      
      const node = findNodeById(state.mapData.root, nodeId);
      if (!node) return;
      
      node.color = color;
      get().pushHistory();
    }),
    
    setNodeBackgroundColor: (nodeId, color) => set((state) => {
      if (!state.mapData) return;
      
      const node = findNodeById(state.mapData.root, nodeId);
      if (!node) return;
      
      node.backgroundColor = color;
      get().pushHistory();
    }),
    
    setFont: (nodeId, font) => set((state) => {
      if (!state.mapData) return;
      
      const node = findNodeById(state.mapData.root, nodeId);
      if (!node) return;
      
      if (!node.font) {
        node.font = {};
      }
      
      Object.assign(node.font, font);
      get().pushHistory();
    }),
    
    setNodeStyle: (nodeId, style) => set((state) => {
      if (!state.mapData) return;
      
      const node = findNodeById(state.mapData.root, nodeId);
      if (!node) return;
      
      node.style = style;
      get().pushHistory();
    }),
    
    // Icons
    addIcon: (nodeId, iconName) => set((state) => {
      if (!state.mapData) return;
      
      const node = findNodeById(state.mapData.root, nodeId);
      if (!node) return;
      
      if (!node.icons) {
        node.icons = [];
      }
      
      // Don't add duplicate icons
      if (!node.icons.some(icon => icon.builtin === iconName)) {
        node.icons.push({ builtin: iconName });
      }
      
      get().pushHistory();
    }),
    
    removeIcon: (nodeId, iconName) => set((state) => {
      if (!state.mapData) return;
      
      const node = findNodeById(state.mapData.root, nodeId);
      if (!node || !node.icons) return;
      
      node.icons = node.icons.filter(icon => icon.builtin !== iconName);
      
      // Clean up empty array
      if (node.icons.length === 0) {
        delete node.icons;
      }
      
      get().pushHistory();
    }),
    
    clearIcons: (nodeId) => set((state) => {
      if (!state.mapData) return;
      
      const node = findNodeById(state.mapData.root, nodeId);
      if (!node) return;
      
      delete node.icons;
      get().pushHistory();
    }),
    
    // Links
    setLink: (nodeId, url) => set((state) => {
      if (!state.mapData) return;
      
      const node = findNodeById(state.mapData.root, nodeId);
      if (!node) return;
      
      node.link = url;
      get().pushHistory();
    }),
    
    removeLink: (nodeId) => set((state) => {
      if (!state.mapData) return;
      
      const node = findNodeById(state.mapData.root, nodeId);
      if (!node) return;
      
      delete node.link;
      get().pushHistory();
    }),
    
    // Arrow Links
    addArrowLink: (sourceId, targetId, arrowLink) => set((state) => {
      if (!state.mapData) return;
      
      const sourceNode = findNodeById(state.mapData.root, sourceId);
      if (!sourceNode) return;
      
      // Verify target node exists
      const targetNode = findNodeById(state.mapData.root, targetId);
      if (!targetNode) return;
      
      // Initialize arrowLinks array if not exists
      if (!sourceNode.arrowLinks) {
        sourceNode.arrowLinks = [];
      }
      
      // Create arrow link with defaults
      const newArrowLink: import('../types/mindmap').ArrowLinkInfo = {
        destination: targetId,
        color: arrowLink?.color || '#ff0000',
        startArrow: arrowLink?.startArrow || 'None',
        endArrow: arrowLink?.endArrow || 'Default',
        startInclination: arrowLink?.startInclination,
        endInclination: arrowLink?.endInclination,
      };
      
      sourceNode.arrowLinks.push(newArrowLink);
      get().pushHistory();
    }),
    
    removeArrowLink: (sourceId, targetId) => set((state) => {
      if (!state.mapData) return;
      
      const sourceNode = findNodeById(state.mapData.root, sourceId);
      if (!sourceNode || !sourceNode.arrowLinks) return;
      
      // Find and remove arrow link to target
      const index = sourceNode.arrowLinks.findIndex(link => link.destination === targetId);
      if (index >= 0) {
        sourceNode.arrowLinks.splice(index, 1);
        get().pushHistory();
      }
    }),
    
    updateArrowLink: (sourceId, targetId, arrowLink) => set((state) => {
      if (!state.mapData) return;
      
      const sourceNode = findNodeById(state.mapData.root, sourceId);
      if (!sourceNode || !sourceNode.arrowLinks) return;
      
      // Find and update arrow link
      const link = sourceNode.arrowLinks.find(link => link.destination === targetId);
      if (link) {
        if (arrowLink.color !== undefined) link.color = arrowLink.color;
        if (arrowLink.startArrow !== undefined) link.startArrow = arrowLink.startArrow;
        if (arrowLink.endArrow !== undefined) link.endArrow = arrowLink.endArrow;
        if (arrowLink.startInclination !== undefined) link.startInclination = arrowLink.startInclination;
        if (arrowLink.endInclination !== undefined) link.endInclination = arrowLink.endInclination;
        get().pushHistory();
      }
    }),
    
    // Cloud
    setCloud: (nodeId, color) => set((state) => {
      if (!state.mapData) return;
      
      const node = findNodeById(state.mapData.root, nodeId);
      if (!node) return;
      
      node.cloud = color ? { color } : {};
      get().pushHistory();
    }),
    
    removeCloud: (nodeId) => set((state) => {
      if (!state.mapData) return;
      
      const node = findNodeById(state.mapData.root, nodeId);
      if (!node) return;
      
      delete node.cloud;
      get().pushHistory();
    }),
    
    // Selection
    selectNode: (nodeId, addToSelection = false) => set((state) => {
      if (!addToSelection) {
        state.selectedNodeIds.clear();
      }
      state.selectedNodeIds.add(nodeId);
    }),
    
    deselectAll: () => set((state) => {
      state.selectedNodeIds.clear();
    }),
    
    // Clipboard
    cutNode: (nodeId) => set((state) => {
      if (!state.mapData || state.mapData.root.id === nodeId) return;
      
      const node = findNodeById(state.mapData.root, nodeId);
      if (!node) return;
      
      state.clipboard = cloneNode(node, true);
      get().deleteNode(nodeId);
    }),
    
    copyNode: (nodeId) => set((state) => {
      if (!state.mapData) return;
      
      const node = findNodeById(state.mapData.root, nodeId);
      if (!node) return;
      
      state.clipboard = cloneNode(node, true);
    }),
    
    pasteNode: (parentId) => set((state) => {
      if (!state.mapData || !state.clipboard) return;
      
      const parent = findNodeById(state.mapData.root, parentId);
      if (!parent) return;
      
      if (!parent.children) {
        parent.children = [];
      }
      
      const cloned = cloneNode(state.clipboard, true);
      parent.children.push(cloned);
      
      get().pushHistory();
    }),
    
    // History
    undo: () => set((state) => {
      if (state.historyIndex > 0) {
        state.historyIndex--;
        state.mapData = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
      }
    }),
    
    redo: () => set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        state.mapData = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
      }
    }),
    
    pushHistory: () => set((state) => {
      if (!state.mapData) return;
      
      // Remove any history after current index
      state.history = state.history.slice(0, state.historyIndex + 1);
      
      // Add new state
      state.history.push(JSON.parse(JSON.stringify(state.mapData)));
      
      // Limit history size
      if (state.history.length > state.maxHistorySize) {
        state.history.shift();
      } else {
        state.historyIndex++;
      }
    }),
    
    // View
    setZoom: (zoom) => set((state) => {
      state.zoom = Math.max(0.1, Math.min(5.0, zoom));
    }),
    
    setPan: (x, y) => set((state) => {
      state.panX = x;
      state.panY = y;
    }),
    
    resetView: () => set((state) => {
      state.zoom = 1.0;
      state.panX = 0;
      state.panY = 0;
    }),
    
    // Config
    setEditable: (editable) => set((state) => {
      state.editable = editable;
    }),
  };
}

/** Default store for single-map usage (no Provider / no initialMapData). Exported for FreeMindMap internal use. */
export const defaultStore = create<FreeMindState & FreeMindActions>()(immer(createFreeMindStoreSlice));

/**
 * Create a new store instance (internal use only; for multi-instance, use FreeMindMap with initialMapData).
 * Exported for FreeMindMap.tsx but not re-exported from index.ts.
 */
export function createFreeMindStore(): FreeMindStoreApi {
  return create<FreeMindState & FreeMindActions>()(immer(createFreeMindStoreSlice)) as unknown as FreeMindStoreApi;
}

/** Context for injecting a store so descendants use it instead of defaultStore */
export const FreeMindStoreContext = createContext<FreeMindStoreApi | null>(null);

/**
 * Hook to use the FreeMind store. Uses store from Context when inside a Provider (e.g. FreeMindMap with initialMapData), otherwise the default store.
 */
function useFreeMindStoreHook<T = FreeMindState & FreeMindActions>(
  selector?: (state: FreeMindState & FreeMindActions) => T
): T {
  const store = useContext(FreeMindStoreContext) ?? defaultStore;
  return useStore(store as FreeMindStoreApi, (selector ?? (s => s)) as (state: FreeMindState & FreeMindActions) => T);
}

export const useFreeMindStore = Object.assign(useFreeMindStoreHook, {
  getState: () => defaultStore.getState(),
});
