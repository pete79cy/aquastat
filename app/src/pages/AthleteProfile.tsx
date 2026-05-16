import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/utils";
import { Edit3, Plus } from "lucide-react";

export default function AthleteProfile() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const athleteId = params.id;

  const athleteQ = useQuery({
    queryKey: ["athlete", athleteId],
    queryFn: () => (athleteId ? api.athletes.get(athleteId).then((r) => r.athlete) : Promise.reject(new Error("no id"))),
    enabled: !!athleteId,
  });

  const resultsQ = useQuery({
    queryKey: ["athlete-results", athleteId],
    queryFn: () => (athleteId ? api.athletes.results(athleteId).then((r) => r.results) : Promise.reject(new Error("no id"))),
    enabled: !!athleteId,
  });

  if (athleteQ.isLoading) {
    return <div className="text-ink-muted text-sm">{t("common.loading")}</div>;
  }
  if (!athleteQ.data) {
    return <div className="text-ink-muted text-sm">Δεν βρέθηκε αθλητής.</div>;
  }

  const a = athleteQ.data;
  const initials = (a.firstName[0] ?? "") + (a.lastName[0] ?? "");
  const results = resultsQ.data ?? [];

  // Compute best time per event (PB)
  const bestByEvent = new Map<string, { event: string; timeMs: number }>();
  for (const r of results) {
    if (r.verificationStatus !== "verified") continue;
    const cur = bestByEvent.get(r.eventDisplay);
    if (!cur || r.timeMs < cur.timeMs) {
      bestByEvent.set(r.eventDisplay, { event: r.eventDisplay, timeMs: r.timeMs });
    }
  }
  const bestTimes = Array.from(bestByEvent.values()).slice(0, 4);

  return (
    <div className="space-y-5">
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-20 h-20 rounded-xl bg-primary text-primary-fg grid place-items-center text-3xl font-bold tracking-tight shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-ink">{a.firstName} {a.lastName}</h1>
                {a.isActive && <Chip tone="achieved">{t("athleteProfile.active")}</Chip>}
              </div>
              <div className="text-sm text-ink-muted mt-1">
                Γεν. {a.dateOfBirth} · {a.gender === "male" ? "Άνδρας" : "Γυναίκα"}
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

      {bestTimes.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {bestTimes.map((b, i) => (
            <Card key={i}>
              <CardBody className="space-y-1">
                <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                  {t("athleteProfile.bestTime")}
                </div>
                <div className="text-xs text-ink-muted">{b.event}</div>
                <div className="text-3xl font-bold text-primary tnum">{formatTime(b.timeMs)}</div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="results" className="space-y-4">
        <TabsList className="bg-surface-0 rounded-md border border-outline-variant w-full lg:w-auto justify-start overflow-x-auto">
          <TabsTrigger value="results">{t("athleteProfile.tabs.results")}</TabsTrigger>
          <TabsTrigger value="training">{t("athleteProfile.tabs.training")}</TabsTrigger>
          <TabsTrigger value="progress">{t("athleteProfile.tabs.progress")}</TabsTrigger>
          <TabsTrigger value="standards">{t("athleteProfile.tabs.standards")}</TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <Card>
            <CardBody className="!p-0">
              {resultsQ.isLoading ? (
                <div className="p-8 text-center text-ink-muted text-sm">{t("common.loading")}</div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-ink-muted text-sm">Δεν υπάρχουν καταχωρημένα αποτελέσματα ακόμα.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-ink-muted text-[11px] uppercase tracking-wider border-b border-outline-variant">
                      <th className="px-4 py-2 text-left">Αγώνισμα</th>
                      <th className="px-4 py-2 text-left">Πισίνα</th>
                      <th className="px-4 py-2 text-left">Φάση</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-right">Χρόνος</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/50">
                    {results.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-1">
                        <td className="px-4 py-3 font-semibold text-ink">{r.eventDisplay}</td>
                        <td className="px-4 py-3 text-ink-muted">{r.poolType === "50m" ? "50μ" : r.poolType === "25m" ? "25μ" : "—"}</td>
                        <td className="px-4 py-3 text-ink-muted">{r.roundType}</td>
                        <td className="px-4 py-3">
                          <Chip tone={r.verificationStatus === "verified" ? "achieved" : r.verificationStatus === "rejected" ? "warn" : "close"}>
                            {r.verificationStatus}
                          </Chip>
                        </td>
                        <td className="px-4 py-3 text-right tnum font-bold text-primary">{formatTime(r.timeMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="training">
          <Card><CardBody className="text-ink-muted text-sm">Training results endpoint pending (Stage 3c).</CardBody></Card>
        </TabsContent>
        <TabsContent value="progress">
          <Card><CardBody className="text-ink-muted text-sm">Progress chart — depends on results history.</CardBody></Card>
        </TabsContent>
        <TabsContent value="standards">
          <Card><CardBody className="text-ink-muted text-sm">Standards comparison — derives from /api/standards.</CardBody></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
