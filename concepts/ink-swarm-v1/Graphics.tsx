"use client";

/* ────────────────────────────────────────────────────────────
   Seeded neural-net generator — deterministic so SSR and the
   client hydration produce the exact same graph (no Math.random
   in render). One pass at module load, then reused. Static now
   (no motion) for a calmer, more premium look.
   ──────────────────────────────────────────────────────────── */
import styles from "./ink-swarm.module.css";

type Node = { x: number; y: number; r: number };
type Edge = { x1: number; y1: number; x2: number; y2: number };
type Net = { nodes: Node[]; edges: Edge[] };

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function genNet(
  seed: number,
  o: { w: number; h: number; layers: number[]; vertical: boolean; prob: number }
): Net {
  const r = rng(seed);
  const nodes: Node[] = [];
  const layerIdx: number[][] = [];
  for (let l = 0; l < o.layers.length; l++) {
    const n = o.layers[l];
    const idx: number[] = [];
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / (n + 1);
      const jitter = (r() - 0.5) * (o.vertical ? o.w * 0.1 : o.h * 0.1);
      const along = (l + 0.5) / o.layers.length;
      const x = o.vertical ? t * o.w + jitter : along * o.w;
      const y = o.vertical ? along * o.h : t * o.h + jitter;
      idx.push(nodes.length);
      nodes.push({ x, y, r: 1.5 + r() * 1.5 });
    }
    layerIdx.push(idx);
  }
  const edges: Edge[] = [];
  for (let l = 0; l < layerIdx.length - 1; l++) {
    for (const a of layerIdx[l]) {
      for (const b of layerIdx[l + 1]) {
        if (r() < o.prob) {
          edges.push({ x1: nodes[a].x, y1: nodes[a].y, x2: nodes[b].x, y2: nodes[b].y });
        }
      }
    }
  }
  return { nodes, edges };
}

const BAND_NET = genNet(23, { w: 300, h: 92, layers: [3, 4, 5, 4, 3], vertical: false, prob: 0.5 });

function NeuroNet({ net, viewBox, className }: { net: Net; viewBox: string; className?: string }) {
  return (
    <svg className={className} viewBox={viewBox} fill="none" aria-hidden="true" preserveAspectRatio="none">
      {net.edges.map((e, i) => (
        <line key={`e${i}`} className={styles.nEdge} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} />
      ))}
      {net.nodes.map((n, i) => (
        <circle key={`n${i}`} className={styles.nNode} cx={n.x} cy={n.y} r={n.r} />
      ))}
    </svg>
  );
}

/** Wide accent band for the top of the solutions panel. */
export function NeuroBand() {
  return <NeuroNet net={BAND_NET} viewBox="0 0 300 92" className={styles.panelNet} />;
}

/* ── Inline line icons (24×24, stroke = currentColor) ── */
function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className={styles.solIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconBot = () => (
  <Svg>
    <rect x="4" y="8" width="16" height="11" rx="3" />
    <path d="M12 4v4" />
    <circle cx="12" cy="3" r="1" />
    <circle cx="9" cy="13" r="1" />
    <circle cx="15" cy="13" r="1" />
    <path d="M9.5 16.5h5" />
  </Svg>
);

export const IconDoc = () => (
  <Svg>
    <path d="M7 3h7l4 4v8a2 2 0 0 1-2 2h-2" />
    <path d="M14 3v4h4" />
    <path d="M9 10h5M9 13h3" />
    <circle cx="8" cy="17" r="3" />
    <path d="m10.2 19.2 2 2" />
  </Svg>
);

export const IconGear = () => (
  <Svg>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4" />
  </Svg>
);

export const IconMic = () => (
  <Svg>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M6 11a6 6 0 0 0 12 0" />
    <path d="M12 17v4M9 21h6" />
  </Svg>
);

export const IconPlatform = () => (
  <Svg>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18" />
    <path d="M8 13h3v4H8zM14 13h3" />
  </Svg>
);

export const IconSpark = () => (
  <Svg>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0 0 12 3z" />
  </Svg>
);
