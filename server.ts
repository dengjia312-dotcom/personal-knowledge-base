import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";
import { initDb } from "./db/database";
import { getAllDocuments, createDocument, updateDocument, syncSystemDocs } from "./db/documents";
import { getProfile, updateProfile } from "./db/profile";
import { getInsight, upsertInsight } from "./db/insights";

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
