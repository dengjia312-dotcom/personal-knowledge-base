import React, { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, CircleDot, Filter, Network, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrainGraph from '../components/BrainGraph';
import BrainNodePanel from '../components/BrainNodePanel';
import { useAppContext } from '../context/AppContext';
import {
  buildBrainGraph,
  filterBrainGraph,
  getBrainCategories,
  getBrainGraphStats,
  getBrainNodeById,
  getCategoryColor,
  getRelatedNodes,
} from '../utils/brainGraph';

export default function BrainView() {
  const { documents } = useAppContext();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isolatedOnly, setIsolatedOnly] = useState(false);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const fullGraphData = useMemo(() => buildBrainGraph(documents), [documents]);
  const categories = useMemo(() => getBrainCategories(fullGraphData), [fullGraphData]);
  const filteredGraphData = useMemo(
    () =>
      filterBrainGraph(fullGraphData, {
        query,
        category: selectedCategory,
        isolatedOnly,
        reviewOnly,
      }),
    [fullGraphData, query, selectedCategory, isolatedOnly, reviewOnly]
  );
  const stats = useMemo(() => getBrainGraphStats(filteredGraphData), [filteredGraphData]);
  const selectedNode = useMemo(
    () => getBrainNodeById(fullGraphData, selectedNodeId),
    [fullGraphData, selectedNodeId]
  );
  const relatedNodes = useMemo(
    () => getRelatedNodes(fullGraphData, selectedNodeId),
    [fullGraphData, selectedNodeId]
  );
  const searchMatchedIds = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return new Set<string>();
    return new Set(
      fullGraphData.nodes
        .filter((node) => node.title.toLowerCase().includes(normalized))
        .map((node) => node.id)
    );
  }, [fullGraphData.nodes, query]);
  const focusNodeId = selectedNodeId ?? Array.from(searchMatchedIds)[0] ?? null;

  useEffect(() => {
    if (!selectedNodeId) return;
    const visible = filteredGraphData.nodes.some((node) => node.id === selectedNodeId);
    if (!visible) {
      setSelectedNodeId(null);
    }
  }, [filteredGraphData.nodes, selectedNodeId]);

  const hasDocuments = documents.length > 0;
  const hasVisibleNodes = filteredGraphData.nodes.length > 0;

  return (
    <div className="h-[calc(100vh-4rem)] min-h-[680px] overflow-hidden bg-[#070b14] text-slate-100">
      <div className="grid h-full grid-cols-1 grid-rows-[auto_minmax(420px,1fr)_auto] md:grid-cols-[292px_minmax(0,1fr)_340px] md:grid-rows-1">
        <aside className="min-h-0 overflow-y-auto border-b border-white/10 bg-[#0c111d] px-4 py-4 md:border-b-0 md:border-r md:px-5 md:py-5 scrollbar-hide">
          <div className="mb-5">
            <div className="mb-2 flex items-center gap-2 text-cyan-200">
              <BrainCircuit size={22} />
              <h1 className="text-xl font-bold text-white">知识脑图</h1>
            </div>
            <p className="text-sm leading-6 text-slate-400">
              用 3D 关系网络查看主题簇、孤立节点、待复习知识和高连接知识点。
            </p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                <Search size={14} />
                搜索标题
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="输入知识标题"
                className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/15"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                <Filter size={14} />
                分类筛选
              </span>
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#141a2a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/15"
              >
                <option value="">全部分类</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3">
                <span className="text-sm font-medium text-slate-200">仅看孤立节点</span>
                <input
                  type="checkbox"
                  checked={isolatedOnly}
                  onChange={(event) => setIsolatedOnly(event.target.checked)}
                  className="h-4 w-4 accent-cyan-300"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3">
                <span className="text-sm font-medium text-slate-200">仅看待复习节点</span>
                <input
                  type="checkbox"
                  checked={reviewOnly}
                  onChange={(event) => setReviewOnly(event.target.checked)}
                  className="h-4 w-4 accent-cyan-300"
                />
              </label>
            </div>

            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Network size={15} className="text-cyan-200" />
                当前视图统计
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-black/20 p-2.5">
                  <p className="text-[11px] text-slate-500">知识节点数</p>
                  <p className="text-xl font-bold text-white">{stats.nodeCount}</p>
                </div>
                <div className="rounded-md bg-black/20 p-2.5">
                  <p className="text-[11px] text-slate-500">关系数</p>
                  <p className="text-xl font-bold text-white">{stats.linkCount}</p>
                </div>
                <div className="rounded-md bg-black/20 p-2.5">
                  <p className="text-[11px] text-slate-500">孤立节点数</p>
                  <p className="text-xl font-bold text-white">{stats.isolatedCount}</p>
                </div>
                <div className="rounded-md bg-black/20 p-2.5">
                  <p className="text-[11px] text-slate-500">待复习节点数</p>
                  <p className="text-xl font-bold text-cyan-200">{stats.reviewDueCount}</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <CircleDot size={15} className="text-cyan-200" />
                分类颜色
              </div>
              <div className="space-y-2">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category === selectedCategory ? '' : category)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-300 transition hover:bg-white/8"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: getCategoryColor(category) }}
                      />
                      <span className="truncate">{category}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">暂无分类</p>
                )}
              </div>
            </section>
          </div>
        </aside>

        <main className="relative min-h-0">
          {!hasDocuments ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center bg-[#070b14] px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                <Sparkles size={24} />
              </div>
              <h2 className="text-xl font-bold text-white">暂无知识节点，请先创建知识内容。</h2>
              <button
                type="button"
                onClick={() => navigate('/page3')}
                className="mt-5 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
              >
                去新建知识
              </button>
            </div>
          ) : (
            <>
              <BrainGraph
                graphData={filteredGraphData}
                selectedNodeId={selectedNodeId}
                hoveredNodeId={hoveredNodeId}
                focusNodeId={focusNodeId}
                searchMatchedIds={searchMatchedIds}
                onNodeClick={(node) => setSelectedNodeId(node.id)}
                onNodeHover={setHoveredNodeId}
              />
              {!hasVisibleNodes && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#070b14]/70 px-6 text-center backdrop-blur-sm">
                  <div className="max-w-sm rounded-lg border border-white/10 bg-[#101421]/90 p-5">
                    <h2 className="text-lg font-bold text-white">当前筛选下没有节点</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      调整搜索、分类或筛选条件后再查看知识关系。
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        <BrainNodePanel
          node={selectedNode}
          relatedNodes={relatedNodes}
          onOpenDetail={(nodeId) => navigate(`/page1?id=${nodeId}`)}
          onSelectNode={setSelectedNodeId}
        />
      </div>
    </div>
  );
}

