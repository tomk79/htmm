/**
 * Demo Application
 * Demonstrates htmm library usage
 */

import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HtmmMap, useHtmmStore, saveMindMapFile, loadMindMapFile } from '@tomk79/htmm';
import type { HtmmMapHandle } from '@tomk79/htmm';
import '@tomk79/htmm/styles/print.css';
import './demo.css';

/** Seeds the main map with demo content when it is empty. Must be rendered inside HtmmMap. */
const DemoMapInitializer: React.FC = () => {
  const { newMap, addChild, mapData } = useHtmmStore();

  useEffect(() => {
    newMap('htmm Demo');
  }, [newMap]);

  useEffect(() => {
    if (!mapData?.root) return;
    if (mapData.root.children && mapData.root.children.length > 0) return;
    const rootId = mapData.root.id;
    addChild(rootId, 'Features');
    addChild(rootId, 'Getting Started');
    addChild(rootId, 'Documentation');
  }, [mapData, addChild]);

  useEffect(() => {
    if (!mapData?.root.children?.length) return;
    const featuresNode = mapData.root.children?.find((n) => n.text === 'Features');
    if (!featuresNode || (featuresNode.children && featuresNode.children.length > 0)) return;
    addChild(featuresNode.id, 'Read/Write .mm files');
    addChild(featuresNode.id, 'React components');
    addChild(featuresNode.id, 'Keyboard shortcuts');
    addChild(featuresNode.id, 'Full styling support');
  }, [mapData, addChild]);

  return null;
};

