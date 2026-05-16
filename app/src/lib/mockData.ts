// Mock data for visual preview. Ms-based times per PDR §11.1.
// Athletes use Greek-style names appropriate for Cyprus club context.

export type Stroke = "freestyle" | "backstroke" | "breaststroke" | "butterfly" | "medley";
export type PoolType = "25m" | "50m";

export const me = {
  coach: { name: "Μάριος Παπαδόπουλος", club: "ΝΟ Λεμεσού", season: "2025–2026" },
  parent: { name: "Ελένη Γεωργίου", club: "ΝΟ Λεμεσού" },
  clubAdmin: { name: "Σοφία Δημητρίου", club: "ΝΟ Λεμεσού" },
  federationAdmin: { name: "Νίκος Παπαδόπουλος", club: "—" },
};

export const clubs = [
  { id: "c1", short: "ΝΟΛ", name: "ΝΟ Λεμεσού", athletes: 86, coaches: 7, region: "Λεμεσός" },
  { id: "c2", short: "ΟΚΟΑΛ", name: "ΟΚΟΑ Λευκωσίας", athletes: 142, coaches: 11, region: "Λευκωσία" },
  { id: "c3", short: "ΝΟΛΑΡ", name: "ΝΟ Λάρνακας", athletes: 64, coaches: 5, region: "Λάρνακα" },
  { id: "c4", short: "ΝΟΠ", name: "ΝΟ Πάφου", athletes: 48, coaches: 4, region: "Πάφος" },
  { id: "c5", short: "ΑΕΛ", name: "Αθλητικός Όμιλος Αμμοχώστου", athletes: 32, coaches: 3, region: "Αμμόχωστος" },
];

export const athletes = [
  {
    id: "a1",
    firstName: "Ανδρέας",
    lastName: "Γεωργίου",
    initials: "ΑΓ",
    dob: "2012-03-14",
    age: 13,
    gender: "male" as const,
    categoryKey: "coachDashboard.categoryBoysU15",
    latestTimeMs: 65_230,
    pbDeltaMs: -420,
  },
  {
    id: "a2",
    firstName: "Λουκάς",
    lastName: "Χριστοφή",
    initials: "ΛΧ",
    dob: "2012-08-22",
    age: 13,
    gender: "male" as const,
    categoryKey: "coachDashboard.categoryBoysU15",
    latestTimeMs: 58_120,
    pbDeltaMs: -150,
  },
  {
    id: "a3",
    firstName: "Έλενα",
    lastName: "Σίλβα",
    initials: "ΕΣ",
    dob: "2013-11-02",
    age: 12,
    gender: "female" as const,
    categoryKey: "coachDashboard.categoryGirlsU13",
    latestTimeMs: 72_440,
    pbDeltaMs: -1_020,
  },
  {
    id: "a4",
    firstName: "Νικόλας",
    lastName: "Αντρέου",
    initials: "ΝΑ",
    dob: "2008-04-09",
    age: 17,
    gender: "male" as const,
    categoryKey: "coachDashboard.categoryJuniors",
    latestTimeMs: 64_180,
    pbDeltaMs: 220,
  },
];

export const upcomingCompetitions = [
  {
    id: "c1",
    date: { day: "24", month: "ΟΚΤ" },
    name: "Πρωτάθλημα Ανοιχτής Κατηγορίας",
    location: "Δημ. Κολυμβητήριο Λεμεσού",
    events: 12,
    swimmers: 18,
  },
  {
    id: "c2",
    date: { day: "02", month: "ΝΟΕ" },
    name: "Χειμερινό Πρωτάθλημα",
    location: "Ολυμπιακό Κολ. Λευκωσίας",
    events: 8,
    swimmers: 6,
  },
];

export const childProgress = {
  athleteId: "a1",
  name: "Ανδρέας Γεωργίου",
  age: 13,
  category: "Παμπαίδες Α´",
  coach: "Μάριος Παπαδόπουλος",
  latest: { eventLabel: "100μ Πεταλούδα", timeMs: 65_230, improvementMs: -450 },
  pb: { timeMs: 65_230, setOn: "2026-04-12" },
  nextCompetition: {
    name: "Αγώνες Νεολαίας",
    date: "20 Ιουλίου 2026 · Ολυμπιακό Κολ.",
    daysToGo: 12,
  },
  progressChart: [
    { month: "Ιαν", ms: 67_400 },
    { month: "Φεβ", ms: 66_900 },
    { month: "Μαρ", ms: 67_100 },
    { month: "Απρ", ms: 65_900 },
    { month: "Μαϊ", ms: 65_550 },
    { month: "Ιουν", ms: 65_230 },
  ],
  upcomingTarget: {
    eventLabel: "100μ Πεταλούδα",
    currentMs: 65_230,
    limitMs: 64_500,
    achievedPct: 88,
    gapMs: 730,
  },
  recentResults: [
    { id: "r1", meet: "Πρωτάθλημα Ομίλου", date: "12 Ιουν 2026", event: "100μ Πεταλούδα", timeMs: 65_230, badge: { kind: "pb" as const, label: "PB · Achieved" } },
    { id: "r2", meet: "Διασυλλογικοί Αγώνες Sprint", date: "28 Μαϊ 2026", event: "50μ Πεταλούδα", timeMs: 29_450, delta: 120 },
    { id: "r3", meet: "Aquatic Gala Λεμεσού", date: "15 Μαϊ 2026", event: "100μ Πεταλούδα", timeMs: 65_680, delta: -320 },
  ],
};

