/**
 * NodeView Component
 * Renders individual mind map nodes with styling
 */

import React, { useRef, useEffect, useState } from 'react';

/** ノードのデフォルトスタイル（コンテナ継承を防ぐため明示） */
const NODE_DEFAULT_STYLE = {
  color: '#333',
  fontSize: 12,
  fontFamily: 'Arial, Helvetica, sans-serif',
  backgroundColor: '#fff',
} as const;
import type { LayoutNode } from '../types/mindmap';
import { useHtmmStore } from '../store/htmm-store';
import { hasChildren } from '../models/MindMapNode';
import { getIconEmoji } from '../utils/icons';
import { RichContentEditor } from './RichContentEditor';
import { sanitizeHtml } from '../utils/sanitize';

interface NodeViewProps {
  node: LayoutNode;
  isSelected: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: (text: string, cancelled?: boolean) => void;
  onRichContentUpdate?: (html: string) => void;
  // Drag and drop handlers
  onDragStart?: (e: React.DragEvent, nodeId: string) => void;
  onDragOver?: (e: React.DragEvent, nodeId: string) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, nodeId: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  dragState?: {
    isDragging: boolean;
    draggedNodeId: string | null;
    dropTargetNodeId: string | null;
    dropPosition: 'before' | 'after' | 'child' | null;
  };
}

