/**
 * MapToolbar
 * Toolbar above the mind map area: node add, format (bold/italic/color/size), fullscreen, code edit.
 */

import React, { useState, useCallback } from 'react';
import { useHtmmStore } from '../store/htmm-store';
import { findNodeById } from '../models/MindMapNode';
import { generateMindMapXML } from '../io/generator';
import { parseMindMapXML } from '../io/parser';

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24];

export interface MapToolbarProps {
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
  readOnly: boolean;
}

export const MapToolbar: React.FC<MapToolbarProps> = ({
  isFullscreen,
  onFullscreenToggle,
  readOnly,
}) => {
  const {
    mapData,
    selectedNodeIds,
    addChild,
    addSibling,
    setFont,
    setNodeColor,
    loadMap,
    readOnly: storeReadOnly,
  } = useHtmmStore();

  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeEditValue, setCodeEditValue] = useState('');
  const [codeEditError, setCodeEditError] = useState<string | null>(null);

  const selectedId = mapData && selectedNodeIds.size > 0 ? Array.from(selectedNodeIds)[0] : null;
  const isRoot = selectedId != null && mapData != null && mapData.root.id === selectedId;
  const selectedNode = selectedId && mapData ? findNodeById(mapData.root, selectedId) : null;

  const handleAddAbove = useCallback(() => {
    if (readOnly || storeReadOnly || !selectedId || isRoot) return;
    addSibling(selectedId, true);
  }, [readOnly, storeReadOnly, selectedId, isRoot, addSibling]);

  const handleAddBelow = useCallback(() => {
    if (readOnly || storeReadOnly || !selectedId || isRoot) return;
    addSibling(selectedId, false);
  }, [readOnly, storeReadOnly, selectedId, isRoot, addSibling]);

  const handleAddChild = useCallback(() => {
    if (readOnly || storeReadOnly || !mapData) return;
    const parentId = selectedId ?? mapData.root.id;
    addChild(parentId, '');
  }, [readOnly, storeReadOnly, mapData, selectedId, addChild]);

  const handleBoldToggle = useCallback(() => {
    if (readOnly || storeReadOnly || !selectedId || !selectedNode) return;
    setFont(selectedId, { bold: !selectedNode.font?.bold });
  }, [readOnly, storeReadOnly, selectedId, selectedNode, setFont]);

  const handleItalicToggle = useCallback(() => {
    if (readOnly || storeReadOnly || !selectedId || !selectedNode) return;
    setFont(selectedId, { italic: !selectedNode.font?.italic });
  }, [readOnly, storeReadOnly, selectedId, selectedNode, setFont]);

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (readOnly || storeReadOnly || !selectedId) return;
      setNodeColor(selectedId, e.target.value);
    },
    [readOnly, storeReadOnly, selectedId, setNodeColor]
  );

  const handleSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (readOnly || storeReadOnly || !selectedId) return;
      const size = parseInt(e.target.value, 10);
      if (!Number.isNaN(size)) setFont(selectedId, { size });
    },
    [readOnly, storeReadOnly, selectedId, setFont]
  );

  const openCodeModal = useCallback(() => {
    if (readOnly || storeReadOnly || !mapData) return;
    setCodeEditError(null);
    setCodeEditValue(generateMindMapXML(mapData));
    setCodeModalOpen(true);
  }, [readOnly, storeReadOnly, mapData]);

  const closeCodeModal = useCallback(() => {
    setCodeModalOpen(false);
    setCodeEditError(null);
  }, []);

  const applyCodeEdit = useCallback(() => {
    try {
      const data = parseMindMapXML(codeEditValue);
      loadMap(data);
      setCodeEditError(null);
      setCodeModalOpen(false);
    } catch (err) {
      setCodeEditError(err instanceof Error ? err.message : String(err));
    }
  }, [codeEditValue, loadMap]);

  const editDisabled = readOnly || storeReadOnly;
  const formatDisabled = editDisabled || !selectedId;

  return (
    <>
      <div className="htmm-map-toolbar" role="toolbar" aria-label="Map toolbar">
        <div className="htmm-map-toolbar-group">
          <button
            type="button"
            className="htmm-map-toolbar-btn"
            onClick={handleAddAbove}
            disabled={editDisabled || !selectedId || isRoot}
            title="上にノードを追加"
            aria-label="上にノードを追加"
          >
            上
          </button>
          <button
            type="button"
            className="htmm-map-toolbar-btn"
            onClick={handleAddBelow}
            disabled={editDisabled || !selectedId || isRoot}
            title="下にノードを追加"
            aria-label="下にノードを追加"
          >
            下
          </button>
          <button
            type="button"
            className="htmm-map-toolbar-btn"
            onClick={handleAddChild}
            disabled={editDisabled}
            title="子ノードを追加"
            aria-label="子ノードを追加"
          >
            子
          </button>
        </div>

        <div className="htmm-map-toolbar-divider" aria-hidden="true" />

        <div className="htmm-map-toolbar-group">
          <button
            type="button"
            className={`htmm-map-toolbar-btn ${selectedNode?.font?.bold ? 'htmm-map-toolbar-btn-active' : ''}`}
            onClick={handleBoldToggle}
            disabled={formatDisabled}
            title="太字"
            aria-label="太字"
          >
            B
          </button>
          <button
            type="button"
            className={`htmm-map-toolbar-btn ${selectedNode?.font?.italic ? 'htmm-map-toolbar-btn-active' : ''}`}
            onClick={handleItalicToggle}
            disabled={formatDisabled}
            title="イタリック"
            aria-label="イタリック"
          >
            I
          </button>
        </div>

        <div className="htmm-map-toolbar-divider" aria-hidden="true" />

        <div className="htmm-map-toolbar-group htmm-map-toolbar-group-inline">
          <label className="htmm-map-toolbar-label" htmlFor="htmm-toolbar-color">
            <span className="htmm-map-toolbar-label-text">色</span>
            <input
              id="htmm-toolbar-color"
              type="color"
              className="htmm-map-toolbar-color"
              value={selectedNode?.color ?? '#000000'}
              onChange={handleColorChange}
              disabled={formatDisabled}
              title="文字色"
              aria-label="文字色"
            />
          </label>
          <label className="htmm-map-toolbar-label" htmlFor="htmm-toolbar-size">
            <span className="htmm-map-toolbar-label-text">サイズ</span>
            <select
              id="htmm-toolbar-size"
              className="htmm-map-toolbar-select"
              value={selectedNode?.font?.size ?? 12}
              onChange={handleSizeChange}
              disabled={formatDisabled}
              title="文字サイズ"
              aria-label="文字サイズ"
            >
              {FONT_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="htmm-map-toolbar-divider" aria-hidden="true" />

        <div className="htmm-map-toolbar-group">
          <button
            type="button"
            className={`htmm-map-toolbar-btn ${isFullscreen ? 'htmm-map-toolbar-btn-active' : ''}`}
            onClick={onFullscreenToggle}
            title={isFullscreen ? 'フルスクリーン解除' : 'フルスクリーン'}
            aria-label={isFullscreen ? 'フルスクリーン解除' : 'フルスクリーン'}
          >
            ⛶
          </button>
          <button
            type="button"
            className="htmm-map-toolbar-btn"
            onClick={openCodeModal}
            disabled={editDisabled}
            title="コード直接編集"
            aria-label="コード直接編集"
          >
            &lt;/&gt;
          </button>
        </div>
      </div>

      {codeModalOpen && (
        <div
          className="htmm-map-code-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="htmm-code-modal-title"
          onClick={(e) => e.target === e.currentTarget && closeCodeModal()}
        >
          <div className="htmm-map-code-modal">
            <h2 id="htmm-code-modal-title" className="htmm-map-code-modal-title">
              コード直接編集 (.mm XML)
            </h2>
            {codeEditError && (
              <div className="htmm-map-code-modal-error" role="alert">
                {codeEditError}
              </div>
            )}
            <textarea
              className="htmm-map-code-modal-textarea"
              value={codeEditValue}
              onChange={(e) => setCodeEditValue(e.target.value)}
              spellCheck={false}
              aria-label="XML 編集"
            />
            <div className="htmm-map-code-modal-actions">
              <button type="button" className="htmm-map-toolbar-btn" onClick={closeCodeModal}>
                キャンセル
              </button>
              <button type="button" className="htmm-map-toolbar-btn htmm-map-code-modal-apply" onClick={applyCodeEdit}>
                適用
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
