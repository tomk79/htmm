/**
 * FreeMind Web - Action Types
 * Based on FreeMind's action system (MindMapController actions)
 */

import type { MindMapNode, FontInfo, NodeStyle } from './mindmap';

export type ActionType =
  // Node operations
  | 'ADD_CHILD'
  | 'ADD_SIBLING'
  | 'ADD_SIBLING_BEFORE'
  | 'DELETE_NODE'
  | 'EDIT_NODE'
  | 'MOVE_NODE'
  | 'CUT_NODE'
  | 'COPY_NODE'
  | 'PASTE_NODE'
  
  // Folding
  | 'TOGGLE_FOLDED'
  | 'TOGGLE_CHILDREN_FOLDED'
  | 'FOLD_ALL'
  | 'UNFOLD_ALL'
  
  // Styling
  | 'SET_NODE_COLOR'
  | 'SET_NODE_BACKGROUND_COLOR'
  | 'SET_FONT'
  | 'SET_NODE_STYLE'
  | 'SET_EDGE_COLOR'
  | 'SET_EDGE_STYLE'
  | 'SET_EDGE_WIDTH'
  
  // Icons & Cloud
  | 'ADD_ICON'
  | 'REMOVE_ICON'
  | 'REMOVE_ALL_ICONS'
  | 'TOGGLE_CLOUD'
  | 'SET_CLOUD_COLOR'
  
  // Links
  | 'SET_LINK'
  | 'REMOVE_LINK'
  | 'ADD_ARROW_LINK'
  | 'REMOVE_ARROW_LINK'
  
  // Rich content
  | 'SET_RICH_CONTENT'
  | 'REMOVE_RICH_CONTENT'
  
  // Selection
  | 'SELECT_NODE'
  | 'SELECT_BRANCH'
  | 'DESELECT_ALL'
  
  // Map operations
  | 'LOAD_MAP'
  | 'NEW_MAP'
  | 'UNDO'
  | 'REDO';

/**
 * Base action interface
 */
export interface Action<T = any> {
  type: ActionType;
  payload?: T;
  meta?: {
    timestamp: number;
    undoable?: boolean;
  };
}

/**
 * Node operation actions
 */
export interface AddChildAction extends Action<{ parentId: string; node?: Partial<MindMapNode> }> {
  type: 'ADD_CHILD';
}

export interface AddSiblingAction extends Action<{ siblingId: string; before?: boolean }> {
  type: 'ADD_SIBLING' | 'ADD_SIBLING_BEFORE';
}

export interface DeleteNodeAction extends Action<{ nodeId: string }> {
  type: 'DELETE_NODE';
}

export interface EditNodeAction extends Action<{ nodeId: string; text: string }> {
  type: 'EDIT_NODE';
}

export interface MoveNodeAction extends Action<{ 
  nodeId: string; 
  newParentId: string; 
  index?: number;
}> {
  type: 'MOVE_NODE';
}

/**
 * Styling actions
 */
export interface SetNodeColorAction extends Action<{ nodeId: string; color: string }> {
  type: 'SET_NODE_COLOR';
}

export interface SetNodeBackgroundColorAction extends Action<{ nodeId: string; color: string }> {
  type: 'SET_NODE_BACKGROUND_COLOR';
}

export interface SetFontAction extends Action<{ nodeId: string; font: Partial<FontInfo> }> {
  type: 'SET_FONT';
}

export interface SetNodeStyleAction extends Action<{ nodeId: string; style: NodeStyle }> {
  type: 'SET_NODE_STYLE';
}

/**
 * Selection actions
 */
export interface SelectNodeAction extends Action<{ nodeId: string; addToSelection?: boolean }> {
  type: 'SELECT_NODE';
}

/**
 * Map-level actions
 */
export interface LoadMapAction extends Action<{ mapData: any }> {
  type: 'LOAD_MAP';
}

/**
 * Union type of all actions
 */
export type MindMapAction =
  | AddChildAction
  | AddSiblingAction
  | DeleteNodeAction
  | EditNodeAction
  | MoveNodeAction
  | SetNodeColorAction
  | SetNodeBackgroundColorAction
  | SetFontAction
  | SetNodeStyleAction
  | SelectNodeAction
  | LoadMapAction
  | Action;
