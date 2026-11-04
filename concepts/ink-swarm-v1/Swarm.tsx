"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { PIPE, pipeClock } from "./Pipeline";

const TAGLINE = ["AI-СИСТЕМЫ", "ПОД ЗАДАЧИ", "БИЗНЕСА"];

// neon per half — left = cyan ("Обо мне"), right = green ("Решения")
const CYAN = [0.28, 0.85, 1.0];
const GREEN = [0.42, 1.0, 0.72];
const TEXT = [0.6, 0.93, 1.0];
// узлы схемы Клиент → ИИ → CRM → Вы, от голубого к зелёному
const NODE_COL = [0x3fcfff, 0x7af0e4, 0x5ff5ae, 0xd8ffe9];

type Props = {
  /** which half the pointer is over — grows that half slightly */
  hovered: "left" | "right" | null;
  /** a panel is open — the cube blows apart into the field behind it */
  dispersed: boolean;
  /** spacer of the pipeline stage: its scroll position drives tagline -> pipeline -> out */
  flowRef: RefObject<HTMLDivElement | null>;
  /** fixed HTML layer of the pipeline (Pipeline.tsx): faded in here, node buttons follow the 3D nodes */
  layerRef: RefObject<HTMLDivElement | null>;
  nodeRefs: MutableRefObject<(HTMLButtonElement | null)[]>;
  activeNode: number;
};

