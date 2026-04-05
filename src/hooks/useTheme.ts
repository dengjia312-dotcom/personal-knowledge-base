import { useEffect, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'lumenkb_theme';

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else if (mode === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem(THEME_KEY) as ThemeMode) || 'system';
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // 跟随系统时，监听系统主题变化
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    localStorage.setItem(THEME_KEY, mode);
    setThemeState(mode);
  };

  return { theme, setTheme };
}
