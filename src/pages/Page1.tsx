import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, Bot, PenLine, Bold, Link as LinkIcon, Paperclip, Clock, CheckCircle2, Link2 } from 'lucide-react';
import { useAppContext, Document } from '../context/AppContext';

export default function Page1() {
  const [searchParams] = useSearchParams();
  const docId = searchParams.get('id');
  const { documents, updateDocument, showToast } = useAppContext();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Document | null>(null);

  useEffect(() => {
    if (docId) {
      const foundDoc = documents.find(d => d.id === docId);
      if (foundDoc) {
        setDoc(foundDoc);
      } else {
        // Handle not found, maybe redirect or show error
        setDoc(documents[0]); // Fallback to first doc for demo
      }
    } else if (documents.length > 0) {
      setDoc(documents[0]);
    }
  }, [docId, documents]);

  const handleMarkMastered = () => {
    if (doc) {
      updateDocument(doc.id, { reviewStatus: 'mastered' });
      showToast('已标记为已掌握');
    }
  };

  if (!doc) {
    return <div className="p-10 text-center text-outline">加载中...</div>;
  }

  // Simple related docs logic (just picking some others)
  const relatedDocs = documents.filter(d => d.id !== doc.id).slice(0, 2);

  return (
    <div className="flex flex-col xl:flex-row w-full h-full overflow-y-auto xl:overflow-hidden min-w-0 max-w-full">
      {/* Reading Canvas */}
      <div className="flex-1 overflow-y-visible xl:overflow-y-auto px-4 md:px-10 py-6 md:py-10 w-full max-w-4xl mx-auto scrollbar-hide min-w-0">
        {/* Title & Header Info */}
        <div className="mb-6 md:mb-10">
          <div className="flex items-center gap-2 md:gap-3 mb-4 flex-wrap">
            <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-medium whitespace-nowrap">深度阅读</span>
            <span className="text-xs md:text-sm text-outline">预计阅读时间: {Math.max(1, Math.ceil(doc.content.length / 300))}分钟</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-headline font-extrabold text-on-surface tracking-tight leading-tight break-words">
            {doc.title}
          </h1>
        </div>

        {/* Cover Image */}
        <div className="mb-6 md:mb-10 rounded-xl md:rounded-2xl overflow-hidden bg-surface-container-high aspect-video relative w-full max-w-full">
          <img 
            src={doc.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop'} 
            alt={doc.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* AI Highlights Card */}
        {doc.summary && doc.summary.length > 0 && (
          <section className="mb-8 md:mb-12 p-4 md:p-8 rounded-xl bg-gradient-to-br from-primary/5 to-primary-container/10 border border-primary/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles size={80} className="text-primary" />
            </div>
            <div className="flex items-center gap-2 mb-6 text-primary font-semibold">
              <Bot size={20} />
              <span className="text-sm tracking-wider">AI 智能摘要</span>
            </div>
            <ul className="space-y-4 text-on-surface-variant leading-relaxed">
              {doc.summary.map((point, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-primary font-bold">{String(index + 1).padStart(2, '0')}</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Article Content */}
        <article className="text-base md:text-lg text-on-surface-variant leading-relaxed space-y-6 whitespace-pre-wrap break-words">
          {doc.content}
        </article>

        {/* My Notes Editor */}
        <section className="mt-10 md:mt-16 pt-8 md:pt-10 border-t border-surface-container-high w-full max-w-full min-w-0">
          <div className="flex items-center justify-between mb-4 md:mb-6 flex-wrap gap-2">
            <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-on-surface">
              <PenLine className="text-primary md:w-6 md:h-6" size={20} />
              我的感悟
            </h3>
            <span className="text-xs text-outline italic">自动保存于 {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 md:p-6 border border-outline-variant/20 shadow-sm focus-within:ring-2 focus-within:ring-primary/10 transition-all w-full max-w-full min-w-0">
            <textarea 
              className="w-full min-h-[120px] bg-transparent border-none focus:ring-0 p-0 text-on-surface-variant placeholder:text-outline/40 leading-relaxed outline-none resize-none min-w-0" 
              placeholder="输入你对这篇文章的思考或读书笔记..."
            ></textarea>
            <div className="flex items-center gap-2 md:gap-4 mt-4 pt-4 border-t border-surface-container flex-wrap">
              <button className="text-outline hover:text-primary transition-colors p-1 md:p-0">
                <Bold size={18} />
              </button>
              <button className="text-outline hover:text-primary transition-colors p-1 md:p-0">
                <LinkIcon size={18} />
              </button>
              <button className="text-outline hover:text-primary transition-colors p-1 md:p-0">
                <Paperclip size={18} />
              </button>
              <button 
                onClick={() => showToast('笔记已保存')}
                className="ml-auto px-4 md:px-6 py-2 bg-primary text-on-primary rounded-full text-xs md:text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
              >
                保存笔记
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Right Sidebar */}
      <aside className="w-full xl:w-80 border-t xl:border-t-0 xl:border-l border-surface-container-high bg-surface-container-low/50 p-4 md:p-8 space-y-8 md:space-y-10 overflow-y-visible xl:overflow-y-auto scrollbar-hide min-w-0 shrink-0">
        {/* Metadata */}
        <div className="w-full max-w-full min-w-0">
          <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-4">内容信息</h4>
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm text-on-surface-variant">来源</span>
              <span className="text-sm font-medium text-primary break-all">内部知识库</span>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm text-on-surface-variant">创建日期</span>
              <span className="text-sm font-medium text-on-surface break-all">{doc.createdAt}</span>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm text-on-surface-variant">知识分类</span>
              <span className="text-xs px-2 py-1 bg-surface-container-highest rounded text-on-surface-variant font-medium break-all">{doc.category}</span>
            </div>
          </div>
        </div>

        {/* Review Status */}
        <div className="p-4 md:p-6 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 w-full max-w-full min-w-0">
          <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-on-surface">
            <Clock className="text-tertiary" size={18} />
            复习进度
          </h4>
          <div className="w-full bg-surface-container rounded-full h-1.5 mb-2">
            <div className="bg-tertiary-container h-1.5 rounded-full" style={{ width: doc.reviewStatus === 'mastered' ? '100%' : '65%' }}></div>
          </div>
          <p className="text-xs text-outline mb-6">
            {doc.reviewStatus === 'mastered' ? '已掌握' : '学习中 · 记忆保持率高'}
          </p>
          <button 
            onClick={handleMarkMastered}
            disabled={doc.reviewStatus === 'mastered'}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              doc.reviewStatus === 'mastered' 
                ? 'bg-surface-container-high text-outline cursor-not-allowed' 
                : 'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20 active:scale-95'
            }`}
          >
            <CheckCircle2 size={18} />
            {doc.reviewStatus === 'mastered' ? '已掌握' : '标记已掌握'}
          </button>
        </div>

        {/* Related Recommendations */}
        <div className="w-full max-w-full min-w-0">
          <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-4 md:mb-6">关联推荐</h4>
          <div className="space-y-4 md:space-y-6">
            {relatedDocs.map(relatedDoc => (
              <div 
                key={relatedDoc.id} 
                className="group block cursor-pointer w-full max-w-full min-w-0" 
                onClick={() => navigate(`/page1?id=${relatedDoc.id}`)}
              >
                <p className="text-xs text-primary font-medium mb-1 truncate">来自 关联标签 #{relatedDoc.tags?.[0] || '默认'}</p>
                <h5 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors leading-snug break-words">
                  {relatedDoc.title}
                </h5>
              </div>
            ))}
            <a className="group block w-full max-w-full min-w-0" href="#">
              <div className="bg-surface-container-highest p-3 md:p-4 rounded-lg flex items-center gap-2 md:gap-3 hover:bg-surface-variant transition-colors">
                <Link2 className="text-outline shrink-0" size={18} />
                <span className="text-xs text-outline font-medium truncate">手动关联更多内容...</span>
              </div>
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
