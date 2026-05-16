import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Building2, Users, GraduationCap, Calendar, AlertCircle, Layers } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { clubs, federationStats, upcomingCompetitions, me } from "@/lib/mockData";

export default function FederationDashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl lg:text-headline-lg font-semibold tracking-tight text-ink">
          {t("federationDashboard.title")}
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          {t("federationDashboard.subtitle", { season: me.coach.season })}
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4">
        <Kpi icon={<Building2 className="w-4 h-4 text-primary" />} label={t("federationDashboard.totalClubs")} value={federationStats.totalClubs} />
        <Kpi icon={<Users className="w-4 h-4 text-primary" />} label={t("federationDashboard.totalAthletes")} value={federationStats.totalAthletes.toLocaleString("el-CY")} />
        <Kpi icon={<GraduationCap className="w-4 h-4 text-primary" />} label={t("federationDashboard.totalCoaches")} value={federationStats.totalCoaches} />
        <Kpi icon={<Layers className="w-4 h-4 text-primary" />} label={t("federationDashboard.activeSeasons")} value={federationStats.activeSeasons} />
        <Kpi icon={<Calendar className="w-4 h-4 text-primary" />} label={t("federationDashboard.upcomingCompetitions")} value={federationStats.upcomingCompetitions} />
        <Kpi icon={<AlertCircle className="w-4 h-4 text-warn" />} label={t("federationDashboard.pendingAIReviews")} value={federationStats.pendingAIReviews} tone="warn" />
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
            <table className="w-full text-sm">
              <thead>
                <tr className="text-ink-muted text-xs uppercase tracking-wider">
                  <th className="px-4 py-2 text-left">Όμιλος</th>
                  <th className="px-4 py-2 text-left hidden sm:table-cell">Περιοχή</th>
                  <th className="px-4 py-2 text-right">Αθλητές</th>
                  <th className="px-4 py-2 text-right">Προπονητές</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {clubs.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-1 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-primary-fixed text-primary grid place-items-center text-[10px] font-bold">
                          {c.short}
                        </div>
                        <span className="font-semibold text-ink">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted hidden sm:table-cell">{c.region}</td>
                    <td className="px-4 py-3 text-right tnum font-semibold text-ink">{c.athletes}</td>
                    <td className="px-4 py-3 text-right tnum text-ink-muted">{c.coaches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <h2 className="text-headline-md text-ink">{t("federationDashboard.upcomingCompetitions")}</h2>
          {upcomingCompetitions.map((c) => (
            <Card key={c.id}>
              <CardBody className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="text-center bg-primary-fixed text-primary rounded-md px-3 py-1.5 shrink-0">
                    <div className="text-[10px] font-semibold tracking-wider">{c.date.month}</div>
                    <div className="text-xl font-bold leading-none">{c.date.day}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-ink leading-snug text-sm">{c.name}</div>
                    <div className="text-xs text-ink-muted mt-0.5">{c.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Chip tone="neutral">{c.events} ev.</Chip>
                  <Chip tone="primary">{c.swimmers} αθ.</Chip>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string | number; tone?: "warn" }) {
  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-center gap-1.5">{icon}<CardTitle className="!text-[11px]">{label}</CardTitle></div>
        <div className={"mt-2 text-2xl lg:text-3xl font-bold tracking-tight tnum " + (tone === "warn" ? "text-warn" : "text-primary")}>
          {value}
        </div>
      </CardBody>
    </Card>
  );
}
