/**
 * HtmmMap Component
 * Main component for rendering mind maps
 */

import React, { useEffect, useState, useCallback, useRef, useContext, forwardRef, useImperativeHandle } from 'react';
import { useHtmmStore, HtmmStoreContext, createHtmmStore } from '../store/htmm-store';
import { loadMindMapURL } from '../io/parser';
import { calculateLayout } from '../layout/layout-engine';
import { NodeView } from './NodeView';
import { EdgeView } from './EdgeView';
import { ArrowLinkView } from './ArrowLinkView';
import { MapToolbar } from './MapToolbar';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useViewportCulling, shouldEnableViewportCulling } from '../hooks/useViewportCulling';
import { useTouchGestures } from '../hooks/useTouchGestures';
import type { LayoutNode, MindMapData } from '../types/mindmap';
import { createRootNode } from '../models/MindMapNode';
import {
  findParentNode,
  findNodeById,
  getNextSiblingOrBelow,
  getPreviousSibling,
  getPreviousSiblingOrAbove,
  getFirstChild,
  getFirstChildByPosition,
  getNodeIndex,
  collectAllArrowLinks
} from '../models/MindMapNode';

/** Resolved appearance for rendering (always 'dark' or 'light'; 'auto' is resolved via prefers-color-scheme). */
export type HtmmAppearance = 'dark' | 'light' | 'auto';

interface HtmmMapInnerProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  /** When loading from src failed, this is set to the error message. */
  loadError?: string | null;
  /** Theme: dark, light, or auto (follow system). Default: auto. */
  appearance?: HtmmAppearance;
  /** Language code for the map container (e.g. en, ja). Default: en. */
  lang?: string;
}

