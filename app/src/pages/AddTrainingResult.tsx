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
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { formatTime } from "@/lib/utils";

const trainingTypes = ["test", "time_trial", "race_simulation", "set_result", "coach_observation"] as const;
const trainingContexts = ["normal", "heavy_fatigue", "taper", "after_gym", "before_competition", "technical_test"] as const;

export default function AddTrainingResult() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const athletesQ = useQuery({ queryKey: ["athletes"], queryFn: () => api.athletes.list().then((r) => r.athletes) });
  const eventsQ = useQuery({ queryKey: ["swim-events"], queryFn: () => api.swimEvents.list().then((r) => r.swimEvents) });

  const [athleteId, setAthleteId] = useState("");
  const [swimEventId, setSwimEventId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [trainingType, setTrainingType] = useState<(typeof trainingTypes)[number]>("time_trial");
  const [trainingContext, setTrainingContext] = useState<(typeof trainingContexts)[number]>("normal");
  const [notes, setNotes] = useState("");
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
      api.results.createTraining({
        athleteId,
        swimEventId,
        resultTimeMs: totalMs,
        date,
        trainingType,
        trainingContext,
        notes: notes || undefined,
      }),
    onSuccess: () => navigate(-1),
    onError: (err: Error) => setError(err.message || "Σφάλμα κατά την αποθήκευση."),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!athleteId || !swimEventId || totalMs <= 0) {
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
        <h1 className="text-2xl lg:text-headline-lg font-semibold text-ink">{t("addResult.trainingTitle")}</h1>
        <p className="text-sm text-ink-muted mt-1">{t("addResult.trainingSubtitle")}</p>
      </header>

      <form onSubmit={onSubmit}>
        <Card>
          <CardBody className="space-y-5">
            <Field label={t("addResult.athlete")} required>
              <Select value={athleteId} onChange={(e) => setAthleteId(e.target.value)} required>
                <option value="">{t("common.select")}</option>
                {(athletesQ.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                ))}
              </Select>
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("addResult.date")} required>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
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

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("addResult.trainingType")} required>
                <Select value={trainingType} onChange={(e) => setTrainingType(e.target.value as typeof trainingType)}>
                  {trainingTypes.map((tt) => (<option key={tt} value={tt}>{t(`training.types.${tt}`)}</option>))}
                </Select>
              </Field>
              <Field label={t("addResult.trainingContext")}>
                <Select value={trainingContext} onChange={(e) => setTrainingContext(e.target.value as typeof trainingContext)}>
                  {trainingContexts.map((c) => (<option key={c} value={c}>{t(`training.contexts.${c}`)}</option>))}
                </Select>
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
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Παρατηρήσεις από προπόνηση..." />
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
              <Chip tone="info">PDR §11.4</Chip>
              <span>Προπονητικοί χρόνοι δεν προσμετρούν για επίσημη πρόκριση.</span>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  );
}