/** Toolbar that uses useHtmmStore (must be inside HtmmMap). Receives ref for load/save. */
const DemoToolbar: React.FC<{
  mapRef: React.RefObject<HtmmMapHandle | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}> = ({ mapRef, fileInputRef }) => {
  const {
    mapData,
    addChild,
    addSibling,
    deleteNode,
    selectedNodeIds,
    undo,
    redo,
    setNodeColor,
    setNodeBackgroundColor,
    toggleFolded,
    addIcon,
    setLink,
    setCloud,
    removeCloud,
  } = useHtmmStore();

  const handleSave = () => {
    const data = mapRef.current?.getMapData();
    if (data) {
      saveMindMapFile(data, 'demo-mindmap.mm');
    }
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddChild = () => {
    const selectedId = Array.from(selectedNodeIds)[0];
    if (selectedId) {
      addChild(selectedId, 'New child');
    } else if (mapData) {
      addChild(mapData.root.id, 'New node');
    }
  };

  const handleAddSibling = () => {
    const selectedId = Array.from(selectedNodeIds)[0];
    if (selectedId && mapData && selectedId !== mapData.root.id) {
      addSibling(selectedId);
    }
  };

  const handleDelete = () => {
    const selectedId = Array.from(selectedNodeIds)[0];
    if (selectedId && mapData && selectedId !== mapData.root.id) {
      deleteNode(selectedId);
    }
  };

  const handleColorChange = (color: string) => {
    const selectedId = Array.from(selectedNodeIds)[0];
    if (selectedId) {
      setNodeColor(selectedId, color);
    }
  };

  const handleBgColorChange = (color: string) => {
    const selectedId = Array.from(selectedNodeIds)[0];
    if (selectedId) {
      setNodeBackgroundColor(selectedId, color);
    }
  };

  const handleToggleFold = () => {
    const selectedId = Array.from(selectedNodeIds)[0];
    if (selectedId) {
      toggleFolded(selectedId);
    }
  };

  const handleAddIcon = () => {
    const selectedId = Array.from(selectedNodeIds)[0];
    if (selectedId) {
      const icons = ['idea', 'yes', 'help', 'messagebox_warning', 'flag'];
      const randomIcon = icons[Math.floor(Math.random() * icons.length)];
      addIcon(selectedId, randomIcon);
    }
  };

  const handleSetLink = () => {
    const selectedId = Array.from(selectedNodeIds)[0];
    if (selectedId) {
      const url = prompt('Enter URL:', 'https://example.com');
      if (url) {
        setLink(selectedId, url);
      }
    }
  };

  const handleToggleCloud = () => {
    const selectedId = Array.from(selectedNodeIds)[0];
    if (selectedId && mapData) {
      const findNode = (n: typeof mapData.root): typeof mapData.root | null => {
        if (n.id === selectedId) return n;
        if (n.children) {
          for (const child of n.children) {
            const found = findNode(child);
            if (found) return found;
          }
        }
        return null;
      };
      const targetNode = findNode(mapData.root);
      if (targetNode?.cloud) {
        removeCloud(selectedId);
      } else {
        setCloud(selectedId, '#ffcc00');
      }
    }
  };

  return (
    <div className="demo-toolbar">
      <div className="toolbar-group">
        <button onClick={handleLoadClick}>Load (.mm)</button>
        <button onClick={handleSave}>Save (.mm)</button>
      </div>
      <div className="toolbar-group">
        <button onClick={handleAddChild} title="Add child (Tab)">
          Add Child
        </button>
        <button onClick={handleAddSibling} title="Add sibling (Enter)">
          Add Sibling
        </button>
        <button onClick={handleDelete} title="Delete (Delete)">
          Delete
        </button>
      </div>
      <div className="toolbar-group">
        <button onClick={undo} title="Undo (Ctrl+Z)">Undo</button>
        <button onClick={redo} title="Redo (Ctrl+Y)">Redo</button>
      </div>
      <div className="toolbar-group">
        <label>
          Text Color:
          <input
            type="color"
            onChange={(e) => handleColorChange(e.target.value)}
            defaultValue="#000000"
          />
        </label>
        <label>
          Background:
          <input
            type="color"
            onChange={(e) => handleBgColorChange(e.target.value)}
            defaultValue="#ffffff"
          />
        </label>
      </div>
      <div className="toolbar-group">
        <button onClick={handleToggleFold}>Toggle Fold</button>
      </div>
      <div className="toolbar-group">
        <button onClick={handleAddIcon} title="Add random icon">
          Add Icon
        </button>
        <button onClick={handleSetLink} title="Set link (Ctrl+Click to open)">
          Set Link
        </button>
        <button onClick={handleToggleCloud} title="Toggle cloud">
          Toggle Cloud
        </button>
      </div>
    </div>
  );
};

const DemoApp: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HtmmMapHandle>(null);
  const [readOnlyRefreshKey, setReadOnlyRefreshKey] = useState(0);
  const [readOnlyMapData, setReadOnlyMapData] = useState<ReturnType<HtmmMapHandle['getMapData']>>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const data = await loadMindMapFile(file);
        mapRef.current?.loadMap(data);
      } catch (err) {
        console.error('Failed to load .mm file', err);
      }
      e.target.value = '';
    }
  };

  const handleReadOnlyRefresh = () => {
    setReadOnlyMapData(mapRef.current?.getMapData() ?? null);
    setReadOnlyRefreshKey((k) => k + 1);
  };

  return (
    <div className="demo-app">
      <header className="demo-header">
        <h1>htmm Demo</h1>
        <p>A modern React library for FreeMind-compatible mind maps</p>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".mm"
        onChange={handleFileChange}
        className="demo-file-input"
        aria-label="Load .mm file"
        data-testid="file-input"
      />

      <HtmmMap ref={mapRef} width="100%" height="calc(100vh - 200px)">
        <DemoMapInitializer />
        <DemoToolbar mapRef={mapRef} fileInputRef={fileInputRef} />
      </HtmmMap>

      <section className="demo-readonly-section" aria-labelledby="readonly-demo-heading">
        <h2 id="readonly-demo-heading">ReadOnly モードのデモ</h2>
        <p className="demo-readonly-desc">
          下のマップは <code>readOnly</code> で表示しています。選択・ズーム・折りたたみ・コピーは可能で、追加・削除・編集はできません。
        </p>
        <button
          type="button"
          className="demo-readonly-refresh"
          onClick={handleReadOnlyRefresh}
        >
          上記の内容を ReadOnly ビューに反映
        </button>
        <div className="demo-readonly-canvas">
          <HtmmMap
            key={`readonly-${readOnlyRefreshKey}`}
            initialMapData={readOnlyMapData ?? undefined}
            readOnly
            width="100%"
            height="400px"
          />
        </div>
      </section>

      <footer className="demo-footer">
        <p>
          <strong>Tips:</strong> Double-click to edit • Click to select •
          Ctrl+Click on link to open • Ctrl+B for bold • Ctrl+I for italic •
          Use toolbar buttons or keyboard shortcuts
        </p>
      </footer>
    </div>
  );
};

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<DemoApp />);
}
