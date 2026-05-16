import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { athleteCard as a } from "@/lib/mockData";
import { formatTime, formatDelta } from "@/lib/utils";
import { MapPin, Edit3, Plus, Activity, Trophy, FlaskConical } from "lucide-react";

export default function AthleteProfile() {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      {/* Profile header */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-20 h-20 rounded-xl bg-primary text-primary-fg grid place-items-center text-3xl font-bold tracking-tight shrink-0">
              {a.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-ink">{a.name}</h1>
                {a.active && <Chip tone="achieved">{t("athleteProfile.active")}</Chip>}
              </div>
              <div className="text-sm text-ink-muted mt-1">
                {a.category} · {a.squad}
              </div>
              <div className="text-xs text-ink-subtle flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {a.club}
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button className="flex-1 sm:flex-initial">
                <Plus className="w-4 h-4" /> {t("athleteProfile.recordResult")}
              </Button>
              <Button variant="outline" className="flex-1 sm:flex-initial">
                <Edit3 className="w-4 h-4" /> {t("athleteProfile.editProfile")}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Best time KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {a.bestTimes.map((b, i) => (
          <Card key={i}>
            <CardBody className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                <span>{t("athleteProfile.bestTime")}</span>
                <span>{b.pool === "25m" ? "25μ" : "50μ"}</span>
              </div>
              <div className="text-xs text-ink-muted">{b.eventLabel}</div>
              <div className="text-3xl font-bold text-primary tnum">{formatTime(b.timeMs)}</div>
              <div className="h-5">
                {b.pb && <Chip tone="achieved">{t("athleteProfile.pbBadge")}</Chip>}
                {b.deltaMs !== undefined && (
                  <Chip tone={b.deltaMs <= 0 ? "achieved" : "close"} className="tnum">
                    {formatDelta(b.deltaMs)}
                  </Chip>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-surface-0 rounded-md border border-outline-variant w-full lg:w-auto justify-start overflow-x-auto">
          <TabsTrigger value="overview">{t("athleteProfile.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="results">{t("athleteProfile.tabs.results")}</TabsTrigger>
          <TabsTrigger value="training">{t("athleteProfile.tabs.training")}</TabsTrigger>
          <TabsTrigger value="progress">{t("athleteProfile.tabs.progress")}</TabsTrigger>
          <TabsTrigger value="standards">{t("athleteProfile.tabs.standards")}</TabsTrigger>
          <TabsTrigger value="notes">{t("athleteProfile.tabs.notes")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          {/* Top performances */}
          <Card>
            <CardBody>
              <h2 className="text-headline-md text-ink mb-3">{t("athleteProfile.topPerformances")}</h2>
              <div className="divide-y divide-outline-variant/50">
                {a.topPerformances.map((p, i) => (
                  <div key={i} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-ink">{p.eventLabel}</div>
                      <div className="text-xs text-ink-muted">{p.pool}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold text-primary tnum">{formatTime(p.timeMs)}</div>
                      {p.chip && <Chip tone={p.chip.tone}>{p.chip.label}</Chip>}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardBody>
              <h2 className="text-headline-md text-ink mb-3">{t("athleteProfile.recentActivity")}</h2>
              <ol className="relative border-l-2 border-outline-variant/50 ml-1.5 space-y-5 pl-5">
                {a.recentActivity.map((act, i) => {
                  const Icon = act.kind === "result" ? Trophy : act.kind === "training" ? FlaskConical : Activity;
                  const tone =
                    act.kind === "result" ? "text-achieved" : act.kind === "training" ? "text-primary" : "text-tertiary-container";
                  return (
                    <li key={i} className="relative">
                      <span className={`absolute -left-[34px] top-0 w-7 h-7 rounded-full bg-surface-0 border-2 border-outline-variant grid place-items-center ${tone}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div className="font-semibold text-ink">{act.title}</div>
                      <div className="text-sm text-ink-muted">{act.detail}</div>
                      <div className="text-[11px] text-ink-subtle uppercase tracking-wider mt-1">{act.ago}</div>
                    </li>
                  );
                })}
              </ol>
            </CardBody>
          </Card>

          {/* Qualification progress */}
          <Card>
            <CardBody>
              <h2 className="text-headline-md text-ink mb-3">{t("athleteProfile.qualificationProgress")}</h2>
              <div className="space-y-4">
                {a.qualificationProgress.map((q, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-semibold text-ink">{q.title}</div>
                      <div className="text-ink-muted">{q.pct}%</div>
                    </div>
                    <div className="h-2 rounded-full bg-surface-2 mt-1.5 overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${q.pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-ink-muted mt-1 tnum">
                      <span>
                        {q.eventLabel} · {t("parentDashboard.current")}: {formatTime(q.currentMs)}
                      </span>
                      <span>
                        {t("parentDashboard.limit")}: {formatTime(q.targetMs)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardBody className="text-ink-muted text-sm">Πλήρης λίστα αγωνιστικών αποτελεσμάτων — Stage 2.</CardBody>
          </Card>
        </TabsContent>
        <TabsContent value="training">
          <Card>
            <CardBody className="text-ink-muted text-sm">Προπονητικές επιδόσεις & tests — Stage 2.</CardBody>
          </Card>
        </TabsContent>
        <TabsContent value="progress">
          <Card>
            <CardBody className="text-ink-muted text-sm">Γραφήματα προόδου ανά αγώνισμα — Stage 2.</CardBody>
          </Card>
        </TabsContent>
        <TabsContent value="standards">
          <Card>
            <CardBody className="text-ink-muted text-sm">Όρια πρόκρισης ανά κατηγορία — Stage 2.</CardBody>
          </Card>
        </TabsContent>
        <TabsContent value="notes">
          <Card>
            <CardBody className="text-ink-muted text-sm">Εσωτερικές σημειώσεις προπονητή (όχι ορατές σε γονείς εκτός αν επισημανθούν parent_visible) — Stage 2.</CardBody>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
