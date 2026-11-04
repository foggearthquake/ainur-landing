"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type ShowcaseCase = { key: string; phoneLandscape?: boolean };

const FRAMES = 3;
const FRAME_S = 2.6; // смена кадра внутри проекта
const FADE_S = 0.7; // перетекание кадров
const LIME = 0xc6e35a; // акцент сайта (--accent)

const src = (key: string, dev: "desk" | "mob", i: number) => `/showcase/${key}-${dev}-${i}.webp`;

type Props = { cases: ShowcaseCase[]; active: number; onReady?: () => void };

/**
 * Витрина проектов (raw three.js, строгая уборка): ноутбук и телефон, на экранах
 * сменяются кадры выбранного проекта. Кадры — только вид сайта, без ссылок.
 *   смена проекта -> устройства делают короткий поворот, экраны перетекают;
 *   phoneLandscape -> телефон ложится горизонтально (игра идёт в альбомной);
 *   мышь — лёгкий наклон, на телефоне плавное покачивание; вне экрана цикл стоит.
 * Свет — постоянный набор (без перекомпиляции материалов), DPR ограничен и
 * снижается, если кадр долгий.
 */
export default function DeviceShowcase({ cases, active, onReady }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      return; // нет WebGL — остаётся постер родителя
    }
    let dpr = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

    scene.add(new THREE.HemisphereLight(0xe4e9ff, 0x14151b, 1.15));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.7);
    keyLight.position.set(3, 5, 6);
    scene.add(keyLight);
    const rim = new THREE.DirectionalLight(LIME, 0.9);
    rim.position.set(-5, 2.5, -4);
    scene.add(rim);

    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];
    const g = <T extends THREE.BufferGeometry>(x: T) => (geos.push(x), x);
    const m = <T extends THREE.Material>(x: T) => (mats.push(x), x);

    const metal = m(new THREE.MeshStandardMaterial({ color: 0x2c2f37, metalness: 0.55, roughness: 0.36 }));
    const dark = m(new THREE.MeshStandardMaterial({ color: 0x0a0b0e, metalness: 0.15, roughness: 0.55 }));
    const keys = m(new THREE.MeshStandardMaterial({ color: 0x15171c, metalness: 0.2, roughness: 0.7 }));

    const rig = new THREE.Group();
    scene.add(rig);

    // ── ноутбук ──
    const laptop = new THREE.Group();
    rig.add(laptop);
    const base = new THREE.Mesh(g(new RoundedBoxGeometry(3.3, 0.12, 2.25, 3, 0.05)), metal);
    base.position.y = 0.06;
    laptop.add(base);
    const deck = new THREE.Mesh(g(new THREE.PlaneGeometry(2.9, 1.05)), keys);
    deck.rotation.x = -Math.PI / 2;
    deck.position.set(0, 0.1215, -0.32);
    laptop.add(deck);
    const pad = new THREE.Mesh(g(new THREE.PlaneGeometry(1.05, 0.62)), dark);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(0, 0.1215, 0.62);
    laptop.add(pad);
    const hinge = new THREE.Group();
    hinge.position.set(0, 0.12, -1.1);
    hinge.rotation.x = -0.24; // крышка чуть откинута назад
    laptop.add(hinge);
    const lid = new THREE.Mesh(g(new RoundedBoxGeometry(3.3, 2.15, 0.07, 3, 0.035)), metal);
    lid.position.set(0, 1.075, 0);
    hinge.add(lid);
    const bezel = new THREE.Mesh(g(new THREE.PlaneGeometry(3.2, 2.05)), dark);
    bezel.position.set(0, 1.075, 0.0355);
    hinge.add(bezel);

    // ── телефон ──
    const phone = new THREE.Group();
    phone.position.set(2.15, 1.02, 0.85);
    phone.rotation.set(-0.1, -0.38, 0);
    rig.add(phone);
    const phoneTurn = new THREE.Group(); // поворот в альбомную — отдельной осью
    phone.add(phoneTurn);
    const body = new THREE.Mesh(g(new RoundedBoxGeometry(0.98, 2.0, 0.09, 4, 0.13)), metal);
    phoneTurn.add(body);
    const pbez = new THREE.Mesh(g(new THREE.PlaneGeometry(0.92, 1.94)), dark);
    pbez.position.z = 0.0455;
    phoneTurn.add(pbez);

    // экраны: базовый слой + верхний для перетекания кадров
    const screen = (parent: THREE.Object3D, w: number, h: number, pos: THREE.Vector3) => {
      const geo = g(new THREE.PlaneGeometry(w, h));
      const a = new THREE.Mesh(geo, m(new THREE.MeshBasicMaterial({ color: 0x0a0b0e, toneMapped: false })));
      const b = new THREE.Mesh(geo, m(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, toneMapped: false })));
      a.position.copy(pos);
      b.position.copy(pos).add(new THREE.Vector3(0, 0, 0.0008));
      parent.add(a, b);
      return { a: a.material as THREE.MeshBasicMaterial, b: b.material as THREE.MeshBasicMaterial };
    };
    const lapScreen = screen(hinge, 3.04, 1.9, new THREE.Vector3(0, 1.09, 0.037));
    const phoneScreen = screen(phoneTurn, 0.86, 1.86, new THREE.Vector3(0, 0, 0.047));

    // мягкая тень-пятно под устройствами (градиент на canvas, без теней рендера)
    const sc = document.createElement("canvas");
    sc.width = sc.height = 128;
    const sx = sc.getContext("2d")!;
    const grad = sx.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, "rgba(0,0,0,0.55)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    sx.fillStyle = grad;
    sx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(sc);
    const shadow = new THREE.Mesh(g(new THREE.PlaneGeometry(6.4, 3.6)), m(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0.45, 0.002, 0.1);
    rig.add(shadow);

    // ── текстуры ──
    const loader = new THREE.TextureLoader();
    const cache = new Map<string, THREE.Texture>();
    const tex = (url: string, rotate = false, onLoad?: () => void) => {
      const id = rotate ? `${url}#r` : url;
      let t = cache.get(id);
      if (!t) {
        t = loader.load(url, onLoad);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        if (rotate) {
          // альбомный кадр на телефон, лежащий на боку
          t.center.set(0.5, 0.5);
          t.rotation = -Math.PI / 2;
        }
        cache.set(id, t);
      } else if (onLoad) onLoad();
      return t;
    };
    const frameTex = (ci: number, i: number) => {
      const c = cases[ci];
      return { lap: tex(src(c.key, "desk", i)), phone: tex(src(c.key, "mob", i), !!c.phoneLandscape) };
    };
    const preload = (ci: number) => {
      for (let i = 0; i < FRAMES; i++) frameTex(ci, i);
    };

    // первый кадр — сразу в базовый слой; готовность, когда оба экрана загрузились
    let pending = 2;
    const loaded = () => {
      pending -= 1;
      if (pending === 0) readyRef.current?.();
    };
    let shownCase = activeRef.current;
    {
      const c = cases[shownCase];
      lapScreen.a.map = tex(src(c.key, "desk", 0), false, loaded);
      phoneScreen.a.map = tex(src(c.key, "mob", 0), !!c.phoneLandscape, loaded);
      lapScreen.a.color.set(0xffffff);
      phoneScreen.a.color.set(0xffffff);
      lapScreen.a.needsUpdate = phoneScreen.a.needsUpdate = true;
    }
    preload(shownCase);

    let frame = 0;
    let frameClock = 0;
    let fading = -1; // <0 — нет перехода, иначе 0..1
    const crossTo = (ci: number, i: number) => {
      const t = frameTex(ci, i);
      lapScreen.b.map = t.lap;
      phoneScreen.b.map = t.phone;
      lapScreen.b.needsUpdate = phoneScreen.b.needsUpdate = true;
      fading = 0;
    };

    // ── кадрирование: оба устройства влезают при любом соотношении сторон ──
    const fit = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      // 2.8 — с запасом под телефон в альбомной (на десктопе кадр задаёт высота, не ширина)
      const dist = Math.max(2.8 / (half * camera.aspect), 1.75 / half) * 1.06;
      camera.position.set(0.45, 1.75 + dist * 0.12, dist);
      camera.lookAt(0.45, 0.98, 0);
      camera.updateProjectionMatrix();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(mount);

    // ── ввод: лёгкий наклон за мышью ──
    const pointer = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = mount.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    const onLeave = () => {
      pointer.x = pointer.y = 0;
    };
    mount.addEventListener("pointermove", onMove);
    mount.addEventListener("pointerleave", onLeave);

    // ── цикл ──
    let raf = 0;
    let running = false;
    let last = 0;
    let time = 0;
    let spin = 0; // импульс поворота при смене проекта
    let slow = 0;
    let samples = 0;

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min(0.1, last ? (now - last) / 1000 : 0.016);
      last = now;
      time += dt;

      // смена проекта по выбору родителя
      if (activeRef.current !== shownCase) {
        shownCase = activeRef.current;
        frame = 0;
        frameClock = 0;
        crossTo(shownCase, 0);
        preload(shownCase);
        if (!reduced) spin = 0.9;
      }

      // смена кадров внутри проекта
      if (!reduced && fading < 0) {
        frameClock += dt;
        if (frameClock >= FRAME_S) {
          frameClock = 0;
          frame = (frame + 1) % FRAMES;
          crossTo(shownCase, frame);
        }
      }
      if (fading >= 0) {
        fading = Math.min(1, fading + dt / (reduced ? 0.001 : FADE_S));
        lapScreen.b.opacity = phoneScreen.b.opacity = fading;
        if (fading >= 1) {
          lapScreen.a.map = lapScreen.b.map;
          phoneScreen.a.map = phoneScreen.b.map;
          lapScreen.a.needsUpdate = phoneScreen.a.needsUpdate = true;
          lapScreen.b.opacity = phoneScreen.b.opacity = 0;
          fading = -1;
        }
      }

      // движение
      const k = 1 - Math.exp(-dt * 4);
      spin += (0 - spin) * (1 - Math.exp(-dt * 3.2));
      const sway = reduced ? 0 : isMobile ? Math.sin(time * 0.5) * 0.12 : 0;
      const yaw = -0.12 + pointer.x * 0.22 + sway + Math.sin(spin * Math.PI) * 0.35;
      rig.rotation.y += (yaw - rig.rotation.y) * k;
      rig.rotation.x += (pointer.y * 0.06 - rig.rotation.x) * k;
      rig.position.y = reduced ? 0 : Math.sin(time * 0.8) * 0.04;
      const turn = cases[shownCase].phoneLandscape ? Math.PI / 2 : 0;
      phoneTurn.rotation.z += (turn - phoneTurn.rotation.z) * (reduced ? 1 : 1 - Math.exp(-dt * 5));

      renderer.render(scene, camera);

      // адаптивное качество: долгие кадры (не фризы) снижают DPR
      if (dt < 0.2) {
        slow += dt;
        samples += 1;
        if (samples === 60) {
          if (slow / samples > 0.036 && dpr > 1) {
            dpr = Math.max(1, dpr - 0.25);
            renderer.setPixelRatio(dpr);
            fit();
          }
          slow = samples = 0;
        }
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        last = 0;
        raf = requestAnimationFrame(step);
      } else if (!entry.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(mount);

    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
      mount.removeEventListener("pointermove", onMove);
      mount.removeEventListener("pointerleave", onLeave);
      cache.forEach((t) => t.dispose());
      shadowTex.dispose();
      geos.forEach((x) => x.dispose());
      mats.forEach((x) => x.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [cases]);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden />;
}
