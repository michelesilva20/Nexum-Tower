const LOCALE_PREFIX = /^\/(pt|en|es)(?=\/|$)/;

/** Paths where auth bootstrap must not block first paint. */
export function isPublicAuthPath(pathname: string): boolean {
  const path = pathname.replace(LOCALE_PREFIX, "") || "/";
  return path === "/" || path === "/login" || path.startsWith("/login/");
}
