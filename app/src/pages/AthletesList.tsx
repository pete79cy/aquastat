import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Chip } from "@/components/ui/Chip";
import { athletes } from "@/lib/mockData";
import { Search, Plus } from "lucide-react";
import { formatTime } from "@/lib/utils";

export default function AthletesList() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  const filtered = athletes.filter((a) => {
    const matchesQ = (a.firstName + " " + a.lastName).toLowerCase().includes(q.toLowerCase());
    const matchesCat = cat === "all" || a.categoryKey === cat;
    return matchesQ && matchesCat;
  });

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-headline-lg font-semibold text-ink">{t("athletesList.title")}</h1>
          <p className="text-sm text-ink-muted mt-1">{t("athletesList.results", { count: filtered.length })}</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" /> {t("athletesList.newAthlete")}
        </Button>
      </header>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
          <Input className="pl-9" placeholder={t("athletesList.searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">{t("athletesList.filterCategory")}</option>
          <option value="coachDashboard.categoryBoysU15">Παμπαίδες Α´</option>
          <option value="coachDashboard.categoryGirlsU13">Παγκορασίδες Β´</option>
          <option value="coachDashboard.categoryJuniors">Νέοι/Νεανίδες</option>
        </Select>
      </div>

      <Card>
        <CardBody className="!p-0">
          {/* Desktop table */}
          <table className="hidden md:table w-full text-sm">
            <thead>
              <tr className="text-ink-muted text-[11px] uppercase tracking-wider border-b border-outline-variant">
                <th className="px-4 py-2 text-left">{t("athletesList.columns.athlete")}</th>
                <th className="px-4 py-2 text-left">{t("athletesList.columns.dob")}</th>
                <th className="px-4 py-2 text-left">{t("athletesList.columns.category")}</th>
                <th className="px-4 py-2 text-left">{t("athletesList.columns.status")}</th>
                <th className="px-4 py-2 text-right">{t("athletesList.columns.lastResult")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-surface-1 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/coach/athletes/${a.id}`} className="flex items-center gap-2.5 hover:text-primary">
                      <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary grid place-items-center text-xs font-bold">
                        {a.initials}
                      </div>
                      <span className="font-semibold text-ink">{a.firstName} {a.lastName}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-muted tnum">{a.dob}</td>
                  <td className="px-4 py-3 text-ink-muted">{t(a.categoryKey)}</td>
                  <td className="px-4 py-3"><Chip tone="achieved">{t("athletesList.active")}</Chip></td>
                  <td className="px-4 py-3 text-right tnum font-semibold text-primary">{formatTime(a.latestTimeMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <ul className="md:hidden divide-y divide-outline-variant/50">
            {filtered.map((a) => (
              <li key={a.id}>
                <Link to={`/coach/athletes/${a.id}`} className="flex items-center gap-3 p-4 hover:bg-surface-1">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary grid place-items-center text-sm font-bold shrink-0">
                    {a.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-ink">{a.firstName} {a.lastName}</div>
                    <div className="text-xs text-ink-muted">{t(a.categoryKey)} · {a.dob}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold tnum text-primary">{formatTime(a.latestTimeMs)}</div>
                    <Chip tone="achieved">{t("athletesList.active")}</Chip>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
