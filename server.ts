import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { initDb } from "./db/database";
import { getAllDocuments, createDocument, updateDocument, syncSystemDocs } from "./db/documents";
import { getProfile, updateProfile } from "./db/profile";
import { getInsight, upsertInsight } from "./db/insights";

const MODEL_ENV_ERROR = "AI 模型环境变量未配置";
const MODEL_CALL_ERROR = "模型接口调用失败";
const MODEL_PARSE_ERROR = "AI 返回格式解析失败";

interface ChatModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

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
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,，、;\n]/)
      : [];

  return items
    .map((item) => String(item ?? '').replace(/^#+/, '').trim())
    .filter(Boolean);
}

function readModelEnv(name: string): string {
  const value = process.env[name];
  return value ? value.replace(/^"|"$/g, '').trim() : '';
}

function normalizeTags(value: unknown): string[] {
  const genericTags = new Set(["教程", "知识", "内容", "总结"]);
  const seen = new Set<string>();

  return normalizeStringArray(value)
    .map((tag) => tag.replace(/\s+/g, ''))
    .filter((tag) => tag && !genericTags.has(tag))
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

function normalizeSummary(value: unknown): string[] {
  return normalizeStringArray(value).slice(0, 4);
}

function parseModelJson(text: string): unknown {
  try {
    return JSON.parse(cleanJsonText(text));
  } catch {
    throw new Error(MODEL_PARSE_ERROR);
  }
}

function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if ([MODEL_ENV_ERROR, MODEL_CALL_ERROR, MODEL_PARSE_ERROR].includes(error.message)) {
      return error.message;
    }
  }
  return MODEL_CALL_ERROR;
}

