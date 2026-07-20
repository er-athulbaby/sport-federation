import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { pool } from "@/lib/db";

function formatDate(value: unknown): string {
  if (!value) return "?";
  return new Date(value as string | Date).toLocaleDateString();
}

export default async function FederationGamesPage() {
  const session = await auth();
  if (!session?.user.federationId) redirect("/login");

  const result = await pool.query(
    `SELECT gf.id AS game_federation_id, g.name, g.start_date, g.end_date, g.status,
            gf.is_participating, gf.phase1_confirmed_at
     FROM game_federations gf
     JOIN games g ON g.id = gf.game_id
     WHERE gf.federation_id = $1
     ORDER BY g.created_at DESC`,
    [session.user.federationId]
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Games</h1>
      <div className="flex flex-col gap-3">
        {result.rows.map((game) => (
          <Link
            key={game.game_federation_id}
            href={`/federation/games/${game.game_federation_id}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{game.name}</p>
              <p className="text-xs text-slate-500">
                {formatDate(game.start_date)} &ndash; {formatDate(game.end_date)}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {game.phase1_confirmed_at ? (game.is_participating ? "Participating" : "Declined") : "Awaiting response"}
            </span>
          </Link>
        ))}
        {result.rows.length === 0 && (
          <p className="text-sm text-slate-400">No games have been assigned to your federation yet.</p>
        )}
      </div>
    </div>
  );
}
