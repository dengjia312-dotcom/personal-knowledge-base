import React, { useState } from 'react';
import { KnowledgeNode } from '../types';
import { Sparkles, Link2, ChevronRight, Bot } from 'lucide-react';

interface Props {
  node: KnowledgeNode;
  allNodes: KnowledgeNode[];
  onSelectNode: (id: string) => void;
}

// Minimal inline markdown: handles **bold** and newlines
function renderText(text: string) {
  return text.split('\n').map((line, li) => {
    const segments = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <React.Fragment key={li}>
        {segments.map((seg, si) =>
          seg.startsWith('**') && seg.endsWith('**') ? (
            <strong key={si} style={{ color: '#e8e6ff', fontWeight: 600 }}>
              {seg.slice(2, -2)}
            </strong>
          ) : (
            seg
          )
        )}
        {li < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export default function NodePanel({ node, allNodes, onSelectNode }: Props) {
  const [activeQ, setActiveQ] = useState<number | null>(null);

  // Reset active question when node changes
  React.useEffect(() => {
    setActiveQ(null);
  }, [node.id]);

  const relatedNodes = allNodes.filter((n) => node.relatedIds.includes(n.id));

  const handleQuestion = (idx: number) => {
    setActiveQ((prev) => (prev === idx ? null : idx));
  };

  return (
    <aside
      className="h-full flex flex-col overflow-y-auto scrollbar-hide"
      style={{ background: '#0d0d18', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Node Header */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Category badge */}
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide"
          style={{
            background: `${node.categoryColor}18`,
            color: node.categoryColor,
            border: `1px solid ${node.categoryColor}35`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: node.categoryColor, boxShadow: `0 0 5px ${node.categoryColor}` }}
          />
          {node.category}
        </span>

        {/* Title */}
        <h2
          className="mt-3 text-lg font-bold leading-tight"
          style={{ color: '#e8e6ff', fontFamily: '"Plus Jakarta Sans","PingFang SC",sans-serif' }}
        >
          {node.title}
        </h2>
      </div>

      {/* Summary */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p
          className="text-[11px] font-semibold tracking-widest uppercase mb-2"
          style={{ color: 'rgba(150,148,210,0.45)' }}
        >
          摘要
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(190,186,240,0.75)' }}>
          {node.summary}
        </p>
      </div>

      {/* Related nodes */}
      {relatedNodes.length > 0 && (
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <p
            className="text-[11px] font-semibold tracking-widest uppercase mb-2.5"
            style={{ color: 'rgba(150,148,210,0.45)' }}
          >
            关联主题
          </p>
          <div className="flex flex-wrap gap-1.5">
            {relatedNodes.map((rn) => (
              <button
                key={rn.id}
                onClick={() => onSelectNode(rn.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all duration-150"
                style={{
                  background: `${rn.categoryColor}12`,
                  color: rn.categoryColor,
                  border: `1px solid ${rn.categoryColor}30`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${rn.categoryColor}25`;
                  e.currentTarget.style.borderColor = `${rn.categoryColor}60`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${rn.categoryColor}12`;
                  e.currentTarget.style.borderColor = `${rn.categoryColor}30`;
                }}
              >
                <Link2 size={10} />
                {rn.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested questions */}
      <div className="px-5 py-4 flex-1">
        <p
          className="text-[11px] font-semibold tracking-widest uppercase mb-3"
          style={{ color: 'rgba(150,148,210,0.45)' }}
        >
          围绕此节点提问
        </p>
        <div className="space-y-2">
          {node.suggestedQuestions.map((q, idx) => (
            <div key={idx}>
              {/* Question button */}
              <button
                onClick={() => handleQuestion(idx)}
                className="w-full text-left flex items-start gap-2 px-3 py-2.5 rounded-xl transition-all duration-150"
                style={{
                  background:
                    activeQ === idx
                      ? `${node.categoryColor}18`
                      : 'rgba(255,255,255,0.04)',
                  border:
                    activeQ === idx
                      ? `1px solid ${node.categoryColor}40`
                      : '1px solid rgba(255,255,255,0.06)',
                }}
                onMouseEnter={(e) => {
                  if (activeQ !== idx)
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                }}
                onMouseLeave={(e) => {
                  if (activeQ !== idx)
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
              >
                <Sparkles
                  size={13}
                  className="mt-0.5 shrink-0"
                  style={{ color: activeQ === idx ? node.categoryColor : 'rgba(150,148,200,0.5)' }}
                />
                <span
                  className="text-xs leading-relaxed"
                  style={{
                    color: activeQ === idx ? '#e8e6ff' : 'rgba(190,186,240,0.7)',
                    fontWeight: activeQ === idx ? 500 : 400,
                  }}
                >
                  {q}
                </span>
                <ChevronRight
                  size={12}
                  className="ml-auto mt-0.5 shrink-0 transition-transform duration-200"
                  style={{
                    color: 'rgba(150,148,200,0.4)',
                    transform: activeQ === idx ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}
                />
              </button>

              {/* Answer panel */}
              {activeQ === idx && (
                <div
                  className="mt-1.5 mx-1 px-3 py-3 rounded-xl text-xs leading-relaxed"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(185,182,235,0.8)',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Bot size={12} style={{ color: node.categoryColor }} />
                    <span
                      className="text-[10px] font-semibold tracking-wider uppercase"
                      style={{ color: node.categoryColor }}
                    >
                      Mock · AI 回答
                    </span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {renderText(node.mockAnswers[idx] ?? '暂无回答')}
                  </div>

                  {/* AI extension placeholder */}
                  {/* TODO: 接入真实 AI 时，替换此处 mock 数据，调用 /api/ask 接口：
                      POST { nodeId: node.id, question: q } → { answer: string }
                      可复用 server.ts 中的 Gemini 调用逻辑 */}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer: AI connect hint */}
      <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: node.categoryColor }}
          />
          <p className="text-[10px]" style={{ color: 'rgba(120,118,180,0.45)' }}>
            当前为 Mock 模式 · 可接入真实 AI
          </p>
        </div>
      </div>
    </aside>
  );
}
