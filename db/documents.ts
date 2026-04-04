import { pool } from './database';
import { SYSTEM_DOCS } from './seed/system-docs';

export interface Document {
  id: string;
  title: string;
  category: string;
  content: string;
  summary: string[];
  tags: string[];
  createdAt: string;
  reviewStatus: string;
  lastReviewAt: string | null;
  lastReviewResult: string | null;
  imageUrl: string | null;
  isSystem: number;
  systemVersion: string | null;
  systemKey: string | null;
}

export async function getAllDocuments(): Promise<Document[]> {
  const { rows } = await pool.query('SELECT * FROM documents ORDER BY "createdAt" DESC');
  return rows;
}

export async function createDocument(doc: Partial<Document>): Promise<Document> {
  const { rows } = await pool.query(
    `INSERT INTO documents
      (id, title, category, content, summary, tags, "createdAt", "reviewStatus",
       "lastReviewAt", "lastReviewResult", "imageUrl", "isSystem", "systemVersion", "systemKey")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      doc.id, doc.title ?? '', doc.category ?? '', doc.content ?? '',
      JSON.stringify(doc.summary ?? []), JSON.stringify(doc.tags ?? []),
      doc.createdAt ?? '', doc.reviewStatus ?? 'learning',
      doc.lastReviewAt ?? null, doc.lastReviewResult ?? null,
      doc.imageUrl ?? null, 0, null, null,
    ]
  );
  return rows[0];
}

export async function updateDocument(id: string, updates: Partial<Document>): Promise<Document | null> {
  const { rows: existing } = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
  if (!existing.length) return null;

  const doc = { ...existing[0], ...updates };
  const { rows } = await pool.query(
    `UPDATE documents SET
      title=$2, category=$3, content=$4, summary=$5, tags=$6,
      "createdAt"=$7, "reviewStatus"=$8, "lastReviewAt"=$9,
      "lastReviewResult"=$10, "imageUrl"=$11
     WHERE id=$1 RETURNING *`,
    [
      id, doc.title, doc.category, doc.content,
      JSON.stringify(Array.isArray(doc.summary) ? doc.summary : JSON.parse(doc.summary ?? '[]')),
      JSON.stringify(Array.isArray(doc.tags) ? doc.tags : JSON.parse(doc.tags ?? '[]')),
      doc.createdAt, doc.reviewStatus, doc.lastReviewAt,
      doc.lastReviewResult, doc.imageUrl,
    ]
  );
  return rows[0];
}

export async function syncSystemDocs(): Promise<void> {
  for (const doc of SYSTEM_DOCS) {
    const { rows } = await pool.query(
      'SELECT id, "systemVersion" FROM documents WHERE "systemKey" = $1 AND "isSystem" = 1',
      [doc.systemKey]
    );
    if (!rows.length) {
      await pool.query(
        `INSERT INTO documents
          (id, title, category, content, summary, tags, "createdAt", "reviewStatus",
           "lastReviewAt", "lastReviewResult", "imageUrl", "isSystem", "systemVersion", "systemKey")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULL,NULL,$9,1,$10,$11)
         ON CONFLICT (id) DO NOTHING`,
        [
          `sys-${doc.systemKey}`, doc.title, doc.category, doc.content,
          JSON.stringify(doc.summary), JSON.stringify(doc.tags),
          new Date().toISOString().split('T')[0],
          'learning', doc.imageUrl ?? null,
          doc.systemVersion, doc.systemKey,
        ]
      );
    } else if (rows[0].systemVersion !== doc.systemVersion) {
      await pool.query(
        `UPDATE documents SET
          title=$2, category=$3, content=$4, summary=$5, tags=$6,
          "imageUrl"=$7, "systemVersion"=$8
         WHERE "systemKey"=$1 AND "isSystem"=1`,
        [
          doc.systemKey, doc.title, doc.category, doc.content,
          JSON.stringify(doc.summary), JSON.stringify(doc.tags),
          doc.imageUrl ?? null, doc.systemVersion,
        ]
      );
    }
  }
}