const HtmmMapInner: React.FC<HtmmMapInnerProps> = ({
  width = '100%',
  height = '600px',
  className = '',
  loadError = null,
  appearance = 'auto',
  lang = 'en',
}) => {
  const store = useContext(HtmmStoreContext);

  // Resolve 'auto' to 'dark' or 'light' using prefers-color-scheme (when matchMedia is available)
  const [resolvedAppearance, setResolvedAppearance] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined' || appearance !== 'auto') return 'light';
    const mq = window.matchMedia?.( '(prefers-color-scheme: dark)' );
    return mq?.matches ? 'dark' : 'light';
  });
  useEffect(() => {
    if (appearance !== 'auto' || typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setResolvedAppearance(mq.matches ? 'dark' : 'light');
    handler(); // set initial
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [appearance]);
  const effectiveAppearance: 'dark' | 'light' = appearance === 'auto' ? resolvedAppearance : appearance;
  if (store === null) {
    throw new Error('HtmmMapInner must be rendered inside HtmmStoreContext.Provider.');
  }

  const {
    mapData,
    selectedNodeIds,
    selectNode,
    editNode,
    addChild,
    addSibling,
    deleteNode,
    moveNode,
    setNodePosition,
    toggleFolded,
    undo,
    redo,
    copyNode,
    cutNode,
    pasteNode,
    setFont,
    zoom,
    panX,
    panY,
    setZoom,
    setPan,
    resetView,
    readOnly,
  } = useHtmmStore();
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([]);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previousSelectedNodeIdRef = useRef<string | null>(null);
  const newlyAddedNodeIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ panX: number; panY: number; clientX: number; clientY: number } | null>(null);

  const SCROLL_INTO_VIEW_MARGIN = 24;
  const PAN_LIMIT_VISIBLE_PX = 20;

  // Drag and drop handler
  const handleNodeMove = useCallback((draggedNodeId: string, targetNodeId: string, position: 'before' | 'after' | 'child') => {
    if (!mapData) return;
    
    const draggedNode = findNodeById(mapData.root, draggedNodeId);
    const targetNode = findNodeById(mapData.root, targetNodeId);
    
    if (!draggedNode || !targetNode) return;
    
    // Don't allow moving a node into its own descendants
    let current = targetNode;
    while (current) {
      if (current.id === draggedNodeId) {
        return; // Invalid move
      }
      const parent = findParentNode(mapData.root, current.id);
      if (!parent) break;
      current = parent;
    }
    
    if (position === 'child') {
      // Move as child of target
      moveNode(draggedNodeId, targetNodeId);
    } else {
      // Move as sibling of target
      const targetParent = findParentNode(mapData.root, targetNodeId);
      if (!targetParent) return;
      
      const targetIndex = targetParent.children?.findIndex(c => c.id === targetNodeId) ?? -1;
      if (targetIndex < 0) return;
      
      const newIndex = position === 'before' ? targetIndex : targetIndex + 1;
      moveNode(draggedNodeId, targetParent.id, newIndex);
    }
  }, [mapData, moveNode]);
  
  // Initialize drag and drop hook
  const {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useDragAndDrop(handleNodeMove);
  
  // Recalculate layout when map data changes
  useEffect(() => {
    if (mapData) {
      const layout = calculateLayout(mapData.root);
      setLayoutNodes(layout);
    }
  }, [mapData]);

  // Pan bounds: from each edge node's edge, negative margin of (viewport size - PAN_LIMIT_VISIBLE_PX). At limit, only 20px of content visible.
  const getPanBounds = useCallback((contentWidth: number, contentHeight: number) => {
    if (layoutNodes.length === 0) {
      return { minPanX: -Infinity, maxPanX: Infinity, minPanY: -Infinity, maxPanY: Infinity };
    }
    let minLeft = Infinity, maxRight = -Infinity, minTop = Infinity, maxBottom = -Infinity;
    for (const n of layoutNodes) {
      const left = n.x - n.width / 2;
      const right = n.x + n.width / 2;
      const top = n.y - n.height / 2;
      const bottom = n.y + n.height / 2;
      minLeft = Math.min(minLeft, left);
      maxRight = Math.max(maxRight, right);
      minTop = Math.min(minTop, top);
      maxBottom = Math.max(maxBottom, bottom);
    }
    const cx = contentWidth / 2;
    const cy = contentHeight / 2;
    // Right/bottom limit: edge at 20px from viewport edge → smallest pan (minPanX/minPanY). Left/top limit: edge at (size-20) → largest pan (maxPanX/maxPanY).
    return {
      minPanX: PAN_LIMIT_VISIBLE_PX - cx - maxRight * zoom,
      maxPanX: (contentWidth - PAN_LIMIT_VISIBLE_PX) - cx - minLeft * zoom,
      minPanY: PAN_LIMIT_VISIBLE_PX - cy - maxBottom * zoom,
      maxPanY: (contentHeight - PAN_LIMIT_VISIBLE_PX) - cy - minTop * zoom,
    };
  }, [layoutNodes, zoom]);

  const clampPan = useCallback((panX: number, panY: number, contentWidth: number, contentHeight: number) => {
    const b = getPanBounds(contentWidth, contentHeight);
    return {
      panX: Math.max(b.minPanX, Math.min(b.maxPanX, panX)),
      panY: Math.max(b.minPanY, Math.min(b.maxPanY, panY)),
    };
  }, [getPanBounds]);

  // Keep pan within bounds when zoom or layout changes (e.g. after zoom in)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || layoutNodes.length === 0) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (cw <= 0 || ch <= 0) return;
    const state = store.getState();
    const clamped = clampPan(state.panX, state.panY, cw, ch);
    if (clamped.panX !== state.panX || clamped.panY !== state.panY) {
      state.setPan(clamped.panX, clamped.panY);
    }
  }, [layoutNodes, zoom, clampPan, store]);
  
  // Apply viewport culling for large maps (optimization)
  const enableCulling = shouldEnableViewportCulling(layoutNodes.length);
  const visibleNodes = useViewportCulling(
    layoutNodes,
    width,
    height,
    zoom,
    panX,
    panY
  );

  // Touch gestures: pan and pinch zoom (mobile) — pan clamped to bounds
  const { handlers: touchHandlers } = useTouchGestures({
    initialScale: zoom,
    minScale: 0.25,
    maxScale: 4,
    onPan: (deltaX, deltaY) => {
      const state = store.getState();
      const el = containerRef.current;
      const cw = el?.clientWidth ?? 0;
      const ch = el?.clientHeight ?? 0;
      const proposedX = state.panX + deltaX;
      const proposedY = state.panY + deltaY;
      const clamped = cw > 0 && ch > 0 ? clampPan(proposedX, proposedY, cw, ch) : { panX: proposedX, panY: proposedY };
      state.setPan(clamped.panX, clamped.panY);
    },
    onPinch: (scale) => {
      setZoom(scale);
    },
  });

  const handleZoomIn = useCallback(() => {
    setZoom(Math.min(zoom * 1.25, 4));
  }, [zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(Math.max(zoom / 1.25, 0.25));
  }, [zoom, setZoom]);

  // Wheel scroll (pan) — clamp to pan bounds; when at limit, do not preventDefault so browser can scroll
  useEffect(() => {
    if (!mapData) return;
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const state = store.getState();
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw <= 0 || ch <= 0) return;
      const proposedX = state.panX - e.deltaX;
      const proposedY = state.panY - e.deltaY;
      const clamped = clampPan(proposedX, proposedY, cw, ch);
      const atLimit = clamped.panX !== proposedX || clamped.panY !== proposedY;
      if (atLimit) {
        // At pan limit and user scrolled further — let the browser handle it (e.g. page scroll)
        return;
      }
      e.preventDefault();
      state.setPan(clamped.panX, clamped.panY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [mapData, clampPan, store]);

  // Mouse drag to pan (when dragging on canvas background, not on a node)
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || e.target !== e.currentTarget) return;
    const state = store.getState();
    panStartRef.current = {
      panX: state.panX,
      panY: state.panY,
      clientX: e.clientX,
      clientY: e.clientY,
    };
  }, [store]);

  // Window-level mouse move/up for pan drag (so pan continues when cursor leaves the map)
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const start = panStartRef.current;
      if (!start) return;
      e.preventDefault();
      document.body.style.cursor = 'grabbing';
      const el = containerRef.current;
      const cw = el?.clientWidth ?? 0;
      const ch = el?.clientHeight ?? 0;
      const proposedX = start.panX + (e.clientX - start.clientX);
      const proposedY = start.panY + (e.clientY - start.clientY);
      const clamped = cw > 0 && ch > 0 ? clampPan(proposedX, proposedY, cw, ch) : { panX: proposedX, panY: proposedY };
      store.getState().setPan(clamped.panX, clamped.panY);
    };
    const onMouseUp = () => {
      if (panStartRef.current) document.body.style.cursor = '';
      panStartRef.current = null;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [store, clampPan]);
  
  // Use visible nodes only if culling is enabled, otherwise use all nodes
  const nodesToRender = enableCulling ? visibleNodes : layoutNodes;
  
  const handleStartEdit = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
    // Clear the newly added node flag when starting to edit
    if (newlyAddedNodeIdRef.current !== nodeId) {
      newlyAddedNodeIdRef.current = null;
    }
  }, []);
  
  const handleEndEdit = useCallback((nodeId: string, text: string, cancelled = false) => {
    // If cancelled and this is a newly added node, delete it and restore previous selection
    if (cancelled && newlyAddedNodeIdRef.current === nodeId) {
      deleteNode(nodeId);
      // Restore previous selection if it exists
      if (previousSelectedNodeIdRef.current) {
        selectNode(previousSelectedNodeIdRef.current);
      }
      previousSelectedNodeIdRef.current = null;
      newlyAddedNodeIdRef.current = null;
    } else if (cancelled) {
      // Cancelled but not a newly added node - don't update text, just keep the node selected
      // The UI will automatically revert to the original text when editing ends
      selectNode(nodeId);
    } else {
      // Update the node text
      editNode(nodeId, text);
      // Keep the edited node selected
      selectNode(nodeId);
      newlyAddedNodeIdRef.current = null;
    }
    // Exit edit mode
    setEditingNodeId(null);
  }, [editNode, selectNode, deleteNode]);
  
  // Keyboard shortcut handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if focus is inside the code-edit modal (textarea etc.)
    if (e.target instanceof Element && e.target.closest('.htmm-map-code-modal-overlay')) return;
    // Skip if editing
    if (editingNodeId) return;
    
    // Skip if no map data
    if (!mapData) return;
    
    // Get selected node
    const selectedId = Array.from(selectedNodeIds)[0];
    
    // Check for modifier keys
    const isMod = e.ctrlKey || e.metaKey;
    
    // Handle arrow keys navigation (without modifier)
    if (!isMod && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      if (!selectedId) return;
      
      e.preventDefault();
      let nextNode = null;
      
      if (e.key === 'ArrowUp') {
        // Navigate to previous sibling, or cross to previous branch's last descendant at same depth
        nextNode = getPreviousSiblingOrAbove(mapData.root, selectedId);
      } else if (e.key === 'ArrowDown') {
        // Navigate to next sibling, or cross to next branch's first descendant at same depth
        nextNode = getNextSiblingOrBelow(mapData.root, selectedId);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        // Get the current node and its layout info
        const currentNode = findNodeById(mapData.root, selectedId);
        const currentLayoutNode = layoutNodes.find(node => node.id === selectedId);
        
        if (!currentNode || !currentLayoutNode) return;
        
        const isRightKey = e.key === 'ArrowRight';
        const isLeftKey = e.key === 'ArrowLeft';
        
        // Special handling for root node
        if (selectedId === mapData.root.id) {
          if (isRightKey) {
            // Right key: select first child on the right side
            nextNode = getFirstChildByPosition(currentNode, 'right');
          } else {
            // Left key: select first child on the left side
            nextNode = getFirstChildByPosition(currentNode, 'left');
          }
        } else {
          // For non-root nodes, consider the side (left/right/center)
          const side = currentLayoutNode.side;
          
          if (side === 'left') {
            // For nodes on the left side, reverse the logic
            if (isLeftKey) {
              // Left key: navigate to first child
              nextNode = getFirstChild(currentNode);
            } else {
              // Right key: navigate to parent
              nextNode = findParentNode(mapData.root, selectedId);
            }
          } else {
            // For nodes on the right side or center, use default logic
            if (isRightKey) {
              // Right key: navigate to first child
              nextNode = getFirstChild(currentNode);
            } else {
              // Left key: navigate to parent
              nextNode = findParentNode(mapData.root, selectedId);
            }
          }
        }
      }
      
      if (nextNode) {
        selectNode(nextNode.id);
      }
      return;
    }
    
    // Handle Ctrl/Cmd + arrow keys for moving nodes
    if (isMod && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      if (readOnly || !selectedId || selectedId === mapData.root.id) return;
      
      e.preventDefault();
      
      if (e.key === 'ArrowUp') {
        // Move node up among siblings
        const parent = findParentNode(mapData.root, selectedId);
        if (parent && parent.children) {
          const currentNode = findNodeById(mapData.root, selectedId);
          if (!currentNode) return;
          
          // If parent is root, filter siblings by position (left/right)
          const isRootChild = parent.id === mapData.root.id;
          const siblings = isRootChild && currentNode.position
            ? parent.children.filter(child => child.position === currentNode.position)
            : parent.children;
          
          const currentIndex = siblings.findIndex(child => child.id === selectedId);
          if (currentIndex > 0) {
            // Calculate the new index in the full children array
            const targetSibling = siblings[currentIndex - 1];
            const newIndex = parent.children.findIndex(child => child.id === targetSibling.id);
            moveNode(selectedId, parent.id, newIndex);
          }
        }
      } else if (e.key === 'ArrowDown') {
        // Move node down among siblings
        const parent = findParentNode(mapData.root, selectedId);
        if (parent && parent.children) {
          const currentNode = findNodeById(mapData.root, selectedId);
          if (!currentNode) return;
          
          // If parent is root, filter siblings by position (left/right)
          const isRootChild = parent.id === mapData.root.id;
          const siblings = isRootChild && currentNode.position
            ? parent.children.filter(child => child.position === currentNode.position)
            : parent.children;
          
          const currentIndex = siblings.findIndex(child => child.id === selectedId);
          if (currentIndex >= 0 && currentIndex < siblings.length - 1) {
            // Calculate the new index in the full children array
            const targetSibling = siblings[currentIndex + 1];
            const newIndex = parent.children.findIndex(child => child.id === targetSibling.id);
            moveNode(selectedId, parent.id, newIndex);
          }
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Get the current node (use mapData for position to avoid stale layoutNodes after setNodePosition)
        const currentNode = findNodeById(mapData.root, selectedId);
        const currentLayoutNode = layoutNodes.find(node => node.id === selectedId);
        if (!currentNode || !currentLayoutNode) return;
        
        const isRightKey = e.key === 'ArrowRight';
        const isLeftKey = e.key === 'ArrowLeft';
        const parent = findParentNode(mapData.root, selectedId);
        // Use position from mapData for root's children so it's correct right after setNodePosition (layoutNodes can be stale)
        const side = parent?.id === mapData.root.id
          ? (currentNode.position === 'left' ? 'left' : 'right')
          : currentLayoutNode.side;
        
        // For root's direct children: Ctrl+← move to left, Ctrl+→ move to right
        if (parent?.id === mapData.root.id) {
          const onLeft = currentNode.position === 'left';
          if (isLeftKey && !onLeft) {
            setNodePosition(selectedId, 'left');
            return;
          }
          if (isRightKey && onLeft) {
            setNodePosition(selectedId, 'right');
            return;
          }
        }
        
        // Determine the action based on side (reverse for left side)
        let moveToHigherLevel = false;
        let moveToLowerLevel = false;
        
        if (side === 'left') {
          // For nodes on the left side, reverse the logic
          moveToHigherLevel = isRightKey;
          moveToLowerLevel = isLeftKey;
        } else {
          // For nodes on the right side or center, use default logic
          moveToHigherLevel = isLeftKey;
          moveToLowerLevel = isRightKey;
        }
        
        if (moveToHigherLevel) {
          // Move node to higher level (make it sibling of parent)
          const parent = findParentNode(mapData.root, selectedId);
          if (parent && parent.id !== mapData.root.id) {
            const grandParent = findParentNode(mapData.root, parent.id);
            if (grandParent) {
              const parentIndex = getNodeIndex(mapData.root, parent.id);
              moveNode(selectedId, grandParent.id, parentIndex + 1);
            }
          }
        } else if (moveToLowerLevel) {
          // Move node to lower level (make it child of previous sibling)
          const prevSibling = getPreviousSibling(mapData.root, selectedId);
          if (prevSibling) {
            moveNode(selectedId, prevSibling.id);
          }
        }
      }
      return;
    }
    
    // Handle shortcuts
    if (e.key === 'Tab') {
      if (!readOnly) {
        e.preventDefault();
        // Save the currently selected node before adding a new node
        previousSelectedNodeIdRef.current = selectedId || mapData.root.id;
        const newNodeId = selectedId ? addChild(selectedId, '') : addChild(mapData.root.id, '');
        // Start editing the new node
        if (newNodeId) {
          newlyAddedNodeIdRef.current = newNodeId;
          setEditingNodeId(newNodeId);
        }
      }
    } else if (e.key === 'Enter') {
      if (!readOnly) {
        e.preventDefault();
        if (isMod) {
          // Ctrl/Cmd + Enter: Start editing selected node
          if (selectedId) {
            setEditingNodeId(selectedId);
          }
        } else if (selectedId && selectedId !== mapData.root.id) {
          // Save the currently selected node before adding a new node
          previousSelectedNodeIdRef.current = selectedId;
          const newNodeId = addSibling(selectedId, e.shiftKey);
          // Start editing the new node
          if (newNodeId) {
            newlyAddedNodeIdRef.current = newNodeId;
            setEditingNodeId(newNodeId);
          }
        }
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!readOnly && selectedId && selectedId !== mapData.root.id) {
        e.preventDefault();
        deleteNode(selectedId);
      }
    } else if (e.key === ' ') {
      e.preventDefault();
      if (selectedId) {
        toggleFolded(selectedId);
      }
    } else if (isMod && e.key === 'z') {
      if (!readOnly) {
        e.preventDefault();
        undo();
      }
    } else if (isMod && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      if (!readOnly) {
        e.preventDefault();
        redo();
      }
    } else if (isMod && e.key === 'c') {
      e.preventDefault();
      if (selectedId) {
        copyNode(selectedId);
      }
    } else if (isMod && e.key === 'x') {
      if (!readOnly) {
        e.preventDefault();
        if (selectedId && selectedId !== mapData.root.id) {
          cutNode(selectedId);
        }
      }
    } else if (isMod && e.key === 'v') {
      if (!readOnly) {
        e.preventDefault();
        if (selectedId) {
          pasteNode(selectedId);
        }
      }
    } else if (isMod && e.key === 'b') {
      if (!readOnly) {
        e.preventDefault();
        if (selectedId) {
          const node = findNodeById(mapData.root, selectedId);
          if (node) {
            const currentBold = node.font?.bold || false;
            setFont(selectedId, { bold: !currentBold });
          }
        }
      }
    } else if (isMod && e.key === 'i') {
      if (!readOnly) {
        e.preventDefault();
        if (selectedId) {
          const node = findNodeById(mapData.root, selectedId);
          if (node) {
            const currentItalic = node.font?.italic || false;
            setFont(selectedId, { italic: !currentItalic });
          }
        }
      }
    }
  }, [editingNodeId, mapData, selectedNodeIds, selectNode, addChild, addSibling, deleteNode, moveNode, setNodePosition, toggleFolded, undo, redo, copyNode, cutNode, pasteNode, setFont, readOnly]);
  
  // Setup keyboard event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // Focus container on mount and when selection changes
  useEffect(() => {
    if (containerRef.current && selectedNodeIds.size > 0) {
      containerRef.current.focus();
    }
  }, [selectedNodeIds]);

  // Scroll selected node into view when selection changes (e.g. keyboard navigation)
  useEffect(() => {
    if (editingNodeId || layoutNodes.length === 0) return;
    const selectedId = Array.from(selectedNodeIds)[0];
    if (!selectedId) return;
    const layoutNode = layoutNodes.find(n => n.id === selectedId);
    if (!layoutNode) return;
    const el = containerRef.current;
    if (!el) return;
    /* clientWidth/Height are the content box (inside padding) */
    const contentWidth = el.clientWidth;
    const contentHeight = el.clientHeight;
    if (contentWidth <= 0 || contentHeight <= 0) return;
    const state = store.getState();
    const { panX: currentPanX, panY: currentPanY, zoom: currentZoom } = state;
    const cx = contentWidth / 2;
    const cy = contentHeight / 2;
    const nodeLeft = cx + currentPanX + (layoutNode.x - layoutNode.width / 2) * currentZoom;
    const nodeTop = cy + currentPanY + (layoutNode.y - layoutNode.height / 2) * currentZoom;
    const nodeRight = nodeLeft + layoutNode.width * currentZoom;
    const nodeBottom = nodeTop + layoutNode.height * currentZoom;
    const m = SCROLL_INTO_VIEW_MARGIN;
    const visibleLeft = m;
    const visibleTop = m;
    const visibleRight = contentWidth - m;
    const visibleBottom = contentHeight - m;
    let desiredPanX = currentPanX;
    let desiredPanY = currentPanY;
    if (nodeLeft < visibleLeft) desiredPanX = visibleLeft - cx - (layoutNode.x - layoutNode.width / 2) * currentZoom;
    if (nodeRight > visibleRight) desiredPanX = visibleRight - cx - (layoutNode.x + layoutNode.width / 2) * currentZoom;
    if (nodeTop < visibleTop) desiredPanY = visibleTop - cy - (layoutNode.y - layoutNode.height / 2) * currentZoom;
    if (nodeBottom > visibleBottom) desiredPanY = visibleBottom - cy - (layoutNode.y + layoutNode.height / 2) * currentZoom;
    const clamped = clampPan(desiredPanX, desiredPanY, contentWidth, contentHeight);
    if (clamped.panX !== currentPanX || clamped.panY !== currentPanY) {
      setPan(clamped.panX, clamped.panY);
    }
  }, [selectedNodeIds, layoutNodes, editingNodeId, setPan, clampPan]);

  // Attach touch move with passive: false so we can preventDefault (stops page scroll during pan/pinch).
  // Must be declared before any early return so hook order is consistent every render (React rules of hooks).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      touchHandlers.onTouchMove(e as unknown as React.TouchEvent);
      if (e.touches.length === 1 || e.touches.length === 2) e.preventDefault();
    };
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, [touchHandlers.onTouchMove]);
  
  if (!mapData) {
    return (
      <div className="htmm-map-empty" style={{ width, height }}>
        <p>{loadError ?? 'Loading…'}</p>
      </div>
    );
  }
  
  // Build edge list (parent -> child connections)
  const edges: { source: LayoutNode; target: LayoutNode }[] = [];
  for (const node of layoutNodes) {
    const parent = findParentNode(mapData.root, node.id);
    if (parent) {
      const parentLayout = layoutNodes.find(n => n.id === parent.id);
      if (parentLayout) {
        edges.push({
          source: parentLayout,
          target: node as LayoutNode,
        });
      }
    }
  }
  
  // Collect all arrow links
  const arrowLinks = collectAllArrowLinks(mapData.root);
  const validArrowLinks = arrowLinks
    .map(({ sourceId, targetId, arrowLink }) => {
      const sourceLayout = layoutNodes.find(n => n.id === sourceId);
      const targetLayout = layoutNodes.find(n => n.id === targetId);
      if (sourceLayout && targetLayout) {
        return { sourceLayout, targetLayout, arrowLink };
      }
      return null;
    })
    .filter((link): link is { sourceLayout: LayoutNode; targetLayout: LayoutNode; arrowLink: import('../types/mindmap').ArrowLinkInfo } => link !== null);
  
  // Calculate viewport bounds and zoom/pan transform
  const viewportStyle: React.CSSProperties = {
    width,
    height,
  };

  const mapClassName = [
    'htmm-map',
    className,
    isFullscreen ? 'htmm-map-fullscreen' : '',
  ].filter(Boolean).join(' ');

  const canvasStyle: React.CSSProperties = {
    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
    transformOrigin: '50% 50%',
  };
  
  const mapTitle = mapData?.root.text || 'Mind Map';

  return (
    <div 
      ref={containerRef}
      className={mapClassName}
      style={viewportStyle}
      role="tree"
      aria-label={`Mind map: ${mapTitle}`}
      aria-multiselectable="true"
      tabIndex={0}
      data-appearance={effectiveAppearance}
      lang={lang}
      onTouchStart={touchHandlers.onTouchStart}
      onTouchEnd={touchHandlers.onTouchEnd}
      onTouchCancel={touchHandlers.onTouchCancel}
    >
      <MapToolbar
        isFullscreen={isFullscreen}
        onFullscreenToggle={() => setIsFullscreen((b) => !b)}
        readOnly={readOnly}
      />
      <div className="htmm-map-body">
        <div
          ref={canvasRef}
          className="htmm-canvas"
        style={canvasStyle}
        aria-live="polite"
        aria-atomic="false"
        onMouseDown={handleCanvasMouseDown}
      >
        {/* SVG layer for edges and arrow links */}
        <svg className="edges-layer" aria-hidden="true">
          {edges.map((edge, index) => (
            <EdgeView
              key={`edge-${index}`}
              source={edge.source}
              target={edge.target}
              color={edge.target.edge?.color}
              style={edge.target.edge?.style}
              width={edge.target.edge?.width ? parseInt(edge.target.edge.width) : 1}
            />
          ))}
          {validArrowLinks.map(({ sourceLayout, targetLayout, arrowLink }, index) => (
            <ArrowLinkView
              key={`arrow-link-${index}`}
              sourceNode={sourceLayout}
              targetNode={targetLayout}
              arrowLink={arrowLink}
            />
          ))}
        </svg>
        
        {/* HTML layer for nodes */}
        <div className="nodes-layer" role="group" aria-label="Mind map nodes">
          {nodesToRender.map((node) => (
            <NodeView
              key={node.id}
              node={node}
              isSelected={selectedNodeIds.has(node.id)}
              isEditing={editingNodeId === node.id}
              onStartEdit={() => handleStartEdit(node.id)}
              onEndEdit={(text, cancelled) => handleEndEdit(node.id, text, cancelled)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              dragState={dragState}
            />
          ))}
        </div>
        </div>
        <div
          className="htmm-map-zoom-controls"
          aria-label="Zoom controls"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <button type="button" onClick={handleZoomIn} aria-label="Zoom in" title="Zoom in">+</button>
          <button type="button" onClick={handleZoomOut} aria-label="Zoom out" title="Zoom out">−</button>
          <button type="button" onClick={resetView} aria-label="Reset view" title="Reset view">⌂</button>
        </div>
      </div>
    </div>
  );
};

