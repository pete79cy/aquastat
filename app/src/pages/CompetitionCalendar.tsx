import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { competitions, me } from "@/lib/mockData";
import { Search, Plus, MapPin, Calendar as CalendarIcon, Waves } from "lucide-react";

export default function CompetitionCalendar() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");

  const filtered = competitions.filter(
    (c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.location.toLowerCase().includes(q.toLowerCase())
  );

  const statusTone = (s: typeof competitions[number]["status"]) =>
    s === "registration_open" ? "achieved" : s === "scheduled" ? "primary" : "neutral";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-headline-lg font-semibold text-ink">{t("competitions.title")}</h1>
          <p className="text-sm text-ink-muted mt-1">{t("competitions.subtitle", { season: me.coach.season })}</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" /> {t("competitions.newCompetition")}
        </Button>
      </header>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
          <Input className="pl-9" placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardBody className="text-center text-ink-muted text-sm py-12">{t("competitions.noResults")}</CardBody>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:shadow-card-hover transition-shadow">
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-md bg-primary-fixed text-primary grid place-items-center shrink-0">
                      <Waves className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-ink leading-tight">{c.name}</div>
                      <div className="text-xs text-ink-muted flex items-center gap-1 mt-1">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(c.startDate).toLocaleDateString("el-CY", { day: "2-digit", month: "short" })}
                        {c.startDate !== c.endDate && ` – ${new Date(c.endDate).toLocaleDateString("el-CY", { day: "2-digit", month: "short" })}`}
                      </div>
                    </div>
                  </div>
                  <Chip tone={statusTone(c.status)}>{t(`competitions.status.${c.status}`)}</Chip>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">{t("competitions.pool")}</div>
                    <div className="text-ink mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-ink-subtle" />
                      {c.venue} · {c.pool === "50m" ? "50μ" : "25μ"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">{t("competitions.eligible")}</div>
                    <div className="text-ink mt-0.5">{c.eligibleBirthYears}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-ink-muted border-t border-outline-variant/60 pt-3">
                  <div>
                    <span className="font-semibold text-ink tnum">{c.registeredAthletes}</span> {t("competitions.registeredAthletes").toLowerCase()} · <span className="tnum">{c.eventsCount}</span> {t("competitions.events")}
                  </div>
                  {c.status !== "past" && (
                    <div>
                      {t("competitions.deadline")}: <span className="font-semibold text-ink">{c.declarationDeadline}</span>
                    </div>
                  )}
                </div>

                <Link to={`/coach/competitions/${c.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    {c.status === "past" ? t("competitions.viewResults") : t("competitions.viewDetails")}
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
