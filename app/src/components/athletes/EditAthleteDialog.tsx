import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { api, ApiError, type Athlete } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Save, AlertCircle, ShieldOff, ShieldCheck } from "lucide-react";

export function EditAthleteDialog({
  athlete,
  open,
  onOpenChange,
}: {
  athlete: Athlete | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const isCoach = me?.role === "coach";
  const canToggleActive = me?.role === "federation_admin" || me?.role === "club_admin";

  const usersQ = useQuery({
    queryKey: ["users"],
    queryFn: () => api.users.list().then((r) => r.users),
    enabled: open && !isCoach,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [coachId, setCoachId] = useState<string>("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Sync form to athlete when opened
  useEffect(() => {
    if (open && athlete) {
      setFirstName(athlete.firstName);
      setLastName(athlete.lastName);
      setDateOfBirth(athlete.dateOfBirth.slice(0, 10));
      setGender(athlete.gender === "female" ? "female" : "male");
      setCoachId(athlete.coachId ?? "");
      setRegistrationNumber(athlete.registrationNumber ?? "");
      setError(null);
    }
  }, [open, athlete]);

  const updateMut = useMutation({
    mutationFn: () => {
      if (!athlete) throw new Error("no_athlete");
      return api.athletes.update(athlete.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        gender,
        coachId: coachId || undefined,
        registrationNumber: registrationNumber.trim() || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["athletes"] });
      qc.invalidateQueries({ queryKey: ["athlete", athlete?.id] });
      onOpenChange(false);
    },
    onError: (err: ApiError | Error) => {
      setError(("message" in err && err.message) || "Αποτυχία αποθήκευσης.");
    },
  });

  const toggleActiveMut = useMutation({
    mutationFn: () => {
      if (!athlete) throw new Error("no_athlete");
      return api.athletes.setActive(athlete.id, !athlete.isActive);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["athletes"] });
      qc.invalidateQueries({ queryKey: ["athlete", athlete?.id] });
      onOpenChange(false);
    },
    onError: (err: Error) => setError(err.message || "Αποτυχία αλλαγής κατάστασης."),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (firstName.trim().length < 2) {
      setError("Όνομα τουλάχιστον 2 χαρακτήρες.");
      return;
    }
    if (lastName.trim().length < 2) {
      setError("Επώνυμο τουλάχιστον 2 χαρακτήρες.");
      return;
    }
    if (!dateOfBirth) {
      setError("Επιλέξτε ημερομηνία γέννησης.");
      return;
    }
    updateMut.mutate();
  };

  if (!athlete) return null;
  const coachOptions = (usersQ.data ?? []).filter((u) => u.role === "coach");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Επεξεργασία αθλητή</DialogTitle>
          <DialogDescription>
            Αλλάξτε στοιχεία αθλητή. Ο αριθμός μητρώου είναι κρίσιμος για auto-import από PDF
            αποτελεσμάτων.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Όνομα" required>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoFocus />
            </Field>
            <Field label="Επώνυμο" required>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Ημ. γέννησης" required>
              <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
            </Field>
            <Field label="Φύλο" required>
              <Select value={gender} onChange={(e) => setGender(e.target.value as "male" | "female")}>
                <option value="male">Άνδρας</option>
                <option value="female">Γυναίκα</option>
              </Select>
            </Field>
          </div>

          <Field label="Αριθμός μητρώου" hint="απαραίτητος για auto-matching με PDF αποτελεσμάτων (π.χ. 8659)">
            <Input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} placeholder="π.χ. 8659" />
          </Field>

          {!isCoach && (
            <Field label="Προπονητής" hint="προαιρετικό">
              <Select value={coachId} onChange={(e) => setCoachId(e.target.value)}>
                <option value="">— Καμία ανάθεση —</option>
                {coachOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-warn-bg text-warn p-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter>
            {canToggleActive && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (
                    confirm(
                      athlete.isActive
                        ? "Σίγουρα θες να απενεργοποιήσεις αυτό τον αθλητή;"
                        : "Επανενεργοποίηση αθλητή;"
                    )
                  ) {
                    toggleActiveMut.mutate();
                  }
                }}
                disabled={toggleActiveMut.isPending || updateMut.isPending}
                className="mr-auto"
              >
                {athlete.isActive ? (
                  <><ShieldOff className="w-4 h-4" /> Απενεργοποίηση</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Ενεργοποίηση</>
                )}
              </Button>
            )}
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
