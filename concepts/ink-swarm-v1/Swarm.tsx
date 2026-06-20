"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const TAGLINE = ["AI-СИСТЕМЫ", "ПОД ЗАДАЧИ", "БИЗНЕСА"];

// neon per half — left = cyan ("Обо мне"), right = green ("Решения")
const CYAN = [0.28, 0.85, 1.0];
const GREEN = [0.42, 1.0, 0.72];

type Props = {
  /** which half the pointer is over — grows that half slightly */
  hovered: "left" | "right" | null;
  /** a panel is open — the cube blows apart into the field behind it */
  dispersed: boolean;
};

/**
 * Neon particle CUBE (raw three.js, strict cleanup).
 *   idle          -> a gently wobbling cube split into two coloured, clickable
 *                    halves; the hovered half swells a touch.
 *   click a half  -> `dispersed` flips true: the cube bursts into the field so a
 *                    light panel can read over it.
 *   scroll        -> the cube assembles into the hero tagline, then disperses
 *                    into a calm field behind the content.
 * Additive blending => neon glow on the dark hero, invisible on light content.
 */
export default function Swarm({ hovered, dispersed }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(hovered);
  hoveredRef.current = hovered;
  const dispersedRef = useRef(dispersed);
  dispersedRef.current = dispersed;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    // perfect cube: derive the lattice edge first, then COUNT = s³ (no gaps)
    const s = Math.round(Math.cbrt(isMobile ? 13000 : 28000));
    const COUNT = s * s * s;
    const HALF = 13;
    const sep = (HALF * 2) / (s - 1);
    const s2 = s * s;

    const w = () => mount.clientWidth || window.innerWidth || 1;
    const h = () => mount.clientHeight || window.innerHeight || 1;

    const scene = new THREE.Scene();
    const CAMZ = 42;
    const camera = new THREE.PerspectiveCamera(55, w() / h(), 0.1, 1000);
    camera.position.z = CAMZ;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w(), h());
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── tagline -> flat text points ──
    const textPts = sampleText(TAGLINE);
    const nText = Math.min(textPts.length, isMobile ? 2600 : 6500);
    const textTargets: [number, number][] = [];
    const tstride = textPts.length / nText;
    for (let k = 0; k < nText; k++) textTargets.push(textPts[Math.floor(k * tstride)]);
    const HW = isMobile ? 11 : 17;
    const HH = HW / textAspect(TAGLINE);

    const positions = new Float32Array(COUNT * 3);
    const cube = new Float32Array(COUNT * 3);
    const tpos = new Float32Array(COUNT * 3);
    const field = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const aseed = new Float32Array(COUNT);
    const atype = new Float32Array(COUNT); // 1 = text particle
    const seeds = new Float32Array(COUNT);
    const half = new Float32Array(COUNT); // -1 = left, +1 = right

    let leftCx = 0;
    let rightCx = 0;
    let nLeft = 0;
    let nRight = 0;

    for (let i = 0; i < COUNT; i++) {
      const o = i * 3;
      const cx = (i % s) * sep - HALF;
      const cy = (Math.floor(i / s) % s) * sep - HALF;
      const cz = Math.floor(i / s2) * sep - HALF;
      cube[o] = cx;
      cube[o + 1] = cy;
      cube[o + 2] = cz;

      const isLeft = cx < 0;
      half[i] = isLeft ? -1 : 1;
      const c = isLeft ? CYAN : GREEN;
      colors[o] = c[0];
      colors[o + 1] = c[1];
      colors[o + 2] = c[2];
      if (isLeft) {
        leftCx += cx;
        nLeft++;
      } else {
        rightCx += cx;
        nRight++;
      }

      field[o] = (Math.random() - 0.5) * 96;
      field[o + 1] = (Math.random() - 0.5) * 58;
      field[o + 2] = (Math.random() - 0.5) * 24 - 8;
      seeds[i] = Math.random();
      aseed[i] = Math.random();
      sizes[i] = (isMobile ? 1.0 : 0.72) * (0.5 + Math.pow(Math.random(), 2) * 1.3);

      positions[o] = cx;
      positions[o + 1] = cy;
      positions[o + 2] = cz;
    }
    leftCx /= nLeft || 1;
    rightCx /= nRight || 1;

    // text assignment — a random subset of the cube crumbles into the tagline
    const order = new Int32Array(COUNT);
    for (let i = 0; i < COUNT; i++) order[i] = i;
    for (let i = COUNT - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = order[i];
      order[i] = order[j];
      order[j] = t;
    }
    for (let k = 0; k < nText; k++) {
      const i = order[k];
      const o = i * 3;
      atype[i] = 1;
      tpos[o] = textTargets[k][0] * HW;
      tpos[o + 1] = textTargets[k][1] * HH;
      tpos[o + 2] = 0;
      colors[o] = 0.6;
      colors[o + 1] = 0.93;
      colors[o + 2] = 1.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(aseed, 1));
    geo.setAttribute("aType", new THREE.BufferAttribute(atype, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uPText: { value: 0 } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aSize;
        attribute float aSeed;
        attribute float aType;
        attribute vec3 aColor;
        uniform float uTime;
        varying vec3 vColor;
        varying float vTw;
        varying float vType;
        void main() {
          vColor = aColor;
          vType = aType;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float tw = 0.8 + 0.2 * sin(uTime * 1.3 + aSeed * 6.2831);
          vTw = tw;
          gl_PointSize = aSize * tw * (300.0 / max(1.0, -mv.z));
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform float uOpacity;
        uniform float uPText;
        varying vec3 vColor;
        varying float vTw;
        varying float vType;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.14, d);
          float fade = vType > 0.5 ? 1.0 : (1.0 - uPText * 0.97);
          gl_FragColor = vec4(vColor, a * 0.7 * uOpacity * vTw * fade);
        }
      `,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    const clock = new THREE.Clock();
    let raf = 0;
    let hoverL = 0;
    let hoverR = 0;
    let disp = 0;
    const TILT = 0.42;
    const cosT = Math.cos(TILT);
    const sinT = Math.sin(TILT);

    const step = () => {
      const time = clock.getElapsedTime();
      const vh = window.innerHeight || 800;
      const sy = window.scrollY || 0;
      const pText = clamp(sy / (vh * 0.3), 0, 1);
      const pField = clamp((sy - vh * 0.55) / (vh * 0.5), 0, 1);

      // ease the interactive states
      const hv = hoveredRef.current;
      hoverL += ((hv === "left" ? 1 : 0) - hoverL) * 0.12;
      hoverR += ((hv === "right" ? 1 : 0) - hoverR) * 0.12;
      disp += ((dispersedRef.current ? 1 : 0) - disp) * 0.08;

      mat.uniforms.uTime.value = time;
      mat.uniforms.uPText.value = pText;
      mat.uniforms.uOpacity.value += (1 - mat.uniforms.uOpacity.value) * 0.05;

      // gentle wobble keeps the coloured halves on their side (no full spin)
      const angle = reduced ? 0 : Math.sin(time * 0.3) * 0.28;
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);

      // field amount = whichever pull is stronger (click-disperse vs scroll-end)
      const fAmt = pField > disp ? pField : disp;
      const arr = geo.attributes.position.array as Float32Array;

      for (let i = 0; i < COUNT; i++) {
        const o = i * 3;

        // hovered half swells: scale around its centroid + nudge outward
        const isLeft = half[i] < 0;
        const hf = isLeft ? hoverL : hoverR;
        const grow = 1 + 0.18 * hf;
        const cxc = isLeft ? leftCx : rightCx;
        const lx = cxc + (cube[o] - cxc) * grow + (isLeft ? -2.6 : 2.6) * hf;
        const ly = cube[o + 1] * grow;
        const lz = cube[o + 2] * grow;

        // wobble + fixed tilt
        const rx = lx * ca + lz * sa;
        const rz = -lx * sa + lz * ca;
        const hx = rx;
        const hy = ly * cosT - rz * sinT;
        const hz = ly * sinT + rz * cosT;

        // scroll morph toward tagline (text particles) or scatter (the rest)
        let t1x, t1y, t1z;
        if (atype[i] > 0.5) {
          t1x = tpos[o];
          t1y = tpos[o + 1];
          t1z = tpos[o + 2];
        } else {
          t1x = hx * 2.4;
          t1y = hy * 2.4;
          t1z = hz * 2.4;
        }
        let bx = hx + (t1x - hx) * pText;
        let by = hy + (t1y - hy) * pText;
        let bz = hz + (t1z - hz) * pText;

        if (fAmt > 0.001) {
          const sd = seeds[i] * 6.2832;
          bx += (field[o] + Math.sin(time * 0.24 + sd) * 3.4 - bx) * fAmt;
          by += (field[o + 1] + Math.cos(time * 0.21 + sd) * 3.1 - by) * fAmt;
          bz += (field[o + 2] + Math.sin(time * 0.3 + sd) * 2.3 - bz) * fAmt;
        }

        arr[o] = Number.isFinite(bx) ? bx : 0;
        arr[o + 1] = Number.isFinite(by) ? by : 0;
        arr[o + 2] = Number.isFinite(bz) ? bz : 0;
      }

      geo.attributes.position.needsUpdate = true;
      renderer.domElement.style.opacity = String((1 - 0.9 * pField) * (1 - 0.82 * disp));
      renderer.render(scene, camera);
      raf = requestAnimationFrame(step);
    };
    step();

    const onResize = () => {
      camera.aspect = w() / h();
      camera.updateProjectionMatrix();
      renderer.setSize(w(), h());
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}

function sampleText(lines: string[]): [number, number][] {
  const scale = 2;
  const fs = 46 * scale;
  const lh = fs * 1.16;
  const m = document.createElement("canvas").getContext("2d")!;
  m.font = `700 ${fs}px 'JetBrains Mono', monospace`;
  let maxw = 0;
  for (const l of lines) maxw = Math.max(maxw, m.measureText(l).width);
  const cw = Math.ceil(maxw) + 24;
  const ch = Math.ceil(lh * lines.length) + 24;
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d")!;
  ctx.font = `700 ${fs}px 'JetBrains Mono', monospace`;
  ctx.fillStyle = "#000";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  lines.forEach((l, i) => ctx.fillText(l, cw / 2, lh * (i + 0.5) + 12));
  const data = ctx.getImageData(0, 0, cw, ch).data;
  const pts: [number, number][] = [];
  for (let y = 0; y < ch; y += 2) {
    for (let x = 0; x < cw; x += 2) {
      if (data[(y * cw + x) * 4 + 3] > 128) {
        pts.push([(x / cw) * 2 - 1, -((y / ch) * 2 - 1)]);
      }
    }
  }
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }
  return pts;
}

function textAspect(lines: string[]): number {
  const scale = 2;
  const fs = 46 * scale;
  const lh = fs * 1.16;
  const m = document.createElement("canvas").getContext("2d")!;
  m.font = `700 ${fs}px 'JetBrains Mono', monospace`;
  let maxw = 0;
  for (const l of lines) maxw = Math.max(maxw, m.measureText(l).width);
  return (Math.ceil(maxw) + 24) / (Math.ceil(lh * lines.length) + 24);
}
