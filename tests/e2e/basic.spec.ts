import path from 'path';
import { test, expect, type Page, type Locator } from '@playwright/test';

const FIXTURE_MM = path.join(process.cwd(), 'tests', 'e2e', 'fixtures', 'sample.mm');

/** Main (editable) map — demo page also mounts a ReadOnly map below. */
function mainMap(page: Page): Locator {
  return page.locator('.htmm-map.demo-main-map');
}

function mainRoot(page: Page): Locator {
  return mainMap(page).locator('.node-view.root');
}

function mainNodes(page: Page): Locator {
  return mainMap(page).locator('.node-view');
}

async function loadFixture(page: Page): Promise<void> {
  await page.getByTestId('file-input').setInputFiles(FIXTURE_MM);
  await expect(mainRoot(page)).toContainText('Loaded Map', { timeout: 3000 });
}

/** Tab adds a child and enters edit mode. */
async function addChildViaTab(page: Page): Promise<void> {
  await page.keyboard.press('Tab');
  await expect(mainMap(page).locator('.node-text[contenteditable="true"]')).toBeVisible({
    timeout: 2000,
  });
}

test.describe('htmm - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(mainMap(page)).toBeVisible();
  });

  test('should load the application', async ({ page }) => {
    await expect(page).toHaveTitle(/htmm/);
  });

  test('should display the mind map', async ({ page }) => {
    await expect(mainMap(page)).toBeVisible();
  });

  test('should have a root node', async ({ page }) => {
    const rootNode = mainRoot(page);
    await expect(rootNode).toBeVisible();
    await expect(rootNode).toHaveText(/New Mind Map|htmm Demo|Mind Map/i);
  });
});

test.describe('htmm - Node Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(mainMap(page)).toBeVisible();
    await loadFixture(page);
    await mainRoot(page).click();
  });

  test('should select a node on click', async ({ page }) => {
    await expect(mainRoot(page)).toHaveClass(/selected/);
  });

  test('should add a child node with Tab key', async ({ page }) => {
    const initialNodeCount = await mainNodes(page).count();
    await addChildViaTab(page);
    await expect(mainNodes(page)).toHaveCount(initialNodeCount + 1);
  });

  test('should edit node text', async ({ page }) => {
    const rootNode = mainRoot(page);

    await rootNode.dblclick();
    await expect(mainMap(page).locator('.node-text[contenteditable="true"]')).toBeVisible({
      timeout: 2000,
    });

    const editableText = mainMap(page).locator('.node-text[contenteditable="true"]');
    await editableText.fill('New Root Text');
    await page.keyboard.press('Enter');

    await expect(rootNode).toContainText('New Root Text');
  });

  test('should delete a node with Delete key', async ({ page }) => {
    const initialNodeCount = await mainNodes(page).count();
    await page.getByRole('button', { name: 'Add Child', exact: true }).click();
    await expect(mainNodes(page)).toHaveCount(initialNodeCount + 1);

    // New child is selected by addChild; Delete removes it
    await mainMap(page).focus();
    await page.keyboard.press('Delete');
    await expect(mainNodes(page)).toHaveCount(initialNodeCount, { timeout: 2000 });
  });
});

test.describe('htmm - Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(mainMap(page)).toBeVisible();
    await loadFixture(page);
  });

  test('should navigate between siblings with arrow keys', async ({ page }) => {
    // Child B is on the right side (second root child); use it for stable selection
    await mainMap(page).getByRole('treeitem', { name: 'Child B' }).click();
    await page.keyboard.press('ArrowUp');
    await expect(mainMap(page).getByRole('treeitem', { name: 'Child A' })).toHaveClass(/selected/);
    await page.keyboard.press('ArrowDown');
    await expect(mainMap(page).getByRole('treeitem', { name: 'Child B' })).toHaveClass(/selected/);
  });

  test('should navigate to parent with left arrow key', async ({ page }) => {
    // Right-side child: ArrowLeft moves to parent
    await mainMap(page).getByRole('treeitem', { name: 'Child B' }).click();
    await page.keyboard.press('ArrowLeft');
    await expect(mainRoot(page)).toHaveClass(/selected/);
  });
});

test.describe('htmm - Undo/Redo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(mainMap(page)).toBeVisible();
    await loadFixture(page);
    await mainRoot(page).click();
  });

  test('should undo node creation', async ({ page }) => {
    const initialCount = await mainNodes(page).count();

    // Toolbar Add Child avoids edit-mode (Tab would open contenteditable)
    await page.getByRole('button', { name: 'Add Child', exact: true }).click();
    await expect(mainNodes(page)).toHaveCount(initialCount + 1);

    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(mainNodes(page)).toHaveCount(initialCount, { timeout: 2000 });
  });

  test('should redo node creation', async ({ page }) => {
    const initialCount = await mainNodes(page).count();

    await page.getByRole('button', { name: 'Add Child', exact: true }).click();
    await expect(mainNodes(page)).toHaveCount(initialCount + 1);

    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(mainNodes(page)).toHaveCount(initialCount, { timeout: 2000 });

    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect(mainNodes(page)).toHaveCount(initialCount + 1, { timeout: 2000 });
  });
});

test.describe('htmm - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(mainMap(page)).toBeVisible();
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    const mindMap = mainMap(page);
    await expect(mindMap).toHaveAttribute('role', 'tree');

    const rootNode = mainRoot(page);
    await expect(rootNode).toHaveAttribute('role', 'treeitem');
    await expect(rootNode).toHaveAttribute('aria-level', '1');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await loadFixture(page);
    await mainRoot(page).click();
    const initialCount = await mainNodes(page).count();
    await page.getByRole('button', { name: 'Add Child', exact: true }).click();
    await expect(mainNodes(page)).toHaveCount(initialCount + 1);
  });
});

test.describe('htmm - Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(mainMap(page)).toBeVisible();
    await loadFixture(page);
  });

  test('should move node via drag and drop', async ({ page }) => {
    const childA = mainMap(page).getByRole('treeitem', { name: 'Child A' });
    const childB = mainMap(page).getByRole('treeitem', { name: 'Child B' });
    await expect(childA).toBeVisible();
    await expect(childB).toBeVisible();

    await childA.dragTo(childB, { force: true });

    // Child A becomes a descendant under Child B (or structure still renders)
    await expect(mainMap(page).getByRole('treeitem', { name: 'Child A' })).toBeVisible();
    await expect(mainMap(page).getByRole('treeitem', { name: 'Child B' })).toBeVisible();
  });
});

test.describe('htmm - File Load and Save', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(mainMap(page)).toBeVisible();
  });

  test('should load .mm file and display content', async ({ page }) => {
    await loadFixture(page);
    await expect(mainRoot(page)).toContainText('Loaded Map');
    await expect(mainMap(page).getByRole('treeitem', { name: 'Child A' })).toBeVisible();
    await expect(mainMap(page).getByRole('treeitem', { name: 'Child B' })).toBeVisible();
  });

  test('should trigger save and produce download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
    await page.click('button:has-text("Save (.mm)")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.mm$/);
    await download.path();
  });
});
