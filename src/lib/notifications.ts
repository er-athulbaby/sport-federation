import { pool } from "./db";
import { sendEmail } from "./mailer";

const SIX_MONTHS_DAYS = 183;

export async function checkPassportExpiries(): Promise<{ created: number }> {
  let created = 0;

  const athletes = await pool.query(
    `SELECT a.id, a.full_name_en, a.passport_expiry_date, a.federation_id, f.email AS federation_email
     FROM athletes a
     JOIN federations f ON f.id = a.federation_id
     WHERE a.passport_expiry_date <= (CURRENT_DATE + $1::int)
       AND a.passport_expiry_date >= CURRENT_DATE
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.related_athlete_id = a.id AND n.type = 'passport_expiry'
           AND n.message LIKE '%' || a.passport_expiry_date || '%'
       )`,
    [SIX_MONTHS_DAYS]
  );

  const officials = await pool.query(
    `SELECT o.id, o.full_name_en, o.passport_expiry_date, o.federation_id, f.email AS federation_email
     FROM officials o
     JOIN federations f ON f.id = o.federation_id
     WHERE o.passport_expiry_date <= (CURRENT_DATE + $1::int)
       AND o.passport_expiry_date >= CURRENT_DATE
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.related_official_id = o.id AND n.type = 'passport_expiry'
           AND n.message LIKE '%' || o.passport_expiry_date || '%'
       )`,
    [SIX_MONTHS_DAYS]
  );

  for (const row of athletes.rows) {
    const message = `Athlete ${row.full_name_en}'s passport expires on ${new Date(row.passport_expiry_date).toLocaleDateString()}.`;
    await pool.query(
      `INSERT INTO notifications (federation_id, type, title, message, related_athlete_id, channel, sent_at)
       VALUES ($1, 'passport_expiry', 'Passport expiring soon', $2, $3, 'both', now())`,
      [row.federation_id, message, row.id]
    );
    await sendEmail(row.federation_email, "Passport expiring soon", message);
    created++;
  }

  for (const row of officials.rows) {
    const message = `Official ${row.full_name_en}'s passport expires on ${new Date(row.passport_expiry_date).toLocaleDateString()}.`;
    await pool.query(
      `INSERT INTO notifications (federation_id, type, title, message, related_official_id, channel, sent_at)
       VALUES ($1, 'passport_expiry', 'Passport expiring soon', $2, $3, 'both', now())`,
      [row.federation_id, message, row.id]
    );
    await sendEmail(row.federation_email, "Passport expiring soon", message);
    created++;
  }

  return { created };
}