const VERT = `
attribute vec3 aText;
attribute vec3 aPipe;   // node: local shape offset; link: (u along curve, tube jitter x2)
attribute vec3 aField;
attribute vec3 aColor;
attribute vec4 aMeta;   // size, seed, tagline particle, half (-1 left / 1 right)
attribute float aKind;  // 0 dust, 1..4 node, 5..7 link
uniform float uTime, uOpacity, uPText, uPPipe, uPOut, uDisp, uHoverL, uHoverR, uLeftCx, uRightCx;
uniform float uNodeR, uActive, uSizeK, uCubeK, uTextK;
uniform vec2 uWob, uTilt;
uniform vec3 uPtr;
uniform vec3 uNode[4];
uniform vec3 uNodeCol[4];
uniform vec3 uLinkA[3];
uniform vec3 uLinkB[3];
uniform vec3 uLinkC[3];
uniform float uHit[4];
uniform float uPacket[3];
uniform mat3 uRot;
uniform vec3 uOff;
varying vec3 vColor;
varying float vAlpha;

vec3 rotY(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); }

void main() {
  float seed = aMeta.y;

  // 1. cube: hovered half swells around its centroid, gentle wobble + fixed tilt
  float left = step(aMeta.w, 0.0);
  float hf = mix(uHoverR, uHoverL, left);
  float grow = 1.0 + 0.18 * hf;
  float cxc = mix(uRightCx, uLeftCx, left);
  vec3 l = vec3(cxc + (position.x - cxc) * grow + mix(2.6, -2.6, left) * hf, position.y * grow, position.z * grow);
  float rx = l.x * uWob.x + l.z * uWob.y;
  float rz = -l.x * uWob.y + l.z * uWob.x;
  vec3 h = vec3(rx, l.y * uTilt.x - rz * uTilt.y, l.y * uTilt.y + rz * uTilt.x) * uCubeK;

  // 2. tagline: a subset forms the text, the rest scatters and fades
  vec3 p = mix(h, aMeta.z > 0.5 ? aText * uTextK : h * 2.4, uPText);
  float fade = aMeta.z > 0.5 ? 1.0 : 1.0 - uPText * 0.97;

  // 3. pipeline: nodes, links with a running packet, dim dust behind
  vec3 q; vec3 col; float a2; float boost = 0.0;
  if (aKind > 4.5) {
    int k = int(aKind - 4.5);
    float u = fract(aPipe.x + uTime * 0.04);
    vec3 A = uLinkA[k], B = uLinkB[k], C = uLinkC[k];
    float m = 1.0 - u;
    q = m * m * A + 2.0 * m * u * B + u * u * C;
    vec3 tg = normalize(2.0 * m * (B - A) + 2.0 * u * (C - B));
    vec3 n1 = normalize(cross(tg, vec3(0.0, 0.0, 1.0)));
    vec3 n2 = cross(tg, n1);
    q += (n1 * aPipe.y + n2 * aPipe.z) * uNodeR * 0.14;
    float hd = uPacket[k];
    float x = hd - u;
    float pk = hd < 0.0 ? 0.0 : (x > 0.0 ? exp(-x * 14.0) : exp(-x * x * 1600.0)); // голова и хвост кометы
    boost = pk;
    col = mix(mix(uNodeCol[k], uNodeCol[k + 1], u), vec3(1.0), pk * 0.6);
    a2 = 0.3 + 1.6 * pk;
  } else if (aKind > 0.5) {
    int k = int(aKind - 0.5);
    float hit = uHit[k];
    float act = 1.0 - step(0.5, abs(float(k) - uActive));
    float spin = sin(uTime * 0.45 + float(k) * 1.7) * 0.6 + (k == 1 ? uTime * 0.35 : 0.0);
    q = uNode[k] + rotY(aPipe, spin) * uNodeR * (1.0 + 0.16 * hit + 0.06 * act);
    col = mix(uNodeCol[k], vec3(1.0), hit * 0.4);
    float dens = k == 1 ? 0.55 : k == 3 ? 0.7 : k == 2 ? 0.9 : 1.0; // плотные узлы (ядро ИИ, человек) иначе выгорают в белое
    a2 = (0.55 + 0.25 * act + 0.5 * hit) * dens;
    boost = hit * 0.6 + act * 0.25;
  } else {
    q = aField * vec3(0.9, 0.9, 0.6) + vec3(sin(uTime * 0.2 + seed * 6.28) * 2.0, cos(uTime * 0.17 + seed * 6.28) * 1.6, 0.0);
    col = mix(uNodeCol[0], uNodeCol[2], seed);
    a2 = 0.16;
  }
  q = uRot * q + uOff;

  // staggered flight with a swirl in the middle of the move
  float sp = smoothstep(seed * 0.35, seed * 0.35 + 0.65, uPPipe);
  vec3 sw = vec3(sin(seed * 41.0 + uTime * 0.8), cos(seed * 29.0 + uTime * 0.7), sin(seed * 17.0 + uTime * 0.5));
  p = mix(p, q, sp) + sw * 22.0 * sp * (1.0 - sp);

  // panel open or the light sheet arrives: everything drifts into a calm field
  float f = max(uDisp, uPOut);
  if (f > 0.001) {
    float sd = seed * 6.2832;
    vec3 fp = aField + vec3(sin(uTime * 0.24 + sd) * 3.4, cos(uTime * 0.21 + sd) * 3.1, sin(uTime * 0.3 + sd) * 2.3);
    p = mix(p, fp, f);
  }

  // the pointer parts the particles
  vec2 dv = p.xy - uPtr.xy;
  float dd = dot(dv, dv);
  p.xy += dv * inversesqrt(dd + 0.5) * uPtr.z * exp(-dd / 28.0);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float tw = 0.8 + 0.2 * sin(uTime * 1.3 + seed * 6.2831);
  gl_PointSize = aMeta.x * tw * (1.0 + boost * 1.6) * uSizeK * (300.0 / max(1.0, -mv.z));
  gl_Position = projectionMatrix * mv;
  vColor = mix(aColor, col, sp);
  vAlpha = mix(fade, a2, sp) * 0.7 * tw * uOpacity * (1.0 - 0.8 * uDisp) * (1.0 - 0.6 * uPOut);
}`;

