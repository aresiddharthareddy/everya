import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Bookmark,
  LayoutDashboard,
  Newspaper,
  Settings,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  requiresAuth?: boolean;
};

/** Primary app navigation — single source of truth */
export const primaryNav: NavItem[] = [
  { href: "/explore", label: "Home", icon: BookOpen },
  { href: "/dashboard", label: "Desk", icon: LayoutDashboard, requiresAuth: true },
  { href: "/publications", label: "Publications", icon: Newspaper },
  { href: "/reading-list", label: "Library", icon: Bookmark, requiresAuth: true },
];

export const secondaryNav: NavItem[] = [
  { href: "/notifications", label: "Notifications", icon: Bell, requiresAuth: true },
  { href: "/settings", label: "Settings", icon: Settings, requiresAuth: true },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/explore") return pathname === "/explore" || pathname.startsWith("/explore/");
  if (href === "/dashboard") return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  if (href === "/publications") return pathname.startsWith("/publications") || pathname.startsWith("/p/");
  if (href === "/reading-list") return pathname.startsWith("/reading-list");
  if (href === "/notifications") return pathname.startsWith("/notifications");
  if (href === "/settings") return pathname.startsWith("/settings");
  if (href === "/stats") return pathname.startsWith("/stats");
  if (href === "/create") return pathname.startsWith("/create");
  if (href.startsWith("/u/")) return pathname.startsWith(href);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isCollectionActive(pathname: string, slug: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] === "r" && parts.length >= 2 && parts[2] === slug;
}
