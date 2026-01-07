/**
 * Helper to get the correct docs URL based on environment
 */
export function getDocsUrl(path: string = ''): string {
  if (typeof window === 'undefined') {
    // Server-side: use relative path
    return `/docs${path ? `/${path}` : ''}`;
  }

  const isProduction = window.location.hostname.includes('beastmode.dev');
  
  if (isProduction) {
    return `https://beastmode.dev/docs${path ? `/${path}` : ''}`;
  }
  
  return `/docs${path ? `/${path}` : ''}`;
}

