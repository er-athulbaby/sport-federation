import { pool } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

// No permission check — also used as a lookup by the Games setup flow (event
// names/genders per sport for quota configuration).
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const sports = await pool.query(
    `SELECT id, name, icon_url, created_at FROM sports ORDER BY name ASC`
  );
  const events = await pool.query(
    `SELECT id, sport_id, name, gender, created_at FROM events ORDER BY name ASC`
  );

  const withEvents = sports.rows.map((sport) => ({
    ...sport,
    events: events.rows.filter((e) => e.sport_id === sport.id),
  }));

  return NextResponse.json(withEvents);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin({ resource: "sports_events", action: "edit" });
  if (error) return error;

  const { name, icon_url } = await request.json();
  if (!name) return errorResponse("name is required");

  const result = await pool.query(
    `INSERT INTO sports (name, icon_url) VALUES ($1, $2) RETURNING id, name, icon_url, created_at`,
    [name, icon_url ?? null]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
