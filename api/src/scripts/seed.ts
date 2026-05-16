/**
 * Seed minimal demo data for Aquastat MVP preview.
 * Idempotent: if seed data exists, skip (does not duplicate or wipe).
 *
 * Run: npm run db:seed
 */
import "dotenv/config";
import { db, sql } from "../db/client.js";
import {
  clubs, users, athletes, seasons, ageCategories, swimEvents,
} from "../db/schema.js";
import { hashPassword } from "../lib/auth.js";
import { eq } from "drizzle-orm";

const SEED_ADMIN_EMAIL = process.env.SEED_FEDERATION_ADMIN_EMAIL ?? "admin@aquastat.cy";
const SEED_ADMIN_PASSWORD = process.env.SEED_FEDERATION_ADMIN_PASSWORD ?? "ChangeMe!2026";

async function main() {
  console.log("[seed] starting");

  // Skip if already seeded
  const existing = await db.select().from(users).where(eq(users.email, SEED_ADMIN_EMAIL)).limit(1);
  if (existing.length > 0) {
    console.log("[seed] federation admin already exists — skipping seed");
    await sql.end();
    return;
  }

  // 1. Clubs
  const [nol, okoal, nolar, nop] = await db
    .insert(clubs)
    .values([
      { name: "ΝΟ Λεμεσού", shortName: "ΝΟΛ", federationCode: "ΝΟΛ-01" },
      { name: "ΟΚΟΑ Λευκωσίας", shortName: "ΟΚΟΑΛ", federationCode: "ΟΚΟΑΛ-02" },
      { name: "ΝΟ Λάρνακας", shortName: "ΝΟΛΑΡ", federationCode: "ΝΟΛΑΡ-03" },
      { name: "ΝΟ Πάφου", shortName: "ΝΟΠ", federationCode: "ΝΟΠ-04" },
    ])
    .returning();
  console.log(`[seed] clubs: ${nol.shortName}, ${okoal.shortName}, ${nolar.shortName}, ${nop.shortName}`);

  // 2. Users
  const adminHash = await hashPassword(SEED_ADMIN_PASSWORD);
  const coachHash = await hashPassword("CoachDemo!1");
  const parentHash = await hashPassword("ParentDemo!1");
  const clubAdminHash = await hashPassword("ClubAdminDemo!1");

  const [fedAdmin, clubAdmin, coach, parent] = await db
    .insert(users)
    .values([
      { name: "Νίκος Παπαδόπουλος", email: SEED_ADMIN_EMAIL, passwordHash: adminHash, role: "federation_admin", clubId: null },
      { name: "Σοφία Δημητρίου", email: "club.admin@aquastat.cy", passwordHash: clubAdminHash, role: "club_admin", clubId: nol.id },
      { name: "Μάριος Παπαδόπουλος", email: "coach@aquastat.cy", passwordHash: coachHash, role: "coach", clubId: nol.id },
      { name: "Ελένη Γεωργίου", email: "parent@aquastat.cy", passwordHash: parentHash, role: "parent", clubId: nol.id },
    ])
    .returning();
  console.log(`[seed] users: ${fedAdmin.email}, ${clubAdmin.email}, ${coach.email}, ${parent.email}`);

  // 3. Season 2025-2026
  const [season] = await db.insert(seasons).values({
    name: "2025–2026",
    startDate: "2025-09-01",
    endDate: "2026-08-31",
    qualificationStartDate: "2025-09-01",
    status: "active",
  }).returning();
  console.log(`[seed] season: ${season.name}`);

  // 4. Age categories (typical Cyprus swimming age groups for season 2025-2026)
  await db.insert(ageCategories).values([
    { seasonId: season.id, nameEl: "Άνδρες / Γυναίκες", nameEn: "Men / Women", genderScope: "any", birthYearFrom: null, birthYearTo: 2007 },
    { seasonId: season.id, nameEl: "Νέοι / Νεανίδες", nameEn: "Juniors", genderScope: "any", birthYearFrom: 2008, birthYearTo: 2009 },
    { seasonId: season.id, nameEl: "Παίδες / Κορασίδες", nameEn: "Boys / Girls", genderScope: "any", birthYearFrom: 2010, birthYearTo: 2011 },
    { seasonId: season.id, nameEl: "Παμπαίδες / Παγκορασίδες Α´", nameEn: "Boys / Girls 12", genderScope: "any", birthYearFrom: 2012, birthYearTo: 2012 },
    { seasonId: season.id, nameEl: "Παμπαίδες / Παγκορασίδες Β´", nameEn: "Boys / Girls 13", genderScope: "any", birthYearFrom: 2013, birthYearTo: 2013 },
    { seasonId: season.id, nameEl: "Προαγωνιστική", nameEn: "Pre-competitive", genderScope: "any", birthYearFrom: 2014, birthYearTo: 2017 },
  ]);
  console.log("[seed] age categories: 6");

  // 5. Swim events
  const distances = [50, 100, 200, 400];
  type StrokeKey = "freestyle" | "backstroke" | "breaststroke" | "butterfly" | "medley";
  type SwimEventRow = { distanceM: number; stroke: StrokeKey; gender: "male" | "female"; relay: boolean; displayName: string };
  const strokeLabels: Record<StrokeKey, string> = {
    freestyle: "Ελεύθερο",
    backstroke: "Ύπτιο",
    breaststroke: "Πρόσθιο",
    butterfly: "Πεταλούδα",
    medley: "Μ.Α.",
  };
  const strokes: StrokeKey[] = ["freestyle", "backstroke", "breaststroke", "butterfly"];
  const evRows: SwimEventRow[] = [];
  for (const stroke of strokes) {
    for (const d of distances) {
      if (stroke !== "freestyle" && d === 400) continue;
      for (const gender of ["male", "female"] as const) {
        evRows.push({
          distanceM: d,
          stroke,
          gender,
          relay: false,
          displayName: `${d}μ ${strokeLabels[stroke]}`,
        });
      }
    }
  }
  // 200/400 medley
  for (const d of [200, 400]) {
    for (const gender of ["male", "female"] as const) {
      evRows.push({ distanceM: d, stroke: "medley", gender, relay: false, displayName: `${d}μ Μ.Α.` });
    }
  }
  await db.insert(swimEvents).values(evRows);
  console.log(`[seed] swim events: ${evRows.length}`);

  // 6. Sample athletes for ΝΟΛ
  await db.insert(athletes).values([
    { clubId: nol.id, firstName: "Ανδρέας", lastName: "Γεωργίου", dateOfBirth: "2012-03-14", gender: "male", coachId: coach.id },
    { clubId: nol.id, firstName: "Λουκάς", lastName: "Χριστοφή", dateOfBirth: "2012-08-22", gender: "male", coachId: coach.id },
    { clubId: nol.id, firstName: "Έλενα", lastName: "Σίλβα", dateOfBirth: "2013-11-02", gender: "female", coachId: coach.id },
  ]);
  console.log("[seed] athletes: 3 in ΝΟΛ");

  console.log("[seed] ✓ complete");
  console.log("");
  console.log("  Federation Admin: " + SEED_ADMIN_EMAIL + " / " + SEED_ADMIN_PASSWORD);
  console.log("  Club Admin:       club.admin@aquastat.cy / ClubAdminDemo!1");
  console.log("  Coach:            coach@aquastat.cy / CoachDemo!1");
  console.log("  Parent:           parent@aquastat.cy / ParentDemo!1");

  await sql.end();
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
