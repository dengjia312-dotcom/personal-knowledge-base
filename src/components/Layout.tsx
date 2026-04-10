import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Library,
  PlusCircle,
  BookOpen,
  Settings,
  HelpCircle,
  Search,
  Bell,
  Sun,
  Moon,
  Monitor,
  Network,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useTheme, ThemeMode } from '../hooks/useTheme';

const HELP_SEEN_KEY = 'lumenkb_help_seen';

function WelcomeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm p-8 flex flex-col gap-6 border border-outline-variant/20">
        <div>
          <h2 className="text-xl font-bold text-on-surface mb-3">欢迎使用 LumenKB</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            这是一个用于整理、沉淀和管理个人知识的空间。<br />
            你可以在这里新建内容、分类记录，并逐步形成自己的知识体系。<br />
            建议先从「新建」开始，创建你的第一条知识记录。
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity"
          >
            开始使用
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            稍后查看
          </button>
        </div>
      </div>
    </div>
  );
}

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'system', label: '跟随系统', icon: <Monitor size={15} /> },
  { value: 'light',  label: '浅色模式', icon: <Sun size={15} /> },
  { value: 'dark',   label: '深色模式', icon: <Moon size={15} /> },
];

// 导航项公用样式
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
    isActive
      ? 'text-primary font-semibold border-r-2 border-primary bg-primary/10'
      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
  }`;

export default function Layout() {
  const { userProfile, searchQuery, setSearchQuery } = useAppContext();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showThemeMenu) return;
    const handler = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showThemeMenu]);

  const [showWelcome, setShowWelcome] = React.useState(() => {
    return !localStorage.getItem(HELP_SEEN_KEY);
  });

  const closeWelcome = () => {
    localStorage.setItem(HELP_SEEN_KEY, '1');
    setShowWelcome(false);
  };

  const openHelp = () => {
    setShowWelcome(true);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (window.location.pathname !== '/page2') {
      navigate('/page2');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden w-full bg-background text-on-surface font-body selection:bg-primary-fixed selection:text-on-primary-fixed">
      {showWelcome && <WelcomeModal onClose={closeWelcome} />}

      {/* Sidebar */}
      <aside className="hidden md:flex w-[280px] shrink-0 h-full bg-surface-container-low flex-col py-8 px-4 font-headline text-sm tracking-wide border-r border-outline-variant/20 overflow-y-auto">
        <div className="mb-10 px-4">
          <span className="text-xl font-bold text-primary">信息分类</span>
          <p className="text-xs text-on-surface-variant mt-1">个人知识库</p>
        </div>
        <nav className="flex-1 space-y-2">
          <NavLink to="/page1" className={navLinkClass}>
            <LayoutDashboard size={20} />
            <span>工作台</span>
          </NavLink>
          <NavLink to="/page2" className={navLinkClass}>
            <Library size={20} />
            <span>知识库</span>
          </NavLink>
          <NavLink to="/page3" className={navLinkClass}>
            <PlusCircle size={20} />
            <span>新建</span>
          </NavLink>
          <NavLink to="/page4" className={navLinkClass}>
            <BookOpen size={20} />
            <span>复习</span>
          </NavLink>
        </nav>
        <div className="mt-auto space-y-2 border-t border-outline-variant/20 pt-6">
          <NavLink to="/page5" className={navLinkClass}>
            <Settings size={20} />
            <span>设置</span>
          </NavLink>
          <button
            onClick={openHelp}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors duration-200 w-full"
          >
            <HelpCircle size={20} />
            <span>帮助</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        {/* Top Navbar */}
        <header className="w-full max-w-full h-16 sticky top-0 z-40 bg-surface-container-lowest/80 backdrop-blur-md flex justify-between items-center px-4 md:px-8 border-b border-outline-variant/20 shadow-sm min-w-0">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0 mr-2 md:mr-4">
            <div className="relative w-full max-w-md min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
              <input
                className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none min-w-0"
                placeholder="搜索知识点..."
                type="text"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6 shrink-0">
            <button className="text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100">
              <Bell size={20} />
            </button>

            {/* 主题切换 */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setShowThemeMenu(v => !v)}
                className="text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100"
                title="切换主题"
              >
                {theme === 'dark' ? <Moon size={20} /> : theme === 'light' ? <Sun size={20} /> : <Monitor size={20} />}
              </button>
              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-surface-container-low border border-outline-variant/30 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
                  {THEME_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setTheme(opt.value); setShowThemeMenu(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                        theme === opt.value
                          ? 'text-primary bg-primary/10 font-medium'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              className="text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100"
              onClick={() => navigate('/page5')}
            >
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
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Knowledge Space floating entry button */}
      <Link
        to="/knowledge-space"
        title="进入 Knowledge Space"
        className="fixed bottom-20 right-5 md:bottom-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #2a2870 0%, #1a1a40 100%)',
          border: '1px solid rgba(148,150,255,0.35)',
          boxShadow: '0 4px 20px rgba(100,102,220,0.3)',
          color: '#c0c1ff',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
      >
        <Network size={15} />
        <span className="hidden sm:inline">Knowledge Space</span>
      </Link>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-low border-t border-outline-variant/20 flex justify-around items-center h-16 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <NavLink to="/page1" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-medium">工作台</span>
        </NavLink>
        <NavLink to="/page2" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
          <Library size={20} />
          <span className="text-[10px] font-medium">知识库</span>
        </NavLink>
        <NavLink to="/page3" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
          <PlusCircle size={20} />
          <span className="text-[10px] font-medium">新建</span>
        </NavLink>
        <NavLink to="/page4" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
          <BookOpen size={20} />
          <span className="text-[10px] font-medium">复习</span>
        </NavLink>
        <NavLink to="/page5" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
          <Settings size={20} />
          <span className="text-[10px] font-medium">设置</span>
        </NavLink>
      </nav>
    </div>
  );
}
