/**
 * Aquastat API client.
 *
 * - Reads JWT from localStorage (set on login) and sends as Bearer header.
 * - Cookie-based auth still works in parallel via credentials: 'include'.
 * - All endpoints expect/return JSON.
 */

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
const TOKEN_KEY = "aquastat.token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let body: { error?: string; message?: string } = {};
    try {
      body = await res.json();
    } catch {
      // body is not JSON
    }
    if (res.status === 401) setToken(null);
    throw new ApiError(res.status, body.error ?? "request_failed", body.message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ─── Types (subset, hand-written for clarity) ──────────────────────────────

export type Role = "federation_admin" | "club_admin" | "coach" | "parent";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  clubId: string | null;
  preferredLocale: "el" | "en";
  mustChangePassword?: boolean;
};

export type Club = {
  id: string;
  name: string;
  shortName: string | null;
  federationCode: string | null;
  country: string;
  isActive: boolean;
};

export type Athlete = {
  id: string;
  clubId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "mixed" | "any";
  registrationNumber: string | null;
  coachId: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Competition = {
  id: string;
  seasonId: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string | null;
  venue: string | null;
  poolType: "25m" | "50m" | "unknown";
  declarationDeadline: string | null;
  maxEventsPerAthlete: number | null;
};

export type CompetitionResult = {
  id: string;
  timeMs: number;
  rank: number | null;
  poolType: "25m" | "50m" | "unknown";
  roundType: "heat" | "final" | "direct_final" | "training_race" | "unknown";
  verificationStatus: "pending" | "verified" | "rejected";
  eventDisplay: string;
  distanceM: number;
  stroke: "freestyle" | "backstroke" | "breaststroke" | "butterfly" | "medley";
  gender: "male" | "female" | "mixed" | "any";
  createdAt: string;
};

export type TrainingResult = {
  id: string;
  timeMs: number;
  date: string;
  trainingType: "test" | "time_trial" | "race_simulation" | "set_result" | "coach_observation";
  trainingContext: "normal" | "heavy_fatigue" | "taper" | "after_gym" | "before_competition" | "technical_test";
  notes: string | null;
  eventDisplay: string;
  distanceM: number;
  stroke: string;
};

export type AthleteStandard = {
  id: string;
  standardType: "domestic_qualification" | "penalty_limit" | "international" | "national_team" | "incentive";
  gender: "male" | "female" | "mixed" | "any";
  timeMs: number;
  eventDisplay: string;
  distanceM: number;
  stroke: string;
  categoryEl: string | null;
};

export type Standard = {
  id: string;
  standardType: "domestic_qualification" | "penalty_limit" | "international" | "national_team" | "incentive";
  gender: "male" | "female" | "mixed" | "any";
  timeMs: number;
  validFrom: string | null;
  validUntil: string | null;
  categoryEl: string | null;
  categoryEn: string | null;
  eventDisplay: string;
  distanceM: number;
  stroke: string;
};

// ─── Endpoints ─────────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<AuthUser>("/auth/me"),
    logout: () => request<void>("/auth/logout", { method: "POST" }),
    forgotPassword: (email: string) =>
      request<void>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
    resetPassword: (token: string, newPassword: string) =>
      request<void>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, newPassword }) }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<void>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },

  users: {
    list: () => request<{ users: AuthUser[] }>("/users"),
    create: (payload: {
      name: string;
      email: string;
      role: Role;
      clubId?: string;
      password?: string;
      forceChangeOnFirstLogin?: boolean;
    }) =>
      request<{ user: AuthUser; tempPassword: string | null }>("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    setActive: (id: string, isActive: boolean) =>
      request<{ user: AuthUser }>(`/users/${id}/active`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
  },

  clubs: {
    list: () => request<{ clubs: Club[] }>("/clubs"),
    get: (id: string) => request<{ club: Club }>(`/clubs/${id}`),
    create: (payload: { name: string; shortName?: string; federationCode?: string; country?: string }) =>
      request<{ club: Club }>("/clubs", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: { name?: string; shortName?: string; federationCode?: string; country?: string }) =>
      request<{ club: Club }>(`/clubs/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  },

  athletes: {
    list: () => request<{ athletes: Athlete[] }>("/athletes"),
    get: (id: string) => request<{ athlete: Athlete }>(`/athletes/${id}`),
    create: (payload: {
      clubId: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      gender: "male" | "female";
      coachId?: string;
      registrationNumber?: string;
    }) =>
      request<{ athlete: Athlete }>("/athletes", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (
      id: string,
      payload: Partial<{
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        gender: "male" | "female";
        coachId: string;
        registrationNumber: string;
      }>
    ) =>
      request<{ athlete: Athlete }>(`/athletes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    setActive: (id: string, isActive: boolean) =>
      request<{ athlete: Athlete }>(`/athletes/${id}/active`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    results: (id: string) =>
      request<{ results: CompetitionResult[] }>(`/athletes/${id}/results`),
    trainingResults: (id: string) =>
      request<{ results: TrainingResult[] }>(`/athletes/${id}/training-results`),
    standardsComparison: (id: string) =>
      request<{
        standards: AthleteStandard[];
        season: { id: string; name: string } | null;
      }>(`/athletes/${id}/standards-comparison`),
  },

  competitions: {
    list: () => request<{ competitions: Competition[] }>("/competitions"),
    get: (id: string) =>
      request<{ competition: Competition; program: unknown[] }>(`/competitions/${id}`),
  },

  standards: {
    list: (seasonId?: string) =>
      request<{ standards: Standard[] }>(`/standards${seasonId ? `?seasonId=${seasonId}` : ""}`),
  },

  swimEvents: {
    list: () => request<{ swimEvents: SwimEvent[] }>("/swim-events"),
  },

  seasons: {
    active: () => request<{ season: Season | null }>("/seasons/active"),
    list: () => request<{ seasons: Season[] }>("/seasons"),
    categories: (seasonId: string) =>
      request<{ ageCategories: AgeCategory[] }>(`/seasons/${seasonId}/categories`),
  },

  stats: {
    federation: () => request<{ stats: FederationStats }>("/stats/federation"),
    club: (clubId?: string) =>
      request<{ stats: ClubStats }>(`/stats/club${clubId ? `?clubId=${clubId}` : ""}`),
  },

  aiExtractions: {
    list: () => request<{ extractions: AiExtractionItem[] }>("/ai-extractions"),
    items: (extractionId: string) =>
      request<{ items: AiItem[] }>(`/ai-extractions/${extractionId}/items`),
    approve: (itemId: string) =>
      request<{
        item: AiItem;
        mapped: { entityType: string; entityId: string; action: "created" | "updated" | "matched" } | null;
        mapError: string | null;
      }>(`/ai-extractions/items/${itemId}/approve`, { method: "POST" }),
    reject: (itemId: string, reason?: string) =>
      request<{ item: AiItem }>(`/ai-extractions/items/${itemId}/reject`, {
        method: "POST",
        body: JSON.stringify(reason ? { reason } : {}),
      }),
    edit: (itemId: string, extractedJson: Record<string, unknown>, reviewerNotes?: string) =>
      request<{ item: AiItem }>(`/ai-extractions/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ extractedJson, reviewerNotes }),
      }),
    bulkApproveHigh: (extractionId: string, minConfidence = 90) =>
      request<{ approved: number }>(`/ai-extractions/${extractionId}/bulk-approve-high`, {
        method: "POST",
        body: JSON.stringify({ minConfidence }),
      }),
  },

  documents: {
    list: () => request<{ documents: Document[] }>("/documents"),
    get: (id: string) => request<{ document: Document }>(`/documents/${id}`),
    upload: async (file: File, documentType: string, competitionId?: string) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("documentType", documentType);
      if (competitionId) fd.append("competitionId", competitionId);
      const token = getToken();
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });
      if (!res.ok) {
        let body: { error?: string; message?: string } = {};
        try { body = await res.json(); } catch { /* ignore */ }
        throw new ApiError(res.status, body.error ?? "upload_failed", body.message);
      }
      return (await res.json()) as { document: Document };
    },
    process: (id: string) =>
      request<{ extraction: { id: string }; itemCount: number; confidence: number }>(
        `/documents/${id}/process`,
        { method: "POST" }
      ),
  },

  results: {
    createCompetition: (payload: {
      athleteId: string;
      competitionId: string;
      swimEventId: string;
      resultTimeMs: number;
      poolType: "25m" | "50m" | "unknown";
      roundType?: "heat" | "final" | "direct_final" | "training_race" | "unknown";
      rank?: number;
    }) => request<{ result: { id: string } }>("/results/competition", { method: "POST", body: JSON.stringify(payload) }),
    updateCompetition: (
      id: string,
      payload: Partial<{
        resultTimeMs: number;
        rank: number | null;
        roundType: "heat" | "final" | "direct_final" | "training_race" | "unknown";
        poolType: "25m" | "50m" | "unknown";
      }>
    ) =>
      request<{ result: CompetitionResult }>(`/results/competition/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    setCompetitionStatus: (id: string, verificationStatus: "pending" | "verified" | "rejected") =>
      request<{ result: CompetitionResult }>(`/results/competition/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ verificationStatus }),
      }),
    deleteCompetition: (id: string) =>
      request<void>(`/results/competition/${id}`, { method: "DELETE" }),
    createTraining: (payload: {
      athleteId: string;
      swimEventId: string;
      resultTimeMs: number;
      date: string;
      trainingType: "test" | "time_trial" | "race_simulation" | "set_result" | "coach_observation";
      trainingContext?: "normal" | "heavy_fatigue" | "taper" | "after_gym" | "before_competition" | "technical_test";
      notes?: string;
    }) => request<{ result: { id: string } }>("/results/training", { method: "POST", body: JSON.stringify(payload) }),
  },
};

export type SwimEvent = {
  id: string;
  distanceM: number;
  stroke: "freestyle" | "backstroke" | "breaststroke" | "butterfly" | "medley";
  relay: boolean;
  gender: "male" | "female" | "mixed" | "any";
  displayName: string;
};

export type Season = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  qualificationStartDate: string | null;
  status: "draft" | "active" | "archived";
};

export type AgeCategory = {
  id: string;
  seasonId: string;
  nameEl: string;
  nameEn: string;
  genderScope: "male" | "female" | "mixed" | "any";
  birthYearFrom: number | null;
  birthYearTo: number | null;
  notes: string | null;
};

export type FederationStats = {
  totalClubs: number;
  totalAthletes: number;
  totalCoaches: number;
  upcomingCompetitions: number;
  pendingAIReviews: number;
  activeSeasons: number;
};

export type ClubStats = {
  athletesCount: number;
  coachesCount: number;
  parentsCount: number;
  upcomingCompetitions: number;
  pendingAIReviews: number;
};

export type AiExtractionItem = {
  id: string;
  extractionType: "competitions" | "program" | "categories" | "standards" | "results" | "records" | "rules";
  confidence: string | null;
  status: "pending" | "approved" | "rejected" | "edited";
  createdAt: string;
  documentId: string;
  documentFilename: string;
  documentType: "season_proclamation" | "results_pdf" | "standards_pdf" | "records_pdf" | "other";
  documentScope: "federation" | "club";
  documentClubId: string | null;
};

export type AiItem = {
  id: string;
  aiExtractionId: string;
  itemType: string;
  extractedJson: Record<string, unknown>;
  mappedEntityType: string | null;
  mappedEntityId: string | null;
  confidence: string | null;
  status: "pending" | "approved" | "rejected" | "edited";
  reviewerNotes: string | null;
};

export type Document = {
  id: string;
  scope: "federation" | "club";
  clubId: string | null;
  filename: string;
  originalFilename: string;
  fileType: "pdf" | "doc" | "docx" | "other";
  documentType: "season_proclamation" | "results_pdf" | "standards_pdf" | "records_pdf" | "other";
  storageUrl: string;
  uploadedBy: string | null;
  uploadedAt: string;
  processingStatus: "uploaded" | "processing" | "completed" | "failed" | "needs_review";
};
