import React, { useCallback, useEffect, useRef } from 'react';
import { KnowledgeNode } from '../types';

interface Props {
  nodes: KnowledgeNode[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const NODE_RADIUS = 26;
const FLOAT_AMP = 3.5;
const PULSE_PERIOD = 2200;
const DOT_GRID = 34;

// Parse hex color to rgba string
function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function KnowledgeGraph({ nodes, selectedId, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const hoverIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);
  // Track canvas CSS dimensions for hit testing
  const dimRef = useRef({ w: 0, h: 0 });

  // Compute float-offset node position in CSS-px space
  const getPos = useCallback(
    (node: KnowledgeNode, w: number, h: number, t: number, idx: number) => {
      const phase = idx * ((Math.PI * 2) / nodes.length) + (t / 3200) * Math.PI * 2;
      return {
        x: node.gx * w,
        y: node.gy * h + Math.sin(phase) * FLOAT_AMP,
      };
    },
    [nodes.length]
  );

  const draw = useCallback(
    (t: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      // Work in CSS pixels by scaling ctx
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      dimRef.current = { w, h };

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // ── Background ──────────────────────────────────────────
      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      bg.addColorStop(0, '#0e0e1a');
      bg.addColorStop(1, '#07070f');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Dot grid
      ctx.fillStyle = 'rgba(130,120,200,0.07)';
      for (let gx = DOT_GRID / 2; gx < w; gx += DOT_GRID) {
        for (let gy = DOT_GRID / 2; gy < h; gy += DOT_GRID) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Compute positions ────────────────────────────────────
      const positions = nodes.map((n, i) => getPos(n, w, h, t, i));

      // ── Build unique edge set ────────────────────────────────
      const edges = new Set<string>();
      nodes.forEach((n) =>
        n.relatedIds.forEach((rid) => {
          edges.add([n.id, rid].sort().join('|'));
        })
      );

      // ── Draw edges ───────────────────────────────────────────
      edges.forEach((key) => {
        const [aId, bId] = key.split('|');
        const ai = nodes.findIndex((n) => n.id === aId);
        const bi = nodes.findIndex((n) => n.id === bId);
        if (ai === -1 || bi === -1) return;

        const ap = positions[ai];
        const bp = positions[bi];
        const an = nodes[ai];
        const bn = nodes[bi];
        const highlight =
          an.id === selectedId ||
          bn.id === selectedId ||
          an.id === hoverIdRef.current ||
          bn.id === hoverIdRef.current;

        const grad = ctx.createLinearGradient(ap.x, ap.y, bp.x, bp.y);
        grad.addColorStop(0, hexAlpha(an.categoryColor, highlight ? 0.55 : 0.18));
        grad.addColorStop(1, hexAlpha(bn.categoryColor, highlight ? 0.55 : 0.18));

        ctx.beginPath();
        ctx.moveTo(ap.x, ap.y);
        ctx.lineTo(bp.x, bp.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = highlight ? 1.5 : 0.8;
        ctx.stroke();
      });

      // ── Draw nodes ───────────────────────────────────────────
      nodes.forEach((node, idx) => {
        const pos = positions[idx];
        const isSel = node.id === selectedId;
        const isHov = node.id === hoverIdRef.current;
        const r = isSel ? NODE_RADIUS + 5 : isHov ? NODE_RADIUS + 2 : NODE_RADIUS;

        // Pulse ring
        if (isSel) {
          const phase = (t % PULSE_PERIOD) / PULSE_PERIOD;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r + phase * 38, 0, Math.PI * 2);
          ctx.strokeStyle = hexAlpha(node.categoryColor, (1 - phase) * 0.45);
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Second pulse (offset half period)
          const phase2 = ((t + PULSE_PERIOD / 2) % PULSE_PERIOD) / PULSE_PERIOD;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r + phase2 * 38, 0, Math.PI * 2);
          ctx.strokeStyle = hexAlpha(node.categoryColor, (1 - phase2) * 0.25);
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Glow (shadow)
        ctx.shadowBlur = isSel ? 45 : isHov ? 30 : 18;
        ctx.shadowColor = node.categoryColor;

        // Fill
        const fillGrad = ctx.createRadialGradient(pos.x - r * 0.3, pos.y - r * 0.3, 0, pos.x, pos.y, r);
        fillGrad.addColorStop(0, hexAlpha(node.categoryColor, isSel ? 0.35 : isHov ? 0.25 : 0.12));
        fillGrad.addColorStop(1, hexAlpha(node.categoryColor, isSel ? 0.1 : 0.04));

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fillStyle = fillGrad;
        ctx.fill();

        // Border
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = hexAlpha(node.categoryColor, isSel ? 1 : isHov ? 0.85 : 0.55);
        ctx.lineWidth = isSel ? 2 : 1.5;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // Center dot
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, isSel ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = hexAlpha(node.categoryColor, isSel ? 1 : 0.8);
        ctx.fill();

        // Label
        ctx.font = `${isSel ? 600 : 500} 11px "Inter","PingFang SC",sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Label shadow for readability
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.fillStyle = isSel ? '#ffffff' : 'rgba(210,208,235,0.88)';
        ctx.fillText(node.title, pos.x, pos.y + r + 7);
        ctx.shadowBlur = 0;
      });

      ctx.restore();
    },
    [nodes, selectedId, getPos]
  );

  // Animation loop
  useEffect(() => {
    const animate = (ts: number) => {
      if (startTimeRef.current === null) startTimeRef.current = ts;
      draw(ts - startTimeRef.current);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      startTimeRef.current = null;
    };
  }, [draw]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      dimRef.current = { w: rect.width, h: rect.height };
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Hit test (ignores float offset for simplicity — negligible 3-4px error)
  const hitTest = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): string | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const { w, h } = dimRef.current;

      // Reverse order so top-painted node takes priority
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const nx = n.gx * w;
        const ny = n.gy * h;
        if (Math.hypot(mx - nx, my - ny) <= NODE_RADIUS + 8) return n.id;
      }
      return null;
    },
    [nodes]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const hit = hitTest(e);
      hoverIdRef.current = hit;
      if (canvasRef.current) canvasRef.current.style.cursor = hit ? 'pointer' : 'default';
    },
    [hitTest]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const hit = hitTest(e);
      if (hit) onSelect(hit);
    },
    [hitTest, onSelect]
  );

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={() => {
          hoverIdRef.current = null;
        }}
      />
    </div>
  );
}
