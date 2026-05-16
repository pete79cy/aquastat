import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, Textarea, Field } from "@/components/ui/Select";
import { Chip } from "@/components/ui/Chip";
import { api } from "@/lib/api";
import { ArrowLeft, Save, Plus, AlertCircle } from "lucide-react";
import { formatTime } from "@/lib/utils";

export default function AddCompetitionResult() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const athletesQ = useQuery({ queryKey: ["athletes"], queryFn: () => api.athletes.list().then((r) => r.athletes) });
  const competitionsQ = useQuery({ queryKey: ["competitions"], queryFn: () => api.competitions.list().then((r) => r.competitions) });
  const eventsQ = useQuery({ queryKey: ["swim-events"], queryFn: () => api.swimEvents.list().then((r) => r.swimEvents) });

  const [athleteId, setAthleteId] = useState("");
  const [competitionId, setCompetitionId] = useState("");
  const [swimEventId, setSwimEventId] = useState("");
  const [poolType, setPoolType] = useState<"25m" | "50m">("50m");
  const [roundType, setRoundType] = useState<"heat" | "final" | "direct_final">("final");
  const [rank, setRank] = useState("");
  const [min, setMin] = useState("");
  const [sec, setSec] = useState("");
  const [hund, setHund] = useState("");
  const [error, setError] = useState<string | null>(null);

  const totalMs = useMemo(() => {
    const m = parseInt(min || "0", 10);
    const s = parseInt(sec || "0", 10);
    const h = parseInt(hund || "0", 10);
    return m * 60_000 + s * 1_000 + h * 10;
  }, [min, sec, hund]);

  const mut = useMutation({
    mutationFn: () =>
      api.results.createCompetition({
        athleteId,
        competitionId,
        swimEventId,
        resultTimeMs: totalMs,
        poolType,
        roundType,
        rank: rank ? parseInt(rank, 10) : undefined,
      }),
    onSuccess: () => navigate(-1),
    onError: (err: Error) => setError(err.message || "Σφάλμα κατά την αποθήκευση."),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!athleteId || !competitionId || !swimEventId || totalMs <= 0) {
      setError("Συμπληρώστε όλα τα υποχρεωτικά πεδία.");
      return;
    }
    mut.mutate();
  };

  return (
    <div className="space-y-5 lg:max-w-3xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("common.back")}
      </button>

      <header>
        <h1 className="text-2xl lg:text-headline-lg font-semibold text-ink">{t("addResult.competitionTitle")}</h1>
        <p className="text-sm text-ink-muted mt-1">{t("addResult.competitionSubtitle")}</p>
      </header>

      <form onSubmit={onSubmit}>
        <Card>
          <CardBody className="space-y-5">
            <Field label={t("addResult.athlete")} required>
              <Select value={athleteId} onChange={(e) => setAthleteId(e.target.value)} required>
                <option value="">{t("common.select")}</option>
                {(athletesQ.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>{a.firstName} {a.lastName} · {a.dateOfBirth}</option>
                ))}
              </Select>
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("addResult.competition")} required>
                <Select value={competitionId} onChange={(e) => setCompetitionId(e.target.value)} required>
                  <option value="">{t("common.select")}</option>
                  {(competitionsQ.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name} · {c.startDate}</option>
                  ))}
                </Select>
              </Field>
              <Field label={t("addResult.event")} required>
                <Select value={swimEventId} onChange={(e) => setSwimEventId(e.target.value)} required>
                  <option value="">{t("common.select")}</option>
                  {(eventsQ.data ?? []).map((e) => (
                    <option key={e.id} value={e.id}>{e.displayName} ({e.gender === "male" ? "Α" : "Γ"})</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Field label={t("addResult.poolType")} required>
                <Select value={poolType} onChange={(e) => setPoolType(e.target.value as "25m" | "50m")}>
                  <option value="25m">25μ</option>
                  <option value="50m">50μ</option>
                </Select>
              </Field>
              <Field label={t("addResult.roundType")}>
                <Select value={roundType} onChange={(e) => setRoundType(e.target.value as "heat" | "final" | "direct_final")}>
                  <option value="heat">{t("addResult.rounds.heat")}</option>
                  <option value="final">{t("addResult.rounds.final")}</option>
                  <option value="direct_final">{t("addResult.rounds.direct_final")}</option>
                </Select>
              </Field>
              <Field label={t("addResult.rank")}>
                <Input type="number" min={1} placeholder={t("addResult.rankPlaceholder")} value={rank} onChange={(e) => setRank(e.target.value)} />
              </Field>
            </div>

            <Field label={t("addResult.time")} required hint={totalMs > 0 ? `${t("addResult.msPreview")}: ${totalMs.toLocaleString("el-CY")} ms · ${formatTime(totalMs)}` : undefined}>
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" min={0} max={59} placeholder={t("addResult.minutes")} value={min} onChange={(e) => setMin(e.target.value)} inputMode="numeric" />
                <Input type="number" min={0} max={59} placeholder={t("addResult.seconds")} value={sec} onChange={(e) => setSec(e.target.value)} inputMode="numeric" />
                <Input type="number" min={0} max={99} placeholder={t("addResult.hundredths")} value={hund} onChange={(e) => setHund(e.target.value)} inputMode="numeric" />
              </div>
            </Field>

            <Field label={t("addResult.notes")}>
              <Textarea placeholder={t("addResult.notesPlaceholder")} />
            </Field>

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-warn-bg text-warn p-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} className="sm:flex-1">
                {t("addResult.cancel")}
              </Button>
              <Button type="submit" className="sm:flex-1" disabled={mut.isPending}>
                {mut.isPending ? t("common.loading") : <>
                  <Save className="w-4 h-4" /> {t("addResult.save")}
                </>}
              </Button>
            </div>

            <div className="text-[11px] text-ink-subtle border-t border-outline-variant/60 pt-3 flex items-start gap-2">
              <Chip tone="info">PDR §6.6</Chip>
              <span>Επίσημες επιδόσεις περνούν σε pending verification.</span>
            </div>
          </CardBody>
        </Card>
      </form>

      {/* Keep Plus import tree-shake friendly */}
      <span className="hidden"><Plus /></span>
    </div>
  );
}
