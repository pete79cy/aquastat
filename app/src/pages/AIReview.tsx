import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { api } from "@/lib/api";
import { Check, X, Sparkles, ShieldAlert, FileText, AlertCircle, CheckCircle2, Edit3, RotateCw } from "lucide-react";
import { EditItemDialog } from "@/components/ai/EditItemDialog";
import type { AiItem } from "@/lib/api";

type MappingResult = {
  itemId: string;
  ok: boolean;
  entityType?: string;
  entityId?: string;
  action?: string;
  error?: string;
};

export default function AIReview() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [lastResult, setLastResult] = useState<MappingResult | null>(null);
  const [bulkSummary, setBulkSummary] = useState<{ ok: number; failed: number } | null>(null);
  const [editTarget, setEditTarget] = useState<AiItem | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "edited">("pending");

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
    mutationFn: async (itemId: string) => {
      const res = await api.aiExtractions.approve(itemId);
      return { itemId, res };
    },
    onSuccess: ({ itemId, res }) => {
      queryClient.invalidateQueries({ queryKey: ["ai-extraction-items"] });
      setBulkSummary(null);
      setLastResult({
        itemId,
        ok: !!res.mapped,
        entityType: res.mapped?.entityType,
        entityId: res.mapped?.entityId,
        action: res.mapped?.action,
        error: res.mapError ?? undefined,
      });
    },
  });

  const rejectMut = useMutation({
    mutationFn: (itemId: string) => api.aiExtractions.reject(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-extraction-items"] });
      setLastResult(null);
    },
  });

  const items = itemsQ.data ?? [];
  const pendingItems = items.filter((i) => i.status === "pending");
  const highConfidenceCount = pendingItems.filter((i) => Number(i.confidence ?? 0) >= 90).length;
  const visibleItems = filter === "all" ? items : items.filter((i) => i.status === filter);
  const counts = {
    all: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
    edited: items.filter((i) => i.status === "edited").length,
  };

  // Bulk approve runs sequentially through high-confidence pending items.
  const bulkMut = useMutation({
    mutationFn: async () => {
      let ok = 0;
      let failed = 0;
      const targets = pendingItems.filter((i) => Number(i.confidence ?? 0) >= 90);
      for (const item of targets) {
        try {
          const res = await api.aiExtractions.approve(item.id);
          if (res.mapped) ok++;
          else failed++;
        } catch {
          failed++;
        }
      }
      return { ok, failed };
    },
    onSuccess: (summary) => {
      queryClient.invalidateQueries({ queryKey: ["ai-extraction-items"] });
      setBulkSummary(summary);
      setLastResult(null);
    },
  });

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

      {(lastResult || bulkSummary) && (
        <div
          className={
            "rounded-md p-3 text-sm flex items-start gap-2 " +
            (bulkSummary
              ? bulkSummary.failed === 0
                ? "bg-achieved-bg text-achieved"
                : "bg-close-bg text-close"
              : lastResult?.ok
                ? "bg-achieved-bg text-achieved"
                : "bg-warn-bg text-warn")
          }
        >
          {bulkSummary ? (
            <>
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Bulk approve: <strong>{bulkSummary.ok}</strong> entities created/updated,{" "}
                {bulkSummary.failed > 0 && (
                  <>
                    <strong>{bulkSummary.failed}</strong> με σφάλμα mapping (ελέγξτε reviewer notes).
                  </>
                )}
              </span>
            </>
          ) : lastResult?.ok ? (
            <>
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Δημιουργήθηκε <strong>{lastResult.entityType}</strong> ({lastResult.action}).
                ID: <code className="text-[11px]">{lastResult.entityId?.slice(0, 8)}</code>
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Approved αλλά mapping απέτυχε: <code className="text-[11px]">{lastResult?.error}</code></span>
            </>
          )}
        </div>
      )}

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
                      onClick={() => {
                        setSelectedId(q.id);
                        setLastResult(null);
                        setBulkSummary(null);
                      }}
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
                {selected && highConfidenceCount > 0 && (
                  <Button variant="outline" size="sm" onClick={() => bulkMut.mutate()} disabled={bulkMut.isPending}>
                    <Check className="w-4 h-4" /> {bulkMut.isPending ? "..." : `${t("aiReview.actions.bulkApprove")} (${highConfidenceCount})`}
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
                <>
                  <div className="flex items-center gap-2 mb-4 text-xs flex-wrap">
                    {(["pending", "approved", "edited", "rejected", "all"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={
                          "px-2.5 py-1 rounded-full font-semibold transition-colors " +
                          (filter === f
                            ? "bg-primary text-primary-fg"
                            : "bg-surface-2 text-ink-muted hover:bg-surface-3")
                        }
                      >
                        {f} · {counts[f]}
                      </button>
                    ))}
                  </div>
                  {visibleItems.length === 0 ? (
                    <div className="text-sm text-ink-muted text-center py-8">
                      Δεν υπάρχουν items στην κατάσταση "{filter}".
                    </div>
                  ) : (
                <ul className="space-y-3">
                  {visibleItems.map((item) => {
                    const conf = Math.round(Number(item.confidence ?? 0));
                    const tone = conf >= 90 ? "achieved" : conf >= 70 ? "close" : "warn";
                    const borderColor =
                      conf >= 90 ? "border-l-achieved" : conf >= 70 ? "border-l-close" : "border-l-warn";
                    const statusTone =
                      item.status === "approved" ? "achieved" : item.status === "rejected" ? "warn" : "neutral";
                    const mappedLabel =
                      item.mappedEntityType && item.mappedEntityId
                        ? `${item.mappedEntityType} #${item.mappedEntityId.slice(0, 8)}`
                        : null;
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
                                ?? (item.extractedJson?.athleteName as string)
                                ?? "(no label)"}
                            </div>
                            {mappedLabel && (
                              <div className="text-[11px] text-achieved mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Mapped → {mappedLabel}
                              </div>
                            )}
                            {item.reviewerNotes && (
                              <div className="text-[11px] text-warn mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {item.reviewerNotes}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Chip tone={tone}>{conf}%</Chip>
                            <Chip tone={statusTone}>{item.status}</Chip>
                          </div>
                        </div>

                        <pre className="text-[11px] text-ink-muted bg-surface-1 rounded p-2 overflow-x-auto">
                          {JSON.stringify(item.extractedJson, null, 2)}
                        </pre>

                        {(item.status === "pending" || item.status === "edited") && (
                          <div className="flex justify-end gap-2 pt-1 flex-wrap">
                            <Button variant="outline" size="sm" onClick={() => rejectMut.mutate(item.id)} disabled={rejectMut.isPending}>
                              <X className="w-4 h-4" /> {t("aiReview.actions.reject")}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditTarget(item)}>
                              <Edit3 className="w-4 h-4" /> {t("aiReview.actions.edit")}
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
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <EditItemDialog
        item={editTarget}
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        onSavedAndApproved={() => {
          setLastResult({ itemId: editTarget?.id ?? "", ok: true, action: "created" });
        }}
      />
    </div>
  );
}
