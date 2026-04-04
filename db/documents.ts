import { db } from './database';

export interface DocRow {
  id: string;
  title: string;
  category: string;
  content: string;
  summary: string;
  tags: string;
  createdAt: string;
  reviewStatus: string;
  lastReviewAt: string | null;
  lastReviewResult: string | null;
  imageUrl: string | null;
}

function deserialize(row: DocRow) {
  return {
    ...row,
    summary: JSON.parse(row.summary),
    tags: JSON.parse(row.tags),
  };
}

export function getAllDocuments() {
  const rows = db.prepare('SELECT * FROM documents ORDER BY createdAt DESC').all() as DocRow[];
  return rows.map(deserialize);
}

export function createDocument(doc: ReturnType<typeof deserialize>) {
  db.prepare(`
    INSERT INTO documents (id, title, category, content, summary, tags, createdAt, reviewStatus, lastReviewAt, lastReviewResult, imageUrl, isSystem, systemVersion, systemKey)
    VALUES (@id, @title, @category, @content, @summary, @tags, @createdAt, @reviewStatus, @lastReviewAt, @lastReviewResult, @imageUrl, @isSystem, @systemVersion, @systemKey)
  `).run({
    lastReviewAt: null,
    lastReviewResult: null,
    imageUrl: null,
    ...doc,
    summary: JSON.stringify(doc.summary),
    tags: JSON.stringify(doc.tags),
    isSystem: 0,
    systemVersion: null,
    systemKey: null,
  });
  return doc;
}

export function updateDocument(id: string, updates: Partial<ReturnType<typeof deserialize>>) {
  const existing = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as DocRow | undefined;
  if (!existing) return null;

  const merged = {
    ...existing,
    ...updates,
    summary: updates.summary !== undefined ? JSON.stringify(updates.summary) : existing.summary,
    tags: updates.tags !== undefined ? JSON.stringify(updates.tags) : existing.tags,
  };

  db.prepare(`
    UPDATE documents SET
      title = @title,
      category = @category,
      content = @content,
      summary = @summary,
      tags = @tags,
      createdAt = @createdAt,
      reviewStatus = @reviewStatus,
      lastReviewAt = @lastReviewAt,
      lastReviewResult = @lastReviewResult,
      imageUrl = @imageUrl
    WHERE id = @id
  `).run(merged);

  return deserialize(merged as DocRow);
}
