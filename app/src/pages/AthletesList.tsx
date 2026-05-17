import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { api } from "@/lib/api";
import { Search, Plus } from "lucide-react";
import { CreateAthleteDialog } from "@/components/athletes/CreateAthleteDialog";

export default function AthletesList() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["athletes"],
    queryFn: () => api.athletes.list().then((r) => r.athletes),
  });

  const athletes = data ?? [];
  const filtered = athletes.filter((a) =>
    (a.firstName + " " + a.lastName).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-headline-lg font-semibold text-ink">{t("athletesList.title")}</h1>
          <p className="text-sm text-ink-muted mt-1">{t("athletesList.results", { count: filtered.length })}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> {t("athletesList.newAthlete")}
        </Button>
      </header>

      <CreateAthleteDialog open={createOpen} onOpenChange={setCreateOpen} />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
        <Input className="pl-9" placeholder={t("athletesList.searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card>
        <CardBody className="!p-0">
          {isLoading ? (
            <div className="p-8 text-center text-ink-muted text-sm">{t("common.loading")}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-ink-muted text-sm">Δεν βρέθηκαν αθλητές.</div>
          ) : (
            <>
              <table className="hidden md:table w-full text-sm">
                <thead>
                  <tr className="text-ink-muted text-[11px] uppercase tracking-wider border-b border-outline-variant">
                    <th className="px-4 py-2 text-left">{t("athletesList.columns.athlete")}</th>
                    <th className="px-4 py-2 text-left">Αρ. Μητρώου</th>
                    <th className="px-4 py-2 text-left">{t("athletesList.columns.dob")}</th>
                    <th className="px-4 py-2 text-left">Φύλο</th>
                    <th className="px-4 py-2 text-left">{t("athletesList.columns.status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {filtered.map((a) => {
                    const initials = (a.firstName[0] ?? "") + (a.lastName[0] ?? "");
                    return (
                      <tr key={a.id} className="hover:bg-surface-1 transition-colors">
                        <td className="px-4 py-3">
                          <Link to={`/coach/athletes/${a.id}`} className="flex items-center gap-2.5 hover:text-primary">
                            <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary grid place-items-center text-xs font-bold">
                              {initials}
                            </div>
                            <span className="font-semibold text-ink">{a.firstName} {a.lastName}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-ink-muted tnum font-mono text-xs">
                          {a.registrationNumber ?? <span className="text-warn">—</span>}
                        </td>
                        <td className="px-4 py-3 text-ink-muted tnum">{a.dateOfBirth}</td>
                        <td className="px-4 py-3 text-ink-muted">{a.gender === "male" ? "Α" : "Γ"}</td>
                        <td className="px-4 py-3">
                          <Chip tone={a.isActive ? "achieved" : "neutral"}>
                            {a.isActive ? t("athletesList.active") : t("athletesList.inactive")}
                          </Chip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <ul className="md:hidden divide-y divide-outline-variant/50">
                {filtered.map((a) => {
                  const initials = (a.firstName[0] ?? "") + (a.lastName[0] ?? "");
                  return (
                    <li key={a.id}>
                      <Link to={`/coach/athletes/${a.id}`} className="flex items-center gap-3 p-4 hover:bg-surface-1">
                        <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary grid place-items-center text-sm font-bold shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-ink">{a.firstName} {a.lastName}</div>
                          <div className="text-xs text-ink-muted">{a.dateOfBirth} · {a.gender === "male" ? "Άνδρας" : "Γυναίκα"}</div>
                        </div>
                        <Chip tone={a.isActive ? "achieved" : "neutral"}>
                          {a.isActive ? t("athletesList.active") : t("athletesList.inactive")}
                        </Chip>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
