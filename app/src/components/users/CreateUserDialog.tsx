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
import { api, ApiError, type Role } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Save, AlertCircle, Copy, CheckCircle2, ShieldCheck } from "lucide-react";

export function CreateUserDialog({
  open,
  onOpenChange,
  defaultClubId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClubId?: string;
}) {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const isFederationAdmin = me?.role === "federation_admin";

  const clubsQ = useQuery({
    queryKey: ["clubs"],
    queryFn: () => api.clubs.list().then((r) => r.clubs),
    enabled: open && isFederationAdmin,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("coach");
  const [clubId, setClubId] = useState(defaultClubId ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (defaultClubId && !clubId) setClubId(defaultClubId);
  }, [defaultClubId, clubId]);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("coach");
    setClubId(defaultClubId ?? "");
    setPassword("");
    setConfirm("");
    setError(null);
    setCreatedUser(null);
    setCopied(false);
  };

  const createMut = useMutation({
    mutationFn: () =>
      api.users.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        clubId: role === "federation_admin" ? undefined : clubId || undefined,
        password,
        forceChangeOnFirstLogin: true,
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setCreatedUser({ email: data.user.email, password });
    },
    onError: (err: ApiError | Error) => {
      if ("code" in err && err.code === "email_already_exists") {
        setError("Υπάρχει ήδη χρήστης με αυτό το email.");
      } else {
        setError(("message" in err && err.message) || "Αποτυχία δημιουργίας.");
      }
    },
  });

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const validate = (): string | null => {
    if (name.trim().length < 2) return "Το όνομα είναι υποχρεωτικό (≥2 χαρακτήρες).";
    if (!email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return "Μη έγκυρο email.";
    if (role !== "federation_admin" && !clubId) return "Πρέπει να επιλέξετε όμιλο.";
    if (password.length < 10) return "Ο κωδικός πρέπει να είναι ≥10 χαρακτήρες.";
    if (password !== confirm) return "Οι κωδικοί δεν ταιριάζουν.";
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

  const copyCredentials = async () => {
    if (!createdUser) return;
    const text = `Aquastat credentials\nEmail: ${createdUser.email}\nPassword: ${createdUser.password}\nURL: https://aquastat.pakkou.cloud/login`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be unavailable on http
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {createdUser ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-achieved">
                <CheckCircle2 className="w-5 h-5" /> Χρήστης δημιουργήθηκε
              </DialogTitle>
              <DialogDescription>
                Δώστε τα παρακάτω credentials στον χρήστη. Στο πρώτο login θα <strong>αναγκαστεί</strong> να
                ορίσει δικό του κωδικό.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-md border border-outline-variant bg-surface-1 p-4 space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-ink-muted">Email</span>
                <code className="text-sm font-mono text-ink">{createdUser.email}</code>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-ink-muted">Password (μία φορά)</span>
                <code className="text-sm font-mono text-ink">{createdUser.password}</code>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-ink-muted">URL</span>
                <code className="text-xs font-mono text-ink-muted">https://aquastat.pakkou.cloud/login</code>
              </div>
            </div>

            <div className="rounded-md bg-primary-fixed/40 border border-primary-fixed text-primary text-xs p-3 flex items-start gap-2 mt-3">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                Ο κωδικός εμφανίζεται <strong>μόνο μία φορά</strong>. Αν τον χάσετε, ο χρήστης πρέπει
                να ζητήσει password reset.
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={copyCredentials}>
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Αντιγράφτηκε" : "Αντιγραφή όλων"}
              </Button>
              <Button onClick={() => handleClose(false)}>Έγινε</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Νέος χρήστης</DialogTitle>
              <DialogDescription>
                Ο χρήστης θα πρέπει να αλλάξει τον κωδικό στο πρώτο login.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Ονοματεπώνυμο" required>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="π.χ. Μάριος Παπαδόπουλος"
                  required
                  autoFocus
                />
              </Field>

              <Field label="Email" required>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coach@example.com"
                  required
                />
              </Field>

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Ρόλος" required>
                  <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                    <option value="coach">Προπονητής</option>
                    <option value="parent">Γονέας</option>
                    <option value="club_admin">Διαχειριστής Ομίλου</option>
                    {isFederationAdmin && (
                      <option value="federation_admin">Διαχειριστής Πλατφόρμας</option>
                    )}
                  </Select>
                </Field>

                {role !== "federation_admin" && (
                  <Field label="Όμιλος" required>
                    {isFederationAdmin ? (
                      <Select value={clubId} onChange={(e) => setClubId(e.target.value)} required>
                        <option value="">— Επιλέξτε —</option>
                        {(clubsQ.data ?? []).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input value="Ο όμιλος σας" disabled />
                    )}
                  </Field>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Προσωρινός κωδικός" required hint="≥10 χαρακτήρες">
                  <Input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="π.χ. Welcome2026!"
                    required
                    minLength={10}
                  />
                </Field>
                <Field label="Επιβεβαίωση" required>
                  <Input
                    type="text"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </Field>
              </div>

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
                  onClick={() => handleClose(false)}
                  disabled={createMut.isPending}
                >
                  Άκυρο
                </Button>
                <Button type="submit" disabled={createMut.isPending}>
                  <Save className="w-4 h-4" /> {createMut.isPending ? "Δημιουργία..." : "Δημιουργία"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
