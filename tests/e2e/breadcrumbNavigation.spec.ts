import { test, expect } from '@playwright/test';

test.describe('Breadcrumb Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/rest/v1/clients*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'client-1',
            name: 'Acme Corporation',
            email: 'contact@acme.com',
            phone: '555-0123',
            status: 'active',
            entity_type: 'business',
            notes: 'Large enterprise client',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ])
      });
    });

    await page.route('**/rest/v1/projects*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'project-1',
            client_id: 'client-1',
            name: 'Q4 2024 Tax Analysis',
            type: 'nexus_analysis',
            status: 'in_progress',
            amount: 15000,
            estimated_hours: 40,
            actual_hours: 25,
            due_date: '2024-12-31',
            notes: 'Complex multi-state analysis',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ])
      });
    });

    await page.route('**/rest/v1/revenue_entries*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display correct breadcrumbs on client details page', async ({ page }) => {
    // Navigate to client details
    await page.goto('/clients/client-1');
    await page.waitForLoadState('networkidle');

    // Check breadcrumbs
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs).toBeVisible();

    // Verify breadcrumb items
    await expect(breadcrumbs.locator('text=Dashboard')).toBeVisible();
    await expect(breadcrumbs.locator('text=Clients')).toBeVisible();
    await expect(breadcrumbs.locator('text=Acme Corporation')).toBeVisible();

    // Verify the current page (client name) is not a link
    const clientCrumb = breadcrumbs.locator('text=Acme Corporation');
    await expect(clientCrumb).toHaveClass(/font-medium/);
  });

  test('should display correct breadcrumbs on project details page', async ({ page }) => {
    // Navigate to project details
    await page.goto('/clients/client-1/projects/project-1');
    await page.waitForLoadState('networkidle');

    // Check breadcrumbs
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs).toBeVisible();

    // Verify all breadcrumb items
    await expect(breadcrumbs.locator('text=Dashboard')).toBeVisible();
    await expect(breadcrumbs.locator('text=Clients')).toBeVisible();
    await expect(breadcrumbs.locator('text=Acme Corporation')).toBeVisible();
    await expect(breadcrumbs.locator('text=Q4 2024 Tax Analysis')).toBeVisible();

    // Verify the current page (project name) is not a link
    const projectCrumb = breadcrumbs.locator('text=Q4 2024 Tax Analysis');
    await expect(projectCrumb).toHaveClass(/font-medium/);
  });

  test('should navigate correctly when clicking breadcrumb links', async ({ page }) => {
    // Start on project details page
    await page.goto('/clients/client-1/projects/project-1');
    await page.waitForLoadState('networkidle');

    // Click on Dashboard breadcrumb
    await page.click('nav[aria-label="Breadcrumb"] button:has-text("Dashboard")');
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('Tax Agency Dashboard');

    // Navigate back to project
    await page.goto('/clients/client-1/projects/project-1');
    await page.waitForLoadState('networkidle');

    // Click on Clients breadcrumb
    await page.click('nav[aria-label="Breadcrumb"] button:has-text("Clients")');
    await page.waitForURL('**/clients');
    await expect(page.locator('h1')).toContainText('Clients');

    // Navigate back to project
    await page.goto('/clients/client-1/projects/project-1');
    await page.waitForLoadState('networkidle');

    // Click on client name breadcrumb
    await page.click('nav[aria-label="Breadcrumb"] button:has-text("Acme Corporation")');
    await page.waitForURL('**/clients/client-1');
    await expect(page.locator('h1')).toContainText('Acme Corporation');
  });

  test('should show breadcrumb separators correctly', async ({ page }) => {
    // Navigate to project details
    await page.goto('/clients/client-1/projects/project-1');
    await page.waitForLoadState('networkidle');

    // Check for breadcrumb separators
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    const separators = breadcrumbs.locator('span:has-text("/")');
    
    // Should have 3 separators for 4 breadcrumb items
    await expect(separators).toHaveCount(3);
  });

  test('should handle breadcrumbs with special characters in names', async ({ page }) => {
    // Mock client with special characters
    await page.route('**/rest/v1/clients*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'client-special',
            name: 'Johnson & Associates LLC',
            email: 'contact@johnson.com',
            phone: '555-0123',
            status: 'active',
            entity_type: 'business',
            notes: 'Client with special characters',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ])
      });
    });

    await page.route('**/rest/v1/projects*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'project-special',
            client_id: 'client-special',
            name: 'Multi-State Analysis (Q4 2024)',
            type: 'nexus_analysis',
            status: 'in_progress',
            amount: 15000,
            estimated_hours: 40,
            actual_hours: 25,
            due_date: '2024-12-31',
            notes: 'Project with special characters',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ])
      });
    });

    // Navigate to project with special characters
    await page.goto('/clients/client-special/projects/project-special');
    await page.waitForLoadState('networkidle');

    // Verify breadcrumbs display special characters correctly
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs.locator('text=Johnson & Associates LLC')).toBeVisible();
    await expect(breadcrumbs.locator('text=Multi-State Analysis (Q4 2024)')).toBeVisible();
  });

  test('should handle very long breadcrumb names gracefully', async ({ page }) => {
    // Mock client with very long name
    await page.route('**/rest/v1/clients*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'client-long',
            name: 'Very Long Client Name That Might Cause Display Issues In The User Interface',
            email: 'contact@longname.com',
            phone: '555-0123',
            status: 'active',
            entity_type: 'business',
            notes: 'Client with very long name',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ])
      });
    });

    await page.route('**/rest/v1/projects*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'project-long',
            client_id: 'client-long',
            name: 'Very Long Project Name That Might Also Cause Display Issues',
            type: 'nexus_analysis',
            status: 'in_progress',
            amount: 15000,
            estimated_hours: 40,
            actual_hours: 25,
            due_date: '2024-12-31',
            notes: 'Project with very long name',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ])
      });
    });

    // Navigate to project with long names
    await page.goto('/clients/client-long/projects/project-long');
    await page.waitForLoadState('networkidle');

    // Verify breadcrumbs are still functional despite long names
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs).toBeVisible();

    // Check that breadcrumbs don't overflow the container
    const breadcrumbsBox = await breadcrumbs.boundingBox();
    const pageBox = await page.locator('body').boundingBox();
    
    if (breadcrumbsBox && pageBox) {
      expect(breadcrumbsBox.width).toBeLessThanOrEqual(pageBox.width);
    }

    // Verify navigation still works
    await page.click('nav[aria-label="Breadcrumb"] button:has-text("Clients")');
    await page.waitForURL('**/clients');
  });

  test('should maintain breadcrumb state during page interactions', async ({ page }) => {
    // Navigate to project details
    await page.goto('/clients/client-1/projects/project-1');
    await page.waitForLoadState('networkidle');

    // Verify initial breadcrumbs
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs.locator('text=Acme Corporation')).toBeVisible();

    // Interact with page content (e.g., switch tabs)
    await page.click('text=Revenue');
    
    // Verify breadcrumbs remain unchanged
    await expect(breadcrumbs.locator('text=Dashboard')).toBeVisible();
    await expect(breadcrumbs.locator('text=Clients')).toBeVisible();
    await expect(breadcrumbs.locator('text=Acme Corporation')).toBeVisible();
    await expect(breadcrumbs.locator('text=Q4 2024 Tax Analysis')).toBeVisible();
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    // Navigate to project details
    await page.goto('/clients/client-1/projects/project-1');
    await page.waitForLoadState('networkidle');

    // Tab to breadcrumb navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need to adjust based on page structure

    // Find the first breadcrumb link
    const dashboardLink = page.locator('nav[aria-label="Breadcrumb"] button:has-text("Dashboard")');
    await dashboardLink.focus();

    // Verify it's focused
    await expect(dashboardLink).toBeFocused();

    // Press Enter to navigate
    await page.keyboard.press('Enter');
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('Tax Agency Dashboard');
  });

  test('should handle missing client data gracefully', async ({ page }) => {
    // Mock empty client response
    await page.route('**/rest/v1/clients*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Navigate to client that doesn't exist
    await page.goto('/clients/nonexistent-client');
    await page.waitForLoadState('networkidle');

    // Should show error state or redirect, but breadcrumbs should still be functional
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    
    // Basic breadcrumbs should still work
    if (await breadcrumbs.isVisible()) {
      await page.click('nav[aria-label="Breadcrumb"] button:has-text("Clients")');
      await page.waitForURL('**/clients');
    }
  });
});