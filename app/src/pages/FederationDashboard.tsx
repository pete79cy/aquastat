import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, Calendar, Layers } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { api } from "@/lib/api";

export default function FederationDashboard() {
  const { t } = useTranslation();

  const clubsQ = useQuery({
    queryKey: ["clubs"],
    queryFn: () => api.clubs.list().then((r) => r.clubs),
  });

  const competitionsQ = useQuery({
    queryKey: ["competitions"],
    queryFn: () => api.competitions.list().then((r) => r.competitions),
  });

  const clubs = clubsQ.data ?? [];
  const competitions = competitionsQ.data ?? [];
  const upcoming = competitions.filter((c) => new Date(c.endDate) >= new Date());

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl lg:text-headline-lg font-semibold tracking-tight text-ink">
          {t("federationDashboard.title")}
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          {t("federationDashboard.subtitle", { season: "2025–2026" })}
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Kpi icon={<Building2 className="w-4 h-4 text-primary" />} label={t("federationDashboard.totalClubs")} value={clubs.length} loading={clubsQ.isLoading} />
        <Kpi icon={<Users className="w-4 h-4 text-primary" />} label={t("federationDashboard.totalAthletes")} value="—" />
        <Kpi icon={<Layers className="w-4 h-4 text-primary" />} label={t("federationDashboard.activeSeasons")} value={1} />
        <Kpi icon={<Calendar className="w-4 h-4 text-primary" />} label={t("federationDashboard.upcomingCompetitions")} value={upcoming.length} loading={competitionsQ.isLoading} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-6 pb-4 flex items-center justify-between">
            <h2 className="text-headline-md text-ink">{t("federationDashboard.clubsBreakdown")}</h2>
            <Link to="/federation/clubs" className="text-sm font-semibold text-primary hover:underline">
              {t("federationDashboard.manageClubs")}
            </Link>
          </div>
          <div className="px-2 pb-2">
            {clubsQ.isLoading ? (
              <div className="px-4 py-8 text-center text-ink-muted text-sm">{t("common.loading")}</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-ink-muted text-xs uppercase tracking-wider">
                    <th className="px-4 py-2 text-left">Όμιλος</th>
                    <th className="px-4 py-2 text-left hidden sm:table-cell">Κωδικός</th>
                    <th className="px-4 py-2 text-left">Χώρα</th>
                    <th className="px-4 py-2 text-right">Κατάσταση</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {clubs.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-1 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-md bg-primary-fixed text-primary grid place-items-center text-[10px] font-bold">
                            {c.shortName ?? c.name.slice(0, 3)}
                          </div>
                          <span className="font-semibold text-ink">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted hidden sm:table-cell">{c.federationCode ?? "—"}</td>
                      <td className="px-4 py-3 text-ink-muted">{c.country}</td>
                      <td className="px-4 py-3 text-right">
                        <Chip tone={c.isActive ? "achieved" : "neutral"}>{c.isActive ? "Ενεργός" : "Ανενεργός"}</Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <h2 className="text-headline-md text-ink">{t("federationDashboard.upcomingCompetitions")}</h2>
          {competitionsQ.isLoading ? (
            <Card><CardBody className="text-sm text-ink-muted">{t("common.loading")}</CardBody></Card>
          ) : upcoming.length === 0 ? (
            <Card><CardBody className="text-sm text-ink-muted">Δεν υπάρχουν επερχόμενοι αγώνες.</CardBody></Card>
          ) : (
            upcoming.slice(0, 5).map((c) => {
              const d = new Date(c.startDate);
              return (
                <Card key={c.id}>
                  <CardBody className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="text-center bg-primary-fixed text-primary rounded-md px-3 py-1.5 shrink-0">
                        <div className="text-[10px] font-semibold tracking-wider">
                          {d.toLocaleDateString("el-CY", { month: "short" }).toUpperCase()}
                        </div>
                        <div className="text-xl font-bold leading-none">{String(d.getDate()).padStart(2, "0")}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink leading-snug text-sm">{c.name}</div>
                        <div className="text-xs text-ink-muted mt-0.5">{c.location ?? c.venue ?? "—"}</div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: string | number; loading?: boolean }) {
  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-center gap-1.5">{icon}<CardTitle className="!text-[11px]">{label}</CardTitle></div>
        <div className="mt-2 text-2xl lg:text-3xl font-bold tracking-tight tnum text-primary">
          {loading ? "…" : value}
        </div>
      </CardBody>
    </Card>
  );
}
