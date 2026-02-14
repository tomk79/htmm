/**
 * Demo Application
 * Demonstrates FreeMind Web library usage
 */

import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { FreeMindMap } from '../components/FreeMindMap';
import { useFreeMindStore } from '../store/freemind-store';
import { loadMindMapFile } from '../io/parser';
import { saveMindMapFile } from '../io/generator';
import './demo.css';

const DemoApp: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    mapData,
    newMap,
    loadMap,
    addChild,
    addSibling,
    deleteNode,
    selectedNodeIds,
    undo,
    redo,
    setNodeColor,
    setNodeBackgroundColor,
    toggleFolded,
  } = useFreeMindStore();
  
  useEffect(() => {
    // Create a sample mind map on mount
    newMap('FreeMind Web Demo');
    
    // Give it a moment, then add some sample nodes
    setTimeout(() => {
      const store = useFreeMindStore.getState();
      if (store.mapData) {
        const rootId = store.mapData.root.id;
        
        // Add some children
        store.addChild(rootId, 'Features');
        store.addChild(rootId, 'Getting Started');
        store.addChild(rootId, 'Documentation');
        
        // Find the Features node and add sub-items
        const featuresNode = store.mapData.root.children?.find(n => n.text === 'Features');
        if (featuresNode) {
          store.addChild(featuresNode.id, 'Read/Write .mm files');
          store.addChild(featuresNode.id, 'React components');
          store.addChild(featuresNode.id, 'Keyboard shortcuts');
          store.addChild(featuresNode.id, 'Full styling support');
        }
      }
    }, 100);
  }, []);
  
  const handleSave = () => {
    if (mapData) {
      saveMindMapFile(mapData, 'demo-mindmap.mm');
    }
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const data = await loadMindMapFile(file);
        loadMap(data);
      } catch (err) {
        console.error('Failed to load .mm file', err);
      }
      e.target.value = '';
    }
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
  
  return (
    <div className="demo-app">
      <header className="demo-header">
        <h1>FreeMind Web Demo</h1>
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
      <div className="demo-toolbar">
        <div className="toolbar-group">
          <button onClick={() => newMap('New Mind Map')}>New</button>
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
      </div>
      
      <div className="demo-canvas">
        <FreeMindMap width="100%" height="calc(100vh - 200px)" />
      </div>
      
      <footer className="demo-footer">
        <p>
          <strong>Tips:</strong> Double-click to edit • Click to select • 
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
