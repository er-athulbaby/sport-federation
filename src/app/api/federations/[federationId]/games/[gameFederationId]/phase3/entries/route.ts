import { pool } from "@/lib/db";
import { requireFederationAccess, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ federationId: string; gameFederationId: string }> }
) {
  const { federationId, gameFederationId } = await params;
  const { error } = await requireFederationAccess(federationId);
  if (error) return error;

  const { sport_id, participant_type, athlete_id, official_id } = await request.json();

  if (!sport_id || !["athlete", "official"].includes(participant_type)) {
    return errorResponse("sport_id and a valid participant_type (athlete|official) are required");
  }
  if (participant_type === "athlete" && !athlete_id) return errorResponse("athlete_id is required");
  if (participant_type === "official" && !official_id) return errorResponse("official_id is required");

  // Confirm the sport is actually part of this game_federation, and fetch the age cutoff.
  const sportCheck = await pool.query(
    `SELECT age_cutoff_date FROM game_federation_sports
     WHERE game_federation_id = $1 AND sport_id = $2`,
    [gameFederationId, sport_id]
  );
  if (sportCheck.rows.length === 0) {
    return errorResponse("This sport has not been set up for this federation in this game", 422);
  }

  if (participant_type === "athlete") {
    const ageCutoff = sportCheck.rows[0].age_cutoff_date;
    const athlete = await pool.query(
      `SELECT dob FROM athletes WHERE id = $1 AND federation_id = $2`,
      [athlete_id, federationId]
    );
    if (athlete.rows.length === 0) return errorResponse("Athlete not found", 404);

    if (ageCutoff && athlete.rows[0].dob && new Date(athlete.rows[0].dob) > new Date(ageCutoff)) {
      return errorResponse(
        `This athlete does not meet the age eligibility cutoff (must be born on or before ${new Date(ageCutoff).toLocaleDateString()})`,
        422
      );
    }
  } else {
    const official = await pool.query(
      `SELECT id FROM officials WHERE id = $1 AND federation_id = $2`,
      [official_id, federationId]
    );
    if (official.rows.length === 0) return errorResponse("Official not found", 404);
  }

  const result = await pool.query(
    `INSERT INTO delegation_long_list (game_federation_id, sport_id, participant_type, athlete_id, official_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id AS entry_id, sport_id, participant_type, athlete_id, official_id`,
    [gameFederationId, sport_id, participant_type, athlete_id ?? null, official_id ?? null]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
