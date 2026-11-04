"use client";

import { useEffect, useRef } from "react";

/* Палитры сняты с прежних фоновых роликов (верх неба, небо, горизонт, свечение, вода у горизонта, вода у зрителя). */
type Palette = [string, string, string, string, string, string];
export const FOG_PALETTES: Palette[] = [
  ["#0c6d35", "#5bca88", "#b0f6cd", "#d4ffeb", "#89e8af", "#5cc98a"], // Сайты
  ["#649afa", "#a9bcfc", "#d6ccfd", "#fde8fe", "#d9ccfd", "#8aa4f4"], // AI-системы
  ["#f14d81", "#f57f84", "#f8a894", "#fbd5b3", "#f48376", "#f6a257"], // AI-креатив
];

const VERT = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

// Туман над гладью: небо с облаками тумана, полоса дымки на горизонте, вода с перспективной рябью
// и дорожкой света. uFly — пролёт сквозь дымку при смене мира, uIntro — туман рассеивается при загрузке.
const FRAG = `precision mediump float;
varying vec2 vUv;
uniform vec2 uRes; uniform float uTime, uMix, uFly, uIntro; uniform vec2 uPtr;
uniform vec3 uA[6]; uniform vec3 uB[6];
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * f * (f * (f * 6. - 15.) + 10.);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 4; i++) { v += a * noise(p); p = m * p + vec2(1.7, 9.2); a *= .5; } return v; }
void main(){
  vec2 uv = vUv; float asp = uRes.x / uRes.y;
  vec3 top = mix(uA[0], uB[0], uMix), sky = mix(uA[1], uB[1], uMix), hzc = mix(uA[2], uB[2], uMix);
  vec3 glow = mix(uA[3], uB[3], uMix), far = mix(uA[4], uB[4], uMix), near = mix(uA[5], uB[5], uMix);
  float hz = .56 + uPtr.y * .012;
  float gx = (uv.x - .5 - uPtr.x * .05) * asp;
  // небо (считается везде, чтобы горизонт был мягким переходом, а не обрезом)
  float t = clamp((uv.y - hz) / (1. - hz), 0., 1.);
  vec3 skyc = mix(hzc, sky, smoothstep(0., .3, t));
  skyc = mix(skyc, top, smoothstep(.28, 1., t));
  float c1 = smoothstep(.38, .82, fbm(vec2(uv.x * asp * 1.2 + uTime * .016, t * 2.4 - uTime * .007)));
  float c2 = smoothstep(.45, .9, fbm(vec2(uv.x * asp * 2.2 - uTime * .011, t * 3.6 + 3.1)));
  skyc = mix(skyc, glow, (c1 * .5 + c2 * .22) * (1. - t * .5));
  skyc += glow * .4 * exp(-gx * gx * 1.1 - pow((uv.y - hz) * 3.6, 2.));
  // вода: перспективная рябь, дорожка света
  float d = max(hz - uv.y, 0.);
  float z = .1 / (d + .02);
  vec2 w = vec2(uv.x * asp * z * .32, z * 2.4 + uTime * (.22 + uFly * 1.8));
  float r = fbm(w);
  vec3 base = mix(far, near, smoothstep(0., hz, d));
  vec3 wat = mix(base * .84, base * 1.12, r);
  float path = exp(-pow(gx * (1.8 + d * 5.), 2.)) * exp(-d * 1.4);
  wat = mix(wat, glow, path * (.3 + .65 * smoothstep(.5, .8, r)));
  vec3 col = mix(wat, skyc, smoothstep(hz - .014, hz + .02, uv.y));
  // дымка на горизонте и общий дрейф тумана
  col = mix(col, glow, exp(-pow((uv.y - hz) * 9., 2.)) * .32);
  float m = fbm(vec2(uv.x * asp * .7 - uTime * .012, uv.y * 1.1 + uTime * .004));
  col = mix(col, hzc, clamp(smoothstep(.4, .8, m) * .2 + uFly * .45 + uIntro * .85, 0., .95));
  col += glow * .06 * exp(-length((uv - (uPtr * .5 + .5)) * vec2(asp, 1.)) * 5.);
  gl_FragColor = vec4(col, 1.);
}`;

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const flat = (p: Palette) => new Float32Array(p.flatMap(hex));

