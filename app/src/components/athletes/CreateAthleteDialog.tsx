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
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Save, AlertCircle } from "lucide-react";

export function CreateAthleteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const isFederationAdmin = me?.role === "federation_admin";
  const isCoach = me?.role === "coach";

  // Federation admin needs to pick club; club_admin + coach are scoped to own club
  const clubsQ = useQuery({
    queryKey: ["clubs"],
    queryFn: () => api.clubs.list().then((r) => r.clubs),
    enabled: open && isFederationAdmin,
  });

  // List coaches for assignment (admin only — coach auto-assigns self)
  const usersQ = useQuery({
    queryKey: ["users"],
    queryFn: () => api.users.list().then((r) => r.users),
    enabled: open && !isCoach,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [clubId, setClubId] = useState(me?.clubId ?? "");
  const [coachId, setCoachId] = useState<string>(isCoach ? me!.id : "");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (me?.clubId && !clubId) setClubId(me.clubId);
      if (isCoach && me?.id) setCoachId(me.id);
    }
  }, [open, me, isCoach, clubId]);

  const reset = () => {
    setFirstName("");
    setLastName("");
    setDateOfBirth("");
    setGender("male");
    setClubId(me?.clubId ?? "");
    setCoachId(isCoach ? (me?.id ?? "") : "");
    setRegistrationNumber("");
    setError(null);
  };

  const createMut = useMutation({
    mutationFn: () =>
      api.athletes.create({
        clubId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        gender,
        coachId: coachId || undefined,
        registrationNumber: registrationNumber.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["athletes"] });
      qc.invalidateQueries({ queryKey: ["stats", "club"] });
      qc.invalidateQueries({ queryKey: ["stats", "federation"] });
      reset();
      onOpenChange(false);
    },
    onError: (err: ApiError | Error) => {
      if ("code" in err) {
        setError(`${err.code}${err.message ? `: ${err.message}` : ""}`);
      } else {
        setError(err.message);
      }
    },
  });

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const validate = (): string | null => {
    if (firstName.trim().length < 2) return "Όνομα τουλάχιστον 2 χαρακτήρες.";
    if (lastName.trim().length < 2) return "Επώνυμο τουλάχιστον 2 χαρακτήρες.";
    if (!dateOfBirth) return "Επιλέξτε ημερομηνία γέννησης.";
    const dob = new Date(dateOfBirth);
    const now = new Date();
    if (isNaN(dob.getTime()) || dob > now) return "Μη έγκυρη ημερομηνία γέννησης.";
    if (now.getFullYear() - dob.getFullYear() > 100) return "Μη έγκυρη ηλικία.";
    if (!clubId) return "Πρέπει να επιλέξετε όμιλο.";
    return null;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    createMut.mutate();
  };

  const coachOptions = (usersQ.data ?? []).filter((u) => u.role === "coach");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Νέος αθλητής</DialogTitle>
          <DialogDescription>
            Η κατηγορία ηλικίας υπολογίζεται αυτόματα από την ημερομηνία γέννησης και τη σαιζόν.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Όνομα" required>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ανδρέας"
                required
                autoFocus
              />
            </Field>
            <Field label="Επώνυμο" required>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Γεωργίου"
                required
              />
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

          {isFederationAdmin ? (
            <Field label="Όμιλος" required>
              <Select value={clubId} onChange={(e) => setClubId(e.target.value)} required>
                <option value="">— Επιλέξτε —</option>
                {(clubsQ.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Όμιλος" hint="αυτόματα: ο όμιλος σας">
              <Input value={me?.clubId ?? ""} disabled />
            </Field>
          )}

          {isCoach ? (
            <Field label="Προπονητής" hint="θα ανατεθείτε εσείς αυτόματα">
              <Input value={me?.name ?? ""} disabled />
            </Field>
          ) : (
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

          <Field label="Αριθμός μητρώου" hint="προαιρετικό">
            <Input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
          </Field>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-warn-bg text-warn p-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={createMut.isPending}>
              Άκυρο
            </Button>
            <Button type="submit" disabled={createMut.isPending}>
              <Save className="w-4 h-4" /> {createMut.isPending ? "Δημιουργία..." : "Δημιουργία"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
