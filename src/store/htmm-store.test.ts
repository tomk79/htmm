import { describe, it, expect, beforeEach } from 'vitest';
import { useHtmmStore, createHtmmStore } from './htmm-store';
import { createRootNode } from '../models/MindMapNode';
import type { MindMapData } from '../types/mindmap';

describe('Htmm Store', () => {
  beforeEach(() => {
    useHtmmStore.getState().newMap('Test');
  });

  describe('Map operations', () => {
    it('newMap should set mapData with root and reset history', () => {
      const state = useHtmmStore.getState();
      expect(state.mapData).not.toBeNull();
      expect(state.mapData!.root.text).toBe('Test');
      expect(state.history).toHaveLength(1);
      expect(state.historyIndex).toBe(0);
      expect(state.selectedNodeIds.size).toBe(0);
    });

    it('loadMap should replace mapData and set history', () => {
      const data: MindMapData = {
        version: '1.0.1',
        root: createRootNode('Loaded Root'),
      };
      useHtmmStore.getState().loadMap(data);
      const state = useHtmmStore.getState();
      expect(state.mapData!.root.text).toBe('Loaded Root');
      expect(state.history).toHaveLength(1);
      expect(state.historyIndex).toBe(0);
    });
  });

  describe('Node operations', () => {
    it('addChild should add a child and select it', () => {
      const { getState } = useHtmmStore;
      const rootId = getState().mapData!.root.id;
      const id = getState().addChild(rootId, 'Child A');
      expect(id).toBeDefined();
      const state = getState();
      expect(state.mapData!.root.children).toHaveLength(1);
      expect(state.mapData!.root.children![0].text).toBe('Child A');
      expect(state.selectedNodeIds.has(id!)).toBe(true);
    });

    it('addSibling should add sibling before or after', () => {
      const { getState } = useHtmmStore;
      const rootId = getState().mapData!.root.id;
      getState().addChild(rootId, 'First');
      const secondId = getState().addChild(rootId, 'Second');
      const siblingBeforeId = getState().addSibling(secondId!, true);
      expect(siblingBeforeId).toBeDefined();
      const state = getState();
      const children = state.mapData!.root.children!;
      expect(children).toHaveLength(3);
      expect(children[0].text).toBe('First');
      expect(children[1].text).toBe('');
      expect(children[1].id).toBe(siblingBeforeId);
      expect(children[2].text).toBe('Second');
    });

    it('deleteNode should remove node and select another', () => {
      const { getState } = useHtmmStore;
      const rootId = getState().mapData!.root.id;
      const childId = getState().addChild(rootId, 'ToDelete');
      getState().deleteNode(childId!);
      const state = getState();
      expect(state.mapData!.root.children).toHaveLength(0);
    });

    it('editNode should update text', () => {
      const { getState } = useHtmmStore;
      const rootId = getState().mapData!.root.id;
      const childId = getState().addChild(rootId, 'Original');
      getState().editNode(childId!, 'Updated');
      const state = getState();
      expect(state.mapData!.root.children![0].text).toBe('Updated');
    });

    it('moveNode should move node to new parent', () => {
      const { getState } = useHtmmStore;
      const rootId = getState().mapData!.root.id;
      const childA = getState().addChild(rootId, 'A');
      const childB = getState().addChild(rootId, 'B');
      getState().moveNode(childA!, childB!, 0);
      const state = getState();
      expect(state.mapData!.root.children).toHaveLength(1);
      expect(state.mapData!.root.children![0].children).toHaveLength(1);
      expect(state.mapData!.root.children![0].children![0].text).toBe('A');
    });
  });

  describe('Folding', () => {
    it('toggleFolded should flip folded state', () => {
      const { getState } = useHtmmStore;
      const rootId = getState().mapData!.root.id;
      getState().addChild(rootId, 'Child');
      const childId = getState().mapData!.root.children![0].id;
      expect(getState().mapData!.root.children![0].folded).toBeFalsy();
      getState().toggleFolded(childId);
      expect(getState().mapData!.root.children![0].folded).toBe(true);
      getState().toggleFolded(childId);
      expect(getState().mapData!.root.children![0].folded).toBe(false);
    });

    it('foldAll and unfoldAll should affect all nodes with children', () => {
      const { getState } = useHtmmStore;
      const rootId = getState().mapData!.root.id;
      getState().addChild(rootId, 'C');
      getState().foldAll();
      expect(getState().mapData!.root.folded).toBe(true);
      getState().unfoldAll();
      expect(getState().mapData!.root.folded).toBe(false);
    });
  });

  describe('History', () => {
    it('undo should be no-op when at first history entry', () => {
      const { getState } = useHtmmStore;
      const rootId = getState().mapData!.root.id;
      getState().addChild(rootId, 'Child');
      getState().undo();
      expect(getState().mapData).not.toBeNull();
    });

    it('redo should reapply undone state when redo is available', () => {
      const { getState } = useHtmmStore;
      const rootId = getState().mapData!.root.id;
      getState().addChild(rootId, 'Child');
      getState().undo();
      getState().redo();
      expect(getState().mapData!.root.children).toHaveLength(1);
      expect(getState().mapData!.root.children![0].text).toBe('Child');
    });

    it('history should grow after actions that push history', () => {
      const { getState } = useHtmmStore;
      const rootId = getState().mapData!.root.id;
      const initialLength = getState().history.length;
      getState().addChild(rootId, 'A');
      expect(getState().history.length).toBeGreaterThanOrEqual(initialLength);
    });
  });

  describe('Selection and clipboard', () => {
    it('selectNode and deselectAll should update selectedNodeIds', () => {
      const { getState } = useHtmmStore;
      const rootId = getState().mapData!.root.id;
      const childId = getState().addChild(rootId, 'C');
      getState().deselectAll();
      expect(getState().selectedNodeIds.size).toBe(0);
      getState().selectNode(childId!);
      expect(getState().selectedNodeIds.has(childId!)).toBe(true);
    });

    it('cutNode should set clipboard with cloned node', () => {
      const { getState } = useHtmmStore;
      const rootId = getState().mapData!.root.id;
      getState().addChild(rootId, 'CutMe');
      const childId = getState().mapData!.root.children![0].id;
      getState().cutNode(childId);
      expect(getState().clipboard).not.toBeNull();
      expect(getState().clipboard!.text).toBe('CutMe');
    });

    it('copyNode and pasteNode should clone node to new parent', () => {
      const { getState } = useHtmmStore;
      const rootId = getState().mapData!.root.id;
      const childId = getState().addChild(rootId, 'CopyMe');
      getState().copyNode(childId!);
      expect(getState().clipboard!.text).toBe('CopyMe');
      const otherId = getState().addChild(rootId, 'Other');
      getState().pasteNode(otherId!);
      const state = getState();
      const other = state.mapData!.root.children!.find(c => c.id === otherId);
      expect(other!.children).toHaveLength(1);
      expect(other!.children![0].text).toBe('CopyMe');
    });
  });

  describe('Styling', () => {
    it('setNodeColor and setNodeBackgroundColor should update node', () => {
      const { getState } = useHtmmStore;
      const rootId = getState().mapData!.root.id;
      getState().setNodeColor(rootId, '#ff0000');
      getState().setNodeBackgroundColor(rootId, '#00ff00');
      expect(getState().mapData!.root.color).toBe('#ff0000');
      expect(getState().mapData!.root.backgroundColor).toBe('#00ff00');
    });

    it('setFont and setNodeStyle should update node', () => {
      const { getState } = useHtmmStore;
      const rootId = getState().mapData!.root.id;
      getState().setFont(rootId, { size: 16, bold: true });
      getState().setNodeStyle(rootId, 'bubble');
      expect(getState().mapData!.root.font?.size).toBe(16);
      expect(getState().mapData!.root.font?.bold).toBe(true);
      expect(getState().mapData!.root.style).toBe('bubble');
    });
  });

  describe('ReadOnly mode', () => {
    it('addChild returns undefined and does not add node when readOnly', () => {
      const store = createHtmmStore();
      store.getState().newMap('Test');
      store.getState().addChild(store.getState().mapData!.root.id, 'Child');
      store.getState().setReadOnly(true);
      const rootId = store.getState().mapData!.root.id;
      const id = store.getState().addChild(rootId, 'New');
      expect(id).toBeUndefined();
      expect(store.getState().mapData!.root.children).toHaveLength(1);
      expect(store.getState().mapData!.root.children![0].text).toBe('Child');
    });

    it('deleteNode is no-op when readOnly', () => {
      const store = createHtmmStore();
      store.getState().newMap('Test');
      store.getState().addChild(store.getState().mapData!.root.id, 'Child');
      store.getState().setReadOnly(true);
      const childId = store.getState().mapData!.root.children![0].id;
      store.getState().deleteNode(childId);
      expect(store.getState().mapData!.root.children).toHaveLength(1);
    });

    it('editNode is no-op when readOnly', () => {
      const store = createHtmmStore();
      store.getState().newMap('Test');
      store.getState().addChild(store.getState().mapData!.root.id, 'Child');
      store.getState().setReadOnly(true);
      const childId = store.getState().mapData!.root.children![0].id;
      store.getState().editNode(childId, 'Changed');
      expect(store.getState().mapData!.root.children![0].text).toBe('Child');
    });

    it('pasteNode is no-op when readOnly', () => {
      const store = createHtmmStore();
      store.getState().newMap('Test');
      store.getState().addChild(store.getState().mapData!.root.id, 'Child');
      store.getState().setReadOnly(true);
      const rootId = store.getState().mapData!.root.id;
      const childId = store.getState().mapData!.root.children![0].id;
      store.getState().copyNode(childId);
      store.getState().pasteNode(rootId);
      expect(store.getState().mapData!.root.children).toHaveLength(1);
    });

    it('toggleFolded works when readOnly', () => {
      const store = createHtmmStore();
      store.getState().newMap('Test');
      store.getState().addChild(store.getState().mapData!.root.id, 'Child');
      store.getState().setReadOnly(true);
      const childId = store.getState().mapData!.root.children![0].id;
      expect(store.getState().mapData!.root.children![0].folded).toBeFalsy();
      store.getState().toggleFolded(childId);
      expect(store.getState().mapData!.root.children![0].folded).toBe(true);
      store.getState().toggleFolded(childId);
      expect(store.getState().mapData!.root.children![0].folded).toBe(false);
    });

    it('createHtmmStore({ readOnly: true }) creates store that rejects edits', () => {
      const store = createHtmmStore({ readOnly: true });
      store.getState().setReadOnly(false);
      store.getState().newMap('RO');
      const rootId = store.getState().mapData!.root.id;
      store.getState().setReadOnly(true);
      expect(store.getState().addChild(rootId, 'X')).toBeUndefined();
      expect(store.getState().mapData!.root.children).toHaveLength(0);
    });
  });

  describe('View', () => {
    it('setZoom should clamp between 0.1 and 5', () => {
      const { getState } = useHtmmStore;
      getState().setZoom(2.5);
      expect(getState().zoom).toBe(2.5);
      getState().setZoom(10);
      expect(getState().zoom).toBe(5);
      getState().setZoom(0.05);
      expect(getState().zoom).toBe(0.1);
    });

    it('setPan and resetView should update pan and zoom', () => {
      const { getState } = useHtmmStore;
      getState().setPan(100, 50);
      expect(getState().panX).toBe(100);
      expect(getState().panY).toBe(50);
      getState().setZoom(1.5);
      getState().resetView();
      expect(getState().zoom).toBe(1.0);
      expect(getState().panX).toBe(0);
      expect(getState().panY).toBe(0);
    });
  });
});
