import { useTranslation } from "react-i18next";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { UploadCloud, FileText, Calendar, ListChecks, Tag } from "lucide-react";

const recent = [
  { name: "Προκήρυξη_Σαιζόν_2025-2026_v2.pdf", size: "4.2 MB", time: "πριν 2 ώρες", status: "processing" as const },
  { name: "Πρόγραμμα_Διοργάνωσης.pdf", size: "1.8 MB", time: "πριν 4 ώρες", status: "ready_for_review" as const },
  { name: "Προκήρυξη_2024-2025.pdf", size: "3.9 MB", time: "πριν 5 ημέρες", status: "archived" as const },
];

export default function SeasonSetup() {
  const { t } = useTranslation();

  const statusTone = (s: typeof recent[number]["status"]) =>
    s === "processing" ? "close" : s === "ready_for_review" ? "achieved" : "neutral";

  return (
    <div className="space-y-5 lg:max-w-4xl">
      <header>
        <h1 className="text-2xl lg:text-headline-lg font-semibold text-ink">{t("seasonSetup.title")}</h1>
        <p className="text-sm text-ink-muted mt-1">{t("seasonSetup.subtitle")}</p>
      </header>

      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-headline-md text-ink">{t("seasonSetup.uploadProclamation")} · 2025–2026</h2>

          <label className="block border-2 border-dashed border-outline-variant rounded-lg p-8 sm:p-10 text-center hover:border-primary hover:bg-primary-fixed/30 transition-colors cursor-pointer">
            <input type="file" className="sr-only" accept="application/pdf,.doc,.docx" />
            <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary grid place-items-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="font-semibold text-ink">{t("seasonSetup.dropZone")}</div>
            <div className="text-xs text-ink-muted mt-1">{t("seasonSetup.maxFileSize")}</div>
            <Button size="sm" className="mt-4 pointer-events-none">{t("seasonSetup.uploadButton")}</Button>
          </label>

          <div className="rounded-md bg-primary-fixed/30 border border-primary-fixed text-primary text-xs p-3 flex items-start gap-2">
            <Chip tone="info">PDR §6.13</Chip>
            <span>{t("seasonSetup.uploadHint")}</span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-headline-md text-ink">{t("seasonSetup.recentUploads")}</h2>
            <button className="text-sm font-semibold text-primary hover:underline">{t("seasonSetup.viewAll")}</button>
          </div>
          <ul className="divide-y divide-outline-variant/50">
            {recent.map((r) => (
              <li key={r.name} className="py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-surface-2 grid place-items-center shrink-0">
                  <FileText className="w-4 h-4 text-ink-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink text-sm truncate">{r.name}</div>
                  <div className="text-xs text-ink-muted">{r.size} · {r.time}</div>
                </div>
                <Chip tone={statusTone(r.status)}>{t(`seasonSetup.uploadStatuses.${r.status}`)}</Chip>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <div className="grid sm:grid-cols-3 gap-3">
        <SeasonStat icon={<Calendar className="w-4 h-4 text-primary" />} label={t("seasonSetup.seasonStart")} value="12 Σεπ 2025" />
        <SeasonStat icon={<ListChecks className="w-4 h-4 text-primary" />} label={t("seasonSetup.parsedRules")} value="124" />
        <SeasonStat icon={<Tag className="w-4 h-4 text-primary" />} label={t("seasonSetup.systemVersion")} value="v2026.4.1" />
      </div>
    </div>
  );
}

function SeasonStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardBody className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-primary-fixed grid place-items-center shrink-0">{icon}</div>
        <div>
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">{label}</div>
          <div className="text-base font-semibold text-ink">{value}</div>
        </div>
      </CardBody>
    </Card>
  );
}
