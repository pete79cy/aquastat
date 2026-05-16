import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Select } from "@/components/ui/Select";
import { standards, ageCategories } from "@/lib/mockData";
import { formatTime } from "@/lib/utils";
import { Download } from "lucide-react";

export default function Standards() {
  const { t } = useTranslation();
  const [category, setCategory] = useState("all");
  const [gender, setGender] = useState("all");

  const filtered = standards.filter(
    (s) => (category === "all" || s.category === category) && (gender === "all" || s.gender === gender)
  );

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
              <TabsTrigger value="records">{t("standards.tabs.records")}</TabsTrigger>
            </TabsList>

            <TabsContent value="qualification" className="mt-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">{t("standards.filterCategory")}</label>
                  <Select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1">
                    <option value="all">{t("common.all")}</option>
                    {ageCategories.map((c) => (
                      <option key={c.id} value={c.labelEl}>{c.labelEl}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">{t("standards.filterGender")}</label>
                  <Select value={gender} onChange={(e) => setGender(e.target.value)} className="mt-1">
                    <option value="all">{t("common.all")}</option>
                    <option value="M">Άνδρες</option>
                    <option value="F">Γυναίκες</option>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-ink-muted text-[11px] uppercase tracking-wider border-b border-outline-variant">
                      <th className="px-3 py-2 text-left">{t("standards.event")}</th>
                      <th className="px-3 py-2 text-left">{t("standards.category")}</th>
                      <th className="px-3 py-2 text-center hidden sm:table-cell">{t("standards.pool")}</th>
                      <th className="px-3 py-2 text-right">{t("standards.domestic")}</th>
                      <th className="px-3 py-2 text-right">{t("standards.international")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/50">
                    {filtered.map((s, i) => (
                      <tr key={i} className="hover:bg-surface-1 transition-colors">
                        <td className="px-3 py-3 font-semibold text-ink">{s.eventLabel}</td>
                        <td className="px-3 py-3 text-ink-muted">{s.category} ({s.gender})</td>
                        <td className="px-3 py-3 text-center text-ink-muted hidden sm:table-cell">{s.pool === "50m" ? "50μ" : "25μ"}</td>
                        <td className="px-3 py-3 text-right tnum font-semibold text-primary">{formatTime(s.domestic)}</td>
                        <td className="px-3 py-3 text-right tnum font-semibold text-tertiary-container">{formatTime(s.international)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="international" className="mt-4">
              <div className="text-sm text-ink-muted py-8 text-center">Διεθνή κριτήρια — Stage 2 placeholder. Θα εμφανιστούν ίδιας μορφής όρια από FINA/LEN.</div>
            </TabsContent>

            <TabsContent value="records" className="mt-4">
              <div className="text-sm text-ink-muted py-8 text-center">Παγκύπρια ρεκόρ ανά κατηγορία και αγώνισμα — Stage 2 placeholder.</div>
            </TabsContent>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}
