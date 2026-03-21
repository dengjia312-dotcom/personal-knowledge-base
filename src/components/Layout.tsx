import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Library,
  PlusCircle,
  BookOpen,
  Settings,
  HelpCircle,
  Search,
  Bell,
  MessageCircle
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Layout() {
  const { userProfile, searchQuery, setSearchQuery } = useAppContext();
  const navigate = useNavigate();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (window.location.pathname !== '/page2') {
      navigate('/page2');
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-on-surface font-body selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Sidebar */}
      <aside className="w-[280px] h-screen sticky top-0 left-0 bg-slate-50 flex flex-col py-8 px-4 font-headline text-sm tracking-wide border-r border-slate-100">
        <div className="mb-10 px-4">
          <span className="text-xl font-bold text-indigo-600">数字工坊</span>
          <p className="text-xs text-slate-400 mt-1">个人知识库</p>
        </div>
        <nav className="flex-1 space-y-2">
          <NavLink to="/page1" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${isActive ? 'text-indigo-700 font-semibold border-r-2 border-indigo-600 bg-slate-200/50' : 'text-slate-500 hover:text-indigo-500 hover:bg-slate-200/50'}`}>
            <LayoutDashboard size={20} />
            <span>工作台</span>
          </NavLink>
          <NavLink to="/page2" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${isActive ? 'text-indigo-700 font-semibold border-r-2 border-indigo-600 bg-slate-200/50' : 'text-slate-500 hover:text-indigo-500 hover:bg-slate-200/50'}`}>
            <Library size={20} />
            <span>知识库</span>
          </NavLink>
          <NavLink to="/page3" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${isActive ? 'text-indigo-700 font-semibold border-r-2 border-indigo-600 bg-slate-200/50' : 'text-slate-500 hover:text-indigo-500 hover:bg-slate-200/50'}`}>
            <PlusCircle size={20} />
            <span>新建</span>
          </NavLink>
          <NavLink to="/page4" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${isActive ? 'text-indigo-700 font-semibold border-r-2 border-indigo-600 bg-slate-200/50' : 'text-slate-500 hover:text-indigo-500 hover:bg-slate-200/50'}`}>
            <BookOpen size={20} />
            <span>复习</span>
          </NavLink>
        </nav>
        <div className="mt-auto space-y-2 border-t border-slate-100 pt-6">
          <NavLink to="/page5" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${isActive ? 'text-indigo-700 font-semibold border-r-2 border-indigo-600 bg-slate-200/50' : 'text-slate-500 hover:text-indigo-500 hover:bg-slate-200/50'}`}>
            <Settings size={20} />
            <span>设置</span>
          </NavLink>
          <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-indigo-500 hover:bg-slate-200/50 transition-colors duration-200" href="#">
            <HelpCircle size={20} />
            <span>帮助</span>
          </a>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="w-full h-16 sticky top-0 z-40 bg-white/80 backdrop-blur-md flex justify-between items-center px-8 border-b border-slate-100/50 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                placeholder="搜索知识点..." 
                type="text" 
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-indigo-500 transition-opacity opacity-80 hover:opacity-100">
              <Bell size={20} />
            </button>
            <button className="text-slate-400 hover:text-indigo-500 transition-opacity opacity-80 hover:opacity-100" onClick={() => navigate('/page5')}>
              <Settings size={20} />
            </button>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/page5')}>
              <span className="text-sm font-medium text-on-surface-variant hidden md:block">{userProfile.nickname}</span>
              <img 
                alt="User Profile" 
                className="w-8 h-8 rounded-full ring-2 ring-primary/10 object-cover" 
                src={userProfile.avatar} 
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 flex overflow-hidden">
          <Outlet />
        </main>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-10 right-10 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
        <MessageCircle size={24} fill="currentColor" />
      </button>
    </div>
  );
}
