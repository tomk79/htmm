/**
 * Tests for RichContentEditor component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichContentEditor } from './RichContentEditor';

describe('RichContentEditor', () => {
  it('renders with initial content', () => {
    render(
      <RichContentEditor
        content="<p>Hello <b>World</b></p>"
        onChange={vi.fn()}
      />
    );
    
    const editor = screen.getByRole('textbox');
    expect(editor).toBeInTheDocument();
    expect(editor.innerHTML).toContain('Hello');
    expect(editor.innerHTML).toContain('World');
  });

  it('renders toolbar buttons', () => {
    render(
      <RichContentEditor
        content=""
        onChange={vi.fn()}
      />
    );
    
    expect(screen.getByLabelText('Bold')).toBeInTheDocument();
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Underline')).toBeInTheDocument();
    expect(screen.getByLabelText('Strikethrough')).toBeInTheDocument();
    expect(screen.getByLabelText('Bulleted List')).toBeInTheDocument();
    expect(screen.getByLabelText('Numbered List')).toBeInTheDocument();
    expect(screen.getByLabelText('Insert Link')).toBeInTheDocument();
  });

  it('calls onChange when content is modified', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(
      <RichContentEditor
        content=""
        onChange={handleChange}
      />
    );
    
    const editor = screen.getByRole('textbox');
    await user.click(editor);
    await user.type(editor, 'Test');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows placeholder when empty', () => {
    render(
      <RichContentEditor
        content=""
        onChange={vi.fn()}
        placeholder="Enter text here"
      />
    );
    
    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('data-placeholder', 'Enter text here');
  });

  it('disables editing when disabled prop is true', () => {
    render(
      <RichContentEditor
        content="Test"
        onChange={vi.fn()}
        disabled={true}
      />
    );
    
    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('contentEditable', 'false');
    
    const boldButton = screen.getByLabelText('Bold');
    expect(boldButton).toBeDisabled();
  });

  // Skip paste test in jsdom (ClipboardEvent not available)
  it.skip('sanitizes pasted HTML content', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(
      <RichContentEditor
        content=""
        onChange={handleChange}
      />
    );
    
    const editor = screen.getByRole('textbox');
    await user.click(editor);
    
    // Note: This test requires a real browser environment
    // jsdom does not support ClipboardEvent
  });

  it('calls onBlur when editor loses focus', async () => {
    const handleBlur = vi.fn();
    const user = userEvent.setup();
    
    render(
      <div>
        <RichContentEditor
          content=""
          onChange={vi.fn()}
          onBlur={handleBlur}
        />
        <button>Other button</button>
      </div>
    );
    
    const editor = screen.getByRole('textbox');
    await user.click(editor);
    
    const otherButton = screen.getByRole('button', { name: 'Other button' });
    await user.click(otherButton);
    
    expect(handleBlur).toHaveBeenCalled();
  });

  it('auto focuses when autoFocus is true', () => {
    render(
      <RichContentEditor
        content=""
        onChange={vi.fn()}
        autoFocus={true}
      />
    );
    
    const editor = screen.getByRole('textbox');
    expect(editor).toHaveFocus();
  });
});
