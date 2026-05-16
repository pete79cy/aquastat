import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { api } from "@/lib/api";
import { Check, X, Sparkles, ShieldAlert, FileText } from "lucide-react";

export default function AIReview() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const extractionsQ = useQuery({
    queryKey: ["ai-extractions"],
    queryFn: () => api.aiExtractions.list().then((r) => r.extractions),
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const extractions = extractionsQ.data ?? [];
  const selected = extractions.find((e) => e.id === selectedId) ?? extractions[0];

  const itemsQ = useQuery({
    queryKey: ["ai-extraction-items", selected?.id],
    queryFn: () =>
      selected ? api.aiExtractions.items(selected.id).then((r) => r.items) : Promise.resolve([]),
    enabled: !!selected,
  });

  const approveMut = useMutation({
    mutationFn: (itemId: string) => api.aiExtractions.approve(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-extraction-items"] }),
  });
  const rejectMut = useMutation({
    mutationFn: (itemId: string) => api.aiExtractions.reject(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-extraction-items"] }),
  });
  const bulkMut = useMutation({
    mutationFn: () =>
      selected ? api.aiExtractions.bulkApproveHigh(selected.id, 90) : Promise.resolve({ approved: 0 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-extraction-items"] }),
  });

  const items = itemsQ.data ?? [];
  const pendingItems = items.filter((i) => i.status === "pending");

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
            {extractionsQ.isLoading ? (
              <div className="text-sm text-ink-muted">{t("common.loading")}</div>
            ) : extractions.length === 0 ? (
              <div className="text-sm text-ink-muted py-8 text-center">
                Δεν υπάρχουν εκκρεμή AI extractions. Ανεβάστε αρχείο από Σαιζόν → Upload.
              </div>
            ) : (
              <ul className="space-y-2">
                {extractions.map((q) => {
                  const isSelected = selected?.id === q.id;
                  const confidence = Math.round(Number(q.confidence ?? 0));
                  return (
                    <li
                      key={q.id}
                      onClick={() => setSelectedId(q.id)}
                      className={
                        "rounded-md border p-3 cursor-pointer transition-colors " +
                        (isSelected
                          ? "border-primary bg-primary-fixed/30"
                          : "border-outline-variant/60 hover:bg-surface-1")
                      }
                    >
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-ink truncate">{q.documentFilename}</div>
                          <div className="text-[11px] text-ink-muted mt-0.5">
                            {t(`aiReview.documentType.${q.documentType}`, q.documentType)}
                          </div>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <Chip tone={confidence >= 90 ? "achieved" : confidence >= 70 ? "close" : "warn"}>
                              {confidence}%
                            </Chip>
                            <Chip tone={q.status === "approved" ? "achieved" : "neutral"}>{q.status}</Chip>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
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
                  <h2 className="text-headline-md text-ink mt-0.5">{selected?.documentFilename ?? "—"}</h2>
                </div>
                {selected && pendingItems.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => bulkMut.mutate()} disabled={bulkMut.isPending}>
                    <Check className="w-4 h-4" /> {t("aiReview.actions.bulkApprove")} ({pendingItems.filter(i => Number(i.confidence ?? 0) >= 90).length})
                  </Button>
                )}
              </div>

              {!selected ? (
                <div className="text-sm text-ink-muted text-center py-8">Επιλέξτε ένα extraction.</div>
              ) : itemsQ.isLoading ? (
                <div className="text-sm text-ink-muted text-center py-8">{t("common.loading")}</div>
              ) : items.length === 0 ? (
                <div className="text-sm text-ink-muted text-center py-8">Δεν υπάρχουν items σε αυτό το extraction.</div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => {
                    const conf = Math.round(Number(item.confidence ?? 0));
                    const tone = conf >= 90 ? "achieved" : conf >= 70 ? "close" : "warn";
                    const borderColor =
                      conf >= 90 ? "border-l-achieved" : conf >= 70 ? "border-l-close" : "border-l-warn";
                    const statusTone =
                      item.status === "approved" ? "achieved" : item.status === "rejected" ? "warn" : "neutral";
                    return (
                      <li
                        key={item.id}
                        className={"rounded-md border border-outline-variant/60 border-l-4 " + borderColor + " p-4 space-y-2"}
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">{item.itemType}</div>
                            <div className="text-sm font-semibold text-ink mt-0.5">
                              {(item.extractedJson?.name as string)
                                ?? (item.extractedJson?.eventLabel as string)
                                ?? (item.extractedJson?.nameEl as string)
                                ?? "(no label)"}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Chip tone={tone}>{conf}%</Chip>
                            <Chip tone={statusTone}>{item.status}</Chip>
                          </div>
                        </div>

                        <pre className="text-[11px] text-ink-muted bg-surface-1 rounded p-2 overflow-x-auto">
                          {JSON.stringify(item.extractedJson, null, 2)}
                        </pre>

                        {item.status === "pending" && (
                          <div className="flex justify-end gap-2 pt-1">
                            <Button variant="outline" size="sm" onClick={() => rejectMut.mutate(item.id)} disabled={rejectMut.isPending}>
                              <X className="w-4 h-4" /> {t("aiReview.actions.reject")}
                            </Button>
                            <Button size="sm" onClick={() => approveMut.mutate(item.id)} disabled={approveMut.isPending}>
                              <Check className="w-4 h-4" /> {t("aiReview.actions.approve")}
                            </Button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
