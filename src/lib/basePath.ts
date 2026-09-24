/** Must match next.config.ts basePath — Auth.js redirects ignore Next basePath. */
export const BASE_PATH = "/englishtutor";

export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === BASE_PATH || normalized.startsWith(`${BASE_PATH}/`)) {
    return normalized;
  }
  return `${BASE_PATH}${normalized}`;
}

/** Strip basePath for middleware matching (handles both /login and /englishtutor/login). */
export function stripBasePath(pathname: string): string {
  if (pathname === BASE_PATH) return "/";
  if (pathname.startsWith(`${BASE_PATH}/`)) {
    return pathname.slice(BASE_PATH.length) || "/";
  }
  return pathname;
}
