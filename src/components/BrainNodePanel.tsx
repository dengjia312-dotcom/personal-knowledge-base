import React from 'react';
import { Calendar, Clock3, ExternalLink, Link2, Network, Sparkles, Tags } from 'lucide-react';
import { BrainNode, BrainRelatedNode, getCategoryColor, isReviewDue } from '../utils/brainGraph';

interface BrainNodePanelProps {
  node: BrainNode | null;
  relatedNodes: BrainRelatedNode[];
  coreNodeId?: string | null;
  onOpenDetail: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
}

function formatDate(value?: string): string {
  if (!value) return '暂无记录';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getStatusLabel(node: BrainNode): string {
  return node.reviewStatus === 'mastered' ? '已掌握' : '待复习';
}

export default function BrainNodePanel({
  node,
  relatedNodes,
  coreNodeId,
  onOpenDetail,
  onSelectNode,
}: BrainNodePanelProps) {
  if (!node) {
    return (
      <aside className="h-full min-h-0 rounded-none border-l border-white/10 bg-[#101421] px-5 py-6 text-slate-300">
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400">
            <Network size={22} />
          </div>
          <h2 className="text-base font-semibold text-white">选择一个知识节点</h2>
          <p className="mt-2 max-w-[220px] text-sm leading-6 text-slate-400">
            点击图谱中的节点，查看摘要、标签、复习状态和一阶关联。
          </p>
        </div>
      </aside>
    );
  }

  const categoryColor = getCategoryColor(node.category);
  const reviewDue = isReviewDue(node);
  const isCoreNode = Boolean(coreNodeId && node.id === coreNodeId && node.connectionCount > 0);

  return (
    <aside className="h-full min-h-0 overflow-y-auto border-l border-white/10 bg-[#101421] px-5 py-5 text-slate-200 scrollbar-hide">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shadow-[0_0_18px_currentColor]"
              style={{ color: categoryColor, backgroundColor: categoryColor }}
            />
            <span className="text-xs font-semibold text-slate-400">{node.category}</span>
          </div>
          <h2 className="text-xl font-bold leading-snug text-white">{node.title}</h2>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            reviewDue
              ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/25'
              : 'bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/20'
          }`}
        >
          {getStatusLabel(node)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <p className="text-[11px] font-semibold uppercase text-slate-500">连接度</p>
          <p className="mt-1 text-2xl font-bold text-white">{node.connectionCount}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <p className="text-[11px] font-semibold uppercase text-slate-500">节点状态</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{node.isolated ? '孤立节点' : '已连接'}</p>
        </div>
      </div>

      {(node.isolated || isCoreNode) && (
        <div className="mt-4 space-y-2">
          {node.isolated && (
            <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
              这个知识暂时还没有进入知识网络，建议补充标签、分类或关联主题。
            </p>
          )}
          {isCoreNode && (
            <p className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm leading-6 text-cyan-100">
              这是一个知识枢纽节点，连接多个相关知识，适合作为复习或扩展入口。
            </p>
          )}
        </div>
      )}

      <div className="mt-5 space-y-4">
        <section>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Tags size={15} className="text-cyan-200" />
            标签
          </div>
          {node.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {node.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-medium text-slate-200 ring-1 ring-white/10">
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">暂无标签</p>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles size={15} className="text-amber-200" />
            AI 摘要
          </div>
          {node.summary.length > 0 ? (
            <ul className="space-y-2">
              {node.summary.map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-2 text-sm leading-6 text-slate-300">
                  <span className="mt-0.5 text-xs font-bold text-cyan-200">{index + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">暂无摘要</p>
          )}
        </section>

        <section className="space-y-2 rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Calendar size={14} className="text-slate-500" />
            创建时间：{formatDate(node.createdAt)}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Clock3 size={14} className="text-slate-500" />
            最近复习：{formatDate(node.lastReviewAt)}
          </div>
        </section>

        <section className="rounded-lg border border-dashed border-white/10 bg-white/[0.03] p-3">
          <p className="text-sm font-semibold text-slate-200">Insight</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">将在后续版本接入。</p>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Link2 size={15} className="text-cyan-200" />
            相关节点
          </div>
          {relatedNodes.length > 0 ? (
            <div className="space-y-2">
              {relatedNodes.map(({ node: relatedNode, link }) => (
                <button
                  key={relatedNode.id}
                  type="button"
                  onClick={() => onSelectNode(relatedNode.id)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-3 text-left transition-colors hover:border-cyan-300/40 hover:bg-cyan-300/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-slate-100">{relatedNode.title}</span>
                    <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-slate-300">
                      W{link.weight}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{link.reason}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-slate-500">
              暂无一阶关联，建议补充标签或归入更明确的分类。
            </p>
          )}
        </section>
      </div>

      <button
        type="button"
        onClick={() => onOpenDetail(node.id)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-200"
      >
        打开详情
        <ExternalLink size={15} />
      </button>
    </aside>
  );
}
