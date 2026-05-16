import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { eligibilityList } from "@/lib/mockData";
import { ArrowLeft, Search, FileDown, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { formatTime } from "@/lib/utils";

export default function CompetitionPreparation() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const qualifiedCount = eligibilityList.filter((e) => e.status === "qualified").length;
  const closeCount = eligibilityList.filter((e) => e.status === "close").length;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("common.back")}
      </button>

      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs text-ink-subtle uppercase tracking-wider">{t("preparation.phase")}</div>
          <h1 className="text-2xl lg:text-headline-lg font-semibold text-ink mt-1">{t("preparation.title")}</h1>
          <p className="text-sm text-ink-muted mt-1">{t("preparation.subtitle")}</p>
        </div>
        <Button>
          <FileDown className="w-4 h-4" /> {t("preparation.generateEntries")}
        </Button>
      </header>

      {/* Next competition card */}
      <Card className="bg-primary text-primary-fg shadow-card-hover">
        <CardBody className="space-y-2">
          <div className="flex items-center gap-2">
            <Chip className="bg-white/20 text-white border border-white/30">{t("preparation.phaseTaper")}</Chip>
          </div>
          <h2 className="text-xl font-bold leading-tight">Πρωτάθλημα Ανοιχτής Κατηγορίας</h2>
          <div className="text-sm flex items-center gap-3 text-primary-container-fg">
            <span className="flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" /> 24–26 Οκτ 2026</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Λεμεσός</span>
          </div>
        </CardBody>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label={t("preparation.qualified")} value={qualifiedCount} tone="achieved" />
        <Stat label={t("preparation.close")} value={closeCount} tone="close" />
        <Stat label={t("preparation.pending")} value={6} tone="warn" />
        <Stat label={t("preparation.deadlineIn")} value="4η 12ω" tone="primary" />
      </div>

      {/* Athletes management */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-headline-md text-ink">{t("preparation.athletesManagement")}</h2>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
              <Input className="pl-9" placeholder={t("preparation.searchAthletes")} />
            </div>
          </div>

          <div className="space-y-4">
            {eligibilityList.map((row) => (
              <div key={row.athlete.id} className="border border-outline-variant/60 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary grid place-items-center text-sm font-bold">
                    {row.athlete.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-ink">{row.athlete.name}</div>
                    <div className="text-xs text-ink-muted">{row.athlete.category}</div>
                  </div>
                  <Chip tone={row.status === "qualified" ? "achieved" : "close"}>
                    {t(`preparation.status.${row.status === "qualified" ? "qualified" : "close"}`)}
                  </Chip>
                </div>

                <div className="space-y-2">
                  {row.entries.map((entry, i) => (
                    <div key={i} className="text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-ink-muted">{entry.event}</span>
                        <span className={"tnum font-semibold " + (entry.qualified ? "text-achieved" : "text-close")}>{formatTime(entry.pb)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className={"h-full " + (entry.qualified ? "bg-achieved" : "bg-close")}
                          style={{ width: entry.qualified ? "100%" : `${Math.max(60, 100 - (entry.gapMs ?? 0) / 30)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-ink-subtle mt-0.5 tnum">
                        <span>PB: {formatTime(entry.pb)}</span>
                        <span>{t("preparation.limit")}: {formatTime(entry.limit)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone: "achieved" | "close" | "warn" | "primary" }) {
  const colorMap = { achieved: "text-achieved", close: "text-close", warn: "text-warn", primary: "text-primary" };
  return (
    <Card>
      <CardBody className="p-4">
        <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">{label}</div>
        <div className={"mt-1 text-2xl lg:text-3xl font-bold tnum " + colorMap[tone]}>{value}</div>
      </CardBody>
    </Card>
  );
}
