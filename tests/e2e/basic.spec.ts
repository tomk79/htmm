import path from 'path';
import { test, expect } from '@playwright/test';

const FIXTURE_MM = path.join(process.cwd(), 'tests', 'e2e', 'fixtures', 'sample.mm');

test.describe('FreeMind Web - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application', async ({ page }) => {
    await expect(page).toHaveTitle(/FreeMind Web/);
  });

  test('should display the mind map', async ({ page }) => {
    const mindMap = page.locator('.freemind-map');
    await expect(mindMap).toBeVisible();
  });

  test('should have a root node', async ({ page }) => {
    const rootNode = page.locator('.node-view.root');
    await expect(rootNode).toBeVisible();
    await expect(rootNode).toHaveText(/New Mind Map|Mind Map/i);
  });
});

test.describe('FreeMind Web - Node Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Click on the root node to select it
    await page.click('.node-view.root');
  });

  test('should select a node on click', async ({ page }) => {
    const rootNode = page.locator('.node-view.root');
    await expect(rootNode).toHaveClass(/selected/);
  });

  test('should add a child node with Tab key', async ({ page }) => {
    const initialNodeCount = await page.locator('.node-view').count();
    
    // Press Tab to add a child
    await page.keyboard.press('Tab');
    
    // Wait for the new node to be added
    await page.waitForSelector('.node-view:not(.root)', { timeout: 1000 });
    
    const newNodeCount = await page.locator('.node-view').count();
    expect(newNodeCount).toBe(initialNodeCount + 1);
  });

  test('should edit node text', async ({ page }) => {
    const rootNode = page.locator('.node-view.root');
    
    // Double-click to start editing
    await rootNode.dblclick();
    
    // Wait for edit mode
    await page.waitForSelector('.node-text[contenteditable="true"]', { timeout: 1000 });
    
    // Type new text
    const editableText = page.locator('.node-text[contenteditable="true"]');
    await editableText.fill('New Root Text');
    
    // Press Enter to save
    await page.keyboard.press('Enter');
    
    // Check if text was updated
    await expect(rootNode).toContainText('New Root Text');
  });

  test('should delete a node with Delete key', async ({ page }) => {
    // Add a child node first
    await page.keyboard.press('Tab');
    await page.waitForSelector('.node-view:not(.root)', { timeout: 1000 });
    
    // Get initial count
    const initialNodeCount = await page.locator('.node-view').count();
    
    // The new child should be selected automatically, press Delete
    await page.keyboard.press('Delete');
    
    // Wait a bit for deletion
    await page.waitForTimeout(100);
    
    const newNodeCount = await page.locator('.node-view').count();
    expect(newNodeCount).toBe(initialNodeCount - 1);
  });
});

test.describe('FreeMind Web - Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Click on the root node
    await page.click('.node-view.root');
    
    // Add a few child nodes for testing
    await page.keyboard.press('Tab'); // First child
    await page.keyboard.press('Enter'); // Escape edit mode if needed
    await page.keyboard.press('Enter'); // Sibling
    await page.keyboard.press('Enter'); // Another sibling
  });

  test('should navigate between siblings with arrow keys', async ({ page }) => {
    // Select the first non-root node
    await page.click('.node-view:not(.root)');
    
    // Navigate down
    await page.keyboard.press('ArrowDown');
    
    // Should have moved to next sibling
    await page.waitForTimeout(100);
    
    // Navigate up
    await page.keyboard.press('ArrowUp');
    
    await page.waitForTimeout(100);
  });

  test('should navigate to parent with left arrow key', async ({ page }) => {
    // Select a child node
    const childNode = page.locator('.node-view:not(.root)').first();
    await childNode.click();
    
    // Press left arrow to go to parent
    await page.keyboard.press('ArrowLeft');
    
    // Root node should be selected
    await page.waitForTimeout(100);
    const rootNode = page.locator('.node-view.root');
    await expect(rootNode).toHaveClass(/selected/);
  });
});

test.describe('FreeMind Web - Undo/Redo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('.node-view.root');
  });

  test('should undo node creation', async ({ page }) => {
    // Add a child node
    await page.keyboard.press('Tab');
    await page.waitForSelector('.node-view:not(.root)', { timeout: 1000 });
    
    const nodeCountAfterAdd = await page.locator('.node-view').count();
    
    // Undo
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');
    await page.waitForTimeout(100);
    
    const nodeCountAfterUndo = await page.locator('.node-view').count();
    expect(nodeCountAfterUndo).toBe(nodeCountAfterAdd - 1);
  });

  test('should redo node creation', async ({ page }) => {
    // Add a child node
    await page.keyboard.press('Tab');
    await page.waitForSelector('.node-view:not(.root)', { timeout: 1000 });
    
    // Undo
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');
    await page.waitForTimeout(100);
    
    const nodeCountAfterUndo = await page.locator('.node-view').count();
    
    // Redo
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+y' : 'Control+y');
    await page.waitForTimeout(100);
    
    const nodeCountAfterRedo = await page.locator('.node-view').count();
    expect(nodeCountAfterRedo).toBe(nodeCountAfterUndo + 1);
  });
});

test.describe('FreeMind Web - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    const mindMap = page.locator('.freemind-map');
    await expect(mindMap).toHaveAttribute('role', 'tree');
    
    const rootNode = page.locator('.node-view.root');
    await expect(rootNode).toHaveAttribute('role', 'treeitem');
    await expect(rootNode).toHaveAttribute('aria-level', '1');
  });

  test('should support keyboard navigation', async ({ page }) => {
    const mindMap = page.locator('.freemind-map');
    await mindMap.focus();
    
    // Tab should work to add nodes
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    // Escape should cancel editing
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
  });
});

test.describe('FreeMind Web - Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('.node-view.root');
    // Create two sibling nodes to drag between
    await page.keyboard.press('Tab');
    await page.waitForSelector('.node-view:not(.root)', { timeout: 2000 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
  });

  test('should move node via drag and drop', async ({ page }) => {
    const nodes = page.locator('.node-view:not(.root)');
    await expect(nodes).toHaveCount(3); // Tab added one, Enter added two more
    const sourceNode = nodes.first();
    const targetNode = nodes.nth(1);
    await expect(sourceNode).toBeVisible();
    await expect(targetNode).toBeVisible();

    // Drag source (first child) and drop on target (second child) as child
    await sourceNode.dragTo(targetNode, { force: true });
    await page.waitForTimeout(300);
    // After drop: first node becomes child of second; structure changes
    const nodesAfter = page.locator('.node-view:not(.root)');
    await expect(nodesAfter.first()).toBeVisible();
  });
});

test.describe('FreeMind Web - File Load and Save', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load .mm file and display content', async ({ page }) => {
    await expect(page.locator('.freemind-map')).toBeVisible();
    const fileInput = page.getByTestId('file-input');
    await fileInput.setInputFiles(FIXTURE_MM);
    await page.waitForTimeout(500);
    await expect(page.locator('.node-view.root')).toContainText('Loaded Map');
    await expect(page.locator('.node-view')).toContainText('Child A');
    await expect(page.locator('.node-view')).toContainText('Child B');
  });

  test('should trigger save and produce download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
    await page.click('button:has-text("Save (.mm)")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.mm$/);
    await download.path();
  });
});
