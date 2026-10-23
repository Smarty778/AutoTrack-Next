/**
 * Page routes handled by src/proxy.ts.
 * Keep API authorization inside each route handler as well; Proxy is only the
 * first-line navigation redirect and is not the authorization boundary.
 */
export const publicRoutes = ['/login', '/register'] as const;
export const authRoutes = ['/dashboard'] as const;

export function isRouteOrChild(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}