export const athleteCard = {
  id: "a1",
  name: "Ανδρέας Γεωργίου",
  initials: "ΑΓ",
  category: "Παμπαίδες Α´",
  club: "ΝΟ Λεμεσού",
  squad: "High Performance Squad",
  active: true,
  bestTimes: [
    { eventLabel: "50μ Ελεύθερο", pool: "25m" as PoolType, timeMs: 24_820, pb: true },
    { eventLabel: "100μ Πεταλούδα", pool: "50m" as PoolType, timeMs: 58_140, deltaMs: -420 },
    { eventLabel: "200μ Μ.Α.", pool: "25m" as PoolType, timeMs: 134_330 },
    { eventLabel: "100μ Ελεύθερο", pool: "50m" as PoolType, timeMs: 54_910 },
  ],
  topPerformances: [
    { eventLabel: "50μ Ελεύθερο", pool: "Πισίνα 25μ", timeMs: 24_820, chip: { tone: "achieved" as const, label: "PB" } },
    { eventLabel: "100μ Πεταλούδα", pool: "Πισίνα 50μ", timeMs: 58_140, chip: { tone: "achieved" as const, label: "PB" } },
    { eventLabel: "200μ Μ.Α.", pool: "Πισίνα 25μ", timeMs: 134_330 },
    { eventLabel: "100μ Ελεύθερο", pool: "Πισίνα 50μ", timeMs: 54_910 },
  ],
  recentActivity: [
    { kind: "result" as const, title: "Πρωτάθλημα Παμπαίδων", detail: "Νέο PB 100μ Πεταλούδα (58.14). 1η θέση στην κατηγορία.", ago: "πριν 2 ημέρες" },
    { kind: "training" as const, title: "Πρωινή προπόνηση", detail: "Εκρηκτικά starts & υποβρύχια. Συνολική απόσταση 4.5km.", ago: "χθες" },
    { kind: "milestone" as const, title: "Όριο πρόκρισης", detail: "50μ Ελεύθερο: πέρασε το όριο για την Ανοιχτή Κατηγορία.", ago: "πριν 4 ημέρες" },
  ],
  qualificationProgress: [
    { title: "Ανοιχτό Πρωτάθλημα", pct: 92, currentMs: 24_820, targetMs: 24_500, eventLabel: "50μ Ελεύθερο" },
    { title: "Πρόκριση Νεαρών Ταλέντων", pct: 85, currentMs: 65_230, targetMs: 64_500, eventLabel: "100μ Πεταλούδα" },
  ],
};

// ─── Stage 2 mock data ─────────────────────────────────────────────────────

export const swimEvents = [
  { id: "e1", label: "50μ Ελεύθερο", distance: 50, stroke: "freestyle" as Stroke },
  { id: "e2", label: "100μ Ελεύθερο", distance: 100, stroke: "freestyle" as Stroke },
  { id: "e3", label: "200μ Ελεύθερο", distance: 200, stroke: "freestyle" as Stroke },
  { id: "e4", label: "400μ Ελεύθερο", distance: 400, stroke: "freestyle" as Stroke },
  { id: "e5", label: "50μ Ύπτιο", distance: 50, stroke: "backstroke" as Stroke },
  { id: "e6", label: "100μ Ύπτιο", distance: 100, stroke: "backstroke" as Stroke },
  { id: "e7", label: "50μ Πρόσθιο", distance: 50, stroke: "breaststroke" as Stroke },
  { id: "e8", label: "100μ Πρόσθιο", distance: 100, stroke: "breaststroke" as Stroke },
  { id: "e9", label: "50μ Πεταλούδα", distance: 50, stroke: "butterfly" as Stroke },
  { id: "e10", label: "100μ Πεταλούδα", distance: 100, stroke: "butterfly" as Stroke },
  { id: "e11", label: "200μ Μ.Α.", distance: 200, stroke: "medley" as Stroke },
  { id: "e12", label: "400μ Μ.Α.", distance: 400, stroke: "medley" as Stroke },
];

