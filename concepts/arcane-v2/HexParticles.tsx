"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  baseSpeed: number;
}

const COLORS = [
  "rgba(201, 168, 76, ",   // gold
  "rgba(0, 212, 184, ",    // cyan
  "rgba(107, 63, 160, ",   // purple
];

export default function HexParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    const count = Math.min(80, Math.floor(window.innerWidth * window.innerHeight / 20000));
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const speed = 0.15 + Math.random() * 0.3;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        size: 1 + Math.random() * 2.5,
        opacity: 0.15 + Math.random() * 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        baseSpeed: speed,
      });
    }
    particlesRef.current = particles;

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouse);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const p of particles) {
        // Mouse interaction: particles gently push away
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const interactRadius = 150;

        if (dist < interactRadius && dist > 0) {
          const force = (interactRadius - dist) / interactRadius;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force * 0.4;
          p.vy += Math.sin(angle) * force * 0.4;

          // Particles near cursor glow brighter
          p.opacity = Math.min(0.9, p.opacity + force * 0.3);
        } else {
          // Dampen back to base
          p.opacity += (0.15 + Math.random() * 0.2 - p.opacity) * 0.01;
        }

        // Dampen velocity
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Restore gentle drift
        if (Math.abs(p.vx) < p.baseSpeed * 0.5) {
          p.vx += (Math.random() - 0.5) * 0.02;
        }
        if (Math.abs(p.vy) < p.baseSpeed * 0.5) {
          p.vy += (Math.random() - 0.5) * 0.02;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.opacity + ")";
        ctx.fill();

        // Glow effect for larger particles
        if (p.size > 1.8) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = p.color + (p.opacity * 0.15) + ")";
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
}
