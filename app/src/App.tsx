import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import CoachDashboard from "@/pages/CoachDashboard";
import ParentDashboard from "@/pages/ParentDashboard";
import AthleteProfile from "@/pages/AthleteProfile";
import { me } from "@/lib/mockData";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="text-ink-muted">
      <h1 className="text-headline-md text-ink mb-2">{title}</h1>
      <p className="text-sm">Stage 2 — αυτή η οθόνη θα ολοκληρωθεί αφού εγκριθεί το visual direction.</p>
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
          <Route path="/coach/athletes" element={<Placeholder title="Αθλητές" />} />
          <Route path="/coach/athletes/:id" element={<AthleteProfile />} />
          <Route path="/coach/competitions" element={<Placeholder title="Αγώνες" />} />
          <Route path="/coach/reports" element={<Placeholder title="Αναφορές" />} />
        </Route>

        {/* Parent */}
        <Route element={<AppLayout role="parent" userName={me.parent.name} clubName={me.parent.club} />}>
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/parent/child" element={<ParentDashboard />} />
          <Route path="/parent/competitions" element={<Placeholder title="Αγώνες παιδιού" />} />
          <Route path="/parent/profile" element={<Placeholder title="Προφίλ" />} />
        </Route>

        {/* Admin placeholders */}
        <Route element={<AppLayout role="club_admin" userName="Admin Demo" clubName={me.coach.club} />}>
          <Route path="/admin" element={<Placeholder title="Club Admin Dashboard (Stage 2)" />} />
          <Route path="/admin/*" element={<Placeholder title="Stage 2" />} />
        </Route>
        <Route element={<AppLayout role="federation_admin" userName="Federation Admin" clubName="ΚΟΕΚ" />}>
          <Route path="/federation" element={<Placeholder title="Federation Dashboard (Stage 2)" />} />
          <Route path="/federation/*" element={<Placeholder title="Stage 2" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
