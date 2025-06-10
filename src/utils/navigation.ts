import { NavigateFunction } from 'react-router-dom';
import { Project } from '../types/database';

/**
 * Generate URL for a specific client
 */
export const getClientUrl = (clientId: string): string => {
  return `/clients/${clientId}`;
};

/**
 * Generate URL for a client's project
 * If projectId is not provided, returns the client URL
 */
export const getClientProjectUrl = (clientId: string, projectId?: string): string => {
  const baseUrl = getClientUrl(clientId);
  return projectId ? `${baseUrl}/projects/${projectId}` : baseUrl;
};

/**
 * Navigate to a project using the new client-centric URL structure
 */
export const navigateToProject = (navigate: NavigateFunction, project: Project): void => {
  navigate(getClientProjectUrl(project.client_id, project.id));
};

/**
 * Navigate to a client's detail page
 */
export const navigateToClient = (navigate: NavigateFunction, clientId: string): void => {
  navigate(getClientUrl(clientId));
};

/**
 * Build breadcrumb navigation items
 */
export const buildBreadcrumbs = (
  clientName: string,
  projectName?: string
): Array<{ label: string; href?: string }> => {
  const crumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Clients', href: '/clients' },
    { label: clientName }
  ];

  if (projectName) {
    crumbs.push({ label: projectName });
  }

  return crumbs;
};

/**
 * Build breadcrumbs with client ID for navigation
 */
export const buildBreadcrumbsWithId = (
  clientId: string,
  clientName: string,
  projectName?: string
): Array<{ label: string; href?: string }> => {
  const crumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Clients', href: '/clients' },
    { label: clientName, href: getClientUrl(clientId) }
  ];

  if (projectName) {
    crumbs.push({ label: projectName });
  }

  return crumbs;
};

/**
 * Check if a URL is a legacy project URL that needs migration
 */
export const isLegacyProjectUrl = (url: string): boolean => {
  return url.startsWith('/projects/') && url !== '/projects';
};

/**
 * Extract project ID from a legacy project URL
 */
export const extractProjectIdFromLegacyUrl = (url: string): string | null => {
  const match = url.match(/^\/projects\/([^\/]+)/);
  return match ? match[1] : null;
};

/**
 * Get the current page identifier based on pathname
 */
export const getCurrentPageId = (pathname: string): string => {
  if (pathname.startsWith('/clients')) {
    return 'clients';
  }
  if (pathname.startsWith('/projects')) {
    return 'projects'; // For legacy support
  }
  if (pathname.startsWith('/reports')) {
    return 'reports';
  }
  if (pathname.startsWith('/dashboard') || pathname === '/') {
    return 'dashboard';
  }
  return 'dashboard';
};

/**
 * Build project URL for dashboard widgets and other components
 * This ensures consistent navigation throughout the app
 */
export const buildProjectUrl = (project: Project): string => {
  return getClientProjectUrl(project.client_id, project.id);
};

/**
 * Build client URL for dashboard widgets and other components
 */
export const buildClientUrl = (clientId: string): string => {
  return getClientUrl(clientId);
};

/**
 * Navigation helper for dashboard project widgets
 */
export const navigateToProjectFromDashboard = (
  navigate: NavigateFunction,
  project: Project
): void => {
  navigateToProject(navigate, project);
};

/**
 * Navigation helper for client list items
 */
export const navigateToClientFromList = (
  navigate: NavigateFunction,
  clientId: string
): void => {
  navigateToClient(navigate, clientId);
};