async function callChatModel(messages: ChatModelMessage[], temperature = 0.3): Promise<string> {
  const modelApiKey = readModelEnv('MODEL_API_KEY');
  const modelBaseUrl = readModelEnv('MODEL_BASE_URL');
  const modelName = readModelEnv('MODEL_NAME');

  if (!modelApiKey || !modelBaseUrl || !modelName) {
    throw new Error(MODEL_ENV_ERROR);
  }

  const modelResponse = await fetch(`${modelBaseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${modelApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      temperature,
    }),
  });

  if (!modelResponse.ok) {
    throw new Error(MODEL_CALL_ERROR);
  }

  const completion = await modelResponse.json().catch(() => {
    throw new Error(MODEL_CALL_ERROR);
  });
  const content = completion?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error(MODEL_PARSE_ERROR);
  }

  return content;
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

      const userPrompt = [
        "请把下面的原始内容整理成一张适合长期沉淀、复习和知识图谱关联的 LumenKB 知识卡片。",
        "只返回 JSON 对象，不要 Markdown 代码块，不要解释，不要在 JSON 外输出任何文字。",
        "这不是简单摘要任务。请先理解原文核心主题，再重组为可复用的知识卡片。",
        "JSON 格式必须严格为：",
        `{
  "title": "string",
  "category": "工作|技术|认知科学|学习方法|阅读|设计|未分类",
  "tags": ["string"],
  "summary": ["string"],
  "content": "string",
  "reviewStatus": "learning"
}`,
        "title：不要直接照抄原文标题，要生成适合作为知识卡片标题的表达，并明确指出这条知识的核心主题。",
        "title 示例：原文标题“小米 MiMo Token Plan 配置教程”，更好的标题是“MiMo Token Plan 的配置方式与注意点”。",
        "category：必须且只能从这些分类中选一个：工作、技术、认知科学、学习方法、阅读、设计、未分类。",
        "tags：生成 3 到 6 个，短、准确、适合知识图谱复用，不带 #。",
        "tags：不要使用“教程”“知识”“内容”“总结”这类过泛标签。",
        "tags：优先包含技术对象（如 MCP、MiMo、OpenClaw、RAG）、应用场景（如 Agent、知识库、模型接入）和关键概念（如 API 接入、权限控制、工作流）。",
        "tags：避免同义重复；例如“小米”和“MiMo”表达同一对象时，优先保留更准确的“MiMo”。",
        "summary：生成 2 到 4 条，每条一句话，像复习卡片要点，而不是复制原文；每条只聚焦一个核心信息，不要空泛。",
        "content：必须是结构化 Markdown 字符串，但不要使用 Markdown 代码块。",
        "content 必须包含这些二级标题：## 核心概念、## 关键内容、## 注意事项、## 可复习问题。",
        "## 核心概念：用 1-2 段解释这条知识到底讲什么。",
        "## 关键内容：用要点列出原文里的主要信息。",
        "## 注意事项：列出使用、配置、理解时容易出错的点；如果原文没有相关信息，写“原文未提供明显注意事项。”",
        "## 可复习问题：生成 2-3 个基于原文的问题，不要编造。",
        "保留原始内容的核心事实，可以清洗和重组表达，但不要大幅编造原文没有提供的信息。",
        "如果原文信息不足，要明确写“原文未提供”。",
        "reviewStatus：固定返回 learning。",
        sourceTitle ? `来源标题：${sourceTitle}` : "",
        sourceUrl ? `来源链接：${sourceUrl}` : "",
        `原始内容：\n${rawText.trim()}`,
      ].filter(Boolean).join("\n\n");

      const jsonStr = await callChatModel([
        {
          role: "system",
          content: "你是 LumenKB 的知识整理助手。你擅长把原始资料整理成长期可复习、可关联的结构化知识卡片。你只能返回严格 JSON，不要返回 Markdown 代码块，不要解释。",
        },
        {
          role: "user",
          content: userPrompt,
        },
      ]);

      const parsed = parseModelJson(jsonStr) as any;

      const allowedCategories = new Set(["工作", "技术", "认知科学", "学习方法", "阅读", "设计", "未分类"]);
      const category = String(parsed.category ?? '').trim();

      res.json({
        title: String(parsed.title ?? '').trim() || "未命名知识",
        category: allowedCategories.has(category) ? category : "未分类",
        tags: normalizeTags(parsed.tags),
        summary: normalizeSummary(parsed.summary),
        content: String(parsed.content ?? rawText).trim(),
        reviewStatus: "learning",
      });
    } catch (error: any) {
      console.error("AI 自动整理失败:", error);
      res.status(500).json({ error: getApiErrorMessage(error) });
    }
  });

  // AI 摘要
  app.post("/api/summarize", async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ error: "请先输入正文内容" });
      }

      const userPrompt = [
        "请为以下文档正文生成适合 LumenKB 复习使用的 AI 摘要。",
        "只返回严格 JSON，不要 Markdown，不要解释，不要在 JSON 外输出任何文字。",
        "优先返回格式：",
        `{
  "summary": ["string", "string", "string"]
}`,
        "summary 生成 2 到 4 条。",
        "每条一句话，适合复习。",
        "不要复制原文，要提炼核心要点。",
        `正文：\n${content.trim()}`,
      ].join("\n\n");

      const jsonStr = await callChatModel([
        {
          role: "system",
          content: "你是 LumenKB 的复习摘要助手。你只能返回严格 JSON，不要返回 Markdown，不要解释。",
        },
        {
          role: "user",
          content: userPrompt,
        },
      ]);

      const parsed = parseModelJson(jsonStr) as any;
      const summaries = Array.isArray(parsed)
        ? normalizeSummary(parsed)
        : normalizeSummary(parsed?.summary ?? parsed?.summaries);

      if (summaries.length === 0) {
        return res.status(500).json({ error: MODEL_PARSE_ERROR });
      }

      res.json({ summary: summaries, summaries });
    } catch (error: any) {
      console.error("AI 摘要生成失败:", error);
      res.status(500).json({ error: getApiErrorMessage(error) });
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
