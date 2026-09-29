"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { ArrowUpRight, Browsers, Cpu, FilmSlate } from "@phosphor-icons/react";
import s from "./hub.module.css";

type Weights = [number, number, number];

/* One entry per direction. `glow` is the colour the shader paints for it (linear-ish RGB,
   already dimmed so it reads as light behind glass, not a neon blob); `accent` is the
   same hue at full strength for the card itself. */
const DIRS = [
  {
    title: "Сайты",
    desc: "Сайт, который доводит клиента до заявки. Запуск за 5–7 дней.",
    href: "https://site.gabdra.pw",
    Icon: Browsers,
    accent: "#c9ef3b",
    glow: [0.62, 0.8, 0.16],
  },
  {
    title: "AI-системы",
    desc: "Боты, ассистенты и автоматизация на ваших данных.",
    href: "https://ai.gabdra.pw",
    Icon: Cpu,
    accent: "#7fdcff",
    glow: [0.3, 0.62, 0.82],
  },
  {
    title: "AI-креатив",
    desc: "ИИ-видео, анимация и генерация под задачу.",
    // https on this host is currently held by the VPS's VPN container (serves a google.com
    // cert), so link plain http until kukla moves to Vercel like the other two
    href: "http://kukla.gabdra.pw",
    Icon: FilmSlate,
    accent: "#ff8d52",
    glow: [0.86, 0.42, 0.22],
  },
] as const;

const IDLE: Weights = [0.55, 0.55, 0.55];

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uW;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;

float blob(vec2 p, vec2 c, float r) { vec2 d = p - c; return exp(-dot(d, d) / (r * r)); }

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float ar = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * ar, uv.y);
  float t = uTime * 0.07;
  p += 0.05 * vec2(sin(p.y * 3.3 + t * 2.1), cos(p.x * 2.9 - t * 1.7)); // liquid warp
  vec2 c0 = vec2(ar * (0.24 + 0.08 * sin(t * 1.3)), 0.70 + 0.10 * cos(t * 1.1));
  vec2 c1 = vec2(ar * (0.78 + 0.08 * cos(t * 0.9)), 0.60 + 0.12 * sin(t * 1.5));
  vec2 c2 = vec2(ar * (0.52 + 0.14 * sin(t * 0.7 + 2.0)), 0.18 + 0.08 * cos(t * 1.2));
  // distances are in screen-height units, so on a portrait phone the whole width is ~0.46:
  // shrink and dim the blobs there, or they wash out the copy behind the headline
  float k = min(ar, 1.0);
  float r = 0.22 + 0.26 * k;
  float dim = mix(0.72, 1.0, k);
  vec3 col = vec3(0.028, 0.030, 0.038);
  col += uC0 * blob(p, c0, r) * uW.x * dim;
  col += uC1 * blob(p, c1, r * 1.05) * uW.y * dim;
  col += uC2 * blob(p, c2, r * 0.95) * uW.z * dim;
  col *= 0.62 + 0.38 * smoothstep(1.2, 0.25, distance(uv, vec2(0.5)) * 1.5); // vignette
  // dither: dark gradients band badly in 8-bit
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * (2.0 / 255.0);
  gl_FragColor = vec4(col, 1.0);
}`;

const VERT = `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

/* Full-screen liquid light in the three direction colours. Rendered at half resolution —
   it is all soft gradients, so nobody can tell, and it keeps phone GPUs idle. If WebGL is
   unavailable the canvas keeps its CSS radial-gradient background as a static fallback. */
function Aurora({ weights }: { weights: MutableRefObject<Weights> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return; // keep the CSS fallback
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // one big triangle
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes"), uTime = u("uTime"), uW = u("uW");
    DIRS.forEach((d, i) => gl.uniform3f(u(`uC${i}`), d.glow[0], d.glow[1], d.glow[2]));

    const resize = () => {
      canvas.width = Math.max(1, Math.round(window.innerWidth * 0.5));
      canvas.height = Math.max(1, Math.round(window.innerHeight * 0.5));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cur: Weights = [...IDLE];
    const t0 = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      for (let i = 0; i < 3; i++) cur[i] += (weights.current[i] - cur[i]) * 0.06; // ease hover
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, still ? 14 : (now - t0) / 1000);
      gl.uniform3f(uW, cur[0], cur[1], cur[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [weights]);

  return <canvas ref={ref} className={s.aurora} aria-hidden />;
}

export default function HubLanding() {
  const weights = useRef<Weights>([...IDLE]);
  const focus = (i: number | null) => {
    weights.current = i === null ? [...IDLE] : ([0, 1, 2].map((k) => (k === i ? 1 : 0.28)) as Weights);
  };

  return (
    <main className={s.root}>
      <Aurora weights={weights} />
      <div className={s.grain} aria-hidden />

      <section className={s.center}>
        <p className={s.kicker}>цифровые продукты под задачу</p>
        <h1 className={s.brand}>
          ainur<span>.</span>
        </h1>
        <p className={s.lead}>От идеи до работающего результата — выберите, с чего начать.</p>

        <nav className={s.cards} aria-label="Направления" onMouseLeave={() => focus(null)}>
          {DIRS.map((d, i) => (
            <a
              key={d.title}
              href={d.href}
              className={s.card}
              style={{ "--c": d.accent } as React.CSSProperties}
              onMouseEnter={() => focus(i)}
              onFocus={() => focus(i)}
              onBlur={() => focus(null)}
            >
              <span className={s.icon} aria-hidden>
                <d.Icon size={26} weight="duotone" />
              </span>
              <span className={s.text}>
                <span className={s.title}>{d.title}</span>
                <span className={s.desc}>{d.desc}</span>
              </span>
              <span className={s.arrow} aria-hidden>
                <ArrowUpRight size={17} weight="bold" />
              </span>
            </a>
          ))}
        </nav>
      </section>

      <footer className={s.foot}>
        <span>© 2026 ainur.</span>
        <a href="https://t.me/foggearthquake_bot" target="_blank" rel="noreferrer">
          Telegram
        </a>
        <a href="mailto:ainur@gabdra.pw">ainur@gabdra.pw</a>
        <a href="/privacy">Политика</a>
      </footer>
    </main>
  );
}
