import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { api } from "@/lib/api";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { Plus, ShieldOff, ShieldCheck } from "lucide-react";

const roleLabel: Record<string, string> = {
  federation_admin: "Διαχ. Πλατφόρμας",
  club_admin: "Διαχ. Ομίλου",
  coach: "Προπονητής",
  parent: "Γονέας",
};

export default function UsersList() {
  const [createOpen, setCreateOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.users.list().then((r) => r.users),
  });

  const setActiveMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.users.setActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const users = data ?? [];

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-headline-lg font-semibold text-ink">Χρήστες</h1>
          <p className="text-sm text-ink-muted mt-1">
            {users.length} εγγραφές · διαχείριση προπονητών, γονέων και admins
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Νέος χρήστης
        </Button>
      </header>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />

      <Card>
        <CardBody className="!p-0">
          {isLoading ? (
            <div className="p-8 text-center text-ink-muted text-sm">Φόρτωση...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-ink-muted text-sm">Δεν υπάρχουν χρήστες.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-ink-muted text-[11px] uppercase tracking-wider border-b border-outline-variant">
                  <th className="px-4 py-2 text-left">Όνομα</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Ρόλος</th>
                  <th className="px-4 py-2 text-left">Κατάσταση</th>
                  <th className="px-4 py-2 text-right">Ενέργειες</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {users.map((u) => {
                  const initials = u.name.split(" ").map((p) => p[0]).slice(0, 2).join("");
                  const active = (u as { isActive?: boolean }).isActive !== false;
                  return (
                    <tr key={u.id} className="hover:bg-surface-1 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary grid place-items-center text-[11px] font-bold">
                            {initials}
                          </div>
                          <span className="font-semibold text-ink">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{u.email}</td>
                      <td className="px-4 py-3 text-ink-muted">{roleLabel[u.role] ?? u.role}</td>
                      <td className="px-4 py-3">
                        <Chip tone={active ? "achieved" : "neutral"}>
                          {active ? "Ενεργός" : "Ανενεργός"}
                        </Chip>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveMut.mutate({ id: u.id, active: !active })}
                          disabled={setActiveMut.isPending}
                        >
                          {active ? (
                            <><ShieldOff className="w-3.5 h-3.5" /> Απενεργοποίηση</>
                          ) : (
                            <><ShieldCheck className="w-3.5 h-3.5" /> Ενεργοποίηση</>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
