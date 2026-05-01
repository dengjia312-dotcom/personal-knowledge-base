import { Document } from '../context/AppContext';

export type BrainReviewStatus = 'learning' | 'mastered';

export interface BrainNode {
  id: string;
  title: string;
  category: string;
  tags: string[];
  summary: string[];
  createdAt: string;
  lastReviewAt?: string;
  reviewStatus: BrainReviewStatus;
  connectionCount: number;
  isolated: boolean;
  contentLength: number;
  x?: number;
  y?: number;
  z?: number;
}

export interface BrainLink {
  source: string;
  target: string;
  weight: number;
  reason: string;
  sharedTags: string[];
  sameCategory: boolean;
}

export interface BrainGraphData {
  nodes: BrainNode[];
  links: BrainLink[];
}

export interface BrainRelatedNode {
  node: BrainNode;
  link: BrainLink;
}

export interface BrainGraphStats {
  nodeCount: number;
  linkCount: number;
  isolatedCount: number;
  reviewDueCount: number;
  largestCategory: {
    category: string;
    count: number;
    ratio: number;
  } | null;
  topConnectedNode: BrainNode | null;
}

export interface BrainGraphFilters {
  query?: string;
  category?: string;
  isolatedOnly?: boolean;
  reviewOnly?: boolean;
}

export interface BrainGraphInsight {
  id: string;
  message: string;
  tone: 'warning' | 'info' | 'success';
}

const CATEGORY_COLORS = [
  '#7c9cff',
  '#43d6b5',
  '#f6c96f',
  '#f28b82',
  '#b58cff',
  '#63c7ff',
  '#9dd672',
  '#f59bd6',
  '#ff9f6e',
  '#a7b4ff',
];

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);
}

function getPairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

function getSharedTags(a: BrainNode, b: BrainNode): string[] {
  const bTags = new Set(b.tags.map((tag) => tag.toLowerCase()));
  return a.tags.filter((tag) => bTags.has(tag.toLowerCase()));
}

function getTagWeight(sharedTags: string[]): number {
  if (sharedTags.length === 1) return 2;
  return Math.min(6, sharedTags.length + 1);
}

function createNode(doc: Document): BrainNode {
  return {
    id: String(doc.id),
    title: doc.title || '未命名知识',
    category: doc.category || '未分类',
    tags: normalizeStringList(doc.tags),
    summary: normalizeStringList(doc.summary),
    createdAt: doc.createdAt || '',
    lastReviewAt: doc.lastReviewAt,
    reviewStatus: doc.reviewStatus === 'mastered' ? 'mastered' : 'learning',
    connectionCount: 0,
    isolated: false,
    contentLength: doc.content?.length ?? 0,
  };
}

export function buildBrainGraph(documents: Document[]): BrainGraphData {
  const nodes = documents.map(createNode);
  const linksByPair = new Map<string, BrainLink>();

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const source = nodes[i];
      const target = nodes[j];
      const sharedTags = getSharedTags(source, target);
      const sameCategory = source.category === target.category;

      if (!sameCategory && sharedTags.length === 0) continue;

      const key = getPairKey(source.id, target.id);

      if (sharedTags.length > 0) {
        linksByPair.set(key, {
          source: source.id,
          target: target.id,
          weight: getTagWeight(sharedTags),
          reason: `共享标签：${sharedTags.join('、')}`,
          sharedTags,
          sameCategory,
        });
        continue;
      }

      linksByPair.set(key, {
        source: source.id,
        target: target.id,
        weight: 1,
        reason: `同分类：${source.category}`,
        sharedTags: [],
        sameCategory,
      });
    }
  }

  const links = Array.from(linksByPair.values());
  const connectionCount = new Map<string, number>();

  for (const link of links) {
    connectionCount.set(link.source, (connectionCount.get(link.source) ?? 0) + 1);
    connectionCount.set(link.target, (connectionCount.get(link.target) ?? 0) + 1);
  }

  const nodesWithStats = nodes.map((node) => {
    const count = connectionCount.get(node.id) ?? 0;
    return {
      ...node,
      connectionCount: count,
      isolated: count === 0,
    };
  });

  return {
    nodes: nodesWithStats,
    links,
  };
}

export function filterBrainGraph(graphData: BrainGraphData, filters: BrainGraphFilters): BrainGraphData {
  const query = filters.query?.trim().toLowerCase() ?? '';
  const visibleNodes = graphData.nodes.filter((node) => {
    const matchesQuery = query ? node.title.toLowerCase().includes(query) : true;
    const matchesCategory = filters.category ? node.category === filters.category : true;
    const matchesIsolated = filters.isolatedOnly ? node.isolated : true;
    const matchesReview = filters.reviewOnly ? node.reviewStatus !== 'mastered' : true;
    return matchesQuery && matchesCategory && matchesIsolated && matchesReview;
  });
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const visibleLinks = graphData.links.filter(
    (link) => visibleIds.has(link.source) && visibleIds.has(link.target)
  );

  return {
    nodes: visibleNodes,
    links: visibleLinks,
  };
}

