import { useTranslation } from "react-i18next";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { aiQueue, aiReviewItems } from "@/lib/mockData";
import { Check, X, Edit3, Sparkles, ShieldAlert, FileText } from "lucide-react";
import { formatTime } from "@/lib/utils";

export default function AIReview() {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl lg:text-headline-lg font-semibold text-ink">{t("aiReview.title")}</h1>
        <p className="text-sm text-ink-muted mt-1">{t("aiReview.subtitle")}</p>
      </header>

      <div className="rounded-lg bg-warn-bg border border-warn/30 p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-warn shrink-0 mt-0.5" />
        <div className="text-sm text-ink">
          <div className="font-semibold text-warn mb-0.5">{t("common.actionRequired")}</div>
          {t("aiReview.humanReviewBanner")}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Queue */}
        <Card className="lg:col-span-1">
          <CardBody>
            <h2 className="text-headline-md text-ink mb-3">{t("aiReview.queue")}</h2>
            <ul className="space-y-2">
              {aiQueue.map((q, i) => (
                <li
                  key={q.id}
                  className={
                    "rounded-md border p-3 cursor-pointer transition-colors " +
                    (i === 0 ? "border-primary bg-primary-fixed/30" : "border-outline-variant/60 hover:bg-surface-1")
                  }
                >
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-ink truncate">{q.document}</div>
                      <div className="text-[11px] text-ink-muted mt-0.5">{t(`aiReview.documentType.${q.type}`)}</div>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <Chip tone="primary">{q.extractedItems} {t("aiReview.items")}</Chip>
                        {q.pending > 0 && <Chip tone="close">{q.pending} {t("aiReview.pending").toLowerCase()}</Chip>}
                        <Chip tone={q.confidence >= 90 ? "achieved" : q.confidence >= 70 ? "close" : "warn"}>{q.confidence}%</Chip>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        {/* Detail */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div>
                  <div className="text-xs text-ink-subtle flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {t("aiReview.extractionReview")}
                  </div>
                  <h2 className="text-headline-md text-ink mt-0.5">Προκήρυξη_Σαιζόν_2025-2026.pdf</h2>
                </div>
                <Button variant="outline" size="sm">
                  <Check className="w-4 h-4" /> {t("aiReview.actions.bulkApprove")}
                </Button>
              </div>

              <Tabs defaultValue="competitions">
                <TabsList className="overflow-x-auto">
                  <TabsTrigger value="competitions">{t("aiReview.tabs.competitions")}</TabsTrigger>
                  <TabsTrigger value="categories">{t("aiReview.tabs.categories")}</TabsTrigger>
                  <TabsTrigger value="standards">{t("aiReview.tabs.standards")}</TabsTrigger>
                  <TabsTrigger value="international">{t("aiReview.tabs.international")}</TabsTrigger>
                  <TabsTrigger value="rules">{t("aiReview.tabs.rules")}</TabsTrigger>
                </TabsList>

                <TabsContent value="competitions" className="mt-4 space-y-3">
                  {aiReviewItems.map((item) => {
                    const tone = item.confidence === "high" ? "achieved" : item.confidence === "medium" ? "close" : "warn";
                    const borderColor =
                      item.confidence === "high" ? "border-l-achieved" : item.confidence === "medium" ? "border-l-close" : "border-l-warn";
                    return (
                      <div key={item.id} className={"rounded-md border border-outline-variant/60 border-l-4 " + borderColor + " p-4 space-y-3"}>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">#{item.eventNumber}</div>
                            <div className="text-base font-semibold text-ink">{item.eventLabel}</div>
                          </div>
                          <Chip tone={tone}>
                            {t(`aiReview.${item.confidence}Confidence`)} · {item.confidenceValue}%
                          </Chip>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <Field label={t("aiReview.session")} value={item.session ?? "TBD"} flag={item.session?.includes("?")} />
                          <Field label={t("aiReview.startTime")} value={item.startTime ?? "TBD"} flag={!item.startTime} />
                          <Field label={t("aiReview.pool")} value={item.pool} />
                          <Field label={t("aiReview.qualifyingTime")} value={item.qualifyingTime ? formatTime(item.qualifyingTime) : "—"} mono flag={!item.qualifyingTime} />
                        </div>

                        {item.flag && (
                          <div className="text-xs text-warn flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> {item.flag}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/40">
                          <span className="text-[11px] text-ink-subtle">{t("aiReview.sourcePage")}: {item.sourcePage}</span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <X className="w-4 h-4" /> {t("aiReview.actions.reject")}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit3 className="w-4 h-4" /> {t("aiReview.actions.edit")}
                            </Button>
                            <Button size="sm">
                              <Check className="w-4 h-4" /> {t("aiReview.actions.approve")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>

                {["categories", "standards", "international", "rules"].map((tab) => (
                  <TabsContent key={tab} value={tab}>
                    <div className="text-sm text-ink-muted py-8 text-center">Δεν υπάρχουν εκκρεμή items για αυτή την κατηγορία.</div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono, flag }: { label: string; value: string; mono?: boolean; flag?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">{label}</div>
      <div className={"font-semibold mt-0.5 " + (mono ? "tnum text-primary" : "text-ink") + (flag ? " text-warn" : "")}>
        {value}
      </div>
    </div>
  );
}