function createEmptyMapData(): MindMapData {
  return {
    version: '1.0.1',
    root: createRootNode('New Mind Map'),
  };
}

export interface HtmmMapHandle {
  loadMap: (data: MindMapData) => void;
  getMapData: () => MindMapData | null;
}

export interface HtmmMapProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  /** URL to a .mm file to load. When provided, the map is loaded from this URL. */
  src?: string;
  /** Initial map data (used when src is not provided). When neither src nor initialMapData is set, an empty map is created. */
  initialMapData?: MindMapData;
  /** When true, node edit operations (add/change/delete/reorder/paste) are disabled; folding is allowed. */
  readOnly?: boolean;
  /** Theme: dark, light, or auto (follow system). Default: auto. */
  appearance?: HtmmAppearance;
  /** Language code for the map container (e.g. en, ja). Default: en. */
  lang?: string;
  /** Optional children (e.g. toolbar). Rendered inside the same store Provider so they can use useHtmmStore(). */
  children?: React.ReactNode;
}

export const HtmmMap = forwardRef<HtmmMapHandle, HtmmMapProps>(function HtmmMap({
  width = '100%',
  height = '600px',
  className = '',
  src,
  initialMapData,
  readOnly = false,
  appearance = 'auto',
  lang = 'en',
  children,
}, ref) {
  const storeRef = useRef<ReturnType<typeof createHtmmStore> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createHtmmStore({ readOnly });
  }
  const internalStore = storeRef.current;

  const [loadError, setLoadError] = useState<string | null>(null);

  // Initial data: src > initialMapData > empty map
  useEffect(() => {
    if (src) {
      setLoadError(null);
      loadMindMapURL(src).then((data) => {
        internalStore.getState().loadMap(data);
      });
      return;
    }
    if (initialMapData != null) {
      internalStore.getState().loadMap(initialMapData);
      setLoadError(null);
      return;
    }
    internalStore.getState().loadMap(createEmptyMapData());
    setLoadError(null);
  }, [src, initialMapData, internalStore]);

  useImperativeHandle(ref, () => ({
    loadMap: (data: MindMapData) => {
      internalStore.getState().loadMap(data);
    },
    getMapData: () => internalStore.getState().mapData,
  }), [internalStore]);

  const inner = (
    <HtmmMapInner
      width={width}
      height={height}
      className={className}
      loadError={loadError}
      appearance={appearance}
      lang={lang}
    />
  );

  return (
    <HtmmStoreContext.Provider value={internalStore}>
      {children}
      {inner}
    </HtmmStoreContext.Provider>
  );
});
