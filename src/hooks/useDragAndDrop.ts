/**
 * useDragAndDrop Hook
 * Custom hook for drag and drop functionality
 */

import { useState, useCallback } from 'react';

export interface DragState {
  isDragging: boolean;
  draggedNodeId: string | null;
  dropTargetNodeId: string | null;
  dropPosition: 'before' | 'after' | 'child' | null;
}

export function useDragAndDrop(
  onNodeMove: (draggedNodeId: string, targetNodeId: string, position: 'before' | 'after' | 'child') => void
) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedNodeId: null,
    dropTargetNodeId: null,
    dropPosition: null,
  });

  const handleDragStart = useCallback((e: React.DragEvent, nodeId: string) => {
    e.stopPropagation();
    
    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', nodeId);
    
    // Set drag state
    setDragState({
      isDragging: true,
      draggedNodeId: nodeId,
      dropTargetNodeId: null,
      dropPosition: null,
    });
    
    // Optional: Create custom drag image
    if (e.currentTarget instanceof HTMLElement) {
      const rect = e.currentTarget.getBoundingClientRect();
      e.dataTransfer.setDragImage(
        e.currentTarget,
        rect.width / 2,
        rect.height / 2
      );
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedNodeId = dragState.draggedNodeId;
    
    // Don't allow dropping on itself
    if (draggedNodeId === nodeId) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    
    e.dataTransfer.dropEffect = 'move';
    
    // Determine drop position based on mouse position
    const targetElement = e.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const height = rect.height;
    
    let position: 'before' | 'after' | 'child';
    
    // Divide the element into three zones
    if (mouseY < height * 0.25) {
      // Top quarter: insert before
      position = 'before';
    } else if (mouseY > height * 0.75) {
      // Bottom quarter: insert after
      position = 'after';
    } else {
      // Middle half: add as child
      position = 'child';
    }
    
    setDragState(prev => ({
      ...prev,
      dropTargetNodeId: nodeId,
      dropPosition: position,
    }));
  }, [dragState.draggedNodeId]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    
    // Clear drop target when leaving
    setDragState(prev => ({
      ...prev,
      dropTargetNodeId: null,
      dropPosition: null,
    }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedNodeId = e.dataTransfer.getData('text/plain');
    
    // Don't allow dropping on itself
    if (draggedNodeId === nodeId) {
      setDragState({
        isDragging: false,
        draggedNodeId: null,
        dropTargetNodeId: null,
        dropPosition: null,
      });
      return;
    }
    
    const position = dragState.dropPosition || 'child';
    
    // Perform the move
    onNodeMove(draggedNodeId, nodeId, position);
    
    // Reset drag state
    setDragState({
      isDragging: false,
      draggedNodeId: null,
      dropTargetNodeId: null,
      dropPosition: null,
    });
  }, [dragState.dropPosition, onNodeMove]);

  const handleDragEnd = useCallback(() => {
    // Reset drag state
    setDragState({
      isDragging: false,
      draggedNodeId: null,
      dropTargetNodeId: null,
      dropPosition: null,
    });
  }, []);

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}
