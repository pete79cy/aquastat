import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Download, CheckCircle2 } from "lucide-react";

export default function AgeCategoriesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "el";
  const items = t("ageCategories.complianceItems", { returnObjects: true }) as string[];

  const seasonQ = useQuery({ queryKey: ["season", "active"], queryFn: () => api.seasons.active().then((r) => r.season) });
  const categoriesQ = useQuery({
    queryKey: ["categories", seasonQ.data?.id],
    queryFn: () =>
      seasonQ.data?.id
        ? api.seasons.categories(seasonQ.data.id).then((r) => r.ageCategories)
        : Promise.resolve([]),
    enabled: !!seasonQ.data?.id,
  });

  const categories = categoriesQ.data ?? [];
  const seasonName = seasonQ.data?.name ?? "—";

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl lg:text-headline-lg font-semibold text-ink">{t("ageCategories.title")}</h1>
        <p className="text-sm text-ink-muted mt-1">{t("ageCategories.subtitle")}</p>
      </header>

      <Card className="bg-primary text-primary-fg">
        <CardBody className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-primary-container-fg">Σαιζόν {seasonName}</div>
          <h2 className="text-xl font-bold">Πλαίσιο Κατηγοριών</h2>
          <p className="text-sm text-primary-container-fg max-w-prose">
            Ταξινόμηση αθλητών ανά έτος γέννησης. Οι κατηγορίες ορίζονται από την προκήρυξη της εκάστοτε σαιζόν.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-headline-md text-ink">{t("ageCategories.matrix")}</h2>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" /> PDF
            </Button>
          </div>
          {categoriesQ.isLoading ? (
            <div className="py-8 text-center text-ink-muted text-sm">{t("common.loading")}</div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center text-ink-muted text-sm">Δεν υπάρχουν κατηγορίες ορισμένες στη σαιζόν.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-ink-muted text-[11px] uppercase tracking-wider border-b border-outline-variant">
                  <th className="px-3 py-2 text-left">{t("ageCategories.category")}</th>
                  <th className="px-3 py-2 text-left">{t("ageCategories.birthYears")}</th>
                  <th className="px-3 py-2 text-left hidden sm:table-cell">{t("ageCategories.gender")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {categories.map((c) => {
                  const yearRange =
                    c.birthYearFrom == null
                      ? `${c.birthYearTo} και πριν`
                      : c.birthYearFrom === c.birthYearTo
                        ? String(c.birthYearFrom)
                        : `${c.birthYearFrom}–${c.birthYearTo}`;
                  const genderLabel = c.genderScope === "any" ? "M / F" : c.genderScope === "male" ? "M" : "F";
                  return (
                    <tr key={c.id} className="hover:bg-surface-1 transition-colors">
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-1 h-5 rounded-full bg-primary" />
                          <span className="font-semibold text-ink">{lang === "el" ? c.nameEl : c.nameEn}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-ink-muted tnum">{yearRange}</td>
                      <td className="px-3 py-3.5 text-ink-muted hidden sm:table-cell">{genderLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="text-headline-md text-ink mb-3">{t("ageCategories.compliance")}</h2>
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink">
                <CheckCircle2 className="w-4 h-4 text-achieved shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
