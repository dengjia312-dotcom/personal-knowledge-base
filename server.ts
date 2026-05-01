import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";
import { initDb } from "./db/database";
import { getAllDocuments, createDocument, updateDocument, syncSystemDocs } from "./db/documents";
import { getProfile, updateProfile } from "./db/profile";
import { getInsight, upsertInsight } from "./db/insights";

function cleanJsonText(value: string): string {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) return fenced[1].trim();

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1).trim();
  }

  return trimmed;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? '').replace(/^#+/, '').trim())
    .filter(Boolean);
}

function readModelEnv(name: string): string {
  const value = process.env[name];
  return value ? value.replace(/^"|"$/g, '').trim() : '';
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // CORS
  app.use((req, res, next) => {
    const allowed = process.env.ALLOWED_ORIGIN || '*';
    res.setHeader('Access-Control-Allow-Origin', allowed);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  app.use(express.json());

  // Health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Documents
  app.get("/api/documents", async (req, res) => {
    try {
      res.json(await getAllDocuments());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      res.status(201).json(await createDocument(req.body));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/documents/:id", async (req, res) => {
    try {
      const updated = await updateDocument(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Document not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Profile
  app.get("/api/profile", async (req, res) => {
    try {
      res.json(await getProfile());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/profile", async (req, res) => {
    try {
      res.json(await updateProfile(req.body));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Insights
  app.get("/api/insights/:docId", async (req, res) => {
    try {
      res.json({ content: await getInsight(req.params.docId) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/insights/:docId", async (req, res) => {
    try {
      await upsertInsight(req.params.docId, req.body.content);
      res.json({ content: req.body.content ?? '' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // AI 自动整理预览：只生成草稿，不写入数据库
  app.post("/api/ingest/preview", async (req, res) => {
    try {
      const { rawText, sourceTitle, sourceUrl } = req.body;
      if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 50) {
        return res.status(400).json({ error: "请至少输入 50 字以上内容" });
      }

      const modelApiKey = readModelEnv('MODEL_API_KEY');
      const modelBaseUrl = readModelEnv('MODEL_BASE_URL');
      const modelName = readModelEnv('MODEL_NAME');

      if (!modelApiKey || !modelBaseUrl || !modelName) {
        return res.status(500).json({ error: "AI 模型环境变量未配置" });
      }

      const userPrompt = [
        "请把下面的原始内容整理成 LumenKB 知识草稿。",
        "只返回 JSON 对象，不要 Markdown，不要代码块，不要解释。",
        "JSON 格式必须是：",
        `{
  "title": "string",
  "category": "string",
  "tags": ["string"],
  "summary": ["string"],
  "content": "string",
  "reviewStatus": "learning"
}`,
        "分类必须优先从这些里面选：工作、技术、认知科学、学习方法、阅读、设计、未分类。",
        "标签生成 3 到 6 个，简短，不带 #，不要太泛。",
        "摘要生成 2 到 4 条，每条一句话，适合复习。",
        "content 是清洗后的正文草稿，保留用户原始内容核心信息，不要大幅编造。",
        "reviewStatus 固定为 learning。",
        sourceTitle ? `来源标题：${sourceTitle}` : "",
        sourceUrl ? `来源链接：${sourceUrl}` : "",
        `原始内容：\n${rawText.trim()}`,
      ].filter(Boolean).join("\n\n");

      const modelResponse = await fetch(`${modelBaseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${modelApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: "system",
              content: "你是 LumenKB 的知识整理助手。你只能返回严格 JSON，不要返回 Markdown，不要解释。",
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!modelResponse.ok) {
        return res.status(500).json({ error: "模型接口调用失败" });
      }

      const completion = await modelResponse.json();
      const jsonStr = completion?.choices?.[0]?.message?.content;
      if (!jsonStr || typeof jsonStr !== 'string') {
        return res.status(500).json({ error: "AI 返回格式解析失败" });
      }

      let parsed: any;
      try {
        parsed = JSON.parse(cleanJsonText(jsonStr));
      } catch {
        return res.status(500).json({ error: "AI 返回格式解析失败" });
      }

      const allowedCategories = new Set(["工作", "技术", "认知科学", "学习方法", "阅读", "设计", "未分类"]);
      const category = String(parsed.category ?? '').trim();

      res.json({
        title: String(parsed.title ?? '').trim() || "未命名知识",
        category: allowedCategories.has(category) ? category : "未分类",
        tags: normalizeStringArray(parsed.tags).slice(0, 6),
        summary: normalizeStringArray(parsed.summary).slice(0, 4),
        content: String(parsed.content ?? rawText).trim(),
        reviewStatus: "learning",
      });
    } catch (error: any) {
      console.error("AI 自动整理失败:", error);
      res.status(500).json({ error: "模型接口调用失败" });
    }
  });

  // AI 摘要
  app.post("/api/summarize", async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ error: "请先输入正文内容" });
      }

      let apiKey = process.env.GOOGLE_API_KEY;
      if (apiKey) apiKey = apiKey.replace(/^"|"$/g, '').trim();
      if (!apiKey) return res.status(500).json({ error: "服务器未配置 GOOGLE_API_KEY" });

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `请为以下正文生成3条简洁的摘要（每条不超过30个字）。\n\n正文：\n${content}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3条简洁的摘要",
          },
        },
      });

      const jsonStr = response.text?.trim();
      if (!jsonStr) throw new Error("API 返回结果为空");
      res.json({ summaries: JSON.parse(jsonStr) });
    } catch (error: any) {
      console.error("AI 摘要生成失败:", error);
      res.status(500).json({ error: error.message || "生成摘要时发生错误" });
    }
  });

  // 静态文件（生产环境）
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// 初始化数据库后再启动服务
initDb()
  .then(() => syncSystemDocs())
  .then(() => startServer())
  .catch(err => {
    console.error('启动失败:', err);
    process.exit(1);
  });
