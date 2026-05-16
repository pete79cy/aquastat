import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Select, Field } from "@/components/ui/Select";
import { api, type ApiError } from "@/lib/api";
import { UploadCloud, FileText, Calendar, ListChecks, Tag, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";

const statusToneMap: Record<string, "close" | "achieved" | "neutral" | "warn"> = {
  uploaded: "neutral",
  processing: "close",
  completed: "achieved",
  needs_review: "achieved",
  failed: "warn",
};

const statusLabel: Record<string, string> = {
  uploaded: "Ανέβηκε",
  processing: "Επεξεργασία",
  completed: "Ολοκληρώθηκε",
  needs_review: "Έτοιμο για review",
  failed: "Απέτυχε",
};

const documentTypeLabels: Record<string, string> = {
  season_proclamation: "Προκήρυξη σαιζόν",
  results_pdf: "Αποτελέσματα αγώνα",
  standards_pdf: "Όρια πρόκρισης",
  records_pdf: "Ρεκόρ",
};

export default function SeasonSetup() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<"season_proclamation" | "results_pdf" | "standards_pdf" | "records_pdf">("season_proclamation");
  const [competitionId, setCompetitionId] = useState("");

  const docsQ = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.documents.list().then((r) => r.documents),
    refetchInterval: 3000,
  });

  const competitionsQ = useQuery({
    queryKey: ["competitions"],
    queryFn: () => api.competitions.list().then((r) => r.competitions),
  });

  const uploadMut = useMutation({
    mutationFn: async (file: File) =>
      api.documents.upload(file, documentType, documentType === "results_pdf" ? competitionId : undefined),
    onSuccess: () => {
      setInfo("Το αρχείο ανέβηκε. Πάτα 'AI' για εξαγωγή.");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err: Error) => setError(err.message || "Αποτυχία upload."),
  });

  const processMut = useMutation({
    mutationFn: async (documentId: string) => api.documents.process(documentId),
    onSuccess: (data) => {
      setInfo(`Εξαγωγή ολοκληρώθηκε: ${data.itemCount} items στο AI Review.`);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["ai-extractions"] });
    },
    onError: (err: ApiError | Error) => {
      const message =
        "status" in err && err.status === 503
          ? "Δεν έχει ρυθμιστεί το ANTHROPIC_API_KEY στον server."
          : err.message || "Αποτυχία επεξεργασίας.";
      setError(message);
    },
  });

  const onSelect = (file: File | null) => {
    setError(null);
    setInfo(null);
    if (!file) return;
    if (documentType === "results_pdf" && !competitionId) {
      setError("Επιλέξτε αγώνα πριν ανεβάσετε αρχείο αποτελεσμάτων.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("Μέγιστο μέγεθος 25MB.");
      return;
    }
    uploadMut.mutate(file);
  };

  const documents = docsQ.data ?? [];
  const competitions = competitionsQ.data ?? [];
  const needsCompetition = documentType === "results_pdf";
  const canUpload = !needsCompetition || !!competitionId;

  return (
    <div className="space-y-5 lg:max-w-4xl">
      <header>
        <h1 className="text-2xl lg:text-headline-lg font-semibold text-ink">{t("seasonSetup.title")}</h1>
        <p className="text-sm text-ink-muted mt-1">{t("seasonSetup.subtitle")}</p>
      </header>

      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-headline-md text-ink">{t("seasonSetup.uploadProclamation")} · 2025–2026</h2>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Τύπος εγγράφου" required>
              <Select
                value={documentType}
                onChange={(e) => {
                  setDocumentType(e.target.value as typeof documentType);
                  setCompetitionId("");
                  setError(null);
                }}
              >
                {Object.entries(documentTypeLabels).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </Field>

            {needsCompetition && (
              <Field label="Αγώνας" required>
                <Select value={competitionId} onChange={(e) => setCompetitionId(e.target.value)} required>
                  <option value="">— Επιλέξτε —</option>
                  {competitions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.startDate}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </div>

          <label
            className={
              "block border-2 border-dashed rounded-lg p-8 sm:p-10 text-center transition-colors " +
              (!canUpload
                ? "border-outline-variant opacity-40 cursor-not-allowed"
                : uploadMut.isPending
                  ? "border-primary bg-primary-fixed/30 pointer-events-none cursor-progress"
                  : "border-outline-variant hover:border-primary hover:bg-primary-fixed/30 cursor-pointer")
            }
          >
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              accept="application/pdf,.doc,.docx"
              disabled={uploadMut.isPending || !canUpload}
              onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
            />
            <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary grid place-items-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="font-semibold text-ink">
              {uploadMut.isPending
                ? "Ανέβασμα..."
                : !canUpload
                  ? "Πρώτα επιλέξτε αγώνα"
                  : t("seasonSetup.dropZone")}
            </div>
            <div className="text-xs text-ink-muted mt-1">{t("seasonSetup.maxFileSize")}</div>
            <Button
              type="button"
              size="sm"
              className="mt-4"
              disabled={uploadMut.isPending || !canUpload}
              onClick={() => inputRef.current?.click()}
            >
              {t("seasonSetup.uploadButton")}
            </Button>
          </label>

          {error && (
            <div className="rounded-md bg-warn-bg text-warn text-sm p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {info && !error && (
            <div className="rounded-md bg-achieved-bg text-achieved text-sm p-3 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{info}</span>
            </div>
          )}

          <div className="rounded-md bg-primary-fixed/30 border border-primary-fixed text-primary text-xs p-3 flex items-start gap-2">
            <Chip tone="info">PDR §6.13</Chip>
            <span>
              {documentType === "results_pdf"
                ? "Από PDF αποτελεσμάτων θα εξαχθούν ατομικά results με fuzzy name matching σε υπάρχοντες αθλητές."
                : t("seasonSetup.uploadHint")}
            </span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-headline-md text-ink">{t("seasonSetup.recentUploads")}</h2>
          </div>
          {docsQ.isLoading ? (
            <div className="py-6 text-center text-ink-muted text-sm">{t("common.loading")}</div>
          ) : documents.length === 0 ? (
            <div className="py-8 text-center text-ink-muted text-sm">Δεν έχουν ανέβει αρχεία ακόμα.</div>
          ) : (
            <ul className="divide-y divide-outline-variant/50">
              {documents.map((d) => {
                const isProcessing = d.processingStatus === "processing";
                const canProcess = d.processingStatus === "uploaded" || d.processingStatus === "failed";
                return (
                  <li key={d.id} className="py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-surface-2 grid place-items-center shrink-0">
                      <FileText className="w-4 h-4 text-ink-muted" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-ink text-sm truncate">{d.originalFilename}</div>
                      <div className="text-xs text-ink-muted">
                        {documentTypeLabels[d.documentType] ?? d.documentType} · {new Date(d.uploadedAt).toLocaleString("el-CY")}
                      </div>
                    </div>
                    <Chip tone={statusToneMap[d.processingStatus] ?? "neutral"}>
                      {isProcessing ? "Επεξεργασία..." : statusLabel[d.processingStatus] ?? d.processingStatus}
                    </Chip>
                    {canProcess && (
                      <Button size="sm" onClick={() => processMut.mutate(d.id)} disabled={processMut.isPending}>
                        <Sparkles className="w-3.5 h-3.5" />
                        {processMut.isPending ? "..." : "AI"}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="grid sm:grid-cols-3 gap-3">
        <SeasonStat icon={<Calendar className="w-4 h-4 text-primary" />} label={t("seasonSetup.seasonStart")} value="12 Σεπ 2025" />
        <SeasonStat icon={<ListChecks className="w-4 h-4 text-primary" />} label={t("seasonSetup.parsedRules")} value="—" />
        <SeasonStat icon={<Tag className="w-4 h-4 text-primary" />} label={t("seasonSetup.systemVersion")} value="v2026.5.2" />
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
