import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, FileText, MoreVertical, Filter, ArrowUpDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Page2() {
  const { documents, searchQuery } = useAppContext();
  const navigate = useNavigate();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'learning' | 'mastered'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az'>('newest');

  const folders = Array.from(new Set(documents.map(doc => doc.category)));

  const filteredDocs = documents
    .filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFolder = selectedFolder ? doc.category === selectedFolder : true;
      const matchesStatus = filterStatus === 'all' ? true : doc.reviewStatus === filterStatus;
      return matchesSearch && matchesFolder && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOrder === 'az') return a.title.localeCompare(b.title);
      return 0;
    });

  return (
    <div className="flex-1 overflow-y-auto px-10 py-10 max-w-6xl mx-auto w-full scrollbar-hide">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface">知识库</h1>
          {searchQuery && (
            <p className="text-sm text-on-surface-variant mt-1">当前结果来自全局搜索，可结合筛选与排序快速归档。</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus !== 'all' ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <Filter size={16} />
              筛选 {filterStatus !== 'all' && '• 1'}
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-lg z-10 py-2">
                <div className="px-4 py-2 text-xs font-bold text-outline uppercase">按状态</div>
                <button 
                  onClick={() => { setFilterStatus('all'); setShowFilterMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-container-low ${filterStatus === 'all' ? 'text-primary font-medium' : 'text-on-surface'}`}
                >全部</button>
                <button 
                  onClick={() => { setFilterStatus('learning'); setShowFilterMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-container-low ${filterStatus === 'learning' ? 'text-primary font-medium' : 'text-on-surface'}`}
                >学习中</button>
                <button 
                  onClick={() => { setFilterStatus('mastered'); setShowFilterMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-container-low ${filterStatus === 'mastered' ? 'text-primary font-medium' : 'text-on-surface'}`}
                >已掌握</button>
              </div>
            )}
          </div>
          <div className="relative">
            <button 
              onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              <ArrowUpDown size={16} />
              排序
            </button>
            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-lg z-10 py-2">
                <button 
                  onClick={() => { setSortOrder('newest'); setShowSortMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-container-low ${sortOrder === 'newest' ? 'text-primary font-medium' : 'text-on-surface'}`}
                >按创建时间 (最新)</button>
                <button 
                  onClick={() => { setSortOrder('oldest'); setShowSortMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-container-low ${sortOrder === 'oldest' ? 'text-primary font-medium' : 'text-on-surface'}`}
                >按创建时间 (最早)</button>
                <button 
                  onClick={() => { setSortOrder('az'); setShowSortMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-container-low ${sortOrder === 'az' ? 'text-primary font-medium' : 'text-on-surface'}`}
                >按标题 (A-Z)</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Folders */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-on-surface">文件夹</h2>
          {selectedFolder && (
            <button 
              onClick={() => setSelectedFolder(null)}
              className="text-sm text-primary hover:underline"
            >
              清除筛选
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <div 
              key={folder} 
              onClick={() => setSelectedFolder(folder === selectedFolder ? null : folder)}
              className={`p-4 border rounded-xl transition-all cursor-pointer group ${
                selectedFolder === folder 
                  ? 'bg-primary/5 border-primary shadow-sm' 
                  : 'bg-surface-container-lowest border-outline-variant/20 hover:border-primary/30 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${
                  selectedFolder === folder ? 'bg-primary text-on-primary' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary'
                }`}>
                  <Folder size={20} />
                </div>
                <span className="font-medium text-on-surface">{folder}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Documents */}
      <div>
        <h2 className="text-lg font-bold text-on-surface mb-4">
          {searchQuery ? `搜索结果: "${searchQuery}"` : selectedFolder ? `${selectedFolder} 下的文档` : '所有文档'}
        </h2>
        {filteredDocs.length > 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/20">
                  <th className="px-6 py-4 text-xs font-semibold text-outline uppercase tracking-wider">标题</th>
                  <th className="px-6 py-4 text-xs font-semibold text-outline uppercase tracking-wider">文件夹</th>
                  <th className="px-6 py-4 text-xs font-semibold text-outline uppercase tracking-wider">创建时间</th>
                  <th className="px-6 py-4 text-xs font-semibold text-outline uppercase tracking-wider text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredDocs.map((doc) => (
                  <tr 
                    key={doc.id} 
                    onClick={() => navigate(`/page1?id=${doc.id}`)}
                    className="hover:bg-surface-container-low/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-primary/70" />
                        <span className="font-medium text-on-surface group-hover:text-primary transition-colors">{doc.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-surface-container rounded-md text-xs font-medium text-on-surface-variant">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {doc.createdAt}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); /* Add menu logic here */ }}
                        className="p-1.5 text-outline hover:text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-surface-container-lowest border border-outline-variant/20 rounded-xl">
            <FileText size={48} className="mx-auto text-outline-variant mb-4" />
            <p className="text-on-surface-variant">没有找到匹配的文档</p>
          </div>
        )}
      </div>
    </div>
  );
}
