import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import * as THREE from 'three';
import {
  BrainGraphData,
  BrainLink,
  BrainNode,
  getCategoryColor,
  getLinkEndpointId,
  getNeighborIds,
  hexToRgba,
  isReviewDue,
} from '../utils/brainGraph';

interface BrainGraphProps {
  graphData: BrainGraphData;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  focusNodeId: string | null;
  searchMatchedIds: Set<string>;
  onNodeClick: (node: BrainNode) => void;
  onNodeHover: (nodeId: string | null) => void;
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

function getNodeRadius(node: BrainNode): number {
  return 4.2 + Math.min(node.connectionCount, 8) * 0.55 + (isReviewDue(node) ? 0.65 : 0);
}

function makeLabelSprite(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(8, 12, 22, 0.78)';
    ctx.strokeStyle = hexToRgba(color, 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(18, 28, 476, 72, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#eef7ff';
    ctx.font = '600 30px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = text.length > 18 ? `${text.slice(0, 18)}...` : text;
    ctx.fillText(label, 256, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(42, 10.5, 1);
  return sprite;
}

function createNodeObject(
  node: BrainNode,
  isActive: boolean,
  isNeighbor: boolean,
  isSearchMatch: boolean
): THREE.Object3D {
  const group = new THREE.Group();
  const color = getCategoryColor(node.category);
  const radius = getNodeRadius(node);
  const visible = isActive || isNeighbor || isSearchMatch;
  const dimmed = node.isolated && !visible;
  const reviewDue = isReviewDue(node);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 18),
    new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: dimmed ? 0.34 : 0.9,
      roughness: 0.42,
      metalness: 0.08,
      emissive: new THREE.Color(reviewDue || visible ? color : '#000000'),
      emissiveIntensity: isActive ? 0.72 : isNeighbor || isSearchMatch ? 0.38 : reviewDue ? 0.24 : 0.04,
    })
  );
  group.add(sphere);

  if (node.isolated) {
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.25, 16, 12),
      new THREE.MeshBasicMaterial({
        color: '#64748b',
        wireframe: true,
        transparent: true,
        opacity: visible ? 0.32 : 0.16,
      })
    );
    group.add(shell);
  }

  if (reviewDue) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.55, 0.16, 8, 52),
      new THREE.MeshBasicMaterial({
        color: '#67e8f9',
        transparent: true,
        opacity: isActive || isNeighbor ? 0.88 : 0.46,
      })
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  }

  if (isActive || isSearchMatch) {
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.9, 24, 16),
      new THREE.MeshBasicMaterial({
        color: isActive ? '#e0f2fe' : '#fef08a',
        transparent: true,
        opacity: isActive ? 0.16 : 0.1,
        depthWrite: false,
      })
    );
    group.add(halo);
  }

  if (isActive || isSearchMatch) {
    const label = makeLabelSprite(node.title, color);
    label.position.set(0, radius + 9, 0);
    group.add(label);
  }

  return group;
}

function isLinkConnectedTo(link: BrainLink, nodeId: string | null): boolean {
  if (!nodeId) return false;
  return getLinkEndpointId(link.source) === nodeId || getLinkEndpointId(link.target) === nodeId;
}

export default function BrainGraph({
  graphData,
  selectedNodeId,
  hoveredNodeId,
  focusNodeId,
  searchMatchedIds,
  onNodeClick,
  onNodeHover,
}: BrainGraphProps) {
  const graphRef = useRef<ForceGraphMethods<BrainNode, BrainLink> | undefined>(undefined);
  const { ref: containerRef, size } = useElementSize<HTMLDivElement>();
  const activeNodeId = hoveredNodeId ?? selectedNodeId;
  const neighborIds = useMemo(() => getNeighborIds(graphData, activeNodeId), [graphData, activeNodeId]);

  const nodeThreeObject = useCallback(
    (node: BrainNode) =>
      createNodeObject(
        node,
        node.id === activeNodeId,
        neighborIds.has(node.id),
        searchMatchedIds.has(node.id)
      ),
    [activeNodeId, neighborIds, searchMatchedIds]
  );

  const linkWidth = useCallback(
    (link: BrainLink) => {
      const highlighted = isLinkConnectedTo(link, activeNodeId);
      return 0.45 + link.weight * 0.42 + (highlighted ? 1.15 : 0);
    },
    [activeNodeId]
  );

  const linkMaterial = useCallback(
    (link: BrainLink) => {
      const highlighted = isLinkConnectedTo(link, activeNodeId);
      const baseOpacity = Math.min(0.7, 0.12 + link.weight * 0.12);
      return new THREE.LineBasicMaterial({
        color: highlighted ? '#cffafe' : '#7dd3fc',
        transparent: true,
        opacity: highlighted ? 0.92 : baseOpacity,
      });
    },
    [activeNodeId]
  );

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || graphData.nodes.length === 0) return;
    const timer = window.setTimeout(() => {
      graph.zoomToFit(700, 56);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [graphData.nodes.length, graphData.links.length]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !focusNodeId) return;

    const timer = window.setTimeout(() => {
      const node = graphData.nodes.find((item) => item.id === focusNodeId);
      if (!node) return;

      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const z = node.z ?? 0;
      const distance = 145;
      const length = Math.hypot(x, y, z) || 1;
      const ratio = 1 + distance / length;

      graph.cameraPosition(
        { x: x * ratio, y: y * ratio, z: z * ratio + 80 },
        { x, y, z },
        900
      );
    }, 500);

    return () => window.clearTimeout(timer);
  }, [focusNodeId, graphData.nodes]);

  return (
    <div ref={containerRef} className="relative h-full min-h-[420px] overflow-hidden bg-[#070b14]">
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.12),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(129,140,248,0.14),transparent_26%)]" />
      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs leading-5 text-slate-400 backdrop-blur">
        拖拽旋转 · 滚轮缩放 · 点击选择节点
      </div>

      {size.width > 0 && size.height > 0 && (
        <ForceGraph3D<BrainNode, BrainLink>
          ref={graphRef}
          graphData={graphData}
          width={size.width}
          height={size.height}
          backgroundColor="#070b14"
          showNavInfo={false}
          nodeId="id"
          nodeLabel={(node) => `${node.title}<br/>${node.category}<br/>连接度 ${node.connectionCount}`}
          nodeThreeObject={nodeThreeObject}
          nodeOpacity={0.92}
          linkSource="source"
          linkTarget="target"
          linkWidth={linkWidth}
          linkMaterial={linkMaterial}
          linkDirectionalParticles={(link) => (isLinkConnectedTo(link, activeNodeId) ? Math.min(4, link.weight) : 0)}
          linkDirectionalParticleWidth={(link) => 1 + link.weight * 0.35}
          linkDirectionalParticleSpeed={0.006}
          cooldownTicks={90}
          d3VelocityDecay={0.22}
          enableNodeDrag
          enableNavigationControls
          onNodeClick={(node) => onNodeClick(node)}
          onNodeHover={(node) => onNodeHover(node?.id ? String(node.id) : null)}
          showPointerCursor
        />
      )}
    </div>
  );
}