export function getBrainGraphStats(graphData: BrainGraphData): BrainGraphStats {
  const categoryCount = new Map<string, number>();
  for (const node of graphData.nodes) {
    categoryCount.set(node.category, (categoryCount.get(node.category) ?? 0) + 1);
  }

  const largestCategoryEntry = Array.from(categoryCount.entries()).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  )[0];

  const topConnectedNode = getTopConnectedNodes(graphData, 1)[0] ?? null;

  return {
    nodeCount: graphData.nodes.length,
    linkCount: graphData.links.length,
    isolatedCount: graphData.nodes.filter((node) => node.isolated).length,
    reviewDueCount: graphData.nodes.filter((node) => node.reviewStatus !== 'mastered').length,
    largestCategory: largestCategoryEntry
      ? {
          category: largestCategoryEntry[0],
          count: largestCategoryEntry[1],
          ratio: graphData.nodes.length > 0 ? largestCategoryEntry[1] / graphData.nodes.length : 0,
        }
      : null,
    topConnectedNode,
  };
}

export function getTopConnectedNodes(graphData: BrainGraphData, limit = 5): BrainNode[] {
  return [...graphData.nodes]
    .filter((node) => node.connectionCount > 0)
    .sort(
      (a, b) =>
        b.connectionCount - a.connectionCount ||
        a.title.localeCompare(b.title) ||
        a.id.localeCompare(b.id)
    )
    .slice(0, limit);
}

export function getBrainGraphInsights(graphData: BrainGraphData): BrainGraphInsight[] {
  const stats = getBrainGraphStats(graphData);
  const insights: BrainGraphInsight[] = [];

  if (stats.isolatedCount > 0) {
    insights.push({
      id: 'isolated',
      tone: 'warning',
      message: `有 ${stats.isolatedCount} 个孤立知识，建议补充标签或关联到已有主题。`,
    });
  }

  if (stats.reviewDueCount > 0) {
    insights.push({
      id: 'review',
      tone: 'info',
      message: `有 ${stats.reviewDueCount} 个知识待复习，建议优先处理。`,
    });
  }

  if (stats.nodeCount > 1 && stats.linkCount < Math.max(1, Math.floor(stats.nodeCount / 2))) {
    insights.push({
      id: 'weak-links',
      tone: 'warning',
      message: '当前知识关系较弱，建议补充更稳定的标签。',
    });
  }

  if (stats.topConnectedNode) {
    insights.push({
      id: 'core-node',
      tone: 'success',
      message: `当前核心知识节点是：${stats.topConnectedNode.title}。`,
    });
  }

  if (stats.largestCategory && stats.largestCategory.ratio >= 0.5 && stats.nodeCount >= 4) {
    insights.push({
      id: 'category-focus',
      tone: 'info',
      message: `当前知识集中在 ${stats.largestCategory.category}，可考虑补充其他方向。`,
    });
  }

  if (insights.length === 0 && stats.nodeCount > 0) {
    insights.push({
      id: 'healthy',
      tone: 'success',
      message: '当前知识网络结构较均衡，可以继续补充高质量标签和复习记录。',
    });
  }

  return insights;
}

export function getBrainCategories(graphData: BrainGraphData): string[] {
  return Array.from(new Set(graphData.nodes.map((node) => node.category))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export function getBrainNodeById(graphData: BrainGraphData, nodeId: string | null): BrainNode | null {
  if (!nodeId) return null;
  return graphData.nodes.find((node) => node.id === nodeId) ?? null;
}

export function getRelatedNodes(graphData: BrainGraphData, nodeId: string | null): BrainRelatedNode[] {
  if (!nodeId) return [];
  return graphData.links
    .reduce<BrainRelatedNode[]>((items, link) => {
      const sourceId = getLinkEndpointId(link.source);
      const targetId = getLinkEndpointId(link.target);
      const relatedId = sourceId === nodeId ? targetId : targetId === nodeId ? sourceId : null;
      if (!relatedId) return items;

      const node = graphData.nodes.find((item) => item.id === relatedId);
      if (node) {
        items.push({ node, link });
      }
      return items;
    }, [])
    .sort((a, b) => b.link.weight - a.link.weight || a.node.title.localeCompare(b.node.title));
}

export function getNeighborIds(graphData: BrainGraphData, nodeId: string | null): Set<string> {
  const ids = new Set<string>();
  if (!nodeId) return ids;

  for (const link of graphData.links) {
    const sourceId = getLinkEndpointId(link.source);
    const targetId = getLinkEndpointId(link.target);

    if (sourceId === nodeId) ids.add(targetId);
    if (targetId === nodeId) ids.add(sourceId);
  }

  return ids;
}

export function getLinkEndpointId(endpoint: string | { id?: string | number } | number | undefined): string {
  if (typeof endpoint === 'object' && endpoint !== null) {
    return String(endpoint.id ?? '');
  }
  return String(endpoint ?? '');
}

export function isReviewDue(node: BrainNode): boolean {
  return node.reviewStatus !== 'mastered';
}

export function getCategoryColor(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash * 31 + category.charCodeAt(i)) % CATEGORY_COLORS.length;
  }
  return CATEGORY_COLORS[Math.abs(hash)];
}

export function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const fullValue = value.length === 3
    ? value.split('').map((part) => part + part).join('')
    : value;
  const r = parseInt(fullValue.slice(0, 2), 16);
  const g = parseInt(fullValue.slice(2, 4), 16);
  const b = parseInt(fullValue.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
