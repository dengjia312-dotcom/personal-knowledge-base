import React, { useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) ?? '';
import { useNavigate } from 'react-router-dom';
import { Save, Image as ImageIcon, List, Type, Hash, Sparkles, Bot, Loader2 } from 'lucide-react';
import { Document, useAppContext } from '../context/AppContext';

interface IngestPreviewDraft {
  title: string;
  category: string;
  tags: string[];
  summary: string[];
  content: string;
  reviewStatus: string;
}

export default function Page3() {
  const { documents, addDocument, showToast } = useAppContext();
  const navigate = useNavigate();
  const [rawText, setRawText] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [summary, setSummary] = useState<string[]>([]);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const MIN_CONTENT_LENGTH = 30;
  const MIN_INGEST_LENGTH = 50;

  const categoryOptions = Array.from(
    new Set(
      documents
        .map((doc) => doc.category?.trim())
        .filter((item): item is string => Boolean(item))
    )
  );

  const handleGenerateSummary = async () => {
    if (!content.trim()) {
      showToast('请先输入正文内容');
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const response = await fetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '生成摘要失败');
      }

      setSummary(data.summaries);
      showToast('AI 摘要生成成功');
    } catch (error: any) {
      showToast(error.message || '生成摘要时发生错误');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleIngestPreview = async () => {
    const normalizedRawText = rawText.trim();

    if (normalizedRawText.length < MIN_INGEST_LENGTH) {
      showToast('请至少输入 50 字以上内容');
      return;
    }

    setIsIngesting(true);
    try {
      const response = await fetch(`${API_BASE}/api/ingest/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: normalizedRawText }),
      });

      const data = await response.json().catch(() => ({ error: 'AI 自动整理失败，请稍后重试' }));

      if (!response.ok) {
        throw new Error(data.error || 'AI 自动整理失败');
      }

      const draft = data as IngestPreviewDraft;
      setTitle(draft.title ?? '');
      setCategory(draft.category ?? '');
      setTags(Array.isArray(draft.tags) ? draft.tags.join(', ') : '');
      setSummary(Array.isArray(draft.summary) ? draft.summary : []);
      setContent(draft.content ?? normalizedRawText);
      showToast('AI 已生成知识草稿');
    } catch (error: any) {
      showToast(error.message || 'AI 自动整理失败，请稍后重试');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    const normalizedTitle = title.trim();
    const normalizedContent = content.trim();
    const normalizedCategory = category.trim();
    const contentLength = normalizedContent.length;

    if (!normalizedTitle) {
      showToast('请输入标题');
      return;
    }

    if (contentLength < MIN_CONTENT_LENGTH) {
      showToast(`正文至少需要 ${MIN_CONTENT_LENGTH} 个字（当前 ${contentLength}）`);
      return;
    }

    if (!normalizedCategory) {
      showToast('请输入分类');
      return;
    }

    const newDoc: Document = {
      id: Date.now().toString(),
      title: normalizedTitle,
      content: normalizedContent,
      category: normalizedCategory,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      summary: summary.length > 0 ? summary : ['AI 摘要将在稍后生成...'],
      createdAt: new Date().toISOString().split('T')[0],
      reviewStatus: 'learning' as const
    };

    setIsSaving(true);
    try {
      const savedDoc = await addDocument(newDoc);
      showToast('保存成功');
      navigate(`/page1?id=${savedDoc.id}`);
    } catch (error: any) {
      showToast(error.message || '保存失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-container-lowest">
      {/* Editor Toolbar */}
      <div className="h-14 border-b border-outline-variant/20 flex items-center justify-between px-6 bg-white dark:bg-surface-container-low">
        <div className="flex items-center gap-2">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">
            <Type size={18} />
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">
            <List size={18} />
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">
            <ImageIcon size={18} />
          </button>
          <div className="w-px h-6 bg-outline-variant/30 mx-2"></div>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">
            <Hash size={18} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary}
            className="flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isGeneratingSummary ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isGeneratingSummary ? '生成中...' : 'AI 摘要'}
          </button>
          <span className="text-xs text-outline">已保存</span>
          <button 
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !category.trim() || content.trim().length < MIN_CONTENT_LENGTH}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? '保存中...' : '发布'}
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto px-10 py-12 max-w-4xl mx-auto w-full scrollbar-hide">
        <section className="mb-10 rounded-2xl border border-primary/10 bg-surface-container-low p-5 md:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-primary">
                <Sparkles size={18} />
                <h2 className="text-lg font-headline font-bold text-on-surface">AI 自动整理</h2>
              </div>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                粘贴文章、笔记、聊天记录或学习材料，AI 会帮你生成标题、分类、标签和摘要。
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-surface-container-high px-2.5 py-1 text-xs text-outline">
              {rawText.trim().length} 字
            </span>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="在这里粘贴需要整理的原始内容..."
            className="min-h-36 w-full resize-y rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm leading-relaxed text-on-surface-variant outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-outline">AI 只生成草稿，不会直接保存入库。</p>
            <button
              onClick={handleIngestPreview}
              disabled={isIngesting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isIngesting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {isIngesting ? 'AI 正在整理...' : 'AI 整理为知识草稿'}
            </button>
          </div>
        </section>

        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="无标题文档" 
          className="w-full text-4xl font-headline font-bold text-on-surface placeholder:text-outline-variant/50 border-none focus:ring-0 p-0 mb-6 bg-transparent outline-none"
        />
        
        <div className="mb-10 space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">分类</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="请输入或选择分类（例如：技术 / 阅读）"
              list="category-options"
              className="w-full max-w-sm px-3 py-2 bg-surface-container-high rounded-xl text-sm text-on-surface-variant focus:ring-2 focus:ring-primary/20 outline-none border-none"
            />
            <p className="text-xs text-outline mt-1">可直接输入，也可使用已有分类建议</p>
            <datalist id="category-options">
              {categoryOptions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm font-medium text-on-surface-variant">标签</label>
            <input 
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="输入标签 (逗号分隔)"
              className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-medium text-on-surface-variant focus:ring-2 focus:ring-primary/20 outline-none border-none w-64"
            />
          </div>

          <div>
            <span className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-medium text-on-surface-variant cursor-pointer hover:bg-surface-variant transition-colors">
              + 添加封面
            </span>
          </div>
        </div>

        {/* AI Highlights Card */}
        {(summary.length > 0 || isGeneratingSummary) && (
          <section className="mb-8 md:mb-12 p-4 md:p-8 rounded-xl bg-gradient-to-br from-primary/5 to-primary-container/10 border border-primary/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles size={80} className="text-primary" />
            </div>
            <div className="flex items-center gap-2 mb-6 text-primary font-semibold">
              <Bot size={20} />
              <span className="text-sm tracking-wider">AI 智能摘要</span>
            </div>
            {isGeneratingSummary ? (
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Loader2 size={16} className="animate-spin" />
                <span>正在分析正文内容，请稍候...</span>
              </div>
            ) : (
              <ul className="space-y-4 text-on-surface-variant leading-relaxed">
                {summary.map((point, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-primary font-bold">{String(index + 1).padStart(2, '0')}</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="从这里开始输入内容，或者输入 '/' 唤起快捷菜单..." 
          className="w-full min-h-[500px] text-lg text-on-surface-variant leading-relaxed placeholder:text-outline-variant/50 border-none focus:ring-0 p-0 bg-transparent outline-none resize-none"
        ></textarea>
      </div>
    </div>
  );
}
