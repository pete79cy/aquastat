import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Users, Trophy, Bell, FlaskConical, Plus, MoreVertical, MapPin } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { athletes, upcomingCompetitions, me } from "@/lib/mockData";
import { formatTime, formatDelta } from "@/lib/utils";

export default function CoachDashboard() {
  const { t } = useTranslation();

  const grouped = athletes.reduce<Record<string, typeof athletes>>((acc, a) => {
    (acc[a.categoryKey] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-headline-lg font-semibold tracking-tight text-ink">
            {t("coachDashboard.title")}
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            {t("coachDashboard.subtitle", { club: me.coach.club, season: me.coach.season })}
          </p>
        </div>
        <Button className="hidden sm:inline-flex">
          <Plus className="w-4 h-4" /> {t("coachDashboard.addResult")}
        </Button>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Kpi icon={<Users className="w-4 h-4" />} label={t("coachDashboard.myAthletes")} value="24" />
        <Kpi
          icon={<Trophy className="w-4 h-4 text-achieved" />}
          label={t("coachDashboard.pbsThisMonth")}
          value="12"
          tone="achieved"
        />
        <Kpi
          icon={<FlaskConical className="w-4 h-4 text-primary" />}
          label={t("coachDashboard.trainingTests")}
          value="38"
        />
        <Kpi
          icon={<Bell className="w-4 h-4 text-warn" />}
          label={t("coachDashboard.performanceAlerts")}
          value="3"
          tone="warn"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Athletes overview */}
        <Card className="lg:col-span-2">
          <div className="p-6 pb-4 flex items-center justify-between">
            <h2 className="text-headline-md text-ink">{t("coachDashboard.athletesOverview")}</h2>
            <Link to="/coach/athletes" className="text-sm font-semibold text-primary hover:underline">
              {t("coachDashboard.myAthletes")} →
            </Link>
          </div>
          <div className="px-2 pb-2 space-y-5">
            {Object.entries(grouped).map(([catKey, list]) => (
              <div key={catKey}>
                <div className="px-4 mb-2 flex items-center gap-2">
                  <span className="inline-block w-1 h-4 bg-primary rounded-full" />
                  <h3 className="text-sm font-semibold text-ink-muted">{t(catKey)}</h3>
                </div>
                <ul className="divide-y divide-outline-variant/50">
                  {list.map((a) => (
                    <li key={a.id}>
                      <Link
                        to={`/coach/athletes/${a.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-1 rounded-md transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary grid place-items-center font-semibold text-sm shrink-0">
                          {a.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-ink truncate">
                            {a.firstName} {a.lastName}
                          </div>
                          <div className="text-xs text-ink-muted">
                            <span className="tnum font-semibold text-ink">{formatTime(a.latestTimeMs)}</span>
                            <span className="mx-1.5">·</span>
                            <span>100μ Πεταλούδα</span>
                          </div>
                        </div>
                        <Chip tone={a.pbDeltaMs <= 0 ? "achieved" : "close"} className="tnum">
                          {a.pbDeltaMs <= 0 ? "PB " : ""}
                          {formatDelta(a.pbDeltaMs)}
                        </Chip>
                        <button className="text-ink-subtle hover:text-ink p-1" aria-label="More">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming competitions */}
        <div className="space-y-4">
          <h2 className="text-headline-md text-ink">{t("coachDashboard.upcomingCompetitions")}</h2>
          <div className="space-y-3">
            {upcomingCompetitions.map((c) => (
              <Card key={c.id}>
                <CardBody className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="text-center bg-primary-fixed text-primary rounded-md px-3 py-2 shrink-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wider">{c.date.month}</div>
                      <div className="text-2xl font-bold leading-none">{c.date.day}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-ink leading-snug">{c.name}</div>
                      <div className="text-xs text-ink-muted flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {c.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip tone="neutral">
                      {c.events} {t("coachDashboard.events")}
                    </Chip>
                    <Chip tone="primary">
                      {c.swimmers} {t("coachDashboard.swimmers")}
                    </Chip>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    {t("coachDashboard.viewAthletes")}
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Floating action button (mobile) */}
      <button
        className="sm:hidden fixed right-4 bottom-20 z-40 h-14 px-5 rounded-full bg-primary text-primary-fg font-semibold shadow-lg flex items-center gap-2"
      >
        <Plus className="w-5 h-5" /> {t("coachDashboard.addResult")}
      </button>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "achieved" | "warn";
}) {
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
          {value}
        </div>
      </CardBody>
    </Card>
  );
}
