import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to the top of the page whenever the route's pathname changes.
 *
 * React Router v6 does not do this on its own, so clicking a nav/bottom-nav
 * link while scrolled down on the previous page left the new page wherever
 * the old scroll position happened to be. Keyed on pathname only (not
 * search) so in-page deep links like /feed?video=<id> don't get reset.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
