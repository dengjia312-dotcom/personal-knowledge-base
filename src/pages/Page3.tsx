import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Image as ImageIcon, List, Type, Hash } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Page3() {
  const { addDocument, showToast } = useAppContext();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const handleSave = () => {
    if (!title.trim()) {
      showToast('请输入标题');
      return;
    }

    const newDoc = {
      id: Date.now().toString(),
      title,
      content,
      category: '默认分类', // Default category for now
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      summary: ['AI 摘要将在稍后生成...'],
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
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="输入标签 (逗号分隔)"
            className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-medium text-on-surface-variant focus:ring-2 focus:ring-primary/20 outline-none border-none w-64"
          />
          <span className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-medium text-on-surface-variant cursor-pointer hover:bg-surface-variant transition-colors">
            + 添加封面
          </span>
        </div>

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
