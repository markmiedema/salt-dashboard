import { describe, it, expect } from 'vitest';
import { buildBreadcrumbs, buildBreadcrumbsWithId } from './navigation';

describe('Breadcrumb Generation', () => {
  describe('buildBreadcrumbs', () => {
    it('should generate breadcrumbs for client only', () => {
      const breadcrumbs = buildBreadcrumbs('Acme Corporation');
      
      expect(breadcrumbs).toEqual([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Clients', href: '/clients' },
        { label: 'Acme Corporation' }
      ]);
    });

    it('should generate breadcrumbs for client and project', () => {
      const breadcrumbs = buildBreadcrumbs('Acme Corporation', 'Q4 2024 Tax Analysis');
      
      expect(breadcrumbs).toEqual([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Clients', href: '/clients' },
        { label: 'Acme Corporation' },
        { label: 'Q4 2024 Tax Analysis' }
      ]);
    });

    it('should handle empty client name', () => {
      const breadcrumbs = buildBreadcrumbs('');
      
      expect(breadcrumbs).toEqual([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Clients', href: '/clients' },
        { label: '' }
      ]);
    });

    it('should handle special characters in names', () => {
      const breadcrumbs = buildBreadcrumbs('Johnson & Associates LLC', 'Multi-State Tax Analysis (2024)');
      
      expect(breadcrumbs).toEqual([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Clients', href: '/clients' },
        { label: 'Johnson & Associates LLC' },
        { label: 'Multi-State Tax Analysis (2024)' }
      ]);
    });

    it('should handle very long names', () => {
      const longClientName = 'Very Long Client Name That Might Cause Display Issues In The UI';
      const longProjectName = 'Very Long Project Name That Might Also Cause Display Issues';
      
      const breadcrumbs = buildBreadcrumbs(longClientName, longProjectName);
      
      expect(breadcrumbs).toEqual([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Clients', href: '/clients' },
        { label: longClientName },
        { label: longProjectName }
      ]);
    });

    it('should handle null/undefined project name', () => {
      const breadcrumbs = buildBreadcrumbs('Acme Corporation', undefined);
      
      expect(breadcrumbs).toEqual([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Clients', href: '/clients' },
        { label: 'Acme Corporation' }
      ]);
    });
  });

  describe('buildBreadcrumbsWithId', () => {
    it('should generate breadcrumbs with client ID for navigation', () => {
      const breadcrumbs = buildBreadcrumbsWithId('client-123', 'Acme Corporation');
      
      expect(breadcrumbs).toEqual([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Clients', href: '/clients' },
        { label: 'Acme Corporation', href: '/clients/client-123' }
      ]);
    });

    it('should generate breadcrumbs with client and project', () => {
      const breadcrumbs = buildBreadcrumbsWithId('client-123', 'Acme Corporation', 'Q4 2024 Tax Analysis');
      
      expect(breadcrumbs).toEqual([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Clients', href: '/clients' },
        { label: 'Acme Corporation', href: '/clients/client-123' },
        { label: 'Q4 2024 Tax Analysis' }
      ]);
    });

    it('should handle UUID-style client IDs', () => {
      const clientId = '550e8400-e29b-41d4-a716-446655440000';
      const breadcrumbs = buildBreadcrumbsWithId(clientId, 'Acme Corporation');
      
      expect(breadcrumbs).toEqual([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Clients', href: '/clients' },
        { label: 'Acme Corporation', href: `/clients/${clientId}` }
      ]);
    });

    it('should handle short client IDs', () => {
      const breadcrumbs = buildBreadcrumbsWithId('1', 'Acme Corporation');
      
      expect(breadcrumbs).toEqual([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Clients', href: '/clients' },
        { label: 'Acme Corporation', href: '/clients/1' }
      ]);
    });

    it('should handle empty client ID', () => {
      const breadcrumbs = buildBreadcrumbsWithId('', 'Acme Corporation');
      
      expect(breadcrumbs).toEqual([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Clients', href: '/clients' },
        { label: 'Acme Corporation', href: '/clients/' }
      ]);
    });

    it('should handle special characters in client ID', () => {
      const clientId = 'client-with-dashes_and_underscores.123';
      const breadcrumbs = buildBreadcrumbsWithId(clientId, 'Acme Corporation');
      
      expect(breadcrumbs).toEqual([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Clients', href: '/clients' },
        { label: 'Acme Corporation', href: `/clients/${clientId}` }
      ]);
    });
  });

  describe('breadcrumb structure consistency', () => {
    it('should maintain consistent structure between both functions', () => {
      const clientName = 'Acme Corporation';
      const projectName = 'Q4 2024 Tax Analysis';
      
      const basicBreadcrumbs = buildBreadcrumbs(clientName, projectName);
      const idBreadcrumbs = buildBreadcrumbsWithId('client-123', clientName, projectName);
      
      // Should have same number of items
      expect(basicBreadcrumbs.length).toBe(idBreadcrumbs.length);
      
      // Should have same labels
      basicBreadcrumbs.forEach((crumb, index) => {
        expect(crumb.label).toBe(idBreadcrumbs[index].label);
      });
      
      // ID version should have href for client
      expect(idBreadcrumbs[2].href).toBe('/clients/client-123');
      expect(basicBreadcrumbs[2].href).toBeUndefined();
    });

    it('should handle edge cases consistently', () => {
      const basicEmpty = buildBreadcrumbs('');
      const idEmpty = buildBreadcrumbsWithId('', '');
      
      expect(basicEmpty.length).toBe(idEmpty.length);
      expect(basicEmpty[0].label).toBe(idEmpty[0].label);
      expect(basicEmpty[1].label).toBe(idEmpty[1].label);
    });
  });

  describe('breadcrumb navigation scenarios', () => {
    it('should support dashboard navigation', () => {
      const breadcrumbs = buildBreadcrumbsWithId('client-123', 'Acme Corporation', 'Project Name');
      
      const dashboardCrumb = breadcrumbs.find(crumb => crumb.label === 'Dashboard');
      expect(dashboardCrumb?.href).toBe('/dashboard');
    });

    it('should support clients list navigation', () => {
      const breadcrumbs = buildBreadcrumbsWithId('client-123', 'Acme Corporation', 'Project Name');
      
      const clientsCrumb = breadcrumbs.find(crumb => crumb.label === 'Clients');
      expect(clientsCrumb?.href).toBe('/clients');
    });

    it('should support client detail navigation', () => {
      const breadcrumbs = buildBreadcrumbsWithId('client-123', 'Acme Corporation', 'Project Name');
      
      const clientCrumb = breadcrumbs.find(crumb => crumb.label === 'Acme Corporation');
      expect(clientCrumb?.href).toBe('/clients/client-123');
    });

    it('should not provide navigation for current page (project)', () => {
      const breadcrumbs = buildBreadcrumbsWithId('client-123', 'Acme Corporation', 'Project Name');
      
      const projectCrumb = breadcrumbs.find(crumb => crumb.label === 'Project Name');
      expect(projectCrumb?.href).toBeUndefined();
    });
  });

  describe('breadcrumb accessibility', () => {
    it('should provide meaningful labels for screen readers', () => {
      const breadcrumbs = buildBreadcrumbsWithId('client-123', 'Acme Corporation', 'Q4 2024 Tax Analysis');
      
      // All labels should be non-empty strings
      breadcrumbs.forEach(crumb => {
        expect(typeof crumb.label).toBe('string');
        expect(crumb.label.length).toBeGreaterThan(0);
      });
    });

    it('should provide valid href attributes for navigation', () => {
      const breadcrumbs = buildBreadcrumbsWithId('client-123', 'Acme Corporation', 'Project Name');
      
      // Check that all hrefs are valid paths
      breadcrumbs.forEach(crumb => {
        if (crumb.href) {
          expect(crumb.href).toMatch(/^\/[a-zA-Z0-9\-_\/]*$/);
        }
      });
    });
  });
});