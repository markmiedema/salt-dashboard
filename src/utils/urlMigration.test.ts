import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Project } from '../types/database';
import {
  migrateProjectUrl,
  needsMigration,
  getMigrationTarget,
  updateStoredUrls,
  batchMigrateUrls,
  validateMigratedUrl,
  getMigrationStats,
  cleanupLegacyReferences
} from './urlMigration';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

describe('URL Migration Utilities', () => {
  const mockProjects: Project[] = [
    {
      id: 'project-1',
      client_id: 'client-1',
      name: 'Test Project 1',
      type: 'tax_prep',
      status: 'in_progress',
      amount: 1000,
      estimated_hours: 10,
      actual_hours: 5,
      due_date: '2024-12-31',
      notes: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'project-2',
      client_id: 'client-2',
      name: 'Test Project 2',
      type: 'advisory',
      status: 'completed',
      amount: 2000,
      estimated_hours: 20,
      actual_hours: 18,
      due_date: null,
      notes: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('migrateProjectUrl', () => {
    it('should migrate legacy project URL to new format', () => {
      const legacyUrl = '/projects/project-1';
      const result = migrateProjectUrl(legacyUrl, mockProjects);
      expect(result).toBe('/clients/client-1/projects/project-1');
    });

    it('should return null for non-legacy URLs', () => {
      const modernUrl = '/clients/client-1/projects/project-1';
      const result = migrateProjectUrl(modernUrl, mockProjects);
      expect(result).toBeNull();
    });

    it('should return null for invalid project ID', () => {
      const invalidUrl = '/projects/invalid-project';
      const result = migrateProjectUrl(invalidUrl, mockProjects);
      expect(result).toBeNull();
    });

    it('should return null for malformed URLs', () => {
      const malformedUrl = '/projects/';
      const result = migrateProjectUrl(malformedUrl, mockProjects);
      expect(result).toBeNull();
    });

    it('should handle projects list URL', () => {
      const projectsListUrl = '/projects';
      const result = migrateProjectUrl(projectsListUrl, mockProjects);
      expect(result).toBeNull();
    });
  });

  describe('needsMigration', () => {
    it('should return true for legacy project URLs', () => {
      expect(needsMigration('/projects/project-1')).toBe(true);
      expect(needsMigration('/projects/abc-123')).toBe(true);
    });

    it('should return false for modern URLs', () => {
      expect(needsMigration('/clients/client-1')).toBe(false);
      expect(needsMigration('/clients/client-1/projects/project-1')).toBe(false);
      expect(needsMigration('/dashboard')).toBe(false);
      expect(needsMigration('/reports')).toBe(false);
    });

    it('should return false for projects list URL', () => {
      expect(needsMigration('/projects')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(needsMigration('')).toBe(false);
      expect(needsMigration('/projects/')).toBe(false);
      expect(needsMigration('/project/123')).toBe(false); // Missing 's'
    });
  });

  describe('getMigrationTarget', () => {
    it('should return correct migration target for valid project', () => {
      const result = getMigrationTarget('/projects/project-1', mockProjects);
      expect(result).toEqual({
        needsMigration: true,
        newUrl: '/clients/client-1/projects/project-1',
        projectId: 'project-1',
        clientId: 'client-1'
      });
    });

    it('should return fallback URL for invalid project', () => {
      const result = getMigrationTarget('/projects/invalid-project', mockProjects);
      expect(result).toEqual({
        needsMigration: true,
        newUrl: '/clients',
        projectId: 'invalid-project',
        clientId: null
      });
    });

    it('should return no migration needed for modern URLs', () => {
      const result = getMigrationTarget('/clients/client-1', mockProjects);
      expect(result).toEqual({
        needsMigration: false,
        newUrl: null,
        projectId: null,
        clientId: null
      });
    });

    it('should handle malformed legacy URLs', () => {
      const result = getMigrationTarget('/projects/', mockProjects);
      expect(result).toEqual({
        needsMigration: false,
        newUrl: null,
        projectId: null,
        clientId: null
      });
    });
  });

  describe('batchMigrateUrls', () => {
    it('should migrate multiple URLs correctly', () => {
      const urls = [
        '/projects/project-1',
        '/projects/project-2',
        '/projects/invalid-project',
        '/clients/client-1'
      ];

      const results = batchMigrateUrls(urls, mockProjects);

      expect(results).toEqual([
        {
          originalUrl: '/projects/project-1',
          newUrl: '/clients/client-1/projects/project-1',
          migrated: true
        },
        {
          originalUrl: '/projects/project-2',
          newUrl: '/clients/client-2/projects/project-2',
          migrated: true
        },
        {
          originalUrl: '/projects/invalid-project',
          newUrl: null,
          migrated: false
        },
        {
          originalUrl: '/clients/client-1',
          newUrl: null,
          migrated: false
        }
      ]);
    });

    it('should handle empty URL array', () => {
      const results = batchMigrateUrls([], mockProjects);
      expect(results).toEqual([]);
    });

    it('should handle URLs with additional path segments', () => {
      const urls = ['/projects/project-1/edit', '/projects/project-2/details'];
      const results = batchMigrateUrls(urls, mockProjects);

      expect(results[0].newUrl).toBe('/clients/client-1/projects/project-1');
      expect(results[1].newUrl).toBe('/clients/client-2/projects/project-2');
    });
  });

  describe('validateMigratedUrl', () => {
    it('should validate client URLs', () => {
      expect(validateMigratedUrl('/clients/client-1', mockProjects)).toBe(true);
      expect(validateMigratedUrl('/clients/any-client', mockProjects)).toBe(true);
    });

    it('should validate client project URLs', () => {
      expect(validateMigratedUrl('/clients/client-1/projects/project-1', mockProjects)).toBe(true);
      expect(validateMigratedUrl('/clients/client-2/projects/project-2', mockProjects)).toBe(true);
    });

    it('should reject invalid client project URLs', () => {
      expect(validateMigratedUrl('/clients/client-1/projects/invalid-project', mockProjects)).toBe(false);
      expect(validateMigratedUrl('/clients/invalid-client/projects/project-1', mockProjects)).toBe(false);
    });

    it('should reject other URLs', () => {
      expect(validateMigratedUrl('/dashboard', mockProjects)).toBe(false);
      expect(validateMigratedUrl('/reports', mockProjects)).toBe(false);
      expect(validateMigratedUrl('/invalid', mockProjects)).toBe(false);
    });

    it('should handle malformed URLs', () => {
      expect(validateMigratedUrl('/clients/', mockProjects)).toBe(false);
      expect(validateMigratedUrl('/clients/client-1/projects/', mockProjects)).toBe(false);
      expect(validateMigratedUrl('', mockProjects)).toBe(false);
    });
  });

  describe('getMigrationStats', () => {
    it('should calculate migration statistics correctly', () => {
      const urls = [
        '/projects/project-1',
        '/projects/project-2',
        '/projects/invalid-project',
        '/clients/client-1',
        '/dashboard'
      ];

      const stats = getMigrationStats(urls, mockProjects);

      expect(stats).toEqual({
        total: 5,
        needsMigration: 3,
        canMigrate: 2,
        cannotMigrate: 1,
        migrationRate: (2 / 3) * 100
      });
    });

    it('should handle empty URL list', () => {
      const stats = getMigrationStats([], mockProjects);

      expect(stats).toEqual({
        total: 0,
        needsMigration: 0,
        canMigrate: 0,
        cannotMigrate: 0,
        migrationRate: 100
      });
    });

    it('should handle all modern URLs', () => {
      const urls = ['/clients/client-1', '/dashboard', '/reports'];
      const stats = getMigrationStats(urls, mockProjects);

      expect(stats).toEqual({
        total: 3,
        needsMigration: 0,
        canMigrate: 0,
        cannotMigrate: 0,
        migrationRate: 100
      });
    });

    it('should handle all legacy URLs that can migrate', () => {
      const urls = ['/projects/project-1', '/projects/project-2'];
      const stats = getMigrationStats(urls, mockProjects);

      expect(stats).toEqual({
        total: 2,
        needsMigration: 2,
        canMigrate: 2,
        cannotMigrate: 0,
        migrationRate: 100
      });
    });
  });

  describe('updateStoredUrls', () => {
    it('should update recent items in localStorage', () => {
      const recentItems = [
        { id: '1', name: 'Item 1', url: '/projects/project-1' },
        { id: '2', name: 'Item 2', url: '/clients/client-1' },
        { id: '3', name: 'Item 3', url: '/projects/invalid-project' }
      ];

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'recentItems') return JSON.stringify(recentItems);
        return null;
      });

      updateStoredUrls(mockProjects);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'recentItems',
        JSON.stringify([
          { id: '1', name: 'Item 1', url: '/clients/client-1/projects/project-1' },
          { id: '2', name: 'Item 2', url: '/clients/client-1' },
          { id: '3', name: 'Item 3', url: '/projects/invalid-project' } // Unchanged because migration failed
        ])
      );
    });

    it('should update bookmarks in localStorage', () => {
      const bookmarks = [
        { id: '1', title: 'Bookmark 1', url: '/projects/project-2' },
        { id: '2', title: 'Bookmark 2', url: '/dashboard' }
      ];

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'bookmarks') return JSON.stringify(bookmarks);
        return null;
      });

      updateStoredUrls(mockProjects);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bookmarks',
        JSON.stringify([
          { id: '1', title: 'Bookmark 1', url: '/clients/client-2/projects/project-2' },
          { id: '2', title: 'Bookmark 2', url: '/dashboard' }
        ])
      );
    });

    it('should update last visited page', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'lastVisitedPage') return '/projects/project-1';
        return null;
      });

      updateStoredUrls(mockProjects);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'lastVisitedPage',
        '/clients/client-1/projects/project-1'
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw
      expect(() => updateStoredUrls(mockProjects)).not.toThrow();
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'recentItems') return 'invalid json';
        return null;
      });

      // Should not throw
      expect(() => updateStoredUrls(mockProjects)).not.toThrow();
    });

    it('should skip migration for non-legacy URLs', () => {
      const recentItems = [
        { id: '1', name: 'Item 1', url: '/clients/client-1' },
        { id: '2', name: 'Item 2', url: '/dashboard' }
      ];

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'recentItems') return JSON.stringify(recentItems);
        return null;
      });

      updateStoredUrls(mockProjects);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'recentItems',
        JSON.stringify(recentItems) // Unchanged
      );
    });
  });

  describe('cleanupLegacyReferences', () => {
    it('should remove legacy session storage items', () => {
      cleanupLegacyReferences();

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('navigationState');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('routeCache');
    });

    it('should handle session storage errors gracefully', () => {
      sessionStorageMock.removeItem.mockImplementation(() => {
        throw new Error('sessionStorage error');
      });

      // Should not throw
      expect(() => cleanupLegacyReferences()).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete migration workflow', () => {
      const legacyUrls = [
        '/projects/project-1',
        '/projects/project-2',
        '/projects/invalid-project'
      ];

      // Check which URLs need migration
      const needsMigrationResults = legacyUrls.map(url => needsMigration(url));
      expect(needsMigrationResults).toEqual([true, true, true]);

      // Perform batch migration
      const migrationResults = batchMigrateUrls(legacyUrls, mockProjects);
      expect(migrationResults.filter(r => r.migrated)).toHaveLength(2);

      // Validate migrated URLs
      const validatedResults = migrationResults
        .filter(r => r.migrated && r.newUrl)
        .map(r => validateMigratedUrl(r.newUrl!, mockProjects));
      expect(validatedResults).toEqual([true, true]);

      // Get migration statistics
      const stats = getMigrationStats(legacyUrls, mockProjects);
      expect(stats.migrationRate).toBeCloseTo(66.67, 1);
    });

    it('should handle mixed URL scenarios', () => {
      const mixedUrls = [
        '/projects/project-1',           // Legacy - can migrate
        '/clients/client-1',             // Modern - no migration needed
        '/projects/invalid-project',     // Legacy - cannot migrate
        '/dashboard',                    // Modern - no migration needed
        '/projects/project-2'            // Legacy - can migrate
      ];

      const stats = getMigrationStats(mixedUrls, mockProjects);
      expect(stats).toEqual({
        total: 5,
        needsMigration: 3,
        canMigrate: 2,
        cannotMigrate: 1,
        migrationRate: (2 / 3) * 100
      });
    });
  });
});