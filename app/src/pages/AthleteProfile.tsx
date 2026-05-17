import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { EditAthleteDialog } from "@/components/athletes/EditAthleteDialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { api, type CompetitionResult } from "@/lib/api";
import { formatTime, formatDelta } from "@/lib/utils";
import { Edit3, Plus, TrendingDown, Trophy, Target } from "lucide-react";

type PB = { event: string; pool: string; timeMs: number; pbId: string };

export default function AthleteProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const params = useParams<{ id: string }>();
  const athleteId = params.id;
  const [editOpen, setEditOpen] = useState(false);

  const addResultBase =
    me?.role === "coach" ? "/coach/add-result"
      : me?.role === "club_admin" ? "/admin/add-result"
      : "/coach/add-result";

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
  const trainingQ = useQuery({
    queryKey: ["athlete-training", athleteId],
    queryFn: () => (athleteId ? api.athletes.trainingResults(athleteId).then((r) => r.results) : Promise.reject(new Error("no id"))),
    enabled: !!athleteId,
  });
  const standardsQ = useQuery({
    queryKey: ["athlete-standards", athleteId],
    queryFn: () => (athleteId ? api.athletes.standardsComparison(athleteId).then((r) => r) : Promise.reject(new Error("no id"))),
    enabled: !!athleteId,
  });

  const results = useMemo(() => resultsQ.data ?? [], [resultsQ.data]);
  const trainingResults = trainingQ.data ?? [];
  const standards = standardsQ.data?.standards ?? [];

  // PB calc: min verified time per (eventDisplay, poolType)
  const pbs = useMemo<PB[]>(() => {
    const map = new Map<string, PB>();
    for (const r of results) {
      if (r.verificationStatus !== "verified") continue;
      const key = `${r.eventDisplay}__${r.poolType}`;
      const existing = map.get(key);
      if (!existing || r.timeMs < existing.timeMs) {
        map.set(key, {
          event: r.eventDisplay,
          pool: r.poolType,
          timeMs: r.timeMs,
          pbId: r.id,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.event.localeCompare(b.event));
  }, [results]);

  // Distinct events for progress chart selector
  const eventOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of results) set.add(r.eventDisplay);
    return Array.from(set).sort();
  }, [results]);

  const [chartEvent, setChartEvent] = useState<string>("");
  const effectiveChartEvent = chartEvent || eventOptions[0] || "";

  const progressData = useMemo(() => {
    if (!effectiveChartEvent) return [];
    return results
      .filter((r) => r.eventDisplay === effectiveChartEvent && r.verificationStatus === "verified")
      .map((r) => ({
        date: new Date(r.createdAt).toLocaleDateString("el-CY", { day: "2-digit", month: "short" }),
        timeMs: r.timeMs,
        rawDate: r.createdAt,
      }))
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [results, effectiveChartEvent]);

  // Standards comparison: for each standard, find athlete's best matching time
  const standardsAnalysis = useMemo(() => {
    return standards.map((s) => {
      const matchingPbs = pbs.filter((p) => p.event === s.eventDisplay);
      const best = matchingPbs.reduce(
        (a, b) => (a == null || b.timeMs < a.timeMs ? b : a),
        null as PB | null
      );
      const gapMs = best ? best.timeMs - s.timeMs : null;
      const status: "achieved" | "close" | "not_achieved" | "no_result" =
        !best ? "no_result"
          : gapMs! <= 0 ? "achieved"
          : gapMs! / s.timeMs < 0.05 ? "close"
          : "not_achieved";
      return { standard: s, best, gapMs, status };
    });
  }, [standards, pbs]);

  if (athleteQ.isLoading) {
    return <div className="text-ink-muted text-sm">{t("common.loading")}</div>;
  }
  if (!athleteQ.data) {
    return <div className="text-ink-muted text-sm">Δεν βρέθηκε αθλητής.</div>;
  }

  const a = athleteQ.data;
  const initials = (a.firstName[0] ?? "") + (a.lastName[0] ?? "");
  const latestResult = results[0] as CompetitionResult | undefined;

  return (
    <div className="space-y-5">
      {/* Header */}
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
              <Button
                className="flex-1 sm:flex-initial"
                onClick={() => navigate(`${addResultBase}?athleteId=${athleteId}`)}
              >
                <Plus className="w-4 h-4" /> {t("athleteProfile.recordResult")}
              </Button>
              <Button
                variant="outline"
                className="flex-1 sm:flex-initial"
                onClick={() => setEditOpen(true)}
              >
                <Edit3 className="w-4 h-4" /> {t("athleteProfile.editProfile")}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Total PBs" value={pbs.length} icon={<Trophy className="w-4 h-4 text-tertiary-container" />} />
        <Kpi label="Verified results" value={results.filter((r) => r.verificationStatus === "verified").length} icon={<Target className="w-4 h-4 text-primary" />} />
        <Kpi label="Training tests" value={trainingResults.length} icon={<TrendingDown className="w-4 h-4 text-primary" />} />
        <Kpi
          label="Achieved standards"
          value={standardsAnalysis.filter((sa) => sa.status === "achieved").length}
          icon={<Trophy className="w-4 h-4 text-achieved" />}
          tone="achieved"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-surface-0 rounded-md border border-outline-variant w-full lg:w-auto justify-start overflow-x-auto">
          <TabsTrigger value="overview">{t("athleteProfile.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="progress">{t("athleteProfile.tabs.progress")}</TabsTrigger>
          <TabsTrigger value="standards">{t("athleteProfile.tabs.standards")}</TabsTrigger>
          <TabsTrigger value="results">{t("athleteProfile.tabs.results")}</TabsTrigger>
          <TabsTrigger value="training">{t("athleteProfile.tabs.training")}</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          {latestResult && (
            <Card>
              <CardBody>
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Τελευταία επίδοση</div>
                    <div className="text-3xl font-bold text-primary tnum mt-1">{formatTime(latestResult.timeMs)}</div>
                    <div className="text-xs text-ink-muted mt-1">{latestResult.eventDisplay} · {latestResult.poolType}</div>
                  </div>
                  <Chip tone={latestResult.verificationStatus === "verified" ? "achieved" : "close"}>
                    {latestResult.verificationStatus}
                  </Chip>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody>
              <h2 className="text-headline-md text-ink mb-3">Personal Bests</h2>
              {pbs.length === 0 ? (
                <div className="text-sm text-ink-muted text-center py-6">Δεν υπάρχουν verified αποτελέσματα ακόμα.</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {pbs.map((pb) => (
                    <div key={pb.pbId} className="border border-outline-variant/60 rounded-md p-3">
                      <div className="text-sm text-ink-muted">{pb.event}</div>
                      <div className="text-xs text-ink-subtle uppercase tracking-wider mt-0.5">{pb.pool}</div>
                      <div className="text-2xl font-bold text-primary tnum mt-1">{formatTime(pb.timeMs)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </TabsContent>

        {/* PROGRESS */}
        <TabsContent value="progress">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="text-headline-md text-ink">Πρόοδος στον χρόνο</h2>
                {eventOptions.length > 1 && (
                  <Select
                    value={effectiveChartEvent}
                    onChange={(e) => setChartEvent(e.target.value)}
                    className="max-w-xs"
                  >
                    {eventOptions.map((ev) => (
                      <option key={ev} value={ev}>{ev}</option>
                    ))}
                  </Select>
                )}
              </div>

              {progressData.length === 0 ? (
                <div className="text-sm text-ink-muted text-center py-12">
                  Δεν υπάρχουν αρκετά verified αποτελέσματα για να σχηματιστεί γραφική.
                </div>
              ) : (
                <>
                  <div className="h-64 -ml-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressData}>
                        <CartesianGrid stroke="#e6e8eb" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" stroke="#70787e" tick={{ fontSize: 12 }} axisLine={{ stroke: "#bfc8ce" }} tickLine={false} />
                        <YAxis
                          domain={["dataMin - 500", "dataMax + 500"]}
                          reversed
                          tickFormatter={(v) => formatTime(v)}
                          tick={{ fontSize: 11 }}
                          width={60}
                        />
                        <Tooltip
                          formatter={(v) => formatTime(Number(v))}
                          contentStyle={{ borderRadius: 8, border: "1px solid #bfc8ce", fontSize: 12 }}
                        />
                        <Line type="monotone" dataKey="timeMs" stroke="#00526f" strokeWidth={2.5} dot={{ r: 4, fill: "#00526f" }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[11px] text-ink-subtle italic text-center mt-2">
                    Μικρότερος χρόνος = καλύτερη επίδοση
                  </p>
                </>
              )}
            </CardBody>
          </Card>
        </TabsContent>

        {/* STANDARDS */}
        <TabsContent value="standards">
          <Card>
            <CardBody>
              <h2 className="text-headline-md text-ink mb-3">Όρια πρόκρισης</h2>
              {standardsQ.isLoading ? (
                <div className="text-sm text-ink-muted">{t("common.loading")}</div>
              ) : standardsAnalysis.length === 0 ? (
                <div className="text-sm text-ink-muted text-center py-8">Δεν υπάρχουν όρια στη σαιζόν.</div>
              ) : (
                <ul className="space-y-3">
                  {standardsAnalysis.map((sa) => {
                    const pct =
                      sa.status === "achieved"
                        ? 100
                        : sa.best && sa.standard.timeMs
                          ? Math.max(40, Math.min(99, Math.round((sa.standard.timeMs / sa.best.timeMs) * 100)))
                          : 0;
                    const barColor =
                      sa.status === "achieved" ? "bg-achieved" : sa.status === "close" ? "bg-close" : "bg-warn";
                    const chipTone =
                      sa.status === "achieved" ? "achieved"
                        : sa.status === "close" ? "close"
                        : sa.status === "no_result" ? "neutral" : "warn";
                    return (
                      <li key={sa.standard.id} className="border border-outline-variant/60 rounded-md p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-ink">{sa.standard.eventDisplay}</div>
                            <div className="text-xs text-ink-muted">
                              {sa.standard.categoryEl ?? "—"} · {sa.standard.gender === "male" ? "Α" : "Γ"}
                            </div>
                          </div>
                          <Chip tone={chipTone}>{sa.status}</Chip>
                        </div>
                        <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                          <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ink-muted tnum">
                            PB: {sa.best ? formatTime(sa.best.timeMs) : "—"}
                          </span>
                          <span className="text-ink-muted tnum">
                            Όριο: <strong className="text-ink">{formatTime(sa.standard.timeMs)}</strong>
                            {sa.gapMs != null && sa.gapMs > 0 && (
                              <span className="text-close ml-2">{formatDelta(sa.gapMs)}</span>
                            )}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </TabsContent>

        {/* RESULTS */}
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

        {/* TRAINING */}
        <TabsContent value="training">
          <Card>
            <CardBody className="!p-0">
              {trainingQ.isLoading ? (
                <div className="p-8 text-center text-ink-muted text-sm">{t("common.loading")}</div>
              ) : trainingResults.length === 0 ? (
                <div className="p-8 text-center text-ink-muted text-sm">Δεν υπάρχουν καταγραμμένες προπονητικές επιδόσεις.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-ink-muted text-[11px] uppercase tracking-wider border-b border-outline-variant">
                      <th className="px-4 py-2 text-left">Ημερομηνία</th>
                      <th className="px-4 py-2 text-left">Αγώνισμα</th>
                      <th className="px-4 py-2 text-left">Τύπος</th>
                      <th className="px-4 py-2 text-left">Συνθήκες</th>
                      <th className="px-4 py-2 text-right">Χρόνος</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/50">
                    {trainingResults.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-1">
                        <td className="px-4 py-3 text-ink-muted tnum">{r.date}</td>
                        <td className="px-4 py-3 font-semibold text-ink">{r.eventDisplay}</td>
                        <td className="px-4 py-3 text-ink-muted">{r.trainingType}</td>
                        <td className="px-4 py-3 text-ink-muted">{r.trainingContext}</td>
                        <td className="px-4 py-3 text-right tnum font-bold text-primary">{formatTime(r.timeMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </TabsContent>
      </Tabs>

      <EditAthleteDialog athlete={a} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "achieved";
}) {
  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-center gap-1.5 text-ink-muted">
          {icon}
          <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <div className={"mt-2 text-2xl lg:text-3xl font-bold tracking-tight tnum " + (tone === "achieved" ? "text-achieved" : "text-primary")}>
          {value}
        </div>
      </CardBody>
    </Card>
  );
}
