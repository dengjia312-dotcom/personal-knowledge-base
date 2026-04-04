import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL 环境变量未设置');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 初始化建表（幂等，IF NOT EXISTS）
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      summary JSONB NOT NULL DEFAULT '[]',
      tags JSONB NOT NULL DEFAULT '[]',
      "createdAt" TEXT NOT NULL DEFAULT '',
      "reviewStatus" TEXT NOT NULL DEFAULT 'learning',
      "lastReviewAt" TEXT,
      "lastReviewResult" TEXT,
      "imageUrl" TEXT,
      "isSystem" INTEGER NOT NULL DEFAULT 0,
      "systemVersion" TEXT,
      "systemKey" TEXT
    );

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      nickname TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      avatar TEXT NOT NULL DEFAULT '',
      CONSTRAINT profile_single_row CHECK (id = 1)
    );

    CREATE TABLE IF NOT EXISTS insights (
      "docId" TEXT PRIMARY KEY,
      content TEXT NOT NULL DEFAULT ''
    );
  `);

  // 默认 profile（首次安装）
  await pool.query(`
    INSERT INTO profile (id, nickname, email, bio, avatar)
    VALUES (1, 'Alex Chen', 'alex.chen@example.com', '终身学习者，专注于认知科学与效率工具。', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBPgMpkSnbw4TBCO9cuKafHJHQwPk85aXUQEJZOhlXTUDmBC1jpO_r2bRoHJvScybyG6M9rREK7MIYFIPQGoSdSBsBKP23sC631XVJcLG0X0hApRaguRNAWP6RfxgY28dZK31h7dytWdqAwHSfDHqy5LYay8LDmDbJyfKn24vo5xgQYawvwPTHTLqtfHrw_03G3AxbuZqxuhsOzn_LeG9oM6jiFJQnZp9CGAtEQEn9LxnPJemfFtBvmhmy-3gWFLbJkPdZj8601gk')
    ON CONFLICT (id) DO NOTHING;
  `);
}
