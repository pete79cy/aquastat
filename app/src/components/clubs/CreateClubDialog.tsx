import { useState } from "react";
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
import { Field } from "@/components/ui/Select";
import { api, ApiError } from "@/lib/api";
import { Save, AlertCircle } from "lucide-react";

export function CreateClubDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [federationCode, setFederationCode] = useState("");
  const [country, setCountry] = useState("CY");
  const [error, setError] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: () =>
      api.clubs.create({
        name: name.trim(),
        shortName: shortName.trim() || undefined,
        federationCode: federationCode.trim() || undefined,
        country: country.trim() || "CY",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubs"] });
      reset();
      onOpenChange(false);
    },
    onError: (err: ApiError | Error) =>
      setError("status" in err ? `${err.code}: ${err.message ?? ""}` : err.message),
  });

  const reset = () => {
    setName("");
    setShortName("");
    setFederationCode("");
    setCountry("CY");
    setError(null);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Το όνομα είναι υποχρεωτικό (τουλάχιστον 2 χαρακτήρες).");
      return;
    }
    createMut.mutate();
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Νέος όμιλος</DialogTitle>
          <DialogDescription>
            Δημιουργία κολυμβητικού ομίλου. Μετά τη δημιουργία μπορείτε να αντιστοιχίσετε αθλητές
            και προπονητές.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Επωνυμία" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="π.χ. Ναυτικός Όμιλος Λεμεσού"
              required
              autoFocus
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Σύντομη ονομασία" hint="προαιρετικό · π.χ. ΝΟΛ">
              <Input value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="ΝΟΛ" maxLength={20} />
            </Field>
            <Field label="Κωδικός" hint="προαιρετικό · μητρώο">
              <Input value={federationCode} onChange={(e) => setFederationCode(e.target.value)} placeholder="ΝΟΛ-01" />
            </Field>
          </div>

          <Field label="Χώρα" hint="ISO κωδικός · default CY">
            <Input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} maxLength={2} />
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
              <Save className="w-4 h-4" /> {createMut.isPending ? "Αποθήκευση..." : "Δημιουργία"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
