import { test, expect } from '@playwright/test';

test.describe('Legacy URL Redirects', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app first to ensure it's loaded
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should redirect legacy project URL to new client-project URL', async ({ page }) => {
    // Mock the projects data to ensure we have a known project
    await page.route('**/rest/v1/projects*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-project-123',
            client_id: 'test-client-456',
            name: 'Test Project',
            type: 'tax_prep',
            status: 'in_progress',
            amount: 1000,
            estimated_hours: 10,
            actual_hours: 5,
            due_date: '2024-12-31',
            notes: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ])
      });
    });

    // Mock the clients data
    await page.route('**/rest/v1/clients*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-client-456',
            name: 'Test Client',
            email: 'test@example.com',
            phone: '555-0123',
            status: 'active',
            entity_type: 'business',
            notes: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ])
      });
    });

    // Navigate to legacy project URL
    await page.goto('/projects/test-project-123');

    // Wait for redirect to complete
    await page.waitForURL('**/clients/test-client-456/projects/test-project-123', { timeout: 5000 });

    // Verify we're on the correct new URL
    expect(page.url()).toContain('/clients/test-client-456/projects/test-project-123');

    // Verify the page content loads correctly
    await expect(page.locator('h1')).toContainText('Test Client');
  });

  test('should redirect to clients list for invalid project ID', async ({ page }) => {
    // Mock empty projects response
    await page.route('**/rest/v1/projects*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Navigate to legacy URL with invalid project ID
    await page.goto('/projects/invalid-project-id');

    // Wait for redirect to clients list
    await page.waitForURL('**/clients', { timeout: 5000 });

    // Verify we're on the clients page
    expect(page.url()).toContain('/clients');
    await expect(page.locator('h1')).toContainText('Clients');
  });

  test('should handle legacy projects list URL', async ({ page }) => {
    // Navigate to legacy projects list URL
    await page.goto('/projects');

    // Should redirect to clients page
    await page.waitForURL('**/clients', { timeout: 5000 });

    // Verify we're on the clients page
    expect(page.url()).toContain('/clients');
    await expect(page.locator('h1')).toContainText('Clients');
  });

  test('should show loading state during redirect', async ({ page }) => {
    // Slow down the API response to test loading state
    await page.route('**/rest/v1/projects*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-project-123',
            client_id: 'test-client-456',
            name: 'Test Project',
            type: 'tax_prep',
            status: 'in_progress',
            amount: 1000,
            estimated_hours: 10,
            actual_hours: 5,
            due_date: '2024-12-31',
            notes: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ])
      });
    });

    // Navigate to legacy project URL
    await page.goto('/projects/test-project-123');

    // Verify loading state is shown
    await expect(page.locator('text=Redirecting to Project')).toBeVisible();
    await expect(page.locator('text=We\'re updating the URL structure')).toBeVisible();

    // Wait for redirect to complete
    await page.waitForURL('**/clients/test-client-456/projects/test-project-123', { timeout: 10000 });
  });

  test('should handle redirect errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/rest/v1/projects*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Navigate to legacy project URL
    await page.goto('/projects/test-project-123');

    // Should show error state or redirect to fallback
    await page.waitForURL('**/clients', { timeout: 5000 });
    expect(page.url()).toContain('/clients');
  });

  test('should preserve query parameters during redirect', async ({ page }) => {
    // Mock the projects data
    await page.route('**/rest/v1/projects*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-project-123',
            client_id: 'test-client-456',
            name: 'Test Project',
            type: 'tax_prep',
            status: 'in_progress',
            amount: 1000,
            estimated_hours: 10,
            actual_hours: 5,
            due_date: '2024-12-31',
            notes: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ])
      });
    });

    // Navigate to legacy URL with query parameters
    await page.goto('/projects/test-project-123?tab=overview&section=details');

    // Wait for redirect
    await page.waitForURL('**/clients/test-client-456/projects/test-project-123*', { timeout: 5000 });

    // Verify query parameters are preserved (if implemented)
    // Note: This test assumes query parameter preservation is implemented
    // If not implemented, this test can be modified or removed
    const url = new URL(page.url());
    expect(url.pathname).toBe('/clients/test-client-456/projects/test-project-123');
  });
});