/**
 * Custom Hooks for FreeMind Web
 * Reusable hooks for common operations
 */

import { useCallback, useMemo } from 'react';
import { useHtmmStore } from '../store/htmm-store';
import type { MindMapNode } from '../types/mindmap';
import { findNodeById } from '../models/MindMapNode';

/**
 * Hook for managing node selection
 */
export function useNodeSelection() {
  const { selectedNodeIds, selectNode, deselectAll, mapData } = useHtmmStore(
    (state) => ({
      selectedNodeIds: state.selectedNodeIds,
      selectNode: state.selectNode,
      deselectAll: state.deselectAll,
      mapData: state.mapData,
    })
  );

  const selectedNodes = useMemo(() => {
    if (!mapData) return [];
    return Array.from(selectedNodeIds)
      .map((id) => findNodeById(mapData.root, id))
      .filter((node): node is MindMapNode => node !== null);
  }, [mapData, selectedNodeIds]);

  const isSelected = useCallback(
    (nodeId: string) => selectedNodeIds.has(nodeId),
    [selectedNodeIds]
  );

  const selectSingle = useCallback(
    (nodeId: string) => selectNode(nodeId, false),
    [selectNode]
  );

  const toggleSelection = useCallback(
    (nodeId: string) => {
      if (selectedNodeIds.has(nodeId)) {
        deselectAll();
      } else {
        selectNode(nodeId, true);
      }
    },
    [selectedNodeIds, selectNode, deselectAll]
  );

  return {
    selectedNodeIds,
    selectedNodes,
    isSelected,
    selectNode,
    selectSingle,
    toggleSelection,
    deselectAll,
  };
}

/**
 * Hook for clipboard operations
 */
export function useClipboard() {
  const { clipboard, cutNode, copyNode, pasteNode } = useHtmmStore(
    (state) => ({
      clipboard: state.clipboard,
      cutNode: state.cutNode,
      copyNode: state.copyNode,
      pasteNode: state.pasteNode,
    })
  );

  const hasClipboard = clipboard !== null;

  const cut = useCallback(
    (nodeId: string) => {
      cutNode(nodeId);
    },
    [cutNode]
  );

  const copy = useCallback(
    (nodeId: string) => {
      copyNode(nodeId);
    },
    [copyNode]
  );

  const paste = useCallback(
    (parentId: string) => {
      if (hasClipboard) {
        pasteNode(parentId);
      }
    },
    [hasClipboard, pasteNode]
  );

  return {
    clipboard,
    hasClipboard,
    cut,
    copy,
    paste,
  };
}

/**
 * Hook for history operations (undo/redo)
 */
export function useHistory() {
  const { history, historyIndex, undo, redo } = useHtmmStore(
    (state) => ({
      history: state.history,
      historyIndex: state.historyIndex,
      undo: state.undo,
      redo: state.redo,
    })
  );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    canUndo,
    canRedo,
    undo,
    redo,
  };
}

/**
 * Hook for node operations
 */
export function useNodeOperations() {
  const {
    addChild,
    addSibling,
    deleteNode,
    editNode,
    moveNode,
    toggleFolded,
  } = useHtmmStore((state) => ({
    addChild: state.addChild,
    addSibling: state.addSibling,
    deleteNode: state.deleteNode,
    editNode: state.editNode,
    moveNode: state.moveNode,
    toggleFolded: state.toggleFolded,
  }));

  return {
    addChild,
    addSibling,
    deleteNode,
    editNode,
    moveNode,
    toggleFolded,
  };
}

/**
 * Hook for node styling operations
 */
export function useNodeStyling() {
  const {
    setNodeColor,
    setNodeBackgroundColor,
    setFont,
    setNodeStyle,
    addIcon,
    removeIcon,
    clearIcons,
    setLink,
    removeLink,
    setCloud,
    removeCloud,
  } = useHtmmStore((state) => ({
    setNodeColor: state.setNodeColor,
    setNodeBackgroundColor: state.setNodeBackgroundColor,
    setFont: state.setFont,
    setNodeStyle: state.setNodeStyle,
    addIcon: state.addIcon,
    removeIcon: state.removeIcon,
    clearIcons: state.clearIcons,
    setLink: state.setLink,
    removeLink: state.removeLink,
    setCloud: state.setCloud,
    removeCloud: state.removeCloud,
  }));

  return {
    setNodeColor,
    setNodeBackgroundColor,
    setFont,
    setNodeStyle,
    addIcon,
    removeIcon,
    clearIcons,
    setLink,
    removeLink,
    setCloud,
    removeCloud,
  };
}

/**
 * Hook for view operations
 */
export function useView() {
  const { zoom, panX, panY, setZoom, setPan, resetView } = useHtmmStore(
    (state) => ({
      zoom: state.zoom,
      panX: state.panX,
      panY: state.panY,
      setZoom: state.setZoom,
      setPan: state.setPan,
      resetView: state.resetView,
    })
  );

  const zoomIn = useCallback(() => {
    setZoom(Math.min(zoom * 1.2, 3));
  }, [zoom, setZoom]);

  const zoomOut = useCallback(() => {
    setZoom(Math.max(zoom / 1.2, 0.3));
  }, [zoom, setZoom]);

  return {
    zoom,
    panX,
    panY,
    setZoom,
    setPan,
    zoomIn,
    zoomOut,
    resetView,
  };
}

/**
 * Hook for getting a specific node
 */
export function useNode(nodeId: string | null) {
  const mapData = useHtmmStore((state) => state.mapData);

  const node = useMemo(() => {
    if (!mapData || !nodeId) return null;
    return findNodeById(mapData.root, nodeId);
  }, [mapData, nodeId]);

  return node;
}

/**
 * Hook for map data access
 */
export function useMapData() {
  const { mapData, loadMap, newMap } = useHtmmStore((state) => ({
    mapData: state.mapData,
    loadMap: state.loadMap,
    newMap: state.newMap,
  }));

  return {
    mapData,
    loadMap,
    newMap,
  };
}
