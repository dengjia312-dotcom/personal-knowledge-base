import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Network } from 'lucide-react';
import KnowledgeGraph from '../knowledge-space/components/KnowledgeGraph';
import NodeList from '../knowledge-space/components/NodeList';
import NodePanel from '../knowledge-space/components/NodePanel';
import { MOCK_NODES, CATEGORY_GROUPS, DEFAULT_NODE_ID } from '../knowledge-space/data/mockNodes';

export default function KnowledgeSpace() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(DEFAULT_NODE_ID);

  const selectedNode = MOCK_NODES.find((n) => n.id === selectedId) ?? MOCK_NODES[0];

  return (
    <div
      className="flex flex-col w-screen h-screen overflow-hidden"
      style={{ background: '#09090f', fontFamily: '"Inter","PingFang SC",sans-serif' }}
    >
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header
        className="flex items-center gap-4 px-5 h-12 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0b0b14' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: 'rgba(160,156,220,0.55)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(200,196,250,0.9)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(160,156,220,0.55)')}
        >
          <ArrowLeft size={14} />
          返回
        </button>

        <div className="flex items-center gap-2">
          <Network size={15} style={{ color: 'rgba(140,138,220,0.6)' }} />
          <span
            className="text-sm font-semibold tracking-wide"
            style={{ color: 'rgba(220,218,255,0.85)' }}
          >
            Knowledge Space
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{
              background: `${selectedNode.categoryColor}18`,
              color: selectedNode.categoryColor,
              border: `1px solid ${selectedNode.categoryColor}35`,
            }}
          >
            {selectedNode.title}
          </span>
          <span className="text-[10px]" style={{ color: 'rgba(120,118,180,0.4)' }}>
            {MOCK_NODES.length} nodes
          </span>
        </div>
      </header>

      {/* ── Three-column body ────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Left: node list */}
        <div className="w-[220px] shrink-0 hidden md:block">
          <NodeList
            groups={CATEGORY_GROUPS}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Center: graph */}
        <div className="flex-1 min-w-0 relative">
          <KnowledgeGraph
            nodes={MOCK_NODES}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {/* Mobile: node name overlay at bottom */}
          <div
            className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-medium"
            style={{
              background: 'rgba(13,13,24,0.9)',
              border: `1px solid ${selectedNode.categoryColor}40`,
              color: selectedNode.categoryColor,
              backdropFilter: 'blur(8px)',
            }}
          >
            {selectedNode.title}
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="w-[280px] shrink-0 hidden lg:block">
          <NodePanel
            node={selectedNode}
            allNodes={MOCK_NODES}
            onSelectNode={setSelectedId}
          />
        </div>
      </div>
    </div>
  );
}
