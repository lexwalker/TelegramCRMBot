export const SESSION_COOKIE_NAME = "crm_session";

export const AUTH_PUBLIC_PATHS = ["/login", "/register", "/verify-email"] as const;

export function isAuthPublicPath(pathname: string) {
  return AUTH_PUBLIC_PATHS.some(
    (publicPath) => pathname === publicPath || pathname.startsWith(`${publicPath}/`),
  );
}
