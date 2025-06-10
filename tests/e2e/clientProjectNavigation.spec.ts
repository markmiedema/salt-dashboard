import { test, expect } from '@playwright/test';

test.describe('Client-Project Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API responses for consistent testing
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
          },
          {
            id: 'client-2',
            name: 'John Smith',
            email: 'john@example.com',
            phone: '555-0456',
            status: 'active',
            entity_type: 'individual',
            notes: 'Individual tax client',
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
          },
          {
            id: 'project-2',
            client_id: 'client-2',
            name: '2024 Individual Return',
            type: 'tax_prep',
            status: 'pending',
            amount: 2500,
            estimated_hours: 8,
            actual_hours: 0,
            due_date: '2024-04-15',
            notes: 'Standard individual return',
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

    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate from dashboard to client details', async ({ page }) => {
    // Start on dashboard
    await expect(page.locator('h1')).toContainText('Tax Agency Dashboard');

    // Click on Clients in navigation
    await page.click('text=Clients');
    await page.waitForURL('**/clients');

    // Verify we're on clients page
    await expect(page.locator('h1')).toContainText('Clients');

    // Click on a specific client
    await page.click('text=Acme Corporation');
    await page.waitForURL('**/clients/client-1');

    // Verify we're on client details page
    await expect(page.locator('h1')).toContainText('Acme Corporation');
  });

  test('should navigate from client details to project details', async ({ page }) => {
    // Navigate directly to client details
    await page.goto('/clients/client-1');
    await page.waitForLoadState('networkidle');

    // Verify we're on client details page
    await expect(page.locator('h1')).toContainText('Acme Corporation');

    // Click on Projects tab
    await page.click('text=Projects');

    // Click on a specific project
    await page.click('text=Q4 2024 Tax Analysis');
    await page.waitForURL('**/clients/client-1/projects/project-1');

    // Verify we're on project details page
    await expect(page.locator('h1')).toContainText('Q4 2024 Tax Analysis');
  });

  test('should show correct breadcrumbs in navigation', async ({ page }) => {
    // Navigate to project details
    await page.goto('/clients/client-1/projects/project-1');
    await page.waitForLoadState('networkidle');

    // Check breadcrumbs
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs).toBeVisible();

    // Verify breadcrumb structure
    await expect(breadcrumbs.locator('text=Dashboard')).toBeVisible();
    await expect(breadcrumbs.locator('text=Clients')).toBeVisible();
    await expect(breadcrumbs.locator('text=Acme Corporation')).toBeVisible();
    await expect(breadcrumbs.locator('text=Q4 2024 Tax Analysis')).toBeVisible();
  });

  test('should navigate using breadcrumbs', async ({ page }) => {
    // Navigate to project details
    await page.goto('/clients/client-1/projects/project-1');
    await page.waitForLoadState('networkidle');

    // Click on Clients breadcrumb
    await page.click('nav[aria-label="Breadcrumb"] text=Clients');
    await page.waitForURL('**/clients');

    // Verify we're back on clients page
    await expect(page.locator('h1')).toContainText('Clients');

    // Navigate back to project
    await page.goto('/clients/client-1/projects/project-1');
    await page.waitForLoadState('networkidle');

    // Click on client name breadcrumb
    await page.click('nav[aria-label="Breadcrumb"] text=Acme Corporation');
    await page.waitForURL('**/clients/client-1');

    // Verify we're on client details page
    await expect(page.locator('h1')).toContainText('Acme Corporation');
  });

  test('should navigate from dashboard project pipeline', async ({ page }) => {
    // Start on dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Find and click on a project in the pipeline
    const projectPipeline = page.locator('text=Project Pipeline').locator('..');
    await expect(projectPipeline).toBeVisible();

    // Click on a project item (look for project name)
    await page.click('text=Q4 2024 Tax Analysis');
    await page.waitForURL('**/clients/client-1/projects/project-1');

    // Verify we're on the correct project page
    await expect(page.locator('h1')).toContainText('Q4 2024 Tax Analysis');
  });

  test('should handle back navigation correctly', async ({ page }) => {
    // Navigate through the flow
    await page.goto('/clients');
    await page.click('text=Acme Corporation');
    await page.waitForURL('**/clients/client-1');

    await page.click('text=Projects');
    await page.click('text=Q4 2024 Tax Analysis');
    await page.waitForURL('**/clients/client-1/projects/project-1');

    // Use browser back button
    await page.goBack();
    await page.waitForURL('**/clients/client-1');
    await expect(page.locator('h1')).toContainText('Acme Corporation');

    // Go back again
    await page.goBack();
    await page.waitForURL('**/clients');
    await expect(page.locator('h1')).toContainText('Clients');
  });

  test('should show active navigation state correctly', async ({ page }) => {
    // Navigate to clients page
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');

    // Check that Clients tab is active in header
    const clientsTab = page.locator('nav button:has-text("Clients")');
    await expect(clientsTab).toHaveClass(/bg-blue-50/);

    // Navigate to client details (should still show Clients as active)
    await page.goto('/clients/client-1');
    await page.waitForLoadState('networkidle');

    await expect(clientsTab).toHaveClass(/bg-blue-50/);

    // Navigate to project details (should still show Clients as active)
    await page.goto('/clients/client-1/projects/project-1');
    await page.waitForLoadState('networkidle');

    await expect(clientsTab).toHaveClass(/bg-blue-50/);
  });

  test('should handle direct URL access to nested routes', async ({ page }) => {
    // Navigate directly to project details URL
    await page.goto('/clients/client-1/projects/project-1');
    await page.waitForLoadState('networkidle');

    // Verify the page loads correctly
    await expect(page.locator('h1')).toContainText('Q4 2024 Tax Analysis');

    // Verify breadcrumbs are correct
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs.locator('text=Acme Corporation')).toBeVisible();
  });

  test('should handle 404 for invalid client/project combinations', async ({ page }) => {
    // Navigate to invalid client ID
    await page.goto('/clients/invalid-client-id');
    await page.waitForLoadState('networkidle');

    // Should show client not found or redirect
    await expect(page.locator('text=Client Not Found')).toBeVisible();

    // Navigate to valid client but invalid project
    await page.goto('/clients/client-1/projects/invalid-project-id');
    await page.waitForLoadState('networkidle');

    // Should show project not found or redirect
    await expect(page.locator('text=Project Not Found')).toBeVisible();
  });

  test('should maintain URL structure consistency', async ({ page }) => {
    // Test various navigation paths lead to consistent URLs
    
    // Path 1: Dashboard -> Clients -> Client -> Project
    await page.goto('/dashboard');
    await page.click('text=Clients');
    await page.click('text=Acme Corporation');
    await page.click('text=Projects');
    await page.click('text=Q4 2024 Tax Analysis');
    
    const url1 = page.url();
    expect(url1).toContain('/clients/client-1/projects/project-1');

    // Path 2: Direct navigation
    await page.goto('/clients/client-1/projects/project-1');
    
    const url2 = page.url();
    expect(url1).toBe(url2);

    // Path 3: From dashboard project pipeline
    await page.goto('/dashboard');
    await page.click('text=Q4 2024 Tax Analysis');
    
    const url3 = page.url();
    expect(url1).toBe(url3);
  });
});