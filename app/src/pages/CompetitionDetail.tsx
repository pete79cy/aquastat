import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { competitionDetail as c, eligibilityList } from "@/lib/mockData";
import { ArrowLeft, MapPin, Calendar as CalendarIcon, Clock, FileText, Download } from "lucide-react";
import { formatTime } from "@/lib/utils";

export default function CompetitionDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("common.back")}
      </button>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-ink">{c.name}</h1>
              <p className="text-sm text-ink-muted mt-2 max-w-prose">{c.description}</p>
            </div>
            <Chip tone="achieved">{t(`competitions.status.${c.status}`)}</Chip>
          </div>

          <div className="grid sm:grid-cols-4 gap-3 pt-3">
            <Meta icon={<CalendarIcon className="w-4 h-4" />} label="Ημερομηνία" value={`${c.startDate} → ${c.endDate}`} />
            <Meta icon={<MapPin className="w-4 h-4" />} label="Τοποθεσία" value={c.venue} />
            <Meta icon={<Clock className="w-4 h-4" />} label={t("competitions.deadline")} value={c.declarationDeadline} />
            <Meta icon={<FileText className="w-4 h-4" />} label={t("competitions.pool")} value={`${c.pool === "50m" ? "50μ" : "25μ"} · ${c.eligibleBirthYears}`} />
          </div>
        </CardBody>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardBody>
            <h2 className="text-headline-md text-ink mb-3">{t("competitionDetail.program")}</h2>
            <div className="space-y-4">
              {c.program.map((session, i) => (
                <div key={i} className="border-l-2 border-primary pl-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-semibold text-ink">{session.day}</span>
                    <Chip tone="primary">{session.session}</Chip>
                    <span className="text-xs text-ink-muted">· {session.time}</span>
                  </div>
                  <ul className="text-sm text-ink space-y-1">
                    {session.events.map((ev, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-ink-muted w-6 tnum">#{j + 1}</span>
                        {ev}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardBody>
              <h2 className="text-headline-md text-ink mb-3">{t("competitionDetail.eligibleAthletes")}</h2>
              <ul className="space-y-3">
                {eligibilityList.map((row) => (
                  <li key={row.athlete.id} className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary grid place-items-center text-xs font-bold">
                      {row.athlete.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-ink truncate">{row.athlete.name}</div>
                      <div className="text-[11px] text-ink-muted">{row.athlete.category}</div>
                    </div>
                    <Chip tone={row.status === "qualified" ? "achieved" : "close"}>
                      {t(`preparation.status.${row.status === "qualified" ? "qualified" : "close"}`)}
                    </Chip>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="text-headline-md text-ink mb-3">{t("competitionDetail.requirements")}</h2>
              <div className="space-y-2 text-sm">
                {eligibilityList[0].entries.slice(0, 3).map((e, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-outline-variant/50 pb-2 last:border-0">
                    <span className="text-ink-muted">{e.event}</span>
                    <span className="font-semibold text-ink tnum">{formatTime(e.limit)}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="text-headline-md text-ink mb-3">{t("competitionDetail.documents")}</h2>
              <Button variant="outline" size="sm" className="w-full">
                <Download className="w-4 h-4" /> Πρόγραμμα PDF
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface-1 rounded-md p-3">
      <div className="flex items-center gap-1.5 text-ink-muted">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-sm font-semibold text-ink mt-1">{value}</div>
    </div>
  );
}
