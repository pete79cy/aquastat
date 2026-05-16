import { useTranslation } from "react-i18next";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { clubs } from "@/lib/mockData";
import { Plus } from "lucide-react";

export default function ClubsList() {
  const { t } = useTranslation();
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
          <table className="w-full text-sm">
            <thead>
              <tr className="text-ink-muted text-[11px] uppercase tracking-wider border-b border-outline-variant">
                <th className="px-4 py-2 text-left">{t("clubsList.columns.club")}</th>
                <th className="px-4 py-2 text-left hidden sm:table-cell">{t("clubsList.columns.region")}</th>
                <th className="px-4 py-2 text-right">{t("clubsList.columns.athletes")}</th>
                <th className="px-4 py-2 text-right hidden sm:table-cell">{t("clubsList.columns.coaches")}</th>
                <th className="px-4 py-2 text-right">{t("clubsList.columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {clubs.map((c) => (
                <tr key={c.id} className="hover:bg-surface-1 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-md bg-primary-fixed text-primary grid place-items-center text-[11px] font-bold">
                        {c.short}
                      </div>
                      <span className="font-semibold text-ink">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-ink-muted hidden sm:table-cell">{c.region}</td>
                  <td className="px-4 py-3.5 text-right tnum font-semibold text-primary">{c.athletes}</td>
                  <td className="px-4 py-3.5 text-right tnum text-ink-muted hidden sm:table-cell">{c.coaches}</td>
                  <td className="px-4 py-3.5 text-right">
                    <Button variant="outline" size="sm">{t("clubsList.view")}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
