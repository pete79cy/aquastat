import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, GraduationCap, UserCircle, Calendar, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ClubAdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const statsQ = useQuery({ queryKey: ["stats", "club"], queryFn: () => api.stats.club().then((r) => r.stats) });
  const competitionsQ = useQuery({ queryKey: ["competitions"], queryFn: () => api.competitions.list().then((r) => r.competitions) });
  const aiQ = useQuery({ queryKey: ["ai-extractions"], queryFn: () => api.aiExtractions.list().then((r) => r.extractions) });

  const stats = statsQ.data;
  const upcoming = (competitionsQ.data ?? []).filter((c) => new Date(c.endDate) >= new Date()).slice(0, 5);
  const aiQueue = aiQ.data ?? [];
  const pendingAI = aiQueue.filter((q) => q.status === "pending").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl lg:text-headline-lg font-semibold tracking-tight text-ink">
          {t("clubAdminDashboard.title")}
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          {t("clubAdminDashboard.subtitle", { club: user?.name ?? "—", season: "2025–2026" })}
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <Kpi icon={<Users className="w-4 h-4 text-primary" />} label={t("clubAdminDashboard.athletesCount")} value={stats?.athletesCount ?? "—"} loading={statsQ.isLoading} />
        <Kpi icon={<GraduationCap className="w-4 h-4 text-primary" />} label={t("clubAdminDashboard.coachesCount")} value={stats?.coachesCount ?? "—"} loading={statsQ.isLoading} />
        <Kpi icon={<UserCircle className="w-4 h-4 text-primary" />} label={t("clubAdminDashboard.parentsCount")} value={stats?.parentsCount ?? "—"} loading={statsQ.isLoading} />
        <Kpi icon={<Calendar className="w-4 h-4 text-primary" />} label={t("clubAdminDashboard.upcomingCompetitions")} value={upcoming.length} loading={competitionsQ.isLoading} />
        <Kpi
          icon={<AlertCircle className={"w-4 h-4 " + (pendingAI > 0 ? "text-warn" : "text-primary")} />}
          label={t("clubAdminDashboard.pendingAIReviews")}
          value={pendingAI}
          loading={aiQ.isLoading}
          tone={pendingAI > 0 ? "warn" : undefined}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-headline-md text-ink">{t("nav.athletes")}</h2>
            <p className="text-sm text-ink-muted">
              {stats?.athletesCount ?? 0} ενεργοί στον όμιλο σας
            </p>
            <Link to="/admin/athletes" className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
              {t("clubAdminDashboard.manageAthletes")}
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-headline-md text-ink">{t("nav.users")}</h2>
            <p className="text-sm text-ink-muted">
              {stats?.coachesCount ?? 0} προπονητές · {stats?.parentsCount ?? 0} γονείς
            </p>
            <Link to="/admin/users" className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
              {t("clubAdminDashboard.manageUsers")}
            </Link>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-headline-md text-ink">AI Review queue</h2>
              {pendingAI > 0 ? (
                <Chip tone="warn">{pendingAI} {t("common.actionRequired").toLowerCase()}</Chip>
              ) : (
                <Chip tone="neutral">Κενή</Chip>
              )}
            </div>
            {aiQ.isLoading ? (
              <div className="text-sm text-ink-muted">{t("common.loading")}</div>
            ) : aiQueue.length === 0 ? (
              <div className="flex items-center gap-3 text-sm text-ink-muted py-4">
                <Sparkles className="w-4 h-4" />
                <span>Δεν υπάρχουν εκκρεμή AI extractions. Ανεβάστε προκήρυξη ή αποτελέσματα για αυτόματη εξαγωγή.</span>
              </div>
            ) : (
              <ul className="divide-y divide-outline-variant/50">
                {aiQueue.map((q) => (
                  <li key={q.id} className="py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-surface-2 grid place-items-center shrink-0">
                      <Sparkles className="w-4 h-4 text-ink-muted" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-ink text-sm truncate">{q.documentFilename}</div>
                      <div className="text-xs text-ink-muted">{q.extractionType} · {new Date(q.createdAt).toLocaleDateString("el-CY")}</div>
                    </div>
                    {q.confidence && <Chip tone="primary">{Math.round(Number(q.confidence))}%</Chip>}
                    <Link to="/admin/ai-review" className="text-primary hover:text-primary-container shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <h2 className="text-headline-md text-ink mb-3">{t("clubAdminDashboard.upcomingCompetitions")}</h2>
            {competitionsQ.isLoading ? (
              <div className="text-sm text-ink-muted">{t("common.loading")}</div>
            ) : upcoming.length === 0 ? (
              <div className="text-sm text-ink-muted">Δεν υπάρχουν επερχόμενοι αγώνες.</div>
            ) : (
              <ul className="divide-y divide-outline-variant/50">
                {upcoming.map((c) => {
                  const d = new Date(c.startDate);
                  return (
                    <li key={c.id} className="py-3 flex items-center gap-4">
                      <div className="text-center bg-primary-fixed text-primary rounded-md px-3 py-1.5 shrink-0">
                        <div className="text-[10px] font-semibold tracking-wider">
                          {d.toLocaleDateString("el-CY", { month: "short" }).toUpperCase()}
                        </div>
                        <div className="text-xl font-bold leading-none">{String(d.getDate()).padStart(2, "0")}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-ink">{c.name}</div>
                        <div className="text-xs text-ink-muted">{c.location ?? c.venue ?? "—"}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, loading, tone }: { icon: React.ReactNode; label: string; value: string | number; loading?: boolean; tone?: "warn" }) {
  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-center gap-1.5">{icon}<CardTitle className="!text-[11px]">{label}</CardTitle></div>
        <div className={"mt-2 text-2xl lg:text-3xl font-bold tracking-tight tnum " + (tone === "warn" ? "text-warn" : "text-primary")}>
          {loading ? "…" : value}
        </div>
      </CardBody>
    </Card>
  );
}
