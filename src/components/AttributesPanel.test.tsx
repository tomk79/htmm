/**
 * Tests for AttributesPanel component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttributesPanel } from './AttributesPanel';
import type { AttributeInfo } from '../types/mindmap';

describe('AttributesPanel', () => {
  const mockAttributes: AttributeInfo[] = [
    { name: 'author', value: 'John Doe' },
    { name: 'version', value: '1.0' },
  ];

  it('renders empty message when no attributes', () => {
    render(<AttributesPanel attributes={[]} onUpdate={vi.fn()} />);
    
    expect(screen.getByText('No attributes')).toBeInTheDocument();
  });

  it('renders attributes list', () => {
    render(<AttributesPanel attributes={mockAttributes} onUpdate={vi.fn()} />);
    
    expect(screen.getByText('author')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('version')).toBeInTheDocument();
    expect(screen.getByText('1.0')).toBeInTheDocument();
  });

  it('shows add button when editable', () => {
    render(<AttributesPanel attributes={[]} onUpdate={vi.fn()} editable={true} />);
    
    expect(screen.getByLabelText('Add attribute')).toBeInTheDocument();
  });

  it('hides action buttons when not editable', () => {
    render(<AttributesPanel attributes={mockAttributes} onUpdate={vi.fn()} editable={false} />);
    
    expect(screen.queryByLabelText('Add attribute')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Edit attribute')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Delete attribute')).not.toBeInTheDocument();
  });

  it('opens add form when add button clicked', async () => {
    const user = userEvent.setup();
    render(<AttributesPanel attributes={[]} onUpdate={vi.fn()} />);
    
    const addButton = screen.getByLabelText('Add attribute');
    await user.click(addButton);
    
    expect(screen.getByLabelText('New attribute key')).toBeInTheDocument();
    expect(screen.getByLabelText('New attribute value')).toBeInTheDocument();
  });

  it('adds new attribute', async () => {
    const handleUpdate = vi.fn();
    const user = userEvent.setup();
    
    render(<AttributesPanel attributes={[]} onUpdate={handleUpdate} />);
    
    // Click add button
    await user.click(screen.getByLabelText('Add attribute'));
    
    // Fill in key and value
    const keyInput = screen.getByLabelText('New attribute key');
    const valueInput = screen.getByLabelText('New attribute value');
    
    await user.type(keyInput, 'status');
    await user.type(valueInput, 'active');
    
    // Click save
    await user.click(screen.getByLabelText('Add'));
    
    expect(handleUpdate).toHaveBeenCalledWith([
      { name: 'status', value: 'active' },
    ]);
  });

  it('edits existing attribute', async () => {
    const handleUpdate = vi.fn();
    const user = userEvent.setup();
    
    render(<AttributesPanel attributes={mockAttributes} onUpdate={handleUpdate} />);
    
    // Click edit button for first attribute
    const editButtons = screen.getAllByLabelText('Edit attribute');
    await user.click(editButtons[0]);
    
    // Modify value
    const valueInput = screen.getByLabelText('Attribute value');
    await user.clear(valueInput);
    await user.type(valueInput, 'Jane Smith');
    
    // Click save
    await user.click(screen.getByLabelText('Save'));
    
    expect(handleUpdate).toHaveBeenCalledWith([
      { name: 'author', value: 'Jane Smith' },
      { name: 'version', value: '1.0' },
    ]);
  });

  it('deletes attribute', async () => {
    const handleUpdate = vi.fn();
    const user = userEvent.setup();
    
    render(<AttributesPanel attributes={mockAttributes} onUpdate={handleUpdate} />);
    
    // Click delete button for first attribute
    const deleteButtons = screen.getAllByLabelText('Delete attribute');
    await user.click(deleteButtons[0]);
    
    expect(handleUpdate).toHaveBeenCalledWith([
      { name: 'version', value: '1.0' },
    ]);
  });

  it('cancels edit operation', async () => {
    const handleUpdate = vi.fn();
    const user = userEvent.setup();
    
    render(<AttributesPanel attributes={mockAttributes} onUpdate={handleUpdate} />);
    
    // Click edit button
    const editButtons = screen.getAllByLabelText('Edit attribute');
    await user.click(editButtons[0]);
    
    // Modify value
    const valueInput = screen.getByLabelText('Attribute value');
    await user.clear(valueInput);
    await user.type(valueInput, 'Modified');
    
    // Click cancel
    await user.click(screen.getByLabelText('Cancel'));
    
    // Should not call onUpdate
    expect(handleUpdate).not.toHaveBeenCalled();
    
    // Original value should still be displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('supports keyboard shortcuts for add', async () => {
    const handleUpdate = vi.fn();
    const user = userEvent.setup();
    
    render(<AttributesPanel attributes={[]} onUpdate={handleUpdate} />);
    
    // Click add button
    await user.click(screen.getByLabelText('Add attribute'));
    
    // Fill in key and press Enter
    const keyInput = screen.getByLabelText('New attribute key');
    await user.type(keyInput, 'test{Enter}');
    
    expect(handleUpdate).toHaveBeenCalledWith([
      { name: 'test', value: '' },
    ]);
  });

  it('supports keyboard shortcuts for cancel', async () => {
    const handleUpdate = vi.fn();
    const user = userEvent.setup();
    
    render(<AttributesPanel attributes={[]} onUpdate={handleUpdate} />);
    
    // Click add button
    await user.click(screen.getByLabelText('Add attribute'));
    
    // Press Escape
    const keyInput = screen.getByLabelText('New attribute key');
    await user.type(keyInput, '{Escape}');
    
    // Form should be closed
    expect(screen.queryByLabelText('New attribute key')).not.toBeInTheDocument();
    expect(handleUpdate).not.toHaveBeenCalled();
  });

  it('does not add attribute with empty key', async () => {
    const handleUpdate = vi.fn();
    const user = userEvent.setup();
    
    render(<AttributesPanel attributes={[]} onUpdate={handleUpdate} />);
    
    // Click add button
    await user.click(screen.getByLabelText('Add attribute'));
    
    // Try to add with empty key
    const valueInput = screen.getByLabelText('New attribute value');
    await user.type(valueInput, 'value');
    
    await user.click(screen.getByLabelText('Add'));
    
    // Should not call onUpdate
    expect(handleUpdate).not.toHaveBeenCalled();
  });
});
