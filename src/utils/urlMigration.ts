/**
 * URL Migration Utilities
 * Handles migration from legacy project URLs to new client-centric structure
 */

import { NavigateFunction } from 'react-router-dom';
import { Project } from '../types/database';
import { getClientProjectUrl, isLegacyProjectUrl, extractProjectIdFromLegacyUrl } from './navigation';

/**
 * Migrate a legacy project URL to the new client-centric format
 * @param oldUrl - The legacy URL (e.g., "/projects/123")
 * @param projects - Array of projects to find the client_id
 * @returns New URL or null if migration not possible
 */
export const migrateProjectUrl = (oldUrl: string, projects: Project[]): string | null => {
  if (!isLegacyProjectUrl(oldUrl)) {
    return null; // Not a legacy URL
  }

  const projectId = extractProjectIdFromLegacyUrl(oldUrl);
  if (!projectId) {
    return null; // Invalid URL format
  }

  const project = projects.find(p => p.id === projectId);
  if (!project) {
    return null; // Project not found
  }

  return getClientProjectUrl(project.client_id, project.id);
};

/**
 * Check if a URL needs migration
 * @param url - URL to check
 * @returns true if URL needs migration
 */
export const needsMigration = (url: string): boolean => {
  return isLegacyProjectUrl(url);
};

/**
 * Get migration target for a legacy URL
 * @param legacyUrl - Legacy URL to migrate
 * @param projects - Available projects
 * @returns Migration target info
 */
export const getMigrationTarget = (
  legacyUrl: string,
  projects: Project[]
): {
  needsMigration: boolean;
  newUrl: string | null;
  projectId: string | null;
  clientId: string | null;
} => {
  const needsMigration = isLegacyProjectUrl(legacyUrl);
  
  if (!needsMigration) {
    return {
      needsMigration: false,
      newUrl: null,
      projectId: null,
      clientId: null
    };
  }

  const projectId = extractProjectIdFromLegacyUrl(legacyUrl);
  if (!projectId) {
    return {
      needsMigration: true,
      newUrl: null,
      projectId: null,
      clientId: null
    };
  }

  const project = projects.find(p => p.id === projectId);
  if (!project) {
    return {
      needsMigration: true,
      newUrl: '/clients', // Fallback to clients list
      projectId,
      clientId: null
    };
  }

  return {
    needsMigration: true,
    newUrl: getClientProjectUrl(project.client_id, project.id),
    projectId,
    clientId: project.client_id
  };
};

/**
 * Update stored URLs in localStorage or other storage
 * This can be used to migrate bookmarks, recent items, etc.
 */
export const updateStoredUrls = (projects: Project[]): void => {
  try {
    // Update recent items in localStorage
    const recentItems = localStorage.getItem('recentItems');
    if (recentItems) {
      const items = JSON.parse(recentItems);
      const updatedItems = items.map((item: any) => {
        if (item.url && isLegacyProjectUrl(item.url)) {
          const newUrl = migrateProjectUrl(item.url, projects);
          return newUrl ? { ...item, url: newUrl } : item;
        }
        return item;
      });
      localStorage.setItem('recentItems', JSON.stringify(updatedItems));
    }

    // Update bookmarks if they exist
    const bookmarks = localStorage.getItem('bookmarks');
    if (bookmarks) {
      const bookmarkList = JSON.parse(bookmarks);
      const updatedBookmarks = bookmarkList.map((bookmark: any) => {
        if (bookmark.url && isLegacyProjectUrl(bookmark.url)) {
          const newUrl = migrateProjectUrl(bookmark.url, projects);
          return newUrl ? { ...bookmark, url: newUrl } : bookmark;
        }
        return bookmark;
      });
      localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
    }

    // Update last visited page
    const lastVisited = localStorage.getItem('lastVisitedPage');
    if (lastVisited && isLegacyProjectUrl(lastVisited)) {
      const newUrl = migrateProjectUrl(lastVisited, projects);
      if (newUrl) {
        localStorage.setItem('lastVisitedPage', newUrl);
      }
    }

    console.log('URL migration completed for stored URLs');
  } catch (error) {
    console.warn('Failed to update stored URLs:', error);
  }
};

/**
 * Batch migrate multiple URLs
 * @param urls - Array of URLs to migrate
 * @param projects - Available projects
 * @returns Array of migration results
 */
export const batchMigrateUrls = (
  urls: string[],
  projects: Project[]
): Array<{
  originalUrl: string;
  newUrl: string | null;
  migrated: boolean;
}> => {
  return urls.map(url => {
    const newUrl = migrateProjectUrl(url, projects);
    return {
      originalUrl: url,
      newUrl,
      migrated: newUrl !== null
    };
  });
};

/**
 * Get legacy URL patterns for cleanup
 * @returns Array of regex patterns that match legacy URLs
 */
export const getLegacyUrlPatterns = (): RegExp[] => {
  return [
    /^\/projects\/[^\/]+$/, // /projects/:id
    /^\/projects\/[^\/]+\/.*$/, // /projects/:id/anything
  ];
};

/**
 * Clean up legacy URL references in the application
 * This can be used during app initialization
 */
export const cleanupLegacyReferences = (): void => {
  try {
    // Remove any cached navigation state that might contain legacy URLs
    sessionStorage.removeItem('navigationState');
    
    // Clear any cached route data that might be outdated
    sessionStorage.removeItem('routeCache');
    
    console.log('Legacy URL references cleaned up');
  } catch (error) {
    console.warn('Failed to cleanup legacy references:', error);
  }
};

/**
 * Validate that a migrated URL is accessible
 * @param url - URL to validate
 * @param projects - Available projects for validation
 * @returns true if URL is valid and accessible
 */
export const validateMigratedUrl = (url: string, projects: Project[]): boolean => {
  // Check if it's a client URL
  const clientMatch = url.match(/^\/clients\/([^\/]+)$/);
  if (clientMatch) {
    return true; // Client URLs are always valid if they reach this point
  }

  // Check if it's a client project URL
  const projectMatch = url.match(/^\/clients\/([^\/]+)\/projects\/([^\/]+)$/);
  if (projectMatch) {
    const [, clientId, projectId] = projectMatch;
    const project = projects.find(p => p.id === projectId && p.client_id === clientId);
    return !!project;
  }

  return false;
};

/**
 * Get migration statistics for monitoring
 * @param urls - URLs to analyze
 * @param projects - Available projects
 * @returns Migration statistics
 */
export const getMigrationStats = (
  urls: string[],
  projects: Project[]
): {
  total: number;
  needsMigration: number;
  canMigrate: number;
  cannotMigrate: number;
  migrationRate: number;
} => {
  const results = batchMigrateUrls(urls, projects);
  const needsMigration = results.filter(r => isLegacyProjectUrl(r.originalUrl)).length;
  const canMigrate = results.filter(r => r.migrated).length;
  const cannotMigrate = needsMigration - canMigrate;
  
  return {
    total: urls.length,
    needsMigration,
    canMigrate,
    cannotMigrate,
    migrationRate: needsMigration > 0 ? (canMigrate / needsMigration) * 100 : 100
  };
};