export interface SystemDoc {
  systemKey: string;
  systemVersion: string;
  title: string;
  category: string;
  content: string;
  summary: string[];
  tags: string[];
  imageUrl: string | null;
}

export const SYSTEM_DOCS: SystemDoc[] = [
  {
    systemKey: 'cognitive-load-digital-age',
    systemVersion: '1.0',
    title: '数字时代的认知负载：如何在碎片化信息中建立深层知识体系',
    category: '认知科学',
    content: '在当今这个实时连接的世界里，我们每天处理的信息量已经远远超过了工业时代的周总量。然而，这种信息的"丰饶"往往伴随着深层理解的"贫瘠"。当我们的注意力不断在社交媒体、新闻推送和各种通知之间切换时，大脑的认知资源被极度摊薄。\n\n建立知识的"索引系统"\n传统的笔记系统往往是层级化的，这种从属关系在面对跨学科知识时显得捉襟见肘。现代个人知识管理（PKM）提倡的是一种"网络化"的思维模式。不再是把笔记放进文件夹，而是让笔记之间通过关键词和上下文产生关联。\n\n这种方法的核心在于"原子化"。每一篇笔记应该只包含一个核心概念，这样它才能更灵活地与其他概念组合。就像乐高积木一样，单一的方块没有意义，但无限的组合可能构成了宏大的建筑。\n\n"知识不是你拥有的资产，而是你建立的连接。"\n\n当我们开始在不同领域之间建立联系时，真正的洞察力便会产生。例如，将生物学的进化论应用到产品迭代中，或者将建筑学的模块化思维应用到软件开发里。这种跨界联觉正是数字工具能赋予我们的最大优势。',
    summary: ['信息过载并非源于数据量，而是缺乏有效的过滤与索引机制。', '知识的"碎片化"可以通过建立双向链接（Bi-directional Links）来重新结构化。', '深度学习需要有意识地制造"认知阻力"，如手写笔记或费曼技巧。'],
    tags: ['生产力', '知识管理'],
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop',
  },
  {
    systemKey: 'zettelkasten-second-brain',
    systemVersion: '1.0',
    title: 'Zettelkasten笔记法的核心：如何构建你的第二大脑',
    category: '工作',
    content: 'Zettelkasten（卡片盒笔记法）是卢曼发明的一种知识管理方法。它的核心在于将知识拆解为最小单元（原子化），并通过双向链接将这些卡片连接起来，形成一个网状的知识库。',
    summary: ['卡片盒笔记法的核心是原子化。', '通过双向链接建立知识网络。'],
    tags: ['生产力', '笔记'],
    imageUrl: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?q=80&w=2070&auto=format&fit=crop',
  },
  {
    systemKey: 'deep-work-focus',
    systemVersion: '1.0',
    title: '深度工作：在嘈杂世界中保持专注的法门',
    category: '阅读',
    content: '深度工作是指在无干扰的状态下进行专注的职业活动，使个人的认知能力达到极限。这种努力能够创造新价值，提升技能，而且难以复制。',
    summary: ['深度工作能创造巨大价值。', '网络工具会削弱深度工作的能力。'],
    tags: ['专注', '时间管理'],
    imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop',
  },
  {
    systemKey: 'react-performance-guide',
    systemVersion: '1.0',
    title: 'React 性能优化指南',
    category: '技术',
    content: 'React 性能优化的关键在于减少不必要的渲染。我们可以使用 React.memo 来缓存组件，使用 useMemo 和 useCallback 来缓存计算结果和函数引用。',
    summary: ['使用 React.memo 避免重复渲染。', '合理使用 useMemo 和 useCallback。'],
    tags: ['前端', 'React'],
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop',
  },
  {
    systemKey: 'design-system-v2',
    systemVersion: '1.0',
    title: '设计系统规范 v2.0',
    category: '设计',
    content: '设计系统是保持产品视觉和交互一致性的基础。它不仅包含颜色、字体、间距等基础规范，还包括可复用的组件库和交互模式。',
    summary: ['统一颜色和排版规范。', '建立可复用的组件库。'],
    tags: ['UI/UX', '规范'],
    imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop',
  },
];