export const competitions = [
  {
    id: "comp1",
    name: "Πρωτάθλημα Ανοιχτής Κατηγορίας",
    startDate: "2026-10-24",
    endDate: "2026-10-26",
    location: "Λεμεσός",
    venue: "Δημ. Κολυμβητήριο Λεμεσού",
    pool: "50m" as PoolType,
    status: "registration_open" as const,
    eligibleBirthYears: "2007 και πριν",
    declarationDeadline: "2026-10-15",
    eventsCount: 32,
    registeredAthletes: 18,
  },
  {
    id: "comp2",
    name: "Χειμερινό Πρωτάθλημα",
    startDate: "2026-11-02",
    endDate: "2026-11-04",
    location: "Λευκωσία",
    venue: "Ολυμπιακό Κολυμβητήριο",
    pool: "25m" as PoolType,
    status: "registration_open" as const,
    eligibleBirthYears: "2014–2017 (Προαγωνιστική)",
    declarationDeadline: "2026-10-25",
    eventsCount: 28,
    registeredAthletes: 6,
  },
  {
    id: "comp3",
    name: "Διασυλλογικοί Παμπαίδων",
    startDate: "2026-12-12",
    endDate: "2026-12-13",
    location: "Λάρνακα",
    venue: "Δημοτικό Κολυμβητήριο",
    pool: "25m" as PoolType,
    status: "scheduled" as const,
    eligibleBirthYears: "2012–2013",
    declarationDeadline: "2026-12-05",
    eventsCount: 24,
    registeredAthletes: 0,
  },
  {
    id: "comp4",
    name: "Αγώνες Νεολαίας",
    startDate: "2026-07-18",
    endDate: "2026-07-20",
    location: "Λευκωσία",
    venue: "Ολυμπιακό Κολυμβητήριο",
    pool: "50m" as PoolType,
    status: "past" as const,
    eligibleBirthYears: "2008–2011",
    declarationDeadline: "2026-07-08",
    eventsCount: 36,
    registeredAthletes: 24,
  },
];

export const competitionDetail = {
  ...competitions[0],
  description: "Αγώνας ανοιχτής κατηγορίας. Δυνατότητα πρόκρισης για επόμενες διοργανώσεις.",
  program: [
    { day: "Σάββατο 24 Οκτ", session: "Πρωινή", time: "09:00", events: ["50μ Ελεύθερο Α", "100μ Πρόσθιο Γ", "200μ Πεταλούδα Α", "400μ Μ.Α. Γ"] },
    { day: "Σάββατο 24 Οκτ", session: "Απογευματινή", time: "17:00", events: ["50μ Ελεύθερο Γ (Τελικός)", "200μ Ύπτιο Α", "100μ Πεταλούδα Γ"] },
    { day: "Κυριακή 25 Οκτ", session: "Πρωινή", time: "09:00", events: ["100μ Ελεύθερο Α", "200μ Πρόσθιο Γ", "100μ Ύπτιο Α", "200μ Μ.Α. Γ"] },
    { day: "Κυριακή 25 Οκτ", session: "Απογευματινή", time: "17:00", events: ["100μ Ελεύθερο Γ (Τελικός)", "400μ Ελεύθερο Α", "50μ Πεταλούδα Γ"] },
  ],
};

export const eligibilityList = [
  {
    athlete: { id: "a4", initials: "ΝΑ", name: "Νικόλας Αντρέου", category: "Νέοι" },
    status: "qualified" as const,
    entries: [
      { event: "100μ Πρόσθιο", pb: 66_850, limit: 65_200, gapMs: 1_650, qualified: false },
      { event: "200μ Πρόσθιο", pb: 142_400, limit: 144_000, qualified: true },
      { event: "50μ Πρόσθιο", pb: 30_150, limit: 28_500, gapMs: 1_650, qualified: false },
    ],
  },
  {
    athlete: { id: "a1", initials: "ΑΓ", name: "Ανδρέας Γεωργίου", category: "Παμπαίδες Α´" },
    status: "close" as const,
    entries: [
      { event: "50μ Ελεύθερο", pb: 24_820, limit: 24_500, gapMs: 320, qualified: false },
      { event: "100μ Πεταλούδα", pb: 58_140, limit: 58_500, qualified: true },
    ],
  },
];

export const ageCategories = [
  { id: "ac1", labelEl: "Άνδρες / Γυναίκες", labelEn: "Men / Women", years: "2007 και πριν", gender: "M / F", color: "primary" },
  { id: "ac2", labelEl: "Νέοι / Νεανίδες", labelEn: "Juniors", years: "2008–2009", gender: "M / F", color: "primary" },
  { id: "ac3", labelEl: "Παίδες / Κορασίδες", labelEn: "Boys / Girls", years: "2010–2011", gender: "M / F", color: "secondary" },
  { id: "ac4", labelEl: "Παμπαίδες / Παγκορασίδες Α´", labelEn: "Boys / Girls 12", years: "2012", gender: "M / F", color: "secondary" },
  { id: "ac5", labelEl: "Παμπαίδες / Παγκορασίδες Β´", labelEn: "Boys / Girls 13", years: "2013", gender: "M / F", color: "tertiary" },
  { id: "ac6", labelEl: "Προαγωνιστική", labelEn: "Pre-competitive", years: "2014–2017", gender: "M / F", color: "neutral" },
];

