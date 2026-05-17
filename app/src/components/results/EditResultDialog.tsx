import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Select, Field } from "@/components/ui/Select";
import { Chip } from "@/components/ui/Chip";
import { api, ApiError, type CompetitionResult } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatTime } from "@/lib/utils";
import {
  Save, AlertCircle, Trash2, ShieldCheck, ShieldOff, CircleDot, Clock,
} from "lucide-react";

export function EditResultDialog({
  result,
  athleteId,
  open,
  onOpenChange,
}: {
  result: CompetitionResult | null;
  athleteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const canChangeStatus = me?.role === "federation_admin" || me?.role === "club_admin";

  // Time inputs as separate fields
  const [min, setMin] = useState("");
  const [sec, setSec] = useState("");
  const [hund, setHund] = useState("");
  const [rank, setRank] = useState("");
  const [roundType, setRoundType] = useState<CompetitionResult["roundType"]>("unknown");
  const [poolType, setPoolType] = useState<CompetitionResult["poolType"]>("unknown");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && result) {
      const totalSec = result.timeMs / 1000;
      const m = Math.floor(totalSec / 60);
      const restSec = totalSec - m * 60;
      const s = Math.floor(restSec);
      const h = Math.round((restSec - s) * 100);
      setMin(m > 0 ? String(m) : "");
      setSec(String(s));
      setHund(String(h).padStart(2, "0"));
      setRank(result.rank ? String(result.rank) : "");
      setRoundType(result.roundType);
      setPoolType(result.poolType);
      setError(null);
    }
  }, [open, result]);

  const totalMs = useMemo(() => {
    const m = parseInt(min || "0", 10);
    const s = parseInt(sec || "0", 10);
    const h = parseInt(hund || "0", 10);
    return m * 60_000 + s * 1_000 + h * 10;
  }, [min, sec, hund]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["athlete-results", athleteId] });
    qc.invalidateQueries({ queryKey: ["athlete-standards", athleteId] });
    qc.invalidateQueries({ queryKey: ["athlete", athleteId] });
  };

  const updateMut = useMutation({
    mutationFn: () => {
      if (!result) throw new Error("no_result");
      return api.results.updateCompetition(result.id, {
        resultTimeMs: totalMs,
        rank: rank ? parseInt(rank, 10) : null,
        roundType,
        poolType,
      });
    },
    onSuccess: () => {
      invalidate();
      onOpenChange(false);
    },
    onError: (err: Error) => setError(err.message),
  });

  const statusMut = useMutation({
    mutationFn: (status: "pending" | "verified" | "rejected") => {
      if (!result) throw new Error("no_result");
      return api.results.setCompetitionStatus(result.id, status);
    },
    onSuccess: () => {
      invalidate();
      onOpenChange(false);
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => {
      if (!result) throw new Error("no_result");
      return api.results.deleteCompetition(result.id);
    },
    onSuccess: () => {
      invalidate();
      onOpenChange(false);
    },
    onError: (err: ApiError | Error) => {
      if ("code" in err && err.code === "coach_can_only_delete_own_entries") {
        setError("Οι coaches μπορούν να σβήσουν μόνο επιδόσεις που κατέγραψαν οι ίδιοι.");
      } else {
        setError(("message" in err && err.message) || "Αποτυχία διαγραφής.");
      }
    },
  });

  if (!result) return null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (totalMs <= 0) {
      setError("Συμπληρώστε έγκυρο χρόνο.");
      return;
    }
    updateMut.mutate();
  };

  const statusTone =
    result.verificationStatus === "verified" ? "achieved"
      : result.verificationStatus === "rejected" ? "warn"
      : "close";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            Επεξεργασία επίδοσης
            <Chip tone={statusTone}>{result.verificationStatus}</Chip>
          </DialogTitle>
          <DialogDescription>
            {result.eventDisplay}
            {result.verificationStatus === "pending" && (
              <> · <span className="text-close font-semibold">pending</span> = αναμένει επιβεβαίωση από admin πριν μετρήσει σαν PB</>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field
            label="Χρόνος"
            required
            hint={totalMs > 0 ? `Θα αποθηκευτεί ως ${formatTime(totalMs)} (${totalMs} ms)` : undefined}
          >
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" min={0} max={59} placeholder="Λεπτά" value={min} onChange={(e) => setMin(e.target.value)} inputMode="numeric" />
              <Input type="number" min={0} max={59} placeholder="Δευτ." value={sec} onChange={(e) => setSec(e.target.value)} inputMode="numeric" />
              <Input type="number" min={0} max={99} placeholder="Εκατοστά" value={hund} onChange={(e) => setHund(e.target.value)} inputMode="numeric" />
            </div>
          </Field>

          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Πισίνα">
              <Select value={poolType} onChange={(e) => setPoolType(e.target.value as CompetitionResult["poolType"])}>
                <option value="25m">25μ</option>
                <option value="50m">50μ</option>
                <option value="unknown">—</option>
              </Select>
            </Field>
            <Field label="Φάση">
              <Select value={roundType} onChange={(e) => setRoundType(e.target.value as CompetitionResult["roundType"])}>
                <option value="unknown">—</option>
                <option value="heat">Σειρά</option>
                <option value="final">Τελικός</option>
                <option value="direct_final">Απευθείας τελικός</option>
                <option value="training_race">Προπ. αγώνας</option>
              </Select>
            </Field>
            <Field label="Κατάταξη">
              <Input type="number" min={1} value={rank} onChange={(e) => setRank(e.target.value)} />
            </Field>
          </div>

          {canChangeStatus && (
            <div className="rounded-md border border-outline-variant/60 p-3 space-y-2">
              <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                Επιβεβαίωση (admin only)
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant={result.verificationStatus === "verified" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => statusMut.mutate("verified")}
                  disabled={statusMut.isPending}
                >
                  <ShieldCheck className="w-4 h-4" /> Verified
                </Button>
                <Button
                  type="button"
                  variant={result.verificationStatus === "pending" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => statusMut.mutate("pending")}
                  disabled={statusMut.isPending}
                >
                  <Clock className="w-4 h-4" /> Pending
                </Button>
                <Button
                  type="button"
                  variant={result.verificationStatus === "rejected" ? "danger" : "outline"}
                  size="sm"
                  onClick={() => statusMut.mutate("rejected")}
                  disabled={statusMut.isPending}
                >
                  <ShieldOff className="w-4 h-4" /> Rejected
                </Button>
              </div>
              <p className="text-[11px] text-ink-subtle">
                Μόνο verified επιδόσεις μετράνε για PB και standards comparison.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-warn-bg text-warn p-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (confirm("Σίγουρα θες να σβήσεις την επίδοση;")) deleteMut.mutate();
              }}
              disabled={deleteMut.isPending || updateMut.isPending}
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4" /> Διαγραφή
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={updateMut.isPending}>
              Άκυρο
            </Button>
            <Button type="submit" disabled={updateMut.isPending}>
              <Save className="w-4 h-4" /> {updateMut.isPending ? "Αποθήκευση..." : "Αποθήκευση"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// keep CircleDot tree-shake friendly
void CircleDot;
