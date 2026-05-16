import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, Trophy, Bell, FlaskConical, Plus, MoreVertical, MapPin } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatTime } from "@/lib/utils";

export default function CoachDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const athletesQ = useQuery({
    queryKey: ["athletes"],
    queryFn: () => api.athletes.list().then((r) => r.athletes),
  });

  const competitionsQ = useQuery({
    queryKey: ["competitions"],
    queryFn: () => api.competitions.list().then((r) => r.competitions),
  });

  const athletes = athletesQ.data ?? [];
  const competitions = competitionsQ.data ?? [];
  const upcoming = competitions
    .filter((c) => new Date(c.endDate) >= new Date())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-headline-lg font-semibold tracking-tight text-ink">
            {t("coachDashboard.title")}
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            {t("coachDashboard.subtitle", { club: user?.name ?? "—", season: "2025–2026" })}
          </p>
        </div>
        <Link to="/coach/add-result" className="hidden sm:inline-flex">
          <Button>
            <Plus className="w-4 h-4" /> {t("coachDashboard.addResult")}
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Kpi icon={<Users className="w-4 h-4" />} label={t("coachDashboard.myAthletes")} value={athletes.length} loading={athletesQ.isLoading} />
        <Kpi icon={<Trophy className="w-4 h-4 text-achieved" />} label={t("coachDashboard.pbsThisMonth")} value="—" tone="achieved" />
        <Kpi icon={<FlaskConical className="w-4 h-4 text-primary" />} label={t("coachDashboard.trainingTests")} value="—" />
        <Kpi icon={<Bell className="w-4 h-4 text-warn" />} label={t("coachDashboard.performanceAlerts")} value="0" tone="warn" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-6 pb-4 flex items-center justify-between">
            <h2 className="text-headline-md text-ink">{t("coachDashboard.athletesOverview")}</h2>
            <Link to="/coach/athletes" className="text-sm font-semibold text-primary hover:underline">
              {t("coachDashboard.myAthletes")} →
            </Link>
          </div>
          <div className="px-2 pb-2">
            {athletesQ.isLoading ? (
              <div className="px-4 py-10 text-center text-ink-muted text-sm">{t("common.loading")}</div>
            ) : athletes.length === 0 ? (
              <div className="px-4 py-10 text-center text-ink-muted text-sm">Δεν υπάρχουν αθλητές ανατεθειμένοι σε εσάς.</div>
            ) : (
              <ul className="divide-y divide-outline-variant/50">
                {athletes.map((a) => {
                  const initials = (a.firstName[0] ?? "") + (a.lastName[0] ?? "");
                  const year = new Date(a.dateOfBirth).getFullYear();
                  return (
                    <li key={a.id}>
                      <Link
                        to={`/coach/athletes/${a.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-1 rounded-md transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary grid place-items-center font-semibold text-sm shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-ink truncate">
                            {a.firstName} {a.lastName}
                          </div>
                          <div className="text-xs text-ink-muted">
                            <span>Γεν. {year}</span>
                          </div>
                        </div>
                        {a.isActive && <Chip tone="achieved">Ενεργός</Chip>}
                        <button className="text-ink-subtle hover:text-ink p-1" aria-label="More">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <h2 className="text-headline-md text-ink">{t("coachDashboard.upcomingCompetitions")}</h2>
          {competitionsQ.isLoading ? (
            <Card><CardBody className="text-sm text-ink-muted">{t("common.loading")}</CardBody></Card>
          ) : upcoming.length === 0 ? (
            <Card><CardBody className="text-sm text-ink-muted">Δεν υπάρχουν επερχόμενοι αγώνες.</CardBody></Card>
          ) : (
            <div className="space-y-3">
              {upcoming.map((c) => {
                const d = new Date(c.startDate);
                const monthLabel = d.toLocaleDateString("el-CY", { month: "short" }).toUpperCase();
                return (
                  <Card key={c.id}>
                    <CardBody className="space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="text-center bg-primary-fixed text-primary rounded-md px-3 py-2 shrink-0">
                          <div className="text-[10px] font-semibold uppercase tracking-wider">{monthLabel}</div>
                          <div className="text-2xl font-bold leading-none">{String(d.getDate()).padStart(2, "0")}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-ink leading-snug">{c.name}</div>
                          {c.venue && (
                            <div className="text-xs text-ink-muted flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" /> {c.venue}
                            </div>
                          )}
                        </div>
                      </div>
                      <Link to={`/coach/competitions/${c.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          {t("coachDashboard.viewAthletes")}
                        </Button>
                      </Link>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Link
        to="/coach/add-result"
        className="sm:hidden fixed right-4 bottom-20 z-40 h-14 px-5 rounded-full bg-primary text-primary-fg font-semibold shadow-lg flex items-center gap-2"
      >
        <Plus className="w-5 h-5" /> {t("coachDashboard.addResult")}
      </Link>
    </div>
  );
}

function Kpi({ icon, label, value, tone, loading }: { icon: React.ReactNode; label: string; value: string | number; tone?: "achieved" | "warn"; loading?: boolean }) {
  return (
    <Card>
      <CardBody className="p-4 lg:p-5">
        <div className="flex items-center gap-1.5 text-ink-muted">
          {icon}
          <CardTitle className="!text-[11px] !text-ink-muted">{label}</CardTitle>
        </div>
        <div
          className={
            "mt-2 text-3xl lg:text-4xl font-bold tracking-tight tnum " +
            (tone === "warn" ? "text-warn" : tone === "achieved" ? "text-achieved" : "text-primary")
          }
        >
          {loading ? "…" : value}
        </div>
      </CardBody>
    </Card>
  );
}

// Keep formatTime tree-shake friendly
void formatTime;
