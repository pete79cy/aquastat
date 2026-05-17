import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Home, Users, Calendar, BarChart3, User, Waves, Bell, LogOut,
  Building2, Sparkles, FileText, Layers, GraduationCap, Plus, ListChecks, UserCog,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "./LocaleSwitcher";

type Role = "federation_admin" | "club_admin" | "coach" | "parent";

type NavItem = { to: string; key: string; icon: React.ComponentType<{ className?: string }> };

const navByRole: Record<Role, NavItem[]> = {
  coach: [
    { to: "/coach", key: "nav.home", icon: Home },
    { to: "/coach/athletes", key: "nav.athletes", icon: Users },
    { to: "/coach/competitions", key: "nav.events", icon: Calendar },
    { to: "/coach/standards", key: "nav.standards", icon: BarChart3 },
  ],
  parent: [
    { to: "/parent", key: "nav.home", icon: Home },
    { to: "/parent/child", key: "nav.myChild", icon: User },
    { to: "/parent/competitions", key: "nav.events", icon: Calendar },
    { to: "/parent/profile", key: "nav.profile", icon: User },
  ],
  club_admin: [
    { to: "/admin", key: "nav.home", icon: Home },
    { to: "/admin/athletes", key: "nav.athletes", icon: Users },
    { to: "/admin/users", key: "nav.users", icon: UserCog },
    { to: "/admin/competitions", key: "nav.events", icon: Calendar },
    { to: "/admin/standards", key: "nav.standards", icon: BarChart3 },
    { to: "/admin/ai-review", key: "nav.aiReview", icon: Sparkles },
    { to: "/admin/season", key: "nav.season", icon: FileText },
  ],
  federation_admin: [
    { to: "/federation", key: "nav.home", icon: Home },
    { to: "/federation/clubs", key: "nav.clubs", icon: Building2 },
    { to: "/federation/users", key: "nav.users", icon: UserCog },
    { to: "/federation/season", key: "nav.season", icon: FileText },
    { to: "/federation/categories", key: "nav.athletes", icon: Layers },
    { to: "/federation/standards", key: "nav.standards", icon: BarChart3 },
    { to: "/federation/ai-review", key: "nav.aiReview", icon: Sparkles },
  ],
};

// Mobile bottom nav uses max 4 items
const mobileNavByRole: Record<Role, NavItem[]> = {
  coach: [
    { to: "/coach", key: "nav.home", icon: Home },
    { to: "/coach/athletes", key: "nav.athletes", icon: Users },
    { to: "/coach/competitions", key: "nav.events", icon: Calendar },
    { to: "/coach/standards", key: "nav.standards", icon: BarChart3 },
  ],
  parent: [
    { to: "/parent", key: "nav.home", icon: Home },
    { to: "/parent/child", key: "nav.myChild", icon: User },
    { to: "/parent/competitions", key: "nav.events", icon: Calendar },
    { to: "/parent/profile", key: "nav.profile", icon: User },
  ],
  club_admin: [
    { to: "/admin", key: "nav.home", icon: Home },
    { to: "/admin/athletes", key: "nav.athletes", icon: Users },
    { to: "/admin/competitions", key: "nav.events", icon: Calendar },
    { to: "/admin/ai-review", key: "nav.aiReview", icon: Sparkles },
  ],
  federation_admin: [
    { to: "/federation", key: "nav.home", icon: Home },
    { to: "/federation/clubs", key: "nav.clubs", icon: Building2 },
    { to: "/federation/season", key: "nav.season", icon: FileText },
    { to: "/federation/ai-review", key: "nav.aiReview", icon: Sparkles },
  ],
};

const quickActionsByRole: Partial<Record<Role, { to: string; key: string; icon: React.ComponentType<{ className?: string }> }>> = {
  coach: { to: "/coach/add-result", key: "coachDashboard.addResult", icon: Plus },
  club_admin: { to: "/admin/add-result", key: "coachDashboard.addResult", icon: Plus },
};

export function AppLayout({ role, userName, clubName }: { role: Role; userName: string; clubName: string }) {
  const { t } = useTranslation();
  const items = navByRole[role];
  const mobileItems = mobileNavByRole[role];
  const quick = quickActionsByRole[role];
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-surface">
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col bg-surface-0 border-r border-outline-variant">
        <div className="px-6 py-5 flex items-center gap-2.5 border-b border-outline-variant">
          <div className="w-9 h-9 rounded-lg bg-primary grid place-items-center">
            <Waves className="w-5 h-5 text-primary-fg" />
          </div>
          <div className="font-semibold text-lg text-primary">{t("app.name")}</div>
        </div>
        <nav className="px-3 py-4 flex-1 space-y-1 overflow-y-auto">
          {items.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/coach" || to === "/parent" || to === "/admin" || to === "/federation"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive ? "bg-primary-fixed text-primary" : "text-ink-muted hover:bg-surface-1 hover:text-primary"
                )
              }
            >
              <Icon className="w-4 h-4" />
              {t(key)}
            </NavLink>
          ))}
          {quick && (
            <NavLink
              to={quick.to}
              className="mt-4 flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold bg-primary text-primary-fg hover:bg-primary-container transition-colors"
            >
              <quick.icon className="w-4 h-4" />
              {t(quick.key)}
            </NavLink>
          )}
        </nav>
        <div className="px-3 pb-4 pt-2 border-t border-outline-variant space-y-1">
          <div className="px-3 py-2">
            <div className="text-xs text-ink-subtle">{t(`roles.${role}`)}</div>
            <div className="text-sm font-semibold text-ink">{userName}</div>
            <div className="text-xs text-ink-muted truncate">{clubName}</div>
          </div>
          <NavLink to="/login" className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-ink-muted hover:bg-surface-1">
            <LogOut className="w-4 h-4" />
            {t("common.logout")}
          </NavLink>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-surface-0/90 backdrop-blur border-b border-outline-variant">
          <div className="px-4 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-7 h-7 rounded-md bg-primary grid place-items-center">
                <Waves className="w-4 h-4 text-primary-fg" />
              </div>
              <span className="font-semibold text-primary">{t("app.name")}</span>
            </div>
            <div className="hidden lg:block text-sm text-ink-muted font-mono">{location.pathname}</div>
            <div className="flex items-center gap-3">
              <LocaleSwitcher />
              <button className="relative w-9 h-9 rounded-full hover:bg-surface-1 grid place-items-center text-ink-muted">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warn rounded-full" />
              </button>
              <div className="w-9 h-9 rounded-full bg-primary-container text-primary-container-fg grid place-items-center text-sm font-semibold">
                {userName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-8 max-w-container w-full mx-auto">
          <Outlet />
        </main>

        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-surface-0 border-t border-outline-variant z-30">
          <div className="grid grid-cols-4">
            {mobileItems.map(({ to, key, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/coach" || to === "/parent" || to === "/admin" || to === "/federation"}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                    isActive ? "text-primary" : "text-ink-subtle"
                  )
                }
              >
                <Icon className="w-5 h-5" />
                {t(key)}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Mobile FAB for quick action */}
        {quick && (
          <NavLink
            to={quick.to}
            className="lg:hidden fixed right-4 bottom-20 z-40 h-14 px-5 rounded-full bg-primary text-primary-fg font-semibold shadow-lg flex items-center gap-2"
          >
            <quick.icon className="w-5 h-5" />
            {t(quick.key)}
          </NavLink>
        )}
      </div>
    </div>
  );
}
// Keep imports tree-shake friendly
void GraduationCap; void ListChecks;
