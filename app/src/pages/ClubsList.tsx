import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { api } from "@/lib/api";
import { Plus } from "lucide-react";

export default function ClubsList() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["clubs"],
    queryFn: () => api.clubs.list().then((r) => r.clubs),
  });

  const clubs = data ?? [];

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-headline-lg font-semibold text-ink">{t("clubsList.title")}</h1>
          <p className="text-sm text-ink-muted mt-1">{t("clubsList.subtitle")}</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" /> {t("clubsList.newClub")}
        </Button>
      </header>

      <Card>
        <CardBody className="!p-0">
          {isLoading ? (
            <div className="p-8 text-center text-ink-muted text-sm">{t("common.loading")}</div>
          ) : clubs.length === 0 ? (
            <div className="p-8 text-center text-ink-muted text-sm">Δεν υπάρχουν όμιλοι.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-ink-muted text-[11px] uppercase tracking-wider border-b border-outline-variant">
                  <th className="px-4 py-2 text-left">{t("clubsList.columns.club")}</th>
                  <th className="px-4 py-2 text-left hidden sm:table-cell">Κωδικός</th>
                  <th className="px-4 py-2 text-left">Χώρα</th>
                  <th className="px-4 py-2 text-left hidden sm:table-cell">Κατάσταση</th>
                  <th className="px-4 py-2 text-right">{t("clubsList.columns.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {clubs.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-1 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-md bg-primary-fixed text-primary grid place-items-center text-[11px] font-bold">
                          {c.shortName ?? c.name.slice(0, 3)}
                        </div>
                        <span className="font-semibold text-ink">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-ink-muted hidden sm:table-cell">{c.federationCode ?? "—"}</td>
                    <td className="px-4 py-3.5 text-ink-muted">{c.country}</td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <Chip tone={c.isActive ? "achieved" : "neutral"}>{c.isActive ? "Ενεργός" : "Ανενεργός"}</Chip>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button variant="outline" size="sm">{t("clubsList.view")}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
