/**
 * ArrowLinkToolbar Component
 * Toolbar for managing arrow links between nodes
 */

import React, { useState } from 'react';
import type { ArrowType } from '../types/mindmap';

export interface ArrowLinkToolbarProps {
  selectedNodeId: string | null;
  onAddArrowLink: (targetId: string, options?: ArrowLinkOptions) => void;
  onRemoveArrowLink: (targetId: string) => void;
  className?: string;
}

export interface ArrowLinkOptions {
  color?: string;
  startArrow?: ArrowType;
  endArrow?: ArrowType;
}

export const ArrowLinkToolbar: React.FC<ArrowLinkToolbarProps> = ({
  selectedNodeId,
  onAddArrowLink,
  onRemoveArrowLink,
  className = '',
}) => {
  const [targetNodeId, setTargetNodeId] = useState('');
  const [color, setColor] = useState('#ff0000');
  const [startArrow, setStartArrow] = useState<ArrowType>('None');
  const [endArrow, setEndArrow] = useState<ArrowType>('Default');
  
  const handleAddArrowLink = () => {
    if (!targetNodeId.trim()) {
      alert('Please enter a target node ID');
      return;
    }
    
    onAddArrowLink(targetNodeId.trim(), {
      color,
      startArrow,
      endArrow,
    });
    
    // Reset form
    setTargetNodeId('');
  };
  
  const handleRemoveArrowLink = () => {
    if (!targetNodeId.trim()) {
      alert('Please enter a target node ID to remove');
      return;
    }
    
    onRemoveArrowLink(targetNodeId.trim());
    setTargetNodeId('');
  };
  
  if (!selectedNodeId) {
    return (
      <div className={`arrow-link-toolbar ${className}`}>
        <p>Select a node to create arrow links</p>
      </div>
    );
  }
  
  return (
    <div className={`arrow-link-toolbar ${className}`}>
      <h3>Arrow Link Manager</h3>
      <p>Source Node: <code>{selectedNodeId}</code></p>
      
      <div className="arrow-link-form">
        <div className="form-group">
          <label htmlFor="target-node-id">Target Node ID:</label>
          <input
            id="target-node-id"
            type="text"
            value={targetNodeId}
            onChange={(e) => setTargetNodeId(e.target.value)}
            placeholder="Enter target node ID"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="arrow-color">Arrow Color:</label>
          <input
            id="arrow-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#ff0000"
            style={{ marginLeft: '8px', width: '100px' }}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="start-arrow">Start Arrow:</label>
          <select
            id="start-arrow"
            value={startArrow}
            onChange={(e) => setStartArrow(e.target.value as ArrowType)}
          >
            <option value="None">None</option>
            <option value="Default">Default</option>
            <option value="Forward">Forward</option>
            <option value="Back">Back</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="end-arrow">End Arrow:</label>
          <select
            id="end-arrow"
            value={endArrow}
            onChange={(e) => setEndArrow(e.target.value as ArrowType)}
          >
            <option value="None">None</option>
            <option value="Default">Default</option>
            <option value="Forward">Forward</option>
            <option value="Back">Back</option>
          </select>
        </div>
        
        <div className="form-actions">
          <button onClick={handleAddArrowLink} className="btn-primary">
            Add Arrow Link
          </button>
          <button onClick={handleRemoveArrowLink} className="btn-secondary">
            Remove Arrow Link
          </button>
        </div>
      </div>
      
      <style>{`
        .arrow-link-toolbar {
          padding: 16px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .arrow-link-toolbar h3 {
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 16px;
        }
        
        .arrow-link-toolbar p {
          margin: 8px 0;
          font-size: 14px;
        }
        
        .arrow-link-toolbar code {
          background: #fff;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
        }
        
        .arrow-link-form {
          margin-top: 16px;
        }
        
        .form-group {
          margin-bottom: 12px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .form-group input[type="text"],
        .form-group input[type="color"],
        .form-group select {
          padding: 6px 8px;
          border: 1px solid #ccc;
          border-radius: 3px;
          font-size: 14px;
        }
        
        .form-group input[type="text"] {
          width: 100%;
        }
        
        .form-actions {
          margin-top: 16px;
          display: flex;
          gap: 8px;
        }
        
        .btn-primary,
        .btn-secondary {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .btn-primary {
          background-color: #007bff;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #0056b3;
        }
        
        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover {
          background-color: #545b62;
        }
      `}</style>
    </div>
  );
};
