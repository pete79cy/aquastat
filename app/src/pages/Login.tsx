import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Waves, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

const roleHomePath: Record<string, string> = {
  federation_admin: "/federation",
  club_admin: "/admin",
  coach: "/coach",
  parent: "/parent",
};

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(roleHomePath[user.role] ?? "/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Λάθος email ή κωδικός.");
      } else {
        setError("Δεν ήταν δυνατή η σύνδεση. Δοκιμάστε ξανά.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-primary via-primary-tint to-secondary">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <svg className="absolute -bottom-10 left-0 right-0 w-full" viewBox="0 0 1200 320" preserveAspectRatio="none">
          <path fill="#ffffff" fillOpacity="0.4" d="M0,160L40,165.3C80,171,160,181,240,170.7C320,160,400,128,480,138.7C560,149,640,203,720,213.3C800,224,880,192,960,165.3C1040,139,1120,117,1160,106.7L1200,96L1200,320L0,320Z" />
          <path fill="#ffffff" fillOpacity="0.25" d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,229.3C840,235,960,213,1080,202.7L1200,192L1200,320L0,320Z" />
        </svg>
      </div>

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
              <h1 className="text-2xl font-bold text-primary tracking-tight">{t("app.name")}</h1>
              <p className="text-sm text-ink-muted mt-1">{t("app.tagline")}</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">{t("auth.email")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
                <Input
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-ink">{t("auth.password")}</label>
                <a href="#" className="text-xs font-semibold text-primary hover:underline">
                  {t("auth.forgotPassword")}
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-warn-bg text-warn p-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full mt-2" disabled={submitting}>
              {submitting ? t("common.loading") : t("auth.login")}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-white/80 mt-5">{t("auth.subtitle")}</p>
      </div>
    </div>
  );
}
