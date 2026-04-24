import apiClient from '../api/client';

/**
 * Resolves a potentially relative URL path to a full URL using the API base URL.
 * @param path The URL path to resolve.
 * @returns The resolved full URL.
 */
export const resolveUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  let baseUrl = (apiClient.defaults.baseURL as string) || '';
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  
  // Ensure we don't have double slashes if path starts with it
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
};
