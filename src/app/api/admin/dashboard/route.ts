import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [federations, sports, events, games, athletes, officials, athletesByGender] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM federations"),
    pool.query("SELECT COUNT(*)::int AS count FROM sports"),
    pool.query("SELECT COUNT(*)::int AS count FROM events"),
    pool.query("SELECT COUNT(*)::int AS count FROM games"),
    pool.query("SELECT COUNT(*)::int AS count FROM athletes"),
    pool.query("SELECT COUNT(*)::int AS count FROM officials"),
    pool.query("SELECT gender, COUNT(*)::int AS count FROM athletes GROUP BY gender"),
  ]);

  const byGender = { male: 0, female: 0 };
  for (const row of athletesByGender.rows) {
    if (row.gender === "male") byGender.male = row.count;
    if (row.gender === "female") byGender.female = row.count;
  }

  return NextResponse.json({
    federations: federations.rows[0].count,
    sports: sports.rows[0].count,
    events: events.rows[0].count,
    games: games.rows[0].count,
    athletes: athletes.rows[0].count,
    officials: officials.rows[0].count,
    athletesByGender: byGender,
  });
}
