import Database from 'better-sqlite3';
import path from 'path';
import { SYSTEM_DOCS } from './seed/system-docs';

const DB_PATH = path.join(process.cwd(), 'data.db');

export const db = new Database(DB_PATH);

// 开启 WAL 模式
db.pragma('journal_mode = WAL');

// 建表（含新字段，适用于全新安装）
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '[]',
    tags TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL DEFAULT '',
    reviewStatus TEXT NOT NULL DEFAULT 'learning',
    lastReviewAt TEXT,
    lastReviewResult TEXT,
    imageUrl TEXT,
    isSystem INTEGER NOT NULL DEFAULT 0,
    systemVersion TEXT,
    systemKey TEXT
  );

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    nickname TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    avatar TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS insights (
    docId TEXT PRIMARY KEY,
    content TEXT NOT NULL DEFAULT ''
  );
`);

// 为已有数据库添加新字段（已存在时 SQLite 会报错，catch 忽略即可）
for (const sql of [
  'ALTER TABLE documents ADD COLUMN isSystem INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE documents ADD COLUMN systemVersion TEXT',
  'ALTER TABLE documents ADD COLUMN systemKey TEXT',
]) {
  try { db.exec(sql); } catch {}
}

// 同步系统文档
function syncSystemDocs() {
  const selectByKey = db.prepare('SELECT id, systemVersion FROM documents WHERE systemKey = ? AND isSystem = 1');

  const insert = db.prepare(`
    INSERT INTO documents
      (id, title, category, content, summary, tags, createdAt, reviewStatus,
       lastReviewAt, lastReviewResult, imageUrl, isSystem, systemVersion, systemKey)
    VALUES
      (@id, @title, @category, @content, @summary, @tags, @createdAt, @reviewStatus,
       @lastReviewAt, @lastReviewResult, @imageUrl, @isSystem, @systemVersion, @systemKey)
  `);

  const update = db.prepare(`
    UPDATE documents SET
      title = @title,
      category = @category,
      content = @content,
      summary = @summary,
      tags = @tags,
      imageUrl = @imageUrl,
      systemVersion = @systemVersion
    WHERE systemKey = @systemKey AND isSystem = 1
  `);

  const sync = db.transaction(() => {
    for (const doc of SYSTEM_DOCS) {
      const existing = selectByKey.get(doc.systemKey) as { id: string; systemVersion: string } | undefined;

      if (!existing) {
        // 情况 1：不存在 → INSERT
        insert.run({
          id: `sys-${doc.systemKey}`,
          title: doc.title,
          category: doc.category,
          content: doc.content,
          summary: JSON.stringify(doc.summary),
          tags: JSON.stringify(doc.tags),
          createdAt: new Date().toISOString().split('T')[0],
          reviewStatus: 'learning',
          lastReviewAt: null,
          lastReviewResult: null,
          imageUrl: doc.imageUrl ?? null,
          isSystem: 1,
          systemVersion: doc.systemVersion,
          systemKey: doc.systemKey,
        });
      } else if (existing.systemVersion !== doc.systemVersion) {
        // 情况 2：版本不同 → 只更新内容字段，保留用户交互字段
        update.run({
          title: doc.title,
          category: doc.category,
          content: doc.content,
          summary: JSON.stringify(doc.summary),
          tags: JSON.stringify(doc.tags),
          imageUrl: doc.imageUrl ?? null,
          systemVersion: doc.systemVersion,
          systemKey: doc.systemKey,
        });
      }
      // 情况 3：版本相同 → 跳过，不做任何操作
    }
  });

  sync();
}

syncSystemDocs();

// 默认 profile（首次安装）
const profileCount = (db.prepare('SELECT COUNT(*) as n FROM profile').get() as { n: number }).n;
if (profileCount === 0) {
  db.prepare(`
    INSERT INTO profile (id, nickname, email, bio, avatar)
    VALUES (1, 'Alex Chen', 'alex.chen@example.com', '终身学习者，专注于认知科学与效率工具。',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCBPgMpkSnbw4TBCO9cuKafHJHQwPk85aXUQEJZOhlXTUDmBC1jpO_r2bRoHJvScybyG6M9rREK7MIYFIPQGoSdSBsBKP23sC631XVJcLG0X0hApRaguRNAWP6RfxgY28dZK31h7dytWdqAwHSfDHqy5LYay8LDmDbJyfKn24vo5xgQYawvwPTHTLqtfHrw_03G3AxbuZqxuhsOzn_LeG9oM6jiFJQnZp9CGAtEQEn9LxnPJemfFtBvmhmy-3gWFLbJkPdZj8601gk')
  `).run();
}
