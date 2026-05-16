/**
 * Per-itemType edit form for AI extracted items.
 * Pre-fills from current extractedJson, sends PATCH on save.
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, Textarea, Field } from "@/components/ui/Select";
import { Chip } from "@/components/ui/Chip";
import { api, type AiItem } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, AlertCircle } from "lucide-react";
import { formatTime } from "@/lib/utils";

type Props = {
  item: AiItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSavedAndApproved?: () => void;
};

const strokes = ["freestyle", "backstroke", "breaststroke", "butterfly", "medley"] as const;
const genders = ["male", "female", "any"] as const;
const rounds = ["heat", "final", "direct_final"] as const;

export function EditItemDialog({ item, open, onOpenChange, onSavedAndApproved }: Props) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  // Reset form when item changes
  const stableId = item?.id;
  if (stableId && Object.keys(draft).length === 0) {
    setDraft({ ...(item.extractedJson as Record<string, unknown>) });
  }

  const editMut = useMutation({
    mutationFn: async () => {
      if (!item) throw new Error("no_item");
      await api.aiExtractions.edit(item.id, draft);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-extraction-items"] });
      onOpenChange(false);
      setDraft({});
    },
    onError: (err: Error) => setError(err.message),
  });

  const editAndApproveMut = useMutation({
    mutationFn: async () => {
      if (!item) throw new Error("no_item");
      await api.aiExtractions.edit(item.id, draft);
      await api.aiExtractions.approve(item.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-extraction-items"] });
      onOpenChange(false);
      setDraft({});
      onSavedAndApproved?.();
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleClose = (next: boolean) => {
    if (!next) {
      setDraft({});
      setError(null);
    }
    onOpenChange(next);
  };

  const set = (key: string, value: unknown) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
  };
  const get = (key: string): string => {
    const v = draft[key];
    if (v == null) return "";
    return String(v);
  };

  if (!item) return null;
  const itemType = item.itemType;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit extracted item
            <Chip tone="neutral">{itemType}</Chip>
          </DialogTitle>
          <DialogDescription>
            Διορθώστε τα πεδία πριν την έγκριση. Status θα γίνει "edited" αν Save, ή θα γίνει
            mapping κατευθείαν αν Save &amp; Approve.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {itemType === "competition" && (
            <>
              <Field label="Όνομα" required>
                <Input value={get("name")} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Έναρξη" required>
                  <Input type="date" value={get("startDate").slice(0, 10)} onChange={(e) => set("startDate", e.target.value)} />
                </Field>
                <Field label="Λήξη" required>
                  <Input type="date" value={get("endDate").slice(0, 10)} onChange={(e) => set("endDate", e.target.value)} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Τοποθεσία">
                  <Input value={get("location")} onChange={(e) => set("location", e.target.value || null)} />
                </Field>
                <Field label="Venue">
                  <Input value={get("venue")} onChange={(e) => set("venue", e.target.value || null)} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Πισίνα">
                  <Select value={get("poolType")} onChange={(e) => set("poolType", e.target.value || null)}>
                    <option value="">—</option>
                    <option value="25m">25μ</option>
                    <option value="50m">50μ</option>
                  </Select>
                </Field>
                <Field label="Λήξη δηλώσεων">
                  <Input
                    type="date"
                    value={get("declarationDeadline").slice(0, 10)}
                    onChange={(e) => set("declarationDeadline", e.target.value || null)}
                  />
                </Field>
              </div>
            </>
          )}

          {itemType === "age_category" && (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Όνομα (Ελληνικά)" required>
                  <Input value={get("nameEl")} onChange={(e) => set("nameEl", e.target.value)} />
                </Field>
                <Field label="Όνομα (English)">
                  <Input value={get("nameEn")} onChange={(e) => set("nameEn", e.target.value || null)} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Φύλο">
                  <Select value={get("genderScope")} onChange={(e) => set("genderScope", e.target.value)}>
                    {genders.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Έτος από">
                  <Input
                    type="number"
                    value={get("birthYearFrom")}
                    onChange={(e) => set("birthYearFrom", e.target.value ? Number(e.target.value) : null)}
                  />
                </Field>
                <Field label="Έτος έως">
                  <Input
                    type="number"
                    value={get("birthYearTo")}
                    onChange={(e) => set("birthYearTo", e.target.value ? Number(e.target.value) : null)}
                  />
                </Field>
              </div>
            </>
          )}

          {itemType === "qualification_standard" && (
            <>
              <Field label="Event label (όπως στο PDF)">
                <Input value={get("eventLabel")} onChange={(e) => set("eventLabel", e.target.value)} />
              </Field>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Απόσταση (μ)" required>
                  <Input
                    type="number"
                    value={get("distanceM")}
                    onChange={(e) => set("distanceM", e.target.value ? Number(e.target.value) : 0)}
                  />
                </Field>
                <Field label="Στυλ" required>
                  <Select value={get("stroke")} onChange={(e) => set("stroke", e.target.value)}>
                    {strokes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Φύλο" required>
                  <Select value={get("gender")} onChange={(e) => set("gender", e.target.value)}>
                    <option value="male">male</option>
                    <option value="female">female</option>
                  </Select>
                </Field>
              </div>
              <Field label="Κατηγορία (nameEl)">
                <Input value={get("categoryName")} onChange={(e) => set("categoryName", e.target.value)} />
              </Field>
              <Field label="Χρόνος (ms)" hint={Number(get("timeMs")) > 0 ? formatTime(Number(get("timeMs"))) : undefined} required>
                <Input
                  type="number"
                  value={get("timeMs")}
                  onChange={(e) => set("timeMs", e.target.value ? Number(e.target.value) : 0)}
                />
              </Field>
            </>
          )}

          {itemType === "result" && (
            <>
              <Field label="Όνομα αθλητή" required>
                <Input value={get("athleteName")} onChange={(e) => set("athleteName", e.target.value)} />
              </Field>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Απόσταση (μ)" required>
                  <Input
                    type="number"
                    value={get("distanceM")}
                    onChange={(e) => set("distanceM", e.target.value ? Number(e.target.value) : 0)}
                  />
                </Field>
                <Field label="Στυλ" required>
                  <Select value={get("stroke")} onChange={(e) => set("stroke", e.target.value)}>
                    {strokes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Φύλο">
                  <Select value={get("gender")} onChange={(e) => set("gender", e.target.value || null)}>
                    <option value="">—</option>
                    <option value="male">male</option>
                    <option value="female">female</option>
                  </Select>
                </Field>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Χρόνος (ms)" hint={Number(get("timeMs")) > 0 ? formatTime(Number(get("timeMs"))) : undefined} required>
                  <Input
                    type="number"
                    value={get("timeMs")}
                    onChange={(e) => set("timeMs", e.target.value ? Number(e.target.value) : 0)}
                  />
                </Field>
                <Field label="Κατάταξη">
                  <Input
                    type="number"
                    value={get("rank")}
                    onChange={(e) => set("rank", e.target.value ? Number(e.target.value) : null)}
                  />
                </Field>
                <Field label="Φάση">
                  <Select value={get("round")} onChange={(e) => set("round", e.target.value || null)}>
                    <option value="">—</option>
                    {rounds.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Όμιλος">
                <Input value={get("clubName")} onChange={(e) => set("clubName", e.target.value || null)} />
              </Field>
            </>
          )}

          {itemType !== "competition" &&
            itemType !== "age_category" &&
            itemType !== "qualification_standard" &&
            itemType !== "result" && (
              <Field label="Raw JSON (advanced)">
                <Textarea
                  rows={10}
                  value={JSON.stringify(draft, null, 2)}
                  onChange={(e) => {
                    try {
                      setDraft(JSON.parse(e.target.value));
                      setError(null);
                    } catch {
                      setError("Invalid JSON");
                    }
                  }}
                />
              </Field>
            )}

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-warn-bg text-warn p-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={editMut.isPending || editAndApproveMut.isPending}>
            Άκυρο
          </Button>
          <Button variant="outline" onClick={() => editMut.mutate()} disabled={editMut.isPending || editAndApproveMut.isPending}>
            <Save className="w-4 h-4" /> Save
          </Button>
          <Button onClick={() => editAndApproveMut.mutate()} disabled={editAndApproveMut.isPending || editMut.isPending}>
            <Save className="w-4 h-4" /> Save &amp; Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
