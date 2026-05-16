/**
 * Maps approved AI-extracted items into real DB entities.
 *
 * Called inside the approve-item handler. Returns the created/updated entity ID
 * and table name so the caller can record `mappedEntityType` + `mappedEntityId`
 * on the AI item.
 */
import { eq, and, sql as drizzleSql } from "drizzle-orm";
import type { db as DB } from "../db/client.js";
import {
  competitions,
  ageCategories,
  swimEvents,
  qualificationStandards,
  seasons,
  athletes,
  competitionResults,
} from "../db/schema.js";
import { logger } from "./logger.js";

type Db = typeof DB;
type Stroke = "freestyle" | "backstroke" | "breaststroke" | "butterfly" | "medley";

export type MappedEntity = {
  entityType: string;
  entityId: string;
  action: "created" | "updated" | "matched";
};

/**
 * Get the active season id, creating-by-default fallback if none.
 */
async function activeSeasonId(db: Db): Promise<string> {
  const [active] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.status, "active"))
    .limit(1);
  if (!active) throw new Error("no_active_season");
  return active.id;
}

/**
 * Find a swim_event row by (distance, stroke, gender). Returns null if not found.
 * Gender "any" matches first available.
 */
async function findSwimEvent(
  db: Db,
  distanceM: number,
  stroke: Stroke,
  gender: "male" | "female" | "any"
): Promise<string | null> {
  const rows = await db
    .select()
    .from(swimEvents)
    .where(and(eq(swimEvents.distanceM, distanceM), eq(swimEvents.stroke, stroke)));
  if (rows.length === 0) return null;
  const matched =
    gender === "any"
      ? rows[0]
      : rows.find((r) => r.gender === gender) ?? rows[0];
  return matched.id;
}

/**
 * Find an age category by Greek name (case-insensitive, ignoring extra whitespace).
 */
async function findAgeCategory(
  db: Db,
  seasonId: string,
  nameEl: string
): Promise<string | null> {
  const normalized = nameEl.trim().toLowerCase();
  const cats = await db
    .select()
    .from(ageCategories)
    .where(eq(ageCategories.seasonId, seasonId));
  const match = cats.find((c) => c.nameEl.trim().toLowerCase() === normalized);
  if (match) return match.id;
  // Loose match: substring
  const loose = cats.find(
    (c) =>
      c.nameEl.toLowerCase().includes(normalized) ||
      normalized.includes(c.nameEl.toLowerCase())
  );
  return loose?.id ?? null;
}

// ─── Mappers per item type ─────────────────────────────────────────────────

export async function mapCompetition(db: Db, data: Record<string, unknown>): Promise<MappedEntity> {
  const seasonId = await activeSeasonId(db);
  const name = String(data.name ?? "").trim();
  const startDate = String(data.startDate ?? "").slice(0, 10);
  const endDate = String(data.endDate ?? startDate).slice(0, 10);
  const location = data.location ? String(data.location) : null;
  const venue = data.venue ? String(data.venue) : null;
  const poolType = (data.poolType === "25m" || data.poolType === "50m" ? data.poolType : "unknown") as "25m" | "50m" | "unknown";
  const declStr = data.declarationDeadline ? String(data.declarationDeadline) : null;
  const declarationDeadline = declStr ? new Date(declStr) : null;

  if (!name || !startDate) throw new Error("competition_missing_name_or_date");

  // Dedupe: same name + start date
  const [existing] = await db
    .select()
    .from(competitions)
    .where(and(eq(competitions.name, name), eq(competitions.startDate, startDate)))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(competitions)
      .set({
        endDate,
        location,
        venue,
        poolType,
        declarationDeadline,
        source: "ai_yearbook",
        verificationStatus: "verified",
        updatedAt: new Date(),
      })
      .where(eq(competitions.id, existing.id))
      .returning();
    return { entityType: "competition", entityId: updated.id, action: "updated" };
  }

  const [created] = await db
    .insert(competitions)
    .values({
      seasonId,
      name,
      startDate,
      endDate,
      location,
      venue,
      poolType,
      declarationDeadline,
      source: "ai_yearbook",
      verificationStatus: "verified",
    })
    .returning();
  return { entityType: "competition", entityId: created.id, action: "created" };
}

