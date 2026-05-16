import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { api } from "@/lib/api";
import { Search, Plus, MapPin, Calendar as CalendarIcon, Waves } from "lucide-react";

export default function CompetitionCalendar() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["competitions"],
    queryFn: () => api.competitions.list().then((r) => r.competitions),
  });

  const competitions = data ?? [];
  const filtered = competitions.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      (c.location?.toLowerCase().includes(q.toLowerCase()) ?? false)
  );

  const statusFor = (c: typeof competitions[number]): "registration_open" | "scheduled" | "past" => {
    const now = new Date();
    const end = new Date(c.endDate);
    if (end < now) return "past";
    if (c.declarationDeadline && new Date(c.declarationDeadline) > now) return "registration_open";
    return "scheduled";
  };

  const statusTone = (s: ReturnType<typeof statusFor>) =>
    s === "registration_open" ? "achieved" : s === "scheduled" ? "primary" : "neutral";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-headline-lg font-semibold text-ink">{t("competitions.title")}</h1>
          <p className="text-sm text-ink-muted mt-1">{t("competitions.subtitle", { season: "2025–2026" })}</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" /> {t("competitions.newCompetition")}
        </Button>
      </header>

      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
        <Input className="pl-9" placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading ? (
        <Card><CardBody className="text-center text-ink-muted py-12 text-sm">{t("common.loading")}</CardBody></Card>
      ) : filtered.length === 0 ? (
        <Card><CardBody className="text-center text-ink-muted py-12 text-sm">{t("competitions.noResults")}</CardBody></Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {filtered.map((c) => {
            const status = statusFor(c);
            const start = new Date(c.startDate);
            const end = new Date(c.endDate);
            return (
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
                          {start.toLocaleDateString("el-CY", { day: "2-digit", month: "short" })}
                          {c.startDate !== c.endDate && ` – ${end.toLocaleDateString("el-CY", { day: "2-digit", month: "short" })}`}
                        </div>
                      </div>
                    </div>
                    <Chip tone={statusTone(status)}>{t(`competitions.status.${status}`)}</Chip>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">{t("competitions.pool")}</div>
                      <div className="text-ink mt-0.5 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-ink-subtle shrink-0" />
                        {c.venue ?? "—"} · {c.poolType === "50m" ? "50μ" : c.poolType === "25m" ? "25μ" : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">{t("competitions.deadline")}</div>
                      <div className="text-ink mt-0.5">
                        {c.declarationDeadline ? new Date(c.declarationDeadline).toLocaleDateString("el-CY") : "—"}
                      </div>
                    </div>
                  </div>

                  <Link to={`/coach/competitions/${c.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      {status === "past" ? t("competitions.viewResults") : t("competitions.viewDetails")}
                    </Button>
                  </Link>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
