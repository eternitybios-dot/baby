/** ボトムナビの左右タブ順（中央の「記録」ボタンはルートではない） */
export const MAIN_TAB_HREFS = [
  "/home",
  "/calendar",
  "/charts",
  "/settings",
] as const;

export type MainTabHref = (typeof MAIN_TAB_HREFS)[number];

export function normalizeAppPathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function getMainTabIndex(pathname: string): number {
  const path = normalizeAppPathname(pathname);
  return MAIN_TAB_HREFS.findIndex(
    (href) => path === href || path.startsWith(`${href}/`),
  );
}

/** スワイプ方向に応じた隣タブ。端または非メインタブなら null */
export function getAdjacentMainTab(
  pathname: string,
  direction: "prev" | "next",
): MainTabHref | null {
  const index = getMainTabIndex(pathname);
  if (index < 0) return null;
  const nextIndex = direction === "next" ? index + 1 : index - 1;
  return MAIN_TAB_HREFS[nextIndex] ?? null;
}
