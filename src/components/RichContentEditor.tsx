import React, { useRef, useEffect, useCallback } from 'react';
import { RichContentToolbar, type ToolbarAction } from './RichContentToolbar';
import { sanitizeRichContent } from '../utils/sanitize';

export interface RichContentEditorProps {
  content: string;
  onChange: (content: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Rich content editor with formatting toolbar
 * Supports HTML editing with XSS protection
 */
export const RichContentEditor: React.FC<RichContentEditorProps> = ({
  content,
  onChange,
  onBlur,
  placeholder = 'Enter content...',
  disabled = false,
  autoFocus = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      const sanitized = sanitizeRichContent(content);
      editorRef.current.innerHTML = sanitized;
    }
  }, [content]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  // Handle content change
  const handleInput = useCallback(() => {
    if (isComposingRef.current || !editorRef.current) return;
    
    const html = editorRef.current.innerHTML;
    const sanitized = sanitizeRichContent(html);
    
    // Only update if sanitization changed the content
    if (sanitized !== html) {
      editorRef.current.innerHTML = sanitized;
    }
    
    onChange(sanitized);
  }, [onChange]);

  // Handle composition events (for IME input)
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
    handleInput();
  }, [handleInput]);

  // Handle toolbar actions
  const handleToolbarAction = useCallback((action: ToolbarAction) => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    
    if (action.value) {
      document.execCommand(action.command, false, action.value);
    } else {
      document.execCommand(action.command, false);
    }
    
    handleInput();
  }, [handleInput]);

  // Handle paste - sanitize pasted content
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    
    const text = e.clipboardData.getData('text/plain');
    const html = e.clipboardData.getData('text/html');
    
    const contentToInsert = html ? sanitizeRichContent(html) : text;
    
    // Insert at cursor position
    document.execCommand('insertHTML', false, contentToInsert);
    handleInput();
  }, [handleInput]);

  return (
    <div className="rich-content-editor">
      <RichContentToolbar onAction={handleToolbarAction} disabled={disabled} />
      
      <div
        ref={editorRef}
        className="rich-content-editable"
        contentEditable={!disabled}
        onInput={handleInput}
        onBlur={onBlur}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onPaste={handlePaste}
        role="textbox"
        aria-multiline="true"
        aria-label="Rich text editor"
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
};
