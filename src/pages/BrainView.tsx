import React, { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, CircleDot, Filter, Network, Search, Sparkles, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrainGraph from '../components/BrainGraph';
import BrainNodePanel from '../components/BrainNodePanel';
import { useAppContext } from '../context/AppContext';
import {
  buildBrainGraph,
  filterBrainGraph,
  getBrainCategories,
  getBrainGraphInsights,
  getBrainGraphStats,
  getBrainNodeById,
  getCategoryColor,
  getRelatedNodes,
  getTopConnectedNodes,
} from '../utils/brainGraph';

function getInsightClass(tone: 'warning' | 'info' | 'success'): string {
  if (tone === 'warning') return 'border-amber-300/20 bg-amber-300/10 text-amber-100';
  if (tone === 'success') return 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100';
  return 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100';
}

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
  const overviewStats = useMemo(() => getBrainGraphStats(fullGraphData), [fullGraphData]);
  const graphInsights = useMemo(() => getBrainGraphInsights(fullGraphData), [fullGraphData]);
  const topConnectedNodes = useMemo(() => getTopConnectedNodes(fullGraphData, 5), [fullGraphData]);
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
  const filteredStats = useMemo(() => getBrainGraphStats(filteredGraphData), [filteredGraphData]);
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

  const handleSelectRankedNode = (nodeId: string) => {
    setQuery('');
    setSelectedCategory('');
    setIsolatedOnly(false);
    setReviewOnly(false);
    setSelectedNodeId(nodeId);
  };

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
                认知结构总览
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-black/20 p-2.5">
                  <p className="text-[11px] text-slate-500">知识节点数</p>
                  <p className="text-xl font-bold text-white">{overviewStats.nodeCount}</p>
                </div>
                <div className="rounded-md bg-black/20 p-2.5">
                  <p className="text-[11px] text-slate-500">关系数</p>
                  <p className="text-xl font-bold text-white">{overviewStats.linkCount}</p>
                </div>
                <div className="rounded-md bg-black/20 p-2.5">
                  <p className="text-[11px] text-slate-500">孤立节点数</p>
                  <p className="text-xl font-bold text-white">{overviewStats.isolatedCount}</p>
                </div>
                <div className="rounded-md bg-black/20 p-2.5">
                  <p className="text-[11px] text-slate-500">待复习节点数</p>
                  <p className="text-xl font-bold text-cyan-200">{overviewStats.reviewDueCount}</p>
                </div>
                <div className="rounded-md bg-black/20 p-2.5">
                  <p className="text-[11px] text-slate-500">最大分类/主题</p>
                  <p className="mt-1 truncate text-sm font-bold text-white">
                    {overviewStats.largestCategory
                      ? `${overviewStats.largestCategory.category} · ${overviewStats.largestCategory.count}`
                      : '暂无'}
                  </p>
                </div>
                <div className="rounded-md bg-black/20 p-2.5">
                  <p className="text-[11px] text-slate-500">最高连接节点</p>
                  <p className="mt-1 truncate text-sm font-bold text-white">
                    {overviewStats.topConnectedNode
                      ? `${overviewStats.topConnectedNode.title} · ${overviewStats.topConnectedNode.connectionCount}`
                      : '暂无'}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-slate-500">
                当前筛选视图：{filteredStats.nodeCount} 个节点 / {filteredStats.linkCount} 条关系
              </p>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles size={15} className="text-cyan-200" />
                整理建议
              </div>
              <div className="space-y-2">
                {graphInsights.map((insight) => (
                  <p
                    key={insight.id}
                    className={`rounded-md border px-3 py-2 text-xs leading-5 ${getInsightClass(insight.tone)}`}
                  >
                    {insight.message}
                  </p>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Trophy size={15} className="text-cyan-200" />
                高关联知识排行
              </div>
              {topConnectedNodes.length > 0 ? (
                <div className="space-y-2">
                  {topConnectedNodes.map((node, index) => {
                    const active = node.id === selectedNodeId;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => handleSelectRankedNode(node.id)}
                        className={`w-full rounded-md border px-3 py-2 text-left transition ${
                          active
                            ? 'border-cyan-300/50 bg-cyan-300/10'
                            : 'border-white/10 bg-black/15 hover:border-cyan-300/30 hover:bg-cyan-300/10'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 text-xs font-bold text-cyan-200">{index + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-100">{node.title}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {node.category} · {node.connectionCount} 个连接
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-md border border-white/10 bg-black/15 px-3 py-2 text-xs leading-5 text-slate-500">
                  暂无高关联节点，先为知识补充更稳定的标签。
                </p>
              )}
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
          coreNodeId={overviewStats.topConnectedNode?.id ?? null}
          onOpenDetail={(nodeId) => navigate(`/page1?id=${nodeId}`)}
          onSelectNode={setSelectedNodeId}
        />
      </div>
    </div>
  );
}
