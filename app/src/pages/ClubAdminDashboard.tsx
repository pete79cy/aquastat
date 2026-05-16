import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Users, GraduationCap, UserCircle, Calendar, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { upcomingCompetitions, me, aiQueue } from "@/lib/mockData";

export default function ClubAdminDashboard() {
  const { t } = useTranslation();
  const pendingAI = aiQueue.filter((q) => q.status === "needs_review").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl lg:text-headline-lg font-semibold tracking-tight text-ink">
          {t("clubAdminDashboard.title")}
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          {t("clubAdminDashboard.subtitle", { club: me.clubAdmin.club, season: me.coach.season })}
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <Kpi icon={<Users className="w-4 h-4 text-primary" />} label={t("clubAdminDashboard.athletesCount")} value={86} />
        <Kpi icon={<GraduationCap className="w-4 h-4 text-primary" />} label={t("clubAdminDashboard.coachesCount")} value={7} />
        <Kpi icon={<UserCircle className="w-4 h-4 text-primary" />} label={t("clubAdminDashboard.parentsCount")} value={62} />
        <Kpi icon={<Calendar className="w-4 h-4 text-primary" />} label={t("clubAdminDashboard.upcomingCompetitions")} value={3} />
        <Kpi icon={<AlertCircle className="w-4 h-4 text-warn" />} label={t("clubAdminDashboard.pendingAIReviews")} value={pendingAI} tone="warn" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-headline-md text-ink">{t("nav.athletes")}</h2>
            <p className="text-sm text-ink-muted">86 ενεργοί · 4 ανενεργοί · 12 νέοι αυτό το έτος</p>
            <Link to="/admin/athletes" className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
              {t("clubAdminDashboard.manageAthletes")}
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-headline-md text-ink">{t("nav.users")}</h2>
            <p className="text-sm text-ink-muted">7 προπονητές · 62 γονείς συνδεδεμένοι</p>
            <Link to="/admin/users" className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
              {t("clubAdminDashboard.manageUsers")}
            </Link>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-headline-md text-ink">AI Review queue</h2>
              <Chip tone="warn">{pendingAI} {t("common.actionRequired").toLowerCase()}</Chip>
            </div>
            <ul className="divide-y divide-outline-variant/50">
              {aiQueue.map((q) => (
                <li key={q.id} className="py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-surface-2 grid place-items-center shrink-0">
                    <AlertCircle className="w-4 h-4 text-ink-muted" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-ink text-sm truncate">{q.document}</div>
                    <div className="text-xs text-ink-muted">
                      {t(`aiReview.documentType.${q.type}`)} · {q.extractedItems} {t("aiReview.items")} · {q.uploadedAt}
                    </div>
                  </div>
                  <Chip tone={q.confidence >= 90 ? "achieved" : q.confidence >= 70 ? "close" : "warn"}>
                    {q.confidence}%
                  </Chip>
                  <Link to="/admin/ai-review" className="text-primary hover:text-primary-container shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <h2 className="text-headline-md text-ink mb-3">{t("clubAdminDashboard.upcomingCompetitions")}</h2>
            <ul className="divide-y divide-outline-variant/50">
              {upcomingCompetitions.map((c) => (
                <li key={c.id} className="py-3 flex items-center gap-4">
                  <div className="text-center bg-primary-fixed text-primary rounded-md px-3 py-1.5 shrink-0">
                    <div className="text-[10px] font-semibold tracking-wider">{c.date.month}</div>
                    <div className="text-xl font-bold leading-none">{c.date.day}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-ink">{c.name}</div>
                    <div className="text-xs text-ink-muted">{c.location}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold text-ink tnum">{c.swimmers}</div>
                    <div className="text-xs text-ink-muted">αθλητές</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: "warn" }) {
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