export const NodeView: React.FC<NodeViewProps> = React.memo(({
  node,
  isSelected,
  isEditing,
  onStartEdit,
  onEndEdit,
  onRichContentUpdate,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  dragState,
}) => {
  const { selectNode, toggleFolded, editable, readOnly } = useHtmmStore();
  const inputRef = useRef<HTMLDivElement>(null);
  const cancelledRef = useRef<boolean>(false);
  const originalTextRef = useRef<string>('');
  const [editingRichContent, setEditingRichContent] = useState(false);
  
  // Determine if node has rich content (NODE type, not NOTE)
  const nodeRichContent = node.richContent?.find(rc => rc.type === 'NODE');
  const hasRichContent = Boolean(nodeRichContent?.html);
  
  useEffect(() => {
    if (isEditing && inputRef.current && !editingRichContent) {
      cancelledRef.current = false;
      // Save the original text before editing starts
      originalTextRef.current = node.text || '';
      inputRef.current.focus();
      // Select all text
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(inputRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
    } else if (!isEditing && inputRef.current) {
      // When editing ends, reset content to current node text
      inputRef.current.textContent = node.text || '';
      setEditingRichContent(false);
    }
  }, [isEditing, node.text, editingRichContent]);
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Handle link click with Ctrl/Cmd key
    if ((e.ctrlKey || e.metaKey) && node.link) {
      window.open(node.link, '_blank', 'noopener,noreferrer');
      return;
    }
    
    selectNode(node.id, e.ctrlKey || e.metaKey);
  };
  
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editable && !readOnly) {
      // If node has rich content, enable rich content editing
      if (hasRichContent) {
        setEditingRichContent(true);
      }
      onStartEdit();
    }
  };
  
  // Touch event handlers for mobile support
  const lastTouchRef = useRef<{ time: number; x: number; y: number } | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    // Check for double tap
    if (lastTouchRef.current) {
      const timeDiff = now - lastTouchRef.current.time;
      const distX = Math.abs(touch.clientX - lastTouchRef.current.x);
      const distY = Math.abs(touch.clientY - lastTouchRef.current.y);
      
      if (timeDiff < 300 && distX < 20 && distY < 20) {
        // Double tap detected - start editing
        if (editable && !readOnly) {
          if (hasRichContent) {
            setEditingRichContent(true);
          }
          onStartEdit();
        }
        lastTouchRef.current = null;
        return;
      }
    }
    
    lastTouchRef.current = {
      time: now,
      x: touch.clientX,
      y: touch.clientY,
    };
  };
  
  const handleTouchEnd = () => {
    // Single tap - select node
    if (lastTouchRef.current) {
      selectNode(node.id);
    }
  };
  
  const handleRichContentChange = (html: string) => {
    if (onRichContentUpdate) {
      onRichContentUpdate(html);
    }
  };
  
  const handleRichContentBlur = () => {
    // Rich content changes are applied in real-time
    // Just end editing mode
    setEditingRichContent(false);
    onEndEdit(node.text || '');
  };
  
  const handleFoldClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFolded(node.id);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (inputRef.current) {
        onEndEdit(inputRef.current.innerText ?? inputRef.current.textContent ?? '');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      // Set cancelled flag to prevent blur from saving
      cancelledRef.current = true;
      // Pass the original text to restore it
      onEndEdit(originalTextRef.current, true);
    } else if (e.key === 'Tab') {
      // Prevent tab from triggering global shortcut while editing
      e.preventDefault();
      e.stopPropagation();
    }
  };
  
  const handleBlur = () => {
    // Don't save if the edit was cancelled
    if (cancelledRef.current) {
      cancelledRef.current = false;
      return;
    }
    if (isEditing && inputRef.current) {
      onEndEdit(inputRef.current.innerText ?? inputRef.current.textContent ?? '');
    }
  };
  
  // Calculate style（デフォルトを明示し、コンテナのスタイル継承で見た目が変わらないようにする）
  const style: React.CSSProperties = {
    left: `${node.x - node.width / 2}px`,
    top: `${node.y - node.height / 2}px`,
    width: `${node.width}px`,
    height: `${node.height}px`,
    color: node.color ?? NODE_DEFAULT_STYLE.color,
    backgroundColor: node.backgroundColor ?? NODE_DEFAULT_STYLE.backgroundColor,
    fontSize: `${node.font?.size ?? NODE_DEFAULT_STYLE.fontSize}px`,
    fontFamily: node.font?.name ?? NODE_DEFAULT_STYLE.fontFamily,
    fontWeight: node.font?.bold ? 'bold' : 'normal',
    fontStyle: node.font?.italic ? 'italic' : 'normal',
    textDecoration: node.font?.strikethrough ? 'line-through' : 'none',
  };
  
  const nodeClass = `node-view 
    ${isSelected ? 'selected' : ''} 
    ${node.style || 'fork'}
    ${node.depth === 0 ? 'root' : ''}
    ${dragState?.draggedNodeId === node.id ? 'dragging' : ''}
    ${dragState?.dropTargetNodeId === node.id ? `drop-target drop-${dragState.dropPosition}` : ''}
  `.trim();
  
  const hasFoldableChildren = hasChildren(node);
  
  // Determine if this node can be dragged (not root node)
  const isDraggable = node.depth > 0 && editable && !readOnly;
  
  return (
    <div
      className={nodeClass}
      style={style}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      draggable={isDraggable}
      onDragStart={(e) => onDragStart?.(e, node.id)}
      onDragOver={(e) => onDragOver?.(e, node.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop?.(e, node.id)}
      onDragEnd={onDragEnd}
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={hasFoldableChildren ? !node.folded : undefined}
      aria-level={node.depth + 1}
      aria-label={`${node.text || 'Untitled node'}${node.folded ? ' (collapsed)' : ''}${node.link ? ' (has link)' : ''}`}
      tabIndex={0}
    >
      {/* Folding symbol */}
      {hasFoldableChildren && (
        <div
          className={`fold-symbol ${node.folded ? 'folded' : 'unfolded'}`}
          onClick={handleFoldClick}
          role="button"
          aria-label={node.folded ? 'Expand' : 'Collapse'}
          aria-pressed={!node.folded}
          tabIndex={-1}
        >
          {node.folded ? '▶' : '▼'}
        </div>
      )}
      
      {/* Icons */}
      {node.icons && node.icons.length > 0 && (
        <div className="node-icons" role="group" aria-label="Node icons">
          {node.icons.map((icon, index) => (
            <span 
              key={index} 
              className="node-icon" 
              title={icon.builtin}
              role="img"
              aria-label={`Icon: ${icon.builtin}`}
            >
              {getIconEmoji(icon.builtin)}
            </span>
          ))}
        </div>
      )}
      
      {/* Link indicator */}
      {node.link && (
        <span 
          className="node-link-indicator" 
          title={`Link: ${node.link}\nCtrl+Click to open`}
          role="img"
          aria-label={`Has link to ${node.link}`}
        >
          🔗
        </span>
      )}
      
      {/* Text/Rich content */}
      {isEditing && editingRichContent && hasRichContent ? (
        <div className="node-rich-content-editor">
          <RichContentEditor
            content={nodeRichContent?.html || ''}
            onChange={handleRichContentChange}
            onBlur={handleRichContentBlur}
            autoFocus={true}
          />
        </div>
      ) : hasRichContent ? (
        <div
          className="node-rich-content"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(nodeRichContent?.html || '') }}
          role="region"
          aria-label="Rich content"
        />
      ) : isEditing && !editingRichContent ? (
        <div
          ref={inputRef}
          className="node-text"
          contentEditable={true}
          suppressContentEditableWarning
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          role="textbox"
          aria-label="Node text"
          aria-readonly={false}
          aria-multiline="true"
        >
          {node.text || ''}
        </div>
      ) : (
        <div
          className="node-text"
          role="textbox"
          aria-label="Node text"
          aria-readonly={true}
          aria-multiline="true"
        >
          {(node.text || '').split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </div>
      )}
      
      {/* Cloud (optional) */}
      {node.cloud && (
        <div
          className="node-cloud"
          style={{ borderColor: node.cloud.color }}
        />
      )}
    </div>
  );
});
