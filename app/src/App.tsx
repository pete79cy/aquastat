import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Login from "@/pages/Login";
import ChangePassword from "@/pages/ChangePassword";
import CoachDashboard from "@/pages/CoachDashboard";
import ParentDashboard from "@/pages/ParentDashboard";
import AthleteProfile from "@/pages/AthleteProfile";
import FederationDashboard from "@/pages/FederationDashboard";
import ClubAdminDashboard from "@/pages/ClubAdminDashboard";
import AddCompetitionResult from "@/pages/AddCompetitionResult";
import AddTrainingResult from "@/pages/AddTrainingResult";
import CompetitionCalendar from "@/pages/CompetitionCalendar";
import CompetitionDetail from "@/pages/CompetitionDetail";
import CompetitionPreparation from "@/pages/CompetitionPreparation";
import SeasonSetup from "@/pages/SeasonSetup";
import AIReview from "@/pages/AIReview";
import Standards from "@/pages/Standards";
import AgeCategories from "@/pages/AgeCategories";
import AthletesList from "@/pages/AthletesList";
import ClubsList from "@/pages/ClubsList";
import UsersList from "@/pages/UsersList";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="text-ink-muted">
      <h1 className="text-headline-md text-ink mb-2">{title}</h1>
      <p className="text-sm">Coming soon — backend endpoint pending.</p>
    </div>
  );
}

function RoleAwareLayout({ role }: { role: "federation_admin" | "club_admin" | "coach" | "parent" }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <AppLayout
      role={role}
      userName={user.name}
      clubName={role === "federation_admin" ? "—" : (user.clubId ?? "—").slice(0, 8)}
    />
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/change-password"
              element={
                <RequireAuth>
                  <ChangePassword />
                </RequireAuth>
              }
            />

            <Route
              element={
                <RequireAuth roles={["coach"]}>
                  <RoleAwareLayout role="coach" />
                </RequireAuth>
              }
            >
              <Route path="/coach" element={<CoachDashboard />} />
              <Route path="/coach/athletes" element={<AthletesList />} />
              <Route path="/coach/athletes/:id" element={<AthleteProfile />} />
              <Route path="/coach/competitions" element={<CompetitionCalendar />} />
              <Route path="/coach/competitions/:id" element={<CompetitionDetail />} />
              <Route path="/coach/competitions/:id/preparation" element={<CompetitionPreparation />} />
              <Route path="/coach/preparation" element={<CompetitionPreparation />} />
              <Route path="/coach/add-result" element={<AddCompetitionResult />} />
              <Route path="/coach/add-training" element={<AddTrainingResult />} />
              <Route path="/coach/standards" element={<Standards />} />
              <Route path="/coach/reports" element={<Placeholder title="Αναφορές" />} />
            </Route>

            <Route
              element={
                <RequireAuth roles={["parent"]}>
                  <RoleAwareLayout role="parent" />
                </RequireAuth>
              }
            >
              <Route path="/parent" element={<ParentDashboard />} />
              <Route path="/parent/child" element={<AthleteProfile />} />
              <Route path="/parent/competitions" element={<CompetitionCalendar />} />
              <Route path="/parent/competitions/:id" element={<CompetitionDetail />} />
              <Route path="/parent/profile" element={<Placeholder title="Προφίλ γονέα" />} />
            </Route>

            <Route
              element={
                <RequireAuth roles={["club_admin"]}>
                  <RoleAwareLayout role="club_admin" />
                </RequireAuth>
              }
            >
              <Route path="/admin" element={<ClubAdminDashboard />} />
              <Route path="/admin/athletes" element={<AthletesList />} />
              <Route path="/admin/athletes/:id" element={<AthleteProfile />} />
              <Route path="/admin/users" element={<UsersList />} />
              <Route path="/admin/competitions" element={<CompetitionCalendar />} />
              <Route path="/admin/competitions/:id" element={<CompetitionDetail />} />
              <Route path="/admin/add-result" element={<AddCompetitionResult />} />
              <Route path="/admin/add-training" element={<AddTrainingResult />} />
              <Route path="/admin/standards" element={<Standards />} />
              <Route path="/admin/season" element={<SeasonSetup />} />
              <Route path="/admin/ai-review" element={<AIReview />} />
              <Route path="/admin/reports" element={<Placeholder title="Αναφορές" />} />
            </Route>

            <Route
              element={
                <RequireAuth roles={["federation_admin"]}>
                  <RoleAwareLayout role="federation_admin" />
                </RequireAuth>
              }
            >
              <Route path="/federation" element={<FederationDashboard />} />
              <Route path="/federation/clubs" element={<ClubsList />} />
              <Route path="/federation/users" element={<UsersList />} />
              <Route path="/federation/season" element={<SeasonSetup />} />
              <Route path="/federation/categories" element={<AgeCategories />} />
              <Route path="/federation/standards" element={<Standards />} />
              <Route path="/federation/competitions" element={<CompetitionCalendar />} />
              <Route path="/federation/ai-review" element={<AIReview />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
