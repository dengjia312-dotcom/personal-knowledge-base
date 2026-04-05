import React, { useState, useEffect, useMemo } from 'react';
import { BrainCircuit, Check, X, RotateCcw, ArrowRight, Library, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppContext, Document } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

type ReviewResult = 'again' | 'hard' | 'good';

const RESULT_LABEL: Record<ReviewResult, { text: string; className: string }> = {
  good:  { text: '已掌握', className: 'bg-primary/10 text-primary' },
  hard:  { text: '模糊',   className: 'bg-surface-container-high text-on-surface-variant' },
  again: { text: '需重学', className: 'bg-error-container text-on-error-container' },
};

function isToday(isoStr: string | undefined): boolean {
  if (!isoStr) return false;
  return isoStr.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function formatTimeAgo(isoStr: string): string {
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60)    return '刚刚';
  if (diff < 3600)  return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${Math.floor(diff / 86400)} 天前`;
}

function DocModal({ doc, onClose }: { doc: Document; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm px-0 md:px-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest w-full md:max-w-lg rounded-t-3xl md:rounded-2xl border border-outline-variant/20 shadow-2xl flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
          <div className="flex-1 pr-4">
            <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
              {doc.category}
            </span>
            <h3 className="text-base font-bold text-on-surface leading-snug">{doc.title}</h3>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors mt-0.5 shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto scrollbar-hide px-6 py-5 flex-1">
          {doc.summary && doc.summary.length > 0 ? (
            <ul className="space-y-3">
              {doc.summary.map((point, i) => (
                <li key={i} className="flex gap-3 text-sm text-on-surface-variant leading-relaxed">
                  <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {doc.content.substring(0, 300)}{doc.content.length > 300 && '…'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page4() {
  const { documents, updateDocument } = useAppContext();
  const navigate = useNavigate();

  const [sessionQueue, setSessionQueue] = useState<Document[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<Document | null>(null);
  const [listExpanded, setListExpanded] = useState(true);

  // 今日已复习：从 documents 实时推导，切页回来也能恢复
  const todayReviewed = useMemo(() =>
    documents
      .filter(d => isToday(d.lastReviewAt))
      .sort((a, b) => new Date(b.lastReviewAt!).getTime() - new Date(a.lastReviewAt!).getTime()),
    [documents]
  );

  // 初始化复习队列：仅在首次加载时执行一次（文档加载后）
  useEffect(() => {
    if (initialized || documents.length === 0) return;
    const pending = documents.filter(d => d.reviewStatus !== 'mastered' && !isToday(d.lastReviewAt));
    for (let i = pending.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pending[i], pending[j]] = [pending[j], pending[i]];
    }
    setSessionQueue(pending);
    setInitialized(true);
  }, [documents, initialized]);

  const handleNext = (result: ReviewResult) => {
    if (currentIndex >= sessionQueue.length) return;
    const currentDoc = sessionQueue[currentIndex];
    updateDocument(currentDoc.id, {
      reviewStatus: result === 'good' ? 'mastered' : 'learning',
      lastReviewAt: new Date().toISOString(),
      lastReviewResult: result,
    });
    setFlipped(false);
    setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
  };

  const isEmpty     = initialized && sessionQueue.length === 0;
  const isCompleted = sessionQueue.length > 0 && currentIndex >= sessionQueue.length;
  const currentDoc  = !isEmpty && !isCompleted ? sessionQueue[currentIndex] : null;
  const progress    = sessionQueue.length > 0 ? (currentIndex / sessionQueue.length) * 100 : 0;

  // 真正的空状态：待复习为空 且 今日没有任何复习记录
  const totalEmpty = isEmpty && todayReviewed.length === 0;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-10 py-10 bg-surface-container-lowest">
      <div className="max-w-2xl mx-auto w-full">

        {/* 标题 + 进度 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-headline font-bold text-on-surface flex items-center gap-3">
            <BrainCircuit className="text-primary" size={32} />
            每日复习
          </h1>
          {!isEmpty && sessionQueue.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-on-surface-variant">进度</span>
              <div className="w-32 h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-outline font-bold">
                {Math.min(currentIndex, sessionQueue.length)} / {sessionQueue.length}
              </span>
            </div>
          )}
        </div>

        {/* ── 纯空状态 ── */}
        {totalEmpty && (
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-surface-container-high text-outline rounded-full flex items-center justify-center mb-6">
              <BookOpen size={40} />
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-2">暂无待复习内容</h2>
            <p className="text-on-surface-variant mb-8 max-w-xs">你的知识库还没有内容，或者所有知识点都已标记为掌握。</p>
            <button
              onClick={() => navigate('/page2')}
              className="flex items-center gap-2 px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-medium hover:bg-surface-container-highest transition-colors"
            >
              <Library size={18} />
              去知识库看看
            </button>
          </div>
        )}

        {/* ── 完成态横幅 ── */}
        {isCompleted && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl px-6 py-5 flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center shrink-0">
                <Check size={20} />
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm">太棒了，今日复习完成！</p>
                <p className="text-xs text-on-surface-variant mt-0.5">共复习了 {todayReviewed.length} 条内容</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/page2')}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
            >
              知识库
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ── 待复习为 0 但有已复习：今日已完成提示 ── */}
        {isEmpty && todayReviewed.length > 0 && (
          <div className="bg-surface-container border border-outline-variant/20 rounded-2xl px-6 py-4 flex items-center gap-3 mb-8">
            <Check size={18} className="text-primary shrink-0" />
            <p className="text-sm text-on-surface-variant">今日已无待复习内容</p>
          </div>
        )}

        {/* ── 复习中：闪卡 ── */}
        {!isEmpty && !isCompleted && currentDoc && (
          <>
            <div
              className="relative w-full h-96 bg-surface-container-lowest rounded-3xl shadow-xl border border-outline-variant/10 cursor-pointer"
              onClick={() => setFlipped(f => !f)}
            >
              {/* Front */}
              <div className={`absolute inset-0 p-10 flex flex-col items-center justify-center ${flipped ? 'hidden' : 'block'}`}>
                <span className="absolute top-6 left-6 text-xs font-bold text-outline uppercase tracking-widest">正面 · 问题</span>
                <span className="absolute top-6 right-6 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  {currentDoc.category}
                </span>
                <h2 className="text-2xl font-bold text-center text-on-surface leading-snug">{currentDoc.title}</h2>
                <p className="mt-8 text-sm text-outline text-center">点击卡片查看答案</p>
              </div>

              {/* Back */}
              <div className={`absolute inset-0 p-10 flex flex-col items-center justify-center ${!flipped ? 'hidden' : 'block'}`}>
                <span className="absolute top-6 left-6 text-xs font-bold text-primary uppercase tracking-widest">背面 · 答案</span>
                <div className="w-full h-full pt-12 overflow-y-auto scrollbar-hide text-center">
                  {currentDoc.summary && currentDoc.summary.length > 0 ? (
                    <ul className="space-y-4 text-lg text-on-surface-variant leading-relaxed inline-block text-left">
                      {currentDoc.summary.map((point, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="font-bold opacity-70">{i + 1}.</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-lg text-on-surface-variant leading-relaxed">
                      {currentDoc.content.substring(0, 200)}…
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className={`mt-12 flex items-center justify-center gap-6 transition-opacity duration-300 ${flipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <button onClick={e => { e.stopPropagation(); handleNext('again'); }} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container flex items-center justify-center group-hover:scale-110 transition-transform">
                  <X size={24} />
                </div>
                <span className="text-xs font-medium text-on-surface-variant">忘记了</span>
              </button>
              <button onClick={e => { e.stopPropagation(); handleNext('hard'); }} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center group-hover:scale-110 transition-transform">
                  <RotateCcw size={24} />
                </div>
                <span className="text-xs font-medium text-on-surface-variant">模糊</span>
              </button>
              <button onClick={e => { e.stopPropagation(); handleNext('good'); }} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Check size={24} />
                </div>
                <span className="text-xs font-medium text-on-surface-variant">记得</span>
              </button>
            </div>
          </>
        )}

        {/* ── 今日已复习列表 ── */}
        {todayReviewed.length > 0 && (
          <div className="mt-12">
            <button
              className="flex items-center gap-2 mb-4 group"
              onClick={() => setListExpanded(v => !v)}
            >
              <h2 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                今日已复习
              </h2>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                {todayReviewed.length}
              </span>
              {listExpanded
                ? <ChevronUp size={16} className="text-on-surface-variant" />
                : <ChevronDown size={16} className="text-on-surface-variant" />
              }
            </button>

            {listExpanded && (
              <div className="space-y-3">
                {todayReviewed.map(doc => {
                  const result = (doc.lastReviewResult ?? 'hard') as ReviewResult;
                  const label = RESULT_LABEL[result];
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-4 hover:border-outline-variant/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant text-xs rounded-full">
                            {doc.category}
                          </span>
                          <span className="text-xs text-outline">
                            {doc.lastReviewAt ? formatTimeAgo(doc.lastReviewAt) : '今日'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${label.className}`}>
                          {label.text}
                        </span>
                        <button
                          onClick={() => setExpandedDoc(doc)}
                          className="px-3 py-1.5 text-xs font-medium text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-lg transition-colors"
                        >
                          查看
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {expandedDoc && <DocModal doc={expandedDoc} onClose={() => setExpandedDoc(null)} />}
    </div>
  );
}