/**
 * Фон хаба кодом вместо видео: килобайты вместо мегабайтов ролика, живой — тянется за
 * курсором/пальцем (на Android и за наклоном). Рисуется в пониженном разрешении (туман мягкий),
 * разрешение снижается дальше, если кадры долгие. Нет WebGL — остаются CSS-постеры под ним.
 */
export default function FogBackdrop({ index, className }: { index: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const indexRef = useRef(index);
  indexRef.current = index;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 768px)").matches;

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const vs = sh(gl.VERTEX_SHADER, VERT);
    const fs = sh(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return; // шейдер не собрался — остаются постеры
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // один треугольник на весь экран
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = U("uRes"), uTime = U("uTime"), uMix = U("uMix"), uFly = U("uFly"), uIntro = U("uIntro"), uPtr = U("uPtr");
    const uA = U("uA"), uB = U("uB");

    let scale = mobile ? 0.8 : 0.6; // от CSS-пикселей: на телефоне экран узкий, 0.5 давало ~200 px
    const resize = () => {
      const w = Math.max(1, Math.round(window.innerWidth * scale));
      const h = Math.max(1, Math.round(window.innerHeight * scale));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    // ввод: мышь, палец, наклон (Android отдаёт без запроса разрешения)
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    const toPtr = (cx: number, cy: number) => {
      ptr.tx = (cx / window.innerWidth) * 2 - 1;
      ptr.ty = 1 - (cy / window.innerHeight) * 2;
    };
    const onMove = (e: PointerEvent) => toPtr(e.clientX, e.clientY);
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      ptr.tx = Math.max(-1, Math.min(1, e.gamma / 35));
      ptr.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 35));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("deviceorientation", onTilt, { passive: true });

    let from = indexRef.current;
    let to = from;
    let mix = 1;
    gl.uniform3fv(uA, flat(FOG_PALETTES[from]));
    gl.uniform3fv(uB, flat(FOG_PALETTES[to]));

    let raf = 0;
    let last = 0;
    let time = 0;
    let intro = reduced ? 0 : 1;
    let slow = 0;
    let samples = 0;
    const draw = () => {
      gl.uniform1f(uTime, time);
      gl.uniform1f(uMix, mix);
      gl.uniform1f(uFly, reduced ? 0 : Math.sin(Math.PI * Math.min(1, mix)) * (from === to ? 0 : 1));
      gl.uniform1f(uIntro, intro);
      gl.uniform2f(uPtr, ptr.x, ptr.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!canvas.dataset.on) canvas.dataset.on = "1"; // первый кадр есть — CSS проявляет канвас поверх постера
    };
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min(0.1, last ? (now - last) / 1000 : 0.016);
      last = now;

      // смена мира: палитра перетекает 1.4 с, по дороге пролёт сквозь дымку
      if (indexRef.current !== to) {
        from = to; // новый выбор посреди перехода — стартуем от текущей цели
        gl.uniform3fv(uA, flat(FOG_PALETTES[from]));
        to = indexRef.current;
        gl.uniform3fv(uB, flat(FOG_PALETTES[to]));
        mix = 0;
      }
      if (mix < 1) mix = Math.min(1, mix + dt / (reduced ? 0.001 : 1.4));
      if (mix >= 1 && from !== to) {
        from = to;
        gl.uniform3fv(uA, flat(FOG_PALETTES[from]));
      }
      if (reduced) {
        draw();
        return;
      }
      time += dt;
      intro = Math.max(0, intro - dt / 1.8);
      const k = 1 - Math.exp(-dt * 2.5);
      ptr.x += (ptr.tx - ptr.x) * k;
      ptr.y += (ptr.ty - ptr.y) * k;
      draw();

      // адаптивное разрешение: средний кадр дольше 30 мс — рисуем мельче
      if (dt < 0.2) {
        slow += dt;
        samples += 1;
        if (samples === 60) {
          if (slow / samples > 0.03 && scale > 0.35) {
            scale = Math.max(0.35, scale * 0.8);
            resize();
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
      window.removeEventListener("deviceorientation", onTilt);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
