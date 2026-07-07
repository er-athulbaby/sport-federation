import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import { buildDelegationListHtml, DelegationPerson } from "@/lib/documents";
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
    `SELECT gf.id, gf.phase1_confirmed_at, gf.is_participating, gf.phase2_completed_at,
            g.id AS game_id, g.name AS game_name, g.logo_url AS game_logo_url,
            g.phase2_enabled, g.phase3_enabled,
            f.name AS federation_name, f.logo_url AS federation_logo_url
     FROM game_federations gf
     JOIN games g ON g.id = gf.game_id
     JOIN federations f ON f.id = gf.federation_id
     WHERE gf.id = $1 AND gf.federation_id = $2`,
    [gameFederationId, federationId]
  );
  if (gfResult.rows.length === 0) return errorResponse("Not found", 404);
  const gf = gfResult.rows[0];

  if (!gf.phase3_enabled) return errorResponse("Phase 3 is not enabled for this game", 422);
  if (!gf.phase1_confirmed_at || !gf.is_participating) {
    return errorResponse("Phase 1 must be confirmed (participating) first", 422);
  }
  if (gf.phase2_enabled && !gf.phase2_completed_at) {
    return errorResponse("Phase 2 must be submitted before Phase 3", 422);
  }

  const entries = await pool.query(
    `SELECT dll.participant_type, dll.sport_id, s.name AS sport_name,
            a.full_name_en AS athlete_name, a.photo_url AS athlete_photo, a.dob AS athlete_dob,
            a.tshirt_size AS athlete_tshirt, a.suit_size AS athlete_suit, a.passport_number AS athlete_passport,
            o.full_name_en AS official_name, o.photo_url AS official_photo, o.dob AS official_dob,
            o.designation, o.contact_number, o.email,
            o.tshirt_size AS official_tshirt, o.suit_size AS official_suit, o.passport_number AS official_passport
     FROM delegation_long_list dll
     JOIN sports s ON s.id = dll.sport_id
     LEFT JOIN athletes a ON a.id = dll.athlete_id
     LEFT JOIN officials o ON o.id = dll.official_id
     WHERE dll.game_federation_id = $1
     ORDER BY dll.added_at ASC`,
    [gameFederationId]
  );

  if (entries.rows.length === 0) {
    return errorResponse("Add at least one athlete or official to the long list before submitting", 422);
  }

  const athletes: DelegationPerson[] = entries.rows
    .filter((r) => r.participant_type === "athlete")
    .map((r) => ({
      photoUrl: r.athlete_photo, nameEn: r.athlete_name, sportOrPosition: r.sport_name,
      eventOrContact: "na", dob: r.athlete_dob, tshirtSize: r.athlete_tshirt, suitSize: r.athlete_suit,
      hasPassport: Boolean(r.athlete_passport),
    }));

  const officials: DelegationPerson[] = entries.rows
    .filter((r) => r.participant_type === "official")
    .map((r) => ({
      photoUrl: r.official_photo, nameEn: r.official_name, sportOrPosition: r.designation ?? "-",
      eventOrContact: r.contact_number ?? "-", dob: r.official_dob, contact: r.contact_number, email: r.email,
      tshirtSize: r.official_tshirt, suitSize: r.official_suit, hasPassport: Boolean(r.official_passport),
    }));

  const referenceCode = generateReferenceCode();
  const html = buildDelegationListHtml({
    phase: "Long List",
    gameName: gf.game_name,
    gameLogoUrl: gf.game_logo_url,
    federationName: gf.federation_name,
    federationLogoUrl: gf.federation_logo_url,
    athletes,
    officials,
    referenceCode,
  });

  const doc = await saveGeneratedDocument(gf.game_id, Number(federationId), 3, referenceCode, html);

  await pool.query(`UPDATE game_federations SET phase3_completed_at = now() WHERE id = $1`, [gameFederationId]);

  return NextResponse.json({ document: doc });
}
