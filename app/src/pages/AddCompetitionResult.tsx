import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, Textarea, Field } from "@/components/ui/Select";
import { Chip } from "@/components/ui/Chip";
import { athletes, competitions, swimEvents } from "@/lib/mockData";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { formatTime } from "@/lib/utils";

export default function AddCompetitionResult() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [min, setMin] = useState("");
  const [sec, setSec] = useState("");
  const [hund, setHund] = useState("");

  const totalMs = useMemo(() => {
    const m = parseInt(min || "0", 10);
    const s = parseInt(sec || "0", 10);
    const h = parseInt(hund || "0", 10);
    return m * 60_000 + s * 1_000 + h * 10;
  }, [min, sec, hund]);

  return (
    <div className="space-y-5 lg:max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {t("common.back")}
      </button>

      <header>
        <h1 className="text-2xl lg:text-headline-lg font-semibold text-ink">{t("addResult.competitionTitle")}</h1>
        <p className="text-sm text-ink-muted mt-1">{t("addResult.competitionSubtitle")}</p>
      </header>

      <Card>
        <CardBody className="space-y-5">
          <Field label={t("addResult.athlete")} required>
            <Select defaultValue="a1">
              {athletes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.firstName} {a.lastName} · {a.dob}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t("addResult.competition")} required>
              <Select defaultValue="comp1">
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.startDate}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("addResult.date")} required>
              <Input type="date" defaultValue="2026-10-24" />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t("addResult.event")} required>
              <Select defaultValue="e10">
                {swimEvents.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("addResult.poolType")} required>
              <Select defaultValue="50m">
                <option value="25m">25μ (Short course)</option>
                <option value="50m">50μ (Long course)</option>
              </Select>
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t("addResult.roundType")}>
              <Select defaultValue="final">
                <option value="heat">{t("addResult.rounds.heat")}</option>
                <option value="final">{t("addResult.rounds.final")}</option>
                <option value="direct_final">{t("addResult.rounds.direct_final")}</option>
              </Select>
            </Field>
            <Field label={t("addResult.rank")}>
              <Input type="number" min={1} placeholder={t("addResult.rankPlaceholder")} />
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

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={() => navigate(-1)} className="sm:flex-1">
              {t("addResult.cancel")}
            </Button>
            <Button variant="outline" className="sm:flex-1">
              <Plus className="w-4 h-4" /> {t("addResult.saveAndAddAnother")}
            </Button>
            <Button className="sm:flex-1">
              <Save className="w-4 h-4" /> {t("addResult.save")}
            </Button>
          </div>

          <div className="text-[11px] text-ink-subtle border-t border-outline-variant/60 pt-3 flex items-start gap-2">
            <Chip tone="info">PDR §6.6</Chip>
            <span>
              Επίσημες επιδόσεις περνούν σε pending verification. Μετά την επιβεβαίωση από admin, ενημερώνεται PB.
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