export async function mapAgeCategory(
  db: Db,
  data: Record<string, unknown>
): Promise<MappedEntity> {
  const seasonId = await activeSeasonId(db);
  const nameEl = String(data.nameEl ?? "").trim();
  const nameEn = String(data.nameEn ?? nameEl);
  const genderScope = (data.genderScope === "male" || data.genderScope === "female" ? data.genderScope : "any") as "male" | "female" | "any";
  const birthYearFrom = typeof data.birthYearFrom === "number" ? data.birthYearFrom : null;
  const birthYearTo = typeof data.birthYearTo === "number" ? data.birthYearTo : null;

  if (!nameEl) throw new Error("category_missing_name");

  // Dedupe: same season + nameEl (case-insensitive)
  const existing = await findAgeCategory(db, seasonId, nameEl);
  if (existing) {
    const [updated] = await db
      .update(ageCategories)
      .set({ nameEn, genderScope, birthYearFrom, birthYearTo })
      .where(eq(ageCategories.id, existing))
      .returning();
    return { entityType: "age_category", entityId: updated.id, action: "updated" };
  }

  const [created] = await db
    .insert(ageCategories)
    .values({ seasonId, nameEl, nameEn, genderScope, birthYearFrom, birthYearTo })
    .returning();
  return { entityType: "age_category", entityId: created.id, action: "created" };
}

export async function mapQualificationStandard(
  db: Db,
  data: Record<string, unknown>
): Promise<MappedEntity> {
  const seasonId = await activeSeasonId(db);
  const distanceM = Number(data.distanceM);
  const stroke = String(data.stroke) as Stroke;
  const categoryName = String(data.categoryName ?? "");
  const gender = String(data.gender) as "male" | "female";
  const timeMs = Number(data.timeMs);

  if (!distanceM || !stroke || !timeMs) throw new Error("standard_missing_fields");

  const swimEventId = await findSwimEvent(db, distanceM, stroke, gender);
  if (!swimEventId) throw new Error(`swim_event_not_found:${distanceM}m_${stroke}_${gender}`);

  const categoryId = categoryName ? await findAgeCategory(db, seasonId, categoryName) : null;

  // Dedupe: same season + event + category + gender
  const [existing] = await db
    .select()
    .from(qualificationStandards)
    .where(
      and(
        eq(qualificationStandards.seasonId, seasonId),
        eq(qualificationStandards.swimEventId, swimEventId),
        eq(qualificationStandards.gender, gender),
        categoryId
          ? eq(qualificationStandards.categoryId, categoryId)
          : drizzleSql`${qualificationStandards.categoryId} IS NULL`
      )
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(qualificationStandards)
      .set({ timeMs, verificationStatus: "verified" })
      .where(eq(qualificationStandards.id, existing.id))
      .returning();
    return { entityType: "qualification_standard", entityId: updated.id, action: "updated" };
  }

  const [created] = await db
    .insert(qualificationStandards)
    .values({
      seasonId,
      standardType: "domestic_qualification",
      categoryId,
      gender,
      swimEventId,
      timeMs,
      verificationStatus: "verified",
    })
    .returning();
  return { entityType: "qualification_standard", entityId: created.id, action: "created" };
}

/**
 * Naive name normalization: lowercase, trim, collapse spaces.
 * Handles Greek/Latin without transliteration (good enough for exact-or-substring match).
 */
