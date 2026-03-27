import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Image as ImageIcon, List, Type, Hash, Sparkles, Bot, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Page3() {
  const { documents, addDocument, showToast } = useAppContext();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [summary, setSummary] = useState<string[]>([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const MIN_CONTENT_LENGTH = 30;

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
      const response = await fetch('/api/summarize', {
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

  const handleSave = () => {
    if (!title.trim()) {
      showToast('请输入标题');
      return;
    }

    if (content.trim().length < MIN_CONTENT_LENGTH) {
      showToast(`正文至少需要 ${MIN_CONTENT_LENGTH} 个字`);
      return;
    }

    if (!category.trim()) {
      showToast('请输入分类');
      return;
    }

    const newDoc = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      summary: summary.length > 0 ? summary : ['AI 摘要将在稍后生成...'],
      createdAt: new Date().toISOString().split('T')[0],
      reviewStatus: 'learning' as const
    };

    addDocument(newDoc);
    showToast('保存成功');
    navigate('/page2');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-container-lowest">
      {/* Editor Toolbar */}
      <div className="h-14 border-b border-outline-variant/20 flex items-center justify-between px-6 bg-white">
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
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Save size={16} />
            发布
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto px-10 py-12 max-w-4xl mx-auto w-full scrollbar-hide">
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="无标题文档" 
          className="w-full text-4xl font-headline font-bold text-on-surface placeholder:text-outline-variant/50 border-none focus:ring-0 p-0 mb-6 bg-transparent outline-none"
        />
        
        <div className="flex items-center gap-2 mb-10">
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="输入分类（例如：技术 / 阅读）"
            list="category-options"
            className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-medium text-on-surface-variant focus:ring-2 focus:ring-primary/20 outline-none border-none w-56"
          />
          <datalist id="category-options">
            {categoryOptions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          <input 
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="输入标签 (逗号分隔)"
            className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-medium text-on-surface-variant focus:ring-2 focus:ring-primary/20 outline-none border-none w-64"
          />
          <span className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-medium text-on-surface-variant cursor-pointer hover:bg-surface-variant transition-colors">
            + 添加封面
          </span>
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
