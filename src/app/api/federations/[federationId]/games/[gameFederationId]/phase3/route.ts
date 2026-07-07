import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ federationId: string; gameFederationId: string }> }
) {
  const { federationId, gameFederationId } = await params;
  const { error } = await requireFederationAccess(federationId);
  if (error) return error;

  const gfCheck = await pool.query(
    `SELECT id FROM game_federations WHERE id = $1 AND federation_id = $2`,
    [gameFederationId, federationId]
  );
  if (gfCheck.rows.length === 0) return errorResponse("Not found", 404);

  const sports = await pool.query(
    `SELECT gfs.sport_id, s.name AS sport_name, gfs.age_cutoff_date
     FROM game_federation_sports gfs
     JOIN sports s ON s.id = gfs.sport_id
     WHERE gfs.game_federation_id = $1
     ORDER BY s.name ASC`,
    [gameFederationId]
  );

  const entries = await pool.query(
    `SELECT dll.id AS entry_id, dll.sport_id, dll.participant_type, dll.athlete_id, dll.official_id,
            a.full_name_en AS athlete_name, a.photo_url AS athlete_photo, a.dob AS athlete_dob,
            a.tshirt_size AS athlete_tshirt, a.suit_size AS athlete_suit, a.passport_number AS athlete_passport,
            o.full_name_en AS official_name, o.photo_url AS official_photo, o.dob AS official_dob,
            o.designation, o.contact_number, o.email,
            o.tshirt_size AS official_tshirt, o.suit_size AS official_suit, o.passport_number AS official_passport
     FROM delegation_long_list dll
     LEFT JOIN athletes a ON a.id = dll.athlete_id
     LEFT JOIN officials o ON o.id = dll.official_id
     WHERE dll.game_federation_id = $1
     ORDER BY dll.added_at ASC`,
    [gameFederationId]
  );

  return NextResponse.json({ sports: sports.rows, entries: entries.rows });
}