function normalizeName(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Match an athlete by full name. Returns athleteId + confidence.
 *  - exact full-name match  → 100
 *  - reversed (last first)  → 95
 *  - substring match        → 80
 *  - first-name only match  → 60
 *  - no match               → null
 */
export async function matchAthleteByName(
  db: Db,
  fullName: string
): Promise<{ athleteId: string | null; confidence: number; reason: string }> {
  const normalized = normalizeName(fullName);
  if (!normalized) return { athleteId: null, confidence: 0, reason: "empty" };

  const all = await db.select().from(athletes);
  const indexed = all.map((a) => ({
    a,
    fullNorm: normalizeName(`${a.firstName} ${a.lastName}`),
    revNorm: normalizeName(`${a.lastName} ${a.firstName}`),
  }));

  const exact = indexed.find((i) => i.fullNorm === normalized);
  if (exact) return { athleteId: exact.a.id, confidence: 100, reason: "exact" };

  const reversed = indexed.find((i) => i.revNorm === normalized);
  if (reversed) return { athleteId: reversed.a.id, confidence: 95, reason: "reversed_order" };

  const substring = indexed.find(
    (i) => i.fullNorm.includes(normalized) || normalized.includes(i.fullNorm)
  );
  if (substring) return { athleteId: substring.a.id, confidence: 80, reason: "substring" };

  // First-name + last-initial heuristic
  const parts = normalized.split(" ");
  if (parts.length >= 2) {
    const candidate = indexed.find((i) => {
      const firstMatch = normalizeName(i.a.firstName) === parts[0];
      const lastInit = normalizeName(i.a.lastName).startsWith(parts[parts.length - 1].charAt(0));
      return firstMatch && lastInit;
    });
    if (candidate) return { athleteId: candidate.a.id, confidence: 60, reason: "first_lastinit" };
  }

  return { athleteId: null, confidence: 0, reason: "no_match" };
}

export async function mapResult(
  db: Db,
  data: Record<string, unknown>,
  fallbackCompetitionId: string | null
): Promise<MappedEntity> {
  const athleteName = String(data.athleteName ?? "");
  const distanceM = Number(data.distanceM);
  const stroke = String(data.stroke) as Stroke;
  const timeMs = Number(data.timeMs);
  const rank = data.rank == null ? null : Number(data.rank);
  const round = (data.round === "heat" || data.round === "final" || data.round === "direct_final"
    ? data.round
    : "unknown") as "heat" | "final" | "direct_final" | "unknown";
  const gender = (data.gender === "male" || data.gender === "female" ? data.gender : "any") as
    | "male"
    | "female"
    | "any";

  if (!athleteName || !distanceM || !stroke || !timeMs) {
    throw new Error("result_missing_fields");
  }
  if (!fallbackCompetitionId) {
    throw new Error("result_missing_competition_context");
  }

  const match = await matchAthleteByName(db, athleteName);
  if (!match.athleteId) {
    throw new Error(`athlete_not_matched:${athleteName}`);
  }

  const swimEventId = await findSwimEvent(db, distanceM, stroke, gender);
  if (!swimEventId) throw new Error(`swim_event_not_found:${distanceM}m_${stroke}_${gender}`);

  const [created] = await db
    .insert(competitionResults)
    .values({
      athleteId: match.athleteId,
      competitionId: fallbackCompetitionId,
      swimEventId,
      resultTimeMs: timeMs,
      rank,
      roundType: round,
      poolType: "unknown",
      source: "ai_pdf",
      verificationStatus: "verified",
    })
    .returning();

  logger.info(
    { athleteName, matchedAthleteId: match.athleteId, matchConfidence: match.confidence, matchReason: match.reason },
    "ai_result_mapped"
  );

  return { entityType: "competition_result", entityId: created.id, action: "created" };
}

/**
 * Router: dispatch to the right mapper based on itemType.
 */
export async function mapApprovedItem(
  db: Db,
  itemType: string,
  data: Record<string, unknown>,
  extractionContext: { competitionId?: string | null } = {}
): Promise<MappedEntity> {
  switch (itemType) {
    case "competition":
      return mapCompetition(db, data);
    case "age_category":
      return mapAgeCategory(db, data);
    case "qualification_standard":
      return mapQualificationStandard(db, data);
    case "result":
      return mapResult(db, data, extractionContext.competitionId ?? null);
    default:
      throw new Error(`unsupported_item_type:${itemType}`);
  }
}