const FRAG = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  gl_FragColor = vec4(vColor, smoothstep(0.5, 0.14, d) * vAlpha);
}`;

/**
 * Neon particle story (three.js, all motion on the GPU, bloom on top):
 *   idle          -> a wobbling cube split into two clickable halves; the hovered half swells.
 *   click a half  -> `dispersed`: the cube bursts into a field so a panel can read over it.
 *   scroll        -> cube -> hero tagline -> 3D scheme Клиент → ИИ → CRM → Вы with packets
 *                    running along the links (synced with the HTML log by PIPE) -> calm field
 *                    while the light content sheet slides over the canvas.
 * Colours are raw sRGB values (output colour space left linear), as before bloom was added.
 */
export default function Swarm({ hovered, dispersed, flowRef, layerRef, nodeRefs, activeNode }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(hovered);
  hoveredRef.current = hovered;
  const dispersedRef = useRef(dispersed);
  dispersedRef.current = dispersed;
  const activeRef = useRef(activeNode);
  activeRef.current = activeNode;

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
    const FOV = 55;
    const visH = 2 * CAMZ * Math.tan(THREE.MathUtils.degToRad(FOV / 2)); // высота кадра в плоскости z = 0
    const camera = new THREE.PerspectiveCamera(FOV, w() / h(), 0.1, 1000);
    camera.position.z = CAMZ;

    // ── tagline -> flat text points ──
    const textPts = sampleText(TAGLINE);
    const nText = Math.min(textPts.length, isMobile ? 2600 : 6500);
    const tstride = textPts.length / nText;
    const HW = isMobile ? 11 : 17;
    const HH = HW / textAspect(TAGLINE);

    const cube = new Float32Array(COUNT * 3);
    const tpos = new Float32Array(COUNT * 3);
    const pipe = new Float32Array(COUNT * 3);
    const field = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const meta = new Float32Array(COUNT * 4);
    const kind = new Float32Array(COUNT);

    let leftCx = 0;
    let rightCx = 0;
    let nLeft = 0;
    let nRight = 0;
    for (let i = 0; i < COUNT; i++) {
      const o = i * 3;
      const cx = (i % s) * sep - HALF;
      cube[o] = cx;
      cube[o + 1] = (Math.floor(i / s) % s) * sep - HALF;
      cube[o + 2] = Math.floor(i / s2) * sep - HALF;
      const isLeft = cx < 0;
      colors.set(isLeft ? CYAN : GREEN, o);
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
      meta[i * 4] = (isMobile ? 1.0 : 0.72) * (0.5 + Math.pow(Math.random(), 2) * 1.3);
      meta[i * 4 + 1] = Math.random();
      meta[i * 4 + 3] = isLeft ? -1 : 1;
    }
    leftCx /= nLeft || 1;
    rightCx /= nRight || 1;

    // text assignment — a random subset of the cube crumbles into the tagline
    const order = shuffled(COUNT);
    for (let k = 0; k < nText; k++) {
      const i = order[k];
      const pt = textPts[Math.floor(k * tstride)];
      meta[i * 4 + 2] = 1;
      tpos[i * 3] = pt[0] * HW;
      tpos[i * 3 + 1] = pt[1] * HH;
      colors.set(TEXT, i * 3);
    }

    // pipeline roles, independent of the text subset: 4 nodes, 3 links, the rest is dust
    const roles = shuffled(COUNT);
    const nNode = [1, 1, 1, 0.45].map((wk) => Math.floor(COUNT * 0.11 * wk)); // человек мелкий — меньше точек, иначе сплошное пятно
    const nLink = Math.floor(COUNT * 0.107);
    let r = 0;
    for (let k = 0; k < 4; k++) {
      for (let j = 0; j < nNode[k]; j++, r++) {
        const i = roles[r];
        kind[i] = k + 1;
        pipe.set(nodeShape(k), i * 3);
      }
    }
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 1.4;
    for (let k = 0; k < 3; k++) {
      for (let j = 0; j < nLink; j++, r++) {
        const i = roles[r];
        kind[i] = k + 5;
        pipe[i * 3] = Math.random();
        pipe[i * 3 + 1] = gauss();
        pipe[i * 3 + 2] = gauss();
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(cube, 3));
    geo.setAttribute("aText", new THREE.BufferAttribute(tpos, 3));
    geo.setAttribute("aPipe", new THREE.BufferAttribute(pipe, 3));
    geo.setAttribute("aField", new THREE.BufferAttribute(field, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aMeta", new THREE.BufferAttribute(meta, 4));
    geo.setAttribute("aKind", new THREE.BufferAttribute(kind, 1));

    const v3 = () => new THREE.Vector3();
    const U = {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uPText: { value: 0 },
      uPPipe: { value: 0 },
      uPOut: { value: 0 },
      uDisp: { value: 0 },
      uHoverL: { value: 0 },
      uHoverR: { value: 0 },
      uLeftCx: { value: leftCx },
      uRightCx: { value: rightCx },
      uNodeR: { value: 3 },
      uActive: { value: activeRef.current },
      uSizeK: { value: 1 },
      uCubeK: { value: 1 },
      uTextK: { value: 1 },
      uWob: { value: new THREE.Vector2(1, 0) },
      uTilt: { value: new THREE.Vector2(Math.cos(0.42), Math.sin(0.42)) },
      uPtr: { value: v3() },
      uNode: { value: [v3(), v3(), v3(), v3()] },
      uNodeCol: { value: NODE_COL.map((c) => new THREE.Vector3(((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255)) },
      uLinkA: { value: [v3(), v3(), v3()] },
      uLinkB: { value: [v3(), v3(), v3()] },
      uLinkC: { value: [v3(), v3(), v3()] },
      uHit: { value: [0, 0, 0, 0] },
      uPacket: { value: [-1, -1, -1] },
      uRot: { value: new THREE.Matrix3() },
      uOff: { value: v3() },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: U,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false; // positions are computed in the shader
    scene.add(points);

    // dark radial backdrop under the particles (the canvas is opaque: bloom needs a real background)
    const bgMat = new THREE.ShaderMaterial({
      uniforms: { uAsp: { value: w() / h() } },
      depthTest: false,
      depthWrite: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `precision mediump float; uniform float uAsp; varying vec2 vUv;
        void main(){ float d = length((vUv - vec2(0.5, 0.58)) * vec2(uAsp, 1.0));
          gl_FragColor = vec4(mix(vec3(0.078, 0.086, 0.11), vec3(0.039, 0.043, 0.059), smoothstep(0.0, 0.75, d)), 1.0); }`,
    });
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
    bg.frustumCulled = false;
    bg.renderOrder = -1;
    scene.add(bg);

    // ── renderer + bloom; without WebGL the HTML layer still follows the (math-only) camera ──
    const prMax = Math.min(window.devicePixelRatio || 1, 2);
    let pr = Math.min(prMax, isMobile ? 1.5 : 2);
    U.uSizeK.value = pr / prMax;
    let renderer: THREE.WebGLRenderer | null = null;
    let composer: EffectComposer | null = null;
    let bloom: UnrealBloomPass | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      renderer.setPixelRatio(pr);
      renderer.setSize(w(), h());
      mount.appendChild(renderer.domElement);
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloom = new UnrealBloomPass(new THREE.Vector2(w(), h()), 0.85, 0.5, 0.12);
      composer.addPass(bloom);
    } catch {
      renderer = null; // ponytail: no WebGL -> no particles; the dark CSS backdrop and the HTML layer remain
    }

    // ── pipeline layout: a row on landscape screens, a column on portrait ones ──
    let portrait = false;
    let visW = visH;
    const layout = () => {
      const asp = w() / h();
      visW = visH * asp;
      portrait = asp < 0.9;
      const N = U.uNode.value;
      let R: number;
      if (portrait) {
        R = Math.min(visW * 0.095, visH * 0.05);
        N.forEach((v, k) => v.set(0, (1.5 - k) * visH * 0.16, 0));
        U.uOff.value.set(-visW * 0.24, -visH * 0.008, 0);
      } else {
        R = Math.min(visW * 0.045, visH * 0.085);
        N.forEach((v, k) => v.set((k - 1.5) * visW * 0.21, 0, 0));
        U.uOff.value.set(0, visH * 0.04, 0);
      }
      U.uNodeR.value = R;
      U.uCubeK.value = Math.min(1, visW / 30);
      U.uTextK.value = Math.min(1, (visW * 0.44) / HW);
      const dir = v3();
      for (let k = 0; k < 3; k++) {
        dir.subVectors(N[k + 1], N[k]).normalize();
        U.uLinkA.value[k].copy(N[k]).addScaledVector(dir, R * 1.45);
        U.uLinkC.value[k].copy(N[k + 1]).addScaledVector(dir, -R * 1.45);
        U.uLinkB.value[k]
          .addVectors(N[k], N[k + 1])
          .multiplyScalar(0.5)
          .add(portrait ? v3().set(-R * 0.9, 0, R * 0.7) : v3().set(0, R * 0.9, R * 0.7));
      }
    };
    layout();

    const resize = () => {
      camera.aspect = w() / h();
      camera.updateProjectionMatrix();
      bgMat.uniforms.uAsp.value = camera.aspect;
      layout();
      if (!renderer || !composer || !bloom) return;
      renderer.setPixelRatio(pr);
      renderer.setSize(w(), h());
      composer.setPixelRatio(pr);
      composer.setSize(w(), h());
      bloom.setSize(w() * pr * 0.5, h() * pr * 0.5); // bloom is soft anyway — half the cost
    };
    resize();
    window.addEventListener("resize", resize);

    const ptr = { x: 0, y: 0, tx: 0, ty: 0, str: 0, last: -10 };
    const onMove = (e: PointerEvent) => {
      ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.ty = 1 - (e.clientY / window.innerHeight) * 2;
      ptr.last = pipeClock();
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const t0 = pipeClock();
    let last = t0;
    let hoverL = 0;
    let hoverR = 0;
    let disp = 0;
    let slow = 0;
    let samples = 0;
    const eul = new THREE.Euler();
    const m4 = new THREE.Matrix4();
    const pv = v3();
    let raf = 0;

    const step = () => {
      raf = requestAnimationFrame(step);
      const now = pipeClock();
      const dt = Math.min(0.1, now - last);
      last = now;
      const time = reduced ? 0 : now - t0;

      const vh = window.innerHeight || 800;
      const sy = window.scrollY || 0;
      const fr = flowRef.current?.getBoundingClientRect();
      const pText = clamp(sy / (vh * 0.3), 0, 1);
      const pPipe = fr ? clamp((vh * 0.6 - fr.top) / (vh * 0.7), 0, 1) : 0;
      const pOut = fr ? clamp((vh - fr.bottom) / (vh * 0.8), 0, 1) : 0;

      // ease the interactive states (frame-rate independent)
      const kf = 1 - Math.exp(-dt * 7.5);
      const hv = hoveredRef.current;
      hoverL += ((hv === "left" ? 1 : 0) - hoverL) * kf;
      hoverR += ((hv === "right" ? 1 : 0) - hoverR) * kf;
      disp += ((dispersedRef.current ? 1 : 0) - disp) * (1 - Math.exp(-dt * 5));
      const kp = 1 - Math.exp(-dt * 3);
      ptr.x += (ptr.tx - ptr.x) * kp;
      ptr.y += (ptr.ty - ptr.y) * kp;
      ptr.str += ((!reduced && now - ptr.last < 1.2 ? 1 : 0) - ptr.str) * (1 - Math.exp(-dt * 4));

      U.uTime.value = time;
      U.uPText.value = pText;
      U.uPPipe.value = pPipe;
      U.uPOut.value = pOut;
      U.uDisp.value = disp;
      U.uHoverL.value = hoverL;
      U.uHoverR.value = hoverR;
      U.uOpacity.value += (1 - U.uOpacity.value) * (1 - Math.exp(-dt * 3));
      U.uActive.value = activeRef.current;
      const angle = Math.sin(time * 0.3) * 0.28; // wobble keeps the coloured halves on their side
      U.uWob.value.set(Math.cos(angle), Math.sin(angle));
      U.uPtr.value.set((ptr.x * visW) / 2, (ptr.y * visH) / 2, ptr.str * 2.4 * (1 - pOut));

      // packets and node flashes on the shared PIPE clock (the HTML log uses the same one)
      const ph = now % PIPE.T;
      for (let k = 0; k < 3; k++) {
        const [a, b] = PIPE.seg[k];
        U.uPacket.value[k] = !reduced && ph >= a && ph <= b ? (ph - a) / (b - a) : -1;
      }
      for (let k = 0; k < 4; k++) {
        const d = ph - PIPE.hit[k];
        U.uHit.value[k] = !reduced && d >= 0 ? Math.exp(-d * 3.2) : 0;
      }

      // formation tilt + parallax, camera parallax
      eul.set(portrait ? -0.12 : -0.32, (portrait ? -0.2 : 0) + ptr.x * 0.14 + Math.sin(time * 0.15) * 0.06, 0);
      U.uRot.value.setFromMatrix4(m4.makeRotationFromEuler(eul));
      camera.position.set(ptr.x * 1.4, ptr.y * 0.9, CAMZ);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();

      // HTML layer: fade with the stage, pin node buttons to the projected 3D nodes
      const layer = layerRef.current;
      if (layer) {
        const o = smooth(clamp((pPipe - 0.55) / 0.4, 0, 1)) * clamp(1 - pOut * 1.6, 0, 1) * (1 - disp);
        layer.style.opacity = o.toFixed(3);
        layer.style.visibility = o < 0.02 ? "hidden" : "visible";
        if (o >= 0.02) {
          const W = w();
          const H = h();
          const rPx = (U.uNodeR.value / visH) * H;
          for (let k = 0; k < 4; k++) {
            const el = nodeRefs.current[k];
            if (!el) continue;
            pv.copy(U.uNode.value[k]).applyMatrix3(U.uRot.value).add(U.uOff.value).project(camera);
            el.style.transform = `translate3d(${((pv.x * 0.5 + 0.5) * W).toFixed(1)}px, ${((-pv.y * 0.5 + 0.5) * H).toFixed(1)}px, 0)`;
            el.style.setProperty("--r", `${rPx.toFixed(1)}px`);
          }
        }
      }

      // the light content sheet covers the whole canvas — nothing to draw
      if (!composer || !renderer || (fr && fr.bottom <= 0)) return;
      composer.render(dt);

      // adaptive quality: slow average frame -> lower pixel ratio, then no bloom
      if (dt < 0.2) {
        slow += dt;
        samples += 1;
        if (samples === 90) {
          if (slow / samples > 0.034) {
            if (pr > 1) {
              pr = Math.max(1, pr - 0.5);
              U.uSizeK.value = pr / prMax;
              resize();
            } else if (bloom) bloom.enabled = false;
          }
          slow = samples = 0;
        }
      }
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      geo.dispose();
      mat.dispose();
      bg.geometry.dispose();
      bgMat.dispose();
      bloom?.dispose();
      composer?.dispose();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [flowRef, layerRef, nodeRefs]);

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

const smooth = (t: number) => t * t * (3 - 2 * t);

function shuffled(n: number): Int32Array {
  const a = new Int32Array(n);
  for (let i = 0; i < n; i++) a[i] = i;
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

/** Local point (unit size) of node k: 0 message bubble, 1 AI core, 2 database, 3 person. */
function nodeShape(k: number): [number, number, number] {
  const r = Math.random;
  const sph = (): [number, number, number] => {
    const z = 2 * r() - 1;
    const a = r() * Math.PI * 2;
    const q = Math.sqrt(1 - z * z);
    return [q * Math.cos(a), q * Math.sin(a), z];
  };
  const q = r();
  if (k === 0) {
    // облачко сообщения: контур «сквиркла», хвостик и три точки набора
    if (q < 0.2) {
      const [x, y, z] = sph();
      const rr = 0.12 * Math.cbrt(r());
      return [(Math.floor(r() * 3) - 1) * 0.45 + x * rr, 0.23 + y * rr, z * rr];
    }
    if (q < 0.32) {
      const t = r();
      return r() < 0.5
        ? [-0.55 - 0.3 * t, -0.55 - 0.48 * t, (r() - 0.5) * 0.16]
        : [-0.85 + 0.65 * t, -1.03 + 0.48 * t, (r() - 0.5) * 0.16];
    }
    const a = r() * Math.PI * 2;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    const th = 1 + (r() - 0.5) * 0.08;
    return [Math.sign(c) * Math.sqrt(Math.abs(c)) * 1.15 * th, Math.sign(sn) * Math.sqrt(Math.abs(sn)) * 0.78 * th + 0.15, (r() - 0.5) * 0.22];
  }
  if (k === 1) {
    // ядро ИИ: оболочка, плотное ядро, наклонное кольцо-орбита
    if (q < 0.42) return sph();
    if (q < 0.68) {
      const [x, y, z] = sph();
      const rr = 0.42 * Math.cbrt(r());
      return [x * rr, y * rr, z * rr];
    }
    const a = r() * Math.PI * 2;
    const rr = 1.45 + (r() - 0.5) * 0.08;
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    const y0 = (r() - 0.5) * 0.05;
    return [x, y0 * Math.cos(0.45) - z * Math.sin(0.45), y0 * Math.sin(0.45) + z * Math.cos(0.45)];
  }
  if (k === 2) {
    // база данных: три диска, стенка цилиндра, крышка
    const a = r() * Math.PI * 2;
    if (q < 0.5) {
      const y = [0.7, 0, -0.7][Math.floor(r() * 3)];
      const rr = 0.95 + (r() - 0.5) * 0.05;
      return [Math.cos(a) * rr, y + (r() - 0.5) * 0.04, Math.sin(a) * rr];
    }
    if (q < 0.82) return [Math.cos(a) * 0.95, (r() * 2 - 1) * 0.7, Math.sin(a) * 0.95];
    const rr = 0.95 * Math.sqrt(r());
    return [Math.cos(a) * rr, 0.7, Math.sin(a) * rr];
  }
  // вы: голова и плечи
  const [x, y, z] = sph();
  if (q < 0.38) return [x * 0.42, 0.55 + y * 0.42, z * 0.42];
  return [x * 0.98, -1.0 + Math.abs(y) * 0.85, z * 0.55];
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
