import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Users, Calendar, BarChart3, User, Waves, Bell, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "./LocaleSwitcher";

type Role = "federation_admin" | "club_admin" | "coach" | "parent";

const navByRole: Record<Role, Array<{ to: string; key: string; icon: React.ComponentType<{ className?: string }> }>> = {
  coach: [
    { to: "/coach", key: "nav.home", icon: Home },
    { to: "/coach/athletes", key: "nav.athletes", icon: Users },
    { to: "/coach/competitions", key: "nav.events", icon: Calendar },
    { to: "/coach/reports", key: "nav.reports", icon: BarChart3 },
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
    { to: "/admin/reports", key: "nav.reports", icon: BarChart3 },
  ],
  federation_admin: [
    { to: "/federation", key: "nav.home", icon: Home },
    { to: "/federation/season", key: "nav.season", icon: Calendar },
    { to: "/federation/standards", key: "nav.standards", icon: BarChart3 },
    { to: "/federation/ai-review", key: "nav.aiReview", icon: Users },
  ],
};

export function AppLayout({ role, userName, clubName }: { role: Role; userName: string; clubName: string }) {
  const { t } = useTranslation();
  const items = navByRole[role];
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col bg-surface-0 border-r border-outline-variant">
        <div className="px-6 py-5 flex items-center gap-2.5 border-b border-outline-variant">
          <div className="w-9 h-9 rounded-lg bg-primary grid place-items-center">
            <Waves className="w-5 h-5 text-primary-fg" />
          </div>
          <div className="font-semibold text-lg text-primary">{t("app.name")}</div>
        </div>
        <nav className="px-3 py-4 flex-1 space-y-1">
          {items.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-fixed text-primary"
                    : "text-ink-muted hover:bg-surface-1 hover:text-primary"
                )
              }
            >
              <Icon className="w-4 h-4" />
              {t(key)}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-4 pt-2 border-t border-outline-variant space-y-1">
          <div className="px-3 py-2">
            <div className="text-xs text-ink-subtle">{t(`roles.${role}`)}</div>
            <div className="text-sm font-semibold text-ink">{userName}</div>
            <div className="text-xs text-ink-muted truncate">{clubName}</div>
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-ink-muted hover:bg-surface-1">
            <LogOut className="w-4 h-4" />
            {t("common.logout")}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-surface-0/90 backdrop-blur border-b border-outline-variant">
          <div className="px-4 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-7 h-7 rounded-md bg-primary grid place-items-center">
                <Waves className="w-4 h-4 text-primary-fg" />
              </div>
              <span className="font-semibold text-primary">{t("app.name")}</span>
            </div>
            <div className="hidden lg:block text-sm text-ink-muted">{location.pathname}</div>
            <div className="flex items-center gap-3">
              <LocaleSwitcher />
              <button className="relative w-9 h-9 rounded-full hover:bg-surface-1 grid place-items-center text-ink-muted">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warn rounded-full" />
              </button>
              <div className="w-9 h-9 rounded-full bg-primary-container text-primary-container-fg grid place-items-center text-sm font-semibold">
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-8 max-w-container w-full mx-auto">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-surface-0 border-t border-outline-variant z-30">
          <div className="grid grid-cols-4">
            {items.map(({ to, key, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end
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
      </div>
    </div>
  );
}
