import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) ?? '';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, Bot, PenLine, Loader2, PlusCircle, BrainCircuit, ArrowRight, ChevronDown, ChevronUp, CheckCircle2, Clock, Link2, Info } from 'lucide-react';
import { useAppContext, Document } from '../context/AppContext';

export default function Page1() {
  const [searchParams] = useSearchParams();
  const docId = searchParams.get('id');
  const autoOpenReading = searchParams.get('read') === '1';
  const { documents, updateDocument, showToast } = useAppContext();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<Document | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [insightValue, setInsightValue] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'editing' | 'saved'>('idle');

  useEffect(() => {
    if (docId) {
      const foundDoc = documents.find((d) => d.id === docId);
      setDoc(foundDoc || documents[0] || null);
      return;
    }
    setDoc(documents[0] || null);
  }, [docId, documents]);

  useEffect(() => {
    if (!doc) return;
    fetch(`${API_BASE}/api/insights/${doc.id}`)
      .then(r => r.json())
      .then(data => setInsightValue(data.content ?? ''))
      .catch(() => setInsightValue(''));
    setSaveState('idle');
  }, [doc]);

  useEffect(() => {
    if (autoOpenReading) {
      setIsSummaryExpanded(true);
    }
  }, [autoOpenReading]);

  useEffect(() => {
    if (!doc || saveState !== 'editing') return;
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/api/insights/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: insightValue }),
      }).catch(console.error);
      setSaveState('saved');
    }, 700);

    return () => clearTimeout(timer);
  }, [doc, insightValue, saveState]);

  const relatedDocs = useMemo(() => documents.filter((d) => d.id !== doc?.id).slice(0, 2), [documents, doc?.id]);
  const pendingReviewCount = documents.filter((d) => d.reviewStatus !== 'mastered').length;
  const masteredCount = documents.filter((d) => d.reviewStatus === 'mastered').length;
  const recentAddedCount = documents.filter((d) => {
    const createdTime = new Date(d.createdAt).getTime();
    if (Number.isNaN(createdTime)) return false;
    const diffDays = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }).length;

  const handleGenerateSummary = async () => {
    if (!doc) return;
    if (!doc.content.trim()) {
      showToast('请先输入正文内容');
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const response = await fetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: doc.content })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '生成摘要失败');
      }

      const updatedDoc = { ...doc, summary: data.summaries };
      setDoc(updatedDoc);
      updateDocument(doc.id, { summary: data.summaries });
      setIsSummaryExpanded(true);
      showToast('AI 摘要生成成功');
    } catch (error: any) {
      showToast(error.message || '生成摘要时发生错误');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (!doc) {
    return <div className="p-10 text-center text-outline">加载中...</div>;
  }

  const hasSummary = (doc.summary && doc.summary.length > 0 && doc.summary[0] !== 'AI 摘要将在稍后生成...') || isGeneratingSummary;
  const isReadingMode = autoOpenReading;

  if (isReadingMode) {
    return (
      <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-10 max-w-4xl mx-auto w-full scrollbar-hide">
        <section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 md:p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h2 className="text-lg md:text-xl font-bold text-on-surface">文章详情阅读</h2>
            <button
              onClick={() => navigate('/page1', { replace: true })}
              className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
            >
              返回今日任务入口
            </button>
          </div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface leading-tight mb-3">{doc.title}</h1>
          <p className="text-xs text-outline mb-4">预计阅读时间: {Math.max(1, Math.ceil(doc.content.length / 300))} 分钟</p>
          <article className="text-sm md:text-base text-on-surface-variant leading-relaxed whitespace-pre-wrap">
            {doc.content}
          </article>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {isGeneratingSummary ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isGeneratingSummary ? '生成中...' : '更新AI摘要'}
            </button>
            <button
              onClick={() => navigate('/page4')}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
            >
              开始复习
            </button>
          </div>

          {hasSummary && (
            <div className="p-4 md:p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
              <button
                onClick={() => setIsSummaryExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Bot size={18} />
                  <span className="text-sm tracking-wide">AI 摘要</span>
                </div>
                {isSummaryExpanded ? <ChevronUp size={16} className="text-outline" /> : <ChevronDown size={16} className="text-outline" />}
              </button>
              {isSummaryExpanded && (
                <div className="mt-4">
                  {isGeneratingSummary ? (
                    <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                      <Loader2 size={14} className="animate-spin" />
                      <span>正在分析正文内容，请稍候...</span>
                    </div>
                  ) : (
                    <ul className="space-y-3 text-sm text-on-surface-variant leading-relaxed">
                      {doc.summary.map((point, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="text-primary font-bold">{String(index + 1).padStart(2, '0')}</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-10 max-w-5xl mx-auto w-full scrollbar-hide">
      {/* 顶部概览区 */}
      <section className="mb-6 md:mb-8 p-4 md:p-6 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-headline font-bold text-on-surface">今日任务入口</h2>
            <p className="text-sm text-on-surface-variant mt-1">先推进今天该做的：继续阅读、完成复习、沉淀感悟。</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate(`/page1?id=${doc.id}&read=1`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              继续阅读
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/page4')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container text-on-surface rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors"
            >
              <BrainCircuit size={16} />
              开始复习
            </button>
            <button
              onClick={() => navigate('/page3')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-outline-variant/40 text-outline rounded-full text-xs hover:text-on-surface hover:border-outline transition-colors"
            >
              <PlusCircle size={14} />
              去新建
            </button>
          </div>
        </div>
      </section>

      {/* 今日概览数据卡 */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/page4')}
            className="text-left rounded-xl bg-surface-container-low p-3.5 border border-outline-variant/10 hover:border-primary/30 hover:bg-primary/5 transition-colors"
          >
            <p className="text-[11px] text-outline mb-2">今日待复习数</p>
            <p className="text-3xl font-extrabold text-on-surface leading-none">{pendingReviewCount}</p>
          </button>
          <button
            onClick={() => navigate('/page2?range=7d')}
            className="text-left rounded-xl bg-surface-container-low p-3.5 border border-outline-variant/10 hover:border-primary/30 hover:bg-primary/5 transition-colors"
          >
            <p className="text-[11px] text-outline mb-2">最近新增数（7天）</p>
            <p className="text-3xl font-extrabold text-on-surface leading-none">{recentAddedCount}</p>
          </button>
          <div className="rounded-xl bg-surface-container-low p-3.5 border border-outline-variant/10">
            <p className="text-[11px] text-outline mb-2">已掌握数</p>
            <p className="text-3xl font-extrabold text-on-surface leading-none">{masteredCount}</p>
          </div>
        </div>
      </section>

      {/* 当前阅读内容卡（视觉中心） */}
      <section className="mb-8 rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-surface-container-lowest via-primary/5 to-primary-container/10 shadow-md">
        <div className="p-5 md:p-7">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-medium">当前阅读</span>
            <span className="text-xs text-outline">预计阅读时间: {Math.max(1, Math.ceil(doc.content.length / 300))} 分钟</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-headline font-extrabold text-on-surface tracking-tight leading-tight break-words mb-3">{doc.title}</h1>
          <p className="text-sm md:text-base text-on-surface-variant line-clamp-3">{doc.content}</p>
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate(`/page1?id=${doc.id}&read=1`)}
              className="px-5 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              继续阅读
            </button>
            <button
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {isGeneratingSummary ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isGeneratingSummary ? '生成中...' : '更新AI摘要'}
            </button>
          </div>
        </div>
      </section>

      {/* AI 摘要 + 我的感悟 */}
      <section className="space-y-6">
        {hasSummary && (
          <div className="p-4 md:p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
            <button
              onClick={() => setIsSummaryExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between gap-3 text-left"
            >
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Bot size={18} />
                <span className="text-sm tracking-wide">AI 摘要</span>
              </div>
              {isSummaryExpanded ? <ChevronUp size={16} className="text-outline" /> : <ChevronDown size={16} className="text-outline" />}
            </button>
            {isSummaryExpanded && (
              <div className="mt-4">
                {isGeneratingSummary ? (
                  <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                    <Loader2 size={14} className="animate-spin" />
                    <span>正在分析正文内容，请稍候...</span>
                  </div>
                ) : (
                  <ul className="space-y-3 text-sm text-on-surface-variant leading-relaxed">
                    {doc.summary.map((point, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="text-primary font-bold">{String(index + 1).padStart(2, '0')}</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        <div className="p-4 md:p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-on-surface">
              <PenLine className="text-primary" size={18} />
              我的感悟
            </h3>
            <span className="text-xs text-outline">
              {saveState === 'editing' ? '编辑中' : '已自动保存'}
            </span>
          </div>
          <textarea
            value={insightValue}
            onChange={(e) => {
              setInsightValue(e.target.value);
              setSaveState('editing');
            }}
            className="w-full min-h-[140px] bg-transparent border-none focus:ring-0 p-0 text-on-surface-variant placeholder:text-outline/40 leading-relaxed outline-none resize-none"
            placeholder="输入你对这篇文章的思考或读书笔记..."
          ></textarea>
        </div>
      </section>

      {/* 降级后的低优先模块 */}
      <section className="mt-8 p-3 rounded-xl bg-surface-container-low border border-outline-variant/10">
        <div className="flex items-center gap-2 text-[11px] text-outline mb-2">
          <Info size={14} />
          <span>低频信息（已弱化展示）</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-surface-container-high text-on-surface-variant inline-flex items-center gap-1"><Clock size={12} />复习进度：{doc.reviewStatus === 'mastered' ? '已掌握' : '学习中'}</span>
          <span className="px-2 py-1 rounded-full bg-surface-container-high text-on-surface-variant inline-flex items-center gap-1"><CheckCircle2 size={12} />内容信息：{doc.category}</span>
          {relatedDocs[0] && (
            <button
              onClick={() => navigate(`/page1?id=${relatedDocs[0].id}`)}
              className="px-2 py-1 rounded-full bg-surface-container-high text-on-surface-variant hover:text-primary inline-flex items-center gap-1"
            >
              <Link2 size={12} />关联推荐：{relatedDocs[0].title.slice(0, 10)}...
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
