// Mock data for visual preview. Ms-based times per PDR §11.1.
// Athletes use Greek-style names appropriate for Cyprus club context.

export type Stroke = "freestyle" | "backstroke" | "breaststroke" | "butterfly" | "medley";
export type PoolType = "25m" | "50m";

export const me = {
  coach: { name: "Μάριος Παπαδόπουλος", club: "ΝΟ Λεμεσού", season: "2025–2026" },
  parent: { name: "Ελένη Γεωργίου", club: "ΝΟ Λεμεσού" },
};

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
    latestTimeMs: 65_230, // 1:05.23 (100m butterfly)
    pbDeltaMs: -420, // improved by 0.42s
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
    name: "Παγκύπριο Πρωτάθλημα Ανοιχτής Κατηγορίας",
    location: "Δημ. Κολυμβητήριο Λεμεσού",
    events: 12,
    swimmers: 18,
  },
  {
    id: "c2",
    date: { day: "02", month: "ΝΟΕ" },
    name: "Χειμερινό Πρωτάθλημα ΚΟΕΚ",
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
  latest: {
    eventLabel: "100μ Πεταλούδα",
    timeMs: 65_230,
    improvementMs: -450,
  },
  pb: { timeMs: 65_230, setOn: "2026-04-12" },
  nextCompetition: {
    name: "Παγκύπριοι Αγώνες Νεολαίας",
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
    {
      id: "r1",
      meet: "Πρωτάθλημα Ομίλου",
      date: "12 Ιουν 2026",
      event: "100μ Πεταλούδα",
      timeMs: 65_230,
      badge: { kind: "pb" as const, label: "PB · Achieved" },
    },
    {
      id: "r2",
      meet: "Διασυλλογικοί Αγώνες Sprint",
      date: "28 Μαϊ 2026",
      event: "50μ Πεταλούδα",
      timeMs: 29_450,
      delta: 120,
    },
    {
      id: "r3",
      meet: "Aquatic Gala Λεμεσού",
      date: "15 Μαϊ 2026",
      event: "100μ Πεταλούδα",
      timeMs: 65_680,
      delta: -320,
    },
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
    {
      kind: "result" as const,
      title: "Παγκύπριοι Παμπαίδων",
      detail: "Νέο PB 100μ Πεταλούδα (58.14). 1η θέση στην κατηγορία.",
      ago: "πριν 2 ημέρες",
    },
    {
      kind: "training" as const,
      title: "Πρωινή προπόνηση",
      detail: "Εκρηκτικά starts & υποβρύχια. Συνολική απόσταση 4.5km.",
      ago: "χθες",
    },
    {
      kind: "milestone" as const,
      title: "Όριο πρόκρισης",
      detail: "50μ Ελεύθερο: πέρασε το όριο για τους Παγκύπριους Ανοιχτής.",
      ago: "πριν 4 ημέρες",
    },
  ],
  qualificationProgress: [
    {
      title: "Παγκύπριο Πρωτάθλημα",
      pct: 92,
      currentMs: 24_820,
      targetMs: 24_500,
      eventLabel: "50μ Ελεύθερο",
    },
    {
      title: "Πρόκριση Νεαρών Ταλέντων",
      pct: 85,
      currentMs: 65_230,
      targetMs: 64_500,
      eventLabel: "100μ Πεταλούδα",
    },
  ],
};
