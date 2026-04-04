import { pool } from './database';

export async function getInsight(docId: string): Promise<string> {
  const { rows } = await pool.query('SELECT content FROM insights WHERE "docId" = $1', [docId]);
  return rows[0]?.content ?? '';
}

export async function upsertInsight(docId: string, content: string): Promise<void> {
  await pool.query(
    `INSERT INTO insights ("docId", content) VALUES ($1, $2)
     ON CONFLICT ("docId") DO UPDATE SET content = EXCLUDED.content`,
    [docId, content ?? '']
  );
}
