import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

async function main() {
  const [name, email, username, password] = process.argv.slice(2);

  if (!name || !email || !username || !password) {
    console.error(
      "Usage: npx tsx scripts/seed-admin.ts \"Full Name\" email@example.com username password"
    );
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO admins (name, email, username, password_hash)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [name, email, username, passwordHash]
  );

  console.log(`Admin "${username}" created/updated.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
