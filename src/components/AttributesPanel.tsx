import React, { useState } from 'react';
import type { AttributeInfo } from '../types/mindmap';
import './AttributesPanel.css';

export interface AttributesPanelProps {
  attributes: AttributeInfo[];
  onUpdate: (attributes: AttributeInfo[]) => void;
  editable?: boolean;
}

/**
 * Panel for displaying and editing node attributes
 * Supports add/edit/delete operations
 */
export const AttributesPanel: React.FC<AttributesPanelProps> = ({
  attributes,
  onUpdate,
  editable = true,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleStartEdit = (index: number) => {
    if (!editable) return;
    const attr = attributes[index];
    setEditingIndex(index);
    setEditKey(attr.name);
    setEditValue(attr.value);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    
    const updatedAttributes = [...attributes];
    updatedAttributes[editingIndex] = { name: editKey, value: editValue };
    onUpdate(updatedAttributes);
    
    setEditingIndex(null);
    setEditKey('');
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditKey('');
    setEditValue('');
    setIsAdding(false);
  };

  const handleDelete = (index: number) => {
    if (!editable) return;
    const updatedAttributes = attributes.filter((_, i) => i !== index);
    onUpdate(updatedAttributes);
  };

  const handleStartAdd = () => {
    if (!editable) return;
    setIsAdding(true);
    setEditKey('');
    setEditValue('');
  };

  const handleAdd = () => {
    if (!editKey.trim()) return;
    
    const newAttribute: AttributeInfo = {
      name: editKey,
      value: editValue,
    };
    
    onUpdate([...attributes, newAttribute]);
    setIsAdding(false);
    setEditKey('');
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, onEnter: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  return (
    <div className="attributes-panel" role="region" aria-label="Node attributes">
      <div className="attributes-header">
        <h3>Attributes</h3>
        {editable && (
          <button
            type="button"
            className="btn-add-attribute"
            onClick={handleStartAdd}
            disabled={isAdding || editingIndex !== null}
            aria-label="Add attribute"
          >
            + Add
          </button>
        )}
      </div>

      <div className="attributes-list">
        {attributes.length === 0 && !isAdding && (
          <div className="attributes-empty">No attributes</div>
        )}

        {attributes.map((attr, index) => (
          <div key={index} className="attribute-item">
            {editingIndex === index ? (
              <div className="attribute-edit">
                <input
                  type="text"
                  className="attribute-key-input"
                  value={editKey}
                  onChange={(e) => setEditKey(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                  placeholder="Key"
                  autoFocus
                  aria-label="Attribute key"
                />
                <input
                  type="text"
                  className="attribute-value-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                  placeholder="Value"
                  aria-label="Attribute value"
                />
                <div className="attribute-actions">
                  <button
                    type="button"
                    className="btn-save"
                    onClick={handleSaveEdit}
                    aria-label="Save"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={handleCancelEdit}
                    aria-label="Cancel"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="attribute-display">
                <div className="attribute-key" title={attr.name}>
                  {attr.name}
                </div>
                <div className="attribute-value" title={attr.value}>
                  {attr.value}
                </div>
                {editable && (
                  <div className="attribute-actions">
                    <button
                      type="button"
                      className="btn-edit"
                      onClick={() => handleStartEdit(index)}
                      aria-label="Edit attribute"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => handleDelete(index)}
                      aria-label="Delete attribute"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="attribute-item">
            <div className="attribute-edit">
              <input
                type="text"
                className="attribute-key-input"
                value={editKey}
                onChange={(e) => setEditKey(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleAdd)}
                placeholder="Key"
                autoFocus
                aria-label="New attribute key"
              />
              <input
                type="text"
                className="attribute-value-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleAdd)}
                placeholder="Value"
                aria-label="New attribute value"
              />
              <div className="attribute-actions">
                <button
                  type="button"
                  className="btn-save"
                  onClick={handleAdd}
                  aria-label="Add"
                >
                  ✓
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancelEdit}
                  aria-label="Cancel"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
