import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
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
import { me } from "@/lib/mockData";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="text-ink-muted">
      <h1 className="text-headline-md text-ink mb-2">{title}</h1>
      <p className="text-sm">Stage 3 — backend wiring θα ολοκληρώσει αυτή την οθόνη.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Coach */}
        <Route element={<AppLayout role="coach" userName={me.coach.name} clubName={me.coach.club} />}>
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

        {/* Parent */}
        <Route element={<AppLayout role="parent" userName={me.parent.name} clubName={me.parent.club} />}>
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/parent/child" element={<AthleteProfile />} />
          <Route path="/parent/competitions" element={<CompetitionCalendar />} />
          <Route path="/parent/competitions/:id" element={<CompetitionDetail />} />
          <Route path="/parent/profile" element={<Placeholder title="Προφίλ γονέα" />} />
        </Route>

        {/* Club Admin */}
        <Route element={<AppLayout role="club_admin" userName={me.clubAdmin.name} clubName={me.clubAdmin.club} />}>
          <Route path="/admin" element={<ClubAdminDashboard />} />
          <Route path="/admin/athletes" element={<AthletesList />} />
          <Route path="/admin/athletes/:id" element={<AthleteProfile />} />
          <Route path="/admin/users" element={<Placeholder title="Διαχείριση χρηστών" />} />
          <Route path="/admin/competitions" element={<CompetitionCalendar />} />
          <Route path="/admin/competitions/:id" element={<CompetitionDetail />} />
          <Route path="/admin/add-result" element={<AddCompetitionResult />} />
          <Route path="/admin/add-training" element={<AddTrainingResult />} />
          <Route path="/admin/standards" element={<Standards />} />
          <Route path="/admin/season" element={<SeasonSetup />} />
          <Route path="/admin/ai-review" element={<AIReview />} />
          <Route path="/admin/reports" element={<Placeholder title="Αναφορές" />} />
        </Route>

        {/* Federation Admin */}
        <Route element={<AppLayout role="federation_admin" userName={me.federationAdmin.name} clubName={me.federationAdmin.club} />}>
          <Route path="/federation" element={<FederationDashboard />} />
          <Route path="/federation/clubs" element={<ClubsList />} />
          <Route path="/federation/season" element={<SeasonSetup />} />
          <Route path="/federation/categories" element={<AgeCategories />} />
          <Route path="/federation/standards" element={<Standards />} />
          <Route path="/federation/competitions" element={<CompetitionCalendar />} />
          <Route path="/federation/ai-review" element={<AIReview />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
