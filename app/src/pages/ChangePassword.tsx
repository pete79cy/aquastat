import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Lock, AlertCircle, ShieldCheck, ArrowRight, Waves } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Select";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";

const roleHomePath: Record<string, string> = {
  federation_admin: "/federation",
  club_admin: "/admin",
  coach: "/coach",
  parent: "/parent",
};

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => api.auth.changePassword(current, next),
    onSuccess: () => {
      // Force a fresh /me to clear mustChangePassword flag, then route home
      window.location.href = roleHomePath[user?.role ?? ""] ?? "/login";
    },
    onError: (err: ApiError | Error) => {
      if ("status" in err && err.status === 401) {
        setError("Λανθασμένος τρέχων κωδικός.");
      } else if ("code" in err && err.code === "new_password_must_differ") {
        setError("Ο νέος κωδικός πρέπει να διαφέρει από τον τρέχοντα.");
      } else {
        setError(err.message || "Αποτυχία αλλαγής κωδικού.");
      }
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < 10) {
      setError("Ο νέος κωδικός πρέπει να είναι τουλάχιστον 10 χαρακτήρες.");
      return;
    }
    if (next !== confirm) {
      setError("Οι δύο κωδικοί δεν ταιριάζουν.");
      return;
    }
    if (next === current) {
      setError("Ο νέος κωδικός πρέπει να διαφέρει από τον τρέχοντα.");
      return;
    }
    mut.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-primary via-primary-tint to-secondary">
      <div className="absolute top-4 right-4 z-10">
        <LocaleSwitcher />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-surface-0 rounded-xl shadow-2xl p-8 sm:p-10">
          <div className="flex flex-col items-center gap-3 mb-7">
            <div className="w-14 h-14 rounded-xl bg-primary grid place-items-center shadow-md">
              <Waves className="w-7 h-7 text-primary-fg" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-primary tracking-tight">Αλλαγή κωδικού</h1>
              <p className="text-sm text-ink-muted mt-1">
                Είστε συνδεδεμένοι με προσωρινό κωδικό. Παρακαλώ ορίστε νέο πριν συνεχίσετε.
              </p>
            </div>
          </div>

          <div className="rounded-md bg-primary-fixed/40 border border-primary-fixed text-primary text-xs p-3 flex items-start gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">{user?.email ?? "—"}</div>
              <div className="text-ink-muted mt-0.5">
                Ο νέος κωδικός θα χρησιμοποιείται σε όλες τις μελλοντικές συνδέσεις σας.
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Τρέχων κωδικός (αυτός που σας έδωσαν)" required>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
                <Input
                  type="password"
                  className="pl-9"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </Field>

            <Field label="Νέος κωδικός" required hint="τουλάχιστον 10 χαρακτήρες">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
                <Input
                  type="password"
                  className="pl-9"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  required
                  minLength={10}
                />
              </div>
            </Field>

            <Field label="Επιβεβαίωση νέου κωδικού" required>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
                <Input
                  type="password"
                  className="pl-9"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
            </Field>

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-warn-bg text-warn p-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full mt-2" disabled={mut.isPending}>
              {mut.isPending ? "Αποθήκευση..." : "Αλλαγή κωδικού"}
              {!mut.isPending && <ArrowRight className="w-4 h-4" />}
            </Button>

            <button
              type="button"
              onClick={() => {
                void logout();
                navigate("/login", { replace: true });
              }}
              className="w-full text-xs text-ink-muted hover:text-primary text-center"
            >
              Αποσύνδεση
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