export const standards = [
  { eventLabel: "50μ Ελεύθερο", category: "Παμπαίδες Α´", gender: "M", domestic: 26_500, international: 24_500, pool: "25m" as PoolType },
  { eventLabel: "100μ Ελεύθερο", category: "Παμπαίδες Α´", gender: "M", domestic: 58_000, international: 54_500, pool: "25m" as PoolType },
  { eventLabel: "100μ Πεταλούδα", category: "Παμπαίδες Α´", gender: "M", domestic: 65_500, international: 61_000, pool: "25m" as PoolType },
  { eventLabel: "50μ Ελεύθερο", category: "Νέοι", gender: "M", domestic: 24_200, international: 22_800, pool: "50m" as PoolType },
  { eventLabel: "100μ Πρόσθιο", category: "Νέοι", gender: "M", domestic: 65_200, international: 61_500, pool: "50m" as PoolType },
];

export const aiQueue = [
  {
    id: "ai1",
    document: "Προκήρυξη_Σαιζόν_2025-2026.pdf",
    type: "season_proclamation" as const,
    extractedItems: 142,
    pending: 18,
    approved: 124,
    rejected: 0,
    uploadedAt: "πριν 2 ώρες",
    status: "needs_review" as const,
    confidence: 92,
  },
  {
    id: "ai2",
    document: "Αποτελέσματα_Διασυλλογικοί_Sprint.pdf",
    type: "results_pdf" as const,
    extractedItems: 86,
    pending: 4,
    approved: 78,
    rejected: 4,
    uploadedAt: "χθες",
    status: "needs_review" as const,
    confidence: 87,
  },
  {
    id: "ai3",
    document: "Όρια_Πρόκρισης_2026.pdf",
    type: "standards_pdf" as const,
    extractedItems: 64,
    pending: 0,
    approved: 64,
    rejected: 0,
    uploadedAt: "πριν 5 ημέρες",
    status: "completed" as const,
    confidence: 96,
  },
];

export const aiReviewItems = [
  {
    id: "i1",
    eventNumber: "01",
    eventLabel: "200μ Ελεύθερο — Άνδρες",
    session: "Πρωινή",
    startTime: "09:00",
    pool: "50μ (LC)",
    qualifyingTime: 132_500,
    confidence: "high" as const,
    confidenceValue: 96,
    sourcePage: "σελ. 14",
  },
  {
    id: "i2",
    eventNumber: "02",
    eventLabel: "100μ Πεταλούδα — Γυναίκες",
    session: "Πρωινή (?)",
    startTime: "10:30",
    pool: "50μ (LC)",
    qualifyingTime: 68_200,
    confidence: "medium" as const,
    confidenceValue: 78,
    sourcePage: "σελ. 15",
    flag: "Διφορούμενη ένδειξη session",
  },
  {
    id: "i3",
    eventNumber: "03",
    eventLabel: "50μ Πρόσθιο — Άνδρες",
    session: "TBD",
    startTime: null,
    pool: "50μ (LC)",
    qualifyingTime: null,
    confidence: "low" as const,
    confidenceValue: 54,
    sourcePage: "σελ. 16",
    flag: "Χειρόγραφο κείμενο, ώρα έναρξης ασαφής",
  },
];

export const federationStats = {
  totalClubs: 18,
  totalAthletes: 1284,
  totalCoaches: 86,
  activeSeasons: 1,
  upcomingCompetitions: 6,
  pendingAIReviews: 22,
};

export const trainingTypes = [
  { value: "test", labelKey: "training.types.test" },
  { value: "time_trial", labelKey: "training.types.time_trial" },
  { value: "race_simulation", labelKey: "training.types.race_simulation" },
  { value: "set_result", labelKey: "training.types.set_result" },
  { value: "coach_observation", labelKey: "training.types.coach_observation" },
];

export const trainingContexts = [
  { value: "normal", labelKey: "training.contexts.normal" },
  { value: "heavy_fatigue", labelKey: "training.contexts.heavy_fatigue" },
  { value: "taper", labelKey: "training.contexts.taper" },
  { value: "after_gym", labelKey: "training.contexts.after_gym" },
  { value: "before_competition", labelKey: "training.contexts.before_competition" },
  { value: "technical_test", labelKey: "training.contexts.technical_test" },
];
