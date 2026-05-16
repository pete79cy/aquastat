import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/utils";
import { Download } from "lucide-react";

export default function Standards() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["standards"],
    queryFn: () => api.standards.list().then((r) => r.standards),
  });

  const standards = data ?? [];
  const qualification = standards.filter((s) => s.standardType === "domestic_qualification");
  const international = standards.filter((s) => s.standardType === "international");

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-headline-lg font-semibold text-ink">{t("standards.title")}</h1>
          <p className="text-sm text-ink-muted mt-1">{t("standards.subtitle")}</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4" /> {t("standards.downloadPdf")}
        </Button>
      </header>

      <Card>
        <CardBody>
          <Tabs defaultValue="qualification">
            <TabsList>
              <TabsTrigger value="qualification">{t("standards.tabs.qualification")}</TabsTrigger>
              <TabsTrigger value="international">{t("standards.tabs.international")}</TabsTrigger>
            </TabsList>

            <TabsContent value="qualification" className="mt-4">
              <StandardsTable rows={qualification} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="international" className="mt-4">
              <StandardsTable rows={international} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}

function StandardsTable({
  rows,
  isLoading,
}: {
  rows: Array<{
    id: string;
    timeMs: number;
    gender: string;
    categoryEl: string | null;
    categoryEn: string | null;
    eventDisplay: string;
  }>;
  isLoading: boolean;
}) {
  if (isLoading) return <div className="py-8 text-center text-ink-muted text-sm">Loading...</div>;
  if (rows.length === 0)
    return <div className="py-8 text-center text-ink-muted text-sm">Δεν υπάρχουν όρια στη βάση.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-ink-muted text-[11px] uppercase tracking-wider border-b border-outline-variant">
            <th className="px-3 py-2 text-left">Αγώνισμα</th>
            <th className="px-3 py-2 text-left">Κατηγορία</th>
            <th className="px-3 py-2 text-left">Φύλο</th>
            <th className="px-3 py-2 text-right">Όριο</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/50">
          {rows.map((s) => (
            <tr key={s.id} className="hover:bg-surface-1 transition-colors">
              <td className="px-3 py-3 font-semibold text-ink">{s.eventDisplay}</td>
              <td className="px-3 py-3 text-ink-muted">{s.categoryEl ?? "—"}</td>
              <td className="px-3 py-3 text-ink-muted">{s.gender === "male" ? "Α" : s.gender === "female" ? "Γ" : "—"}</td>
              <td className="px-3 py-3 text-right tnum font-semibold text-primary">{formatTime(s.timeMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
