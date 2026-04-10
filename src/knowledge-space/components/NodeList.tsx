import React, { useState } from 'react';
import { CategoryGroup, KnowledgeNode } from '../types';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  groups: CategoryGroup[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function NodeList({ groups, selectedId, onSelect }: Props) {
  // All categories open by default
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (name: string) =>
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <aside
      className="h-full flex flex-col overflow-y-auto scrollbar-hide"
      style={{ background: '#0d0d18', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(150,148,210,0.5)' }}>
          Knowledge Nodes
        </p>
        <p className="mt-0.5 text-xs" style={{ color: 'rgba(200,196,240,0.4)' }}>
          {groups.reduce((s, g) => s + g.nodes.length, 0)} 个节点
        </p>
      </div>

      {/* Category groups */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {groups.map((group) => {
          const isOpen = !collapsed[group.name];
          return (
            <div key={group.name}>
              {/* Category header */}
              <button
                onClick={() => toggle(group.name)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors"
                style={{ color: 'rgba(200,196,240,0.6)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Color dot */}
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: group.color, boxShadow: `0 0 6px ${group.color}80` }}
                />
                <span className="flex-1 text-left text-xs font-semibold tracking-wide">{group.name}</span>
                <span className="text-[10px]" style={{ color: 'rgba(150,148,200,0.4)' }}>
                  {group.nodes.length}
                </span>
                {isOpen ? (
                  <ChevronDown size={12} style={{ color: 'rgba(150,148,200,0.4)' }} />
                ) : (
                  <ChevronRight size={12} style={{ color: 'rgba(150,148,200,0.4)' }} />
                )}
              </button>

              {/* Node list */}
              {isOpen && (
                <ul className="mt-0.5 space-y-0.5 pl-2">
                  {group.nodes.map((node) => {
                    const isSelected = node.id === selectedId;
                    return (
                      <li key={node.id}>
                        <button
                          onClick={() => onSelect(node.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150"
                          style={{
                            background: isSelected
                              ? `${node.categoryColor}18`
                              : 'transparent',
                            border: isSelected
                              ? `1px solid ${node.categoryColor}40`
                              : '1px solid transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected)
                              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {/* Node indicator */}
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              background: node.categoryColor,
                              boxShadow: isSelected ? `0 0 8px ${node.categoryColor}` : 'none',
                              opacity: isSelected ? 1 : 0.5,
                            }}
                          />
                          <span
                            className="text-xs leading-tight"
                            style={{
                              color: isSelected ? '#e8e6ff' : 'rgba(190,186,230,0.65)',
                              fontWeight: isSelected ? 600 : 400,
                            }}
                          >
                            {node.title}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer hint */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-[10px]" style={{ color: 'rgba(120,118,180,0.4)' }}>
          点击节点探索关联知识
        </p>
      </div>
    </aside>
  );
}
