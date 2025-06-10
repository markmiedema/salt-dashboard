import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from './useAdvancedData';
import { getMigrationTarget } from '../utils/urlMigration';

/**
 * Hook to handle project redirects from legacy URLs
 * Fetches project data and redirects to the new client-centric URL structure
 */
export const useProjectRedirect = (projectId: string | undefined) => {
  const navigate = useNavigate();
  const { projects, loading } = useProjects();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && projectId && !redirecting) {
      setRedirecting(true);
      
      try {
        const legacyUrl = `/projects/${projectId}`;
        const migrationTarget = getMigrationTarget(legacyUrl, projects);
        
        if (migrationTarget.newUrl) {
          // Successful migration - redirect to new URL
          navigate(migrationTarget.newUrl, { replace: true });
        } else if (migrationTarget.projectId && !migrationTarget.clientId) {
          // Project ID exists but project not found - redirect to clients
          console.warn(`Project ${projectId} not found, redirecting to clients list`);
          navigate('/clients', { replace: true });
        } else {
          // Invalid project ID format
          setError('Invalid project URL format');
          navigate('/clients', { replace: true });
        }
      } catch (err) {
        console.error('Error during project redirect:', err);
        setError('Failed to redirect to project');
        navigate('/clients', { replace: true });
      }
    }
  }, [projectId, projects, loading, navigate, redirecting]);

  return {
    loading: loading || redirecting,
    error
  };
};

/**
 * Hook to handle bulk URL migration for stored references
 * Useful for migrating bookmarks, recent items, etc.
 */
export const useUrlMigration = () => {
  const { projects, loading } = useProjects();
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    if (!loading && projects.length > 0 && !migrationComplete) {
      // Import the migration function dynamically to avoid circular dependencies
      import('../utils/urlMigration').then(({ updateStoredUrls }) => {
        updateStoredUrls(projects);
        setMigrationComplete(true);
      });
    }
  }, [projects, loading, migrationComplete]);

  return {
    migrationComplete,
    loading
  };
};

/**
 * Hook to validate and migrate a single URL
 */
export const useUrlValidator = (url: string) => {
  const { projects, loading } = useProjects();
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    needsMigration: boolean;
    migratedUrl: string | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!loading && url) {
      import('../utils/urlMigration').then(({ getMigrationTarget, validateMigratedUrl }) => {
        try {
          const migrationTarget = getMigrationTarget(url, projects);
          
          if (!migrationTarget.needsMigration) {
            // URL doesn't need migration, check if it's valid as-is
            setValidationResult({
              isValid: true,
              needsMigration: false,
              migratedUrl: null,
              error: null
            });
          } else if (migrationTarget.newUrl) {
            // URL can be migrated
            const isValid = validateMigratedUrl(migrationTarget.newUrl, projects);
            setValidationResult({
              isValid,
              needsMigration: true,
              migratedUrl: migrationTarget.newUrl,
              error: isValid ? null : 'Migrated URL is not accessible'
            });
          } else {
            // URL cannot be migrated
            setValidationResult({
              isValid: false,
              needsMigration: true,
              migratedUrl: null,
              error: 'URL cannot be migrated - project not found'
            });
          }
        } catch (err) {
          setValidationResult({
            isValid: false,
            needsMigration: false,
            migratedUrl: null,
            error: 'Failed to validate URL'
          });
        }
      });
    }
  }, [url, projects, loading]);

  return {
    validationResult,
    loading
  };
};

/**
 * Hook to get migration statistics for monitoring
 */
export const useMigrationStats = (urls: string[]) => {
  const { projects, loading } = useProjects();
  const [stats, setStats] = useState<{
    total: number;
    needsMigration: number;
    canMigrate: number;
    cannotMigrate: number;
    migrationRate: number;
  } | null>(null);

  useEffect(() => {
    if (!loading && urls.length > 0) {
      import('../utils/urlMigration').then(({ getMigrationStats }) => {
        const migrationStats = getMigrationStats(urls, projects);
        setStats(migrationStats);
      });
    }
  }, [urls, projects, loading]);

  return {
    stats,
    loading
  };
};