import React from 'react';

export interface ToolbarAction {
  command: string;
  value?: string;
  label: string;
  icon: string;
}

export interface RichContentToolbarProps {
  onAction: (action: ToolbarAction) => void;
  disabled?: boolean;
}

/**
 * Toolbar for rich content editing
 * Provides formatting buttons for text editing
 */
export const RichContentToolbar: React.FC<RichContentToolbarProps> = ({ onAction, disabled = false }) => {
  const textActions: ToolbarAction[] = [
    { command: 'bold', label: 'Bold', icon: 'B' },
    { command: 'italic', label: 'Italic', icon: 'I' },
    { command: 'underline', label: 'Underline', icon: 'U' },
    { command: 'strikeThrough', label: 'Strikethrough', icon: 'S' },
  ];

  const listActions: ToolbarAction[] = [
    { command: 'insertUnorderedList', label: 'Bulleted List', icon: '•' },
    { command: 'insertOrderedList', label: 'Numbered List', icon: '1.' },
  ];

  const linkAction: ToolbarAction = {
    command: 'createLink',
    label: 'Insert Link',
    icon: '🔗',
  };

  const handleAction = (action: ToolbarAction) => {
    if (disabled) return;

    if (action.command === 'createLink') {
      const url = prompt('Enter URL:');
      if (url) {
        onAction({ ...action, value: url });
      }
    } else {
      onAction(action);
    }
  };

  return (
    <div className="rich-content-toolbar" role="toolbar" aria-label="Text formatting">
      <div className="toolbar-group">
        {textActions.map((action) => (
          <button
            key={action.command}
            type="button"
            className="toolbar-button"
            onClick={() => handleAction(action)}
            disabled={disabled}
            title={action.label}
            aria-label={action.label}
          >
            {action.icon}
          </button>
        ))}
      </div>
      
      <div className="toolbar-divider" />
      
      <div className="toolbar-group">
        {listActions.map((action) => (
          <button
            key={action.command}
            type="button"
            className="toolbar-button"
            onClick={() => handleAction(action)}
            disabled={disabled}
            title={action.label}
            aria-label={action.label}
          >
            {action.icon}
          </button>
        ))}
      </div>
      
      <div className="toolbar-divider" />
      
      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-button"
          onClick={() => handleAction(linkAction)}
          disabled={disabled}
          title={linkAction.label}
          aria-label={linkAction.label}
        >
          {linkAction.icon}
        </button>
      </div>
    </div>
  );
};
