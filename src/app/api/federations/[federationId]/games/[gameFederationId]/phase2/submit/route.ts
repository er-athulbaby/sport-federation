import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import { buildEntryByEventHtml } from "@/lib/documents";
import { saveGeneratedDocument, generateReferenceCode } from "@/lib/pdf";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ federationId: string; gameFederationId: string }> }
) {
  const { federationId, gameFederationId } = await params;
  const { error } = await requireFederationAccess(federationId);
  if (error) return error;

  const gfResult = await pool.query(
    `SELECT gf.id, gf.phase1_confirmed_at, gf.is_participating, g.id AS game_id, g.name AS game_name,
            g.logo_url AS game_logo_url, g.phase2_enabled, f.name AS federation_name, f.logo_url AS federation_logo_url
     FROM game_federations gf
     JOIN games g ON g.id = gf.game_id
     JOIN federations f ON f.id = gf.federation_id
     WHERE gf.id = $1 AND gf.federation_id = $2`,
    [gameFederationId, federationId]
  );
  if (gfResult.rows.length === 0) return errorResponse("Not found", 404);
  const gf = gfResult.rows[0];

  if (!gf.phase2_enabled) return errorResponse("Phase 2 is not enabled for this game", 422);
  if (!gf.phase1_confirmed_at || !gf.is_participating) {
    return errorResponse("Phase 1 must be confirmed (participating) before Phase 2 can be submitted", 422);
  }

  const sports = await pool.query(
    `SELECT gfs.id AS game_federation_sport_id, s.name AS sport_name,
            gfs.entry_policy_note, gfs.age_cutoff_date
     FROM game_federation_sports gfs
     JOIN sports s ON s.id = gfs.sport_id
     WHERE gfs.game_federation_id = $1
     ORDER BY s.name ASC`,
    [gameFederationId]
  );

  if (sports.rows.length === 0) {
    return errorResponse("No sports/events have been set up for this federation in this game yet", 422);
  }

  const generatedDocs = [];

  for (const sport of sports.rows) {
    const events = await pool.query(
      `SELECT e.name, e.gender, ge.max_male, ge.max_female, ge.declared_male, ge.declared_female
       FROM game_events ge
       JOIN events e ON e.id = ge.event_id
       WHERE ge.game_federation_sport_id = $1
       ORDER BY e.name ASC`,
      [sport.game_federation_sport_id]
    );

    const referenceCode = generateReferenceCode();
    const html = buildEntryByEventHtml({
      gameName: gf.game_name,
      gameLogoUrl: gf.game_logo_url,
      federationName: gf.federation_name,
      federationLogoUrl: gf.federation_logo_url,
      sportName: sport.sport_name,
      rows: events.rows.map((e) => ({
        eventName: e.name,
        gender: e.gender,
        maxMale: e.max_male,
        maxFemale: e.max_female,
        declaredMale: e.declared_male,
        declaredFemale: e.declared_female,
      })),
      entryPolicyNote: sport.entry_policy_note,
      ageCutoffDate: sport.age_cutoff_date,
      referenceCode,
    });

    const doc = await saveGeneratedDocument(gf.game_id, Number(federationId), 2, referenceCode, html);
    generatedDocs.push({ sportName: sport.sport_name, ...doc });
  }

  await pool.query(
    `UPDATE game_federations SET phase2_completed_at = now() WHERE id = $1`,
    [gameFederationId]
  );

  return NextResponse.json({ documents: generatedDocs });
}
