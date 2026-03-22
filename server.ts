import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/summarize", async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ error: "请先输入正文内容" });
      }

      let apiKey = process.env.GOOGLE_API_KEY;
      if (apiKey) {
        apiKey = apiKey.replace(/^"|"$/g, '').trim();
      }
      
      if (!apiKey) {
        return res.status(500).json({ error: "服务器未配置 GOOGLE_API_KEY" });
      }

      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `请为以下正文生成3条简洁的摘要（每条不超过30个字）。\n\n正文：\n${content}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description: "3条简洁的摘要",
          },
        },
      });

      const jsonStr = response.text?.trim();
      if (!jsonStr) {
        throw new Error("API 返回结果为空");
      }

      const summaries = JSON.parse(jsonStr);
      
      res.json({ summaries });
    } catch (error: any) {
      console.error("AI 摘要生成失败:", error);
      res.status(500).json({ error: error.message || "生成摘要时发生错误" });
    }
  });

  // Vite middleware for development
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

startServer();
