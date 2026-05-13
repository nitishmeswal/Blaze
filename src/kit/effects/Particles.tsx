"use client";

/**
 * Particles
 * Verbatim port of Personal-Portfolio/src/components/Particles.jsx.
 *
 * Canvas-based magnetic particle field. Particles drift, fade near edges, and
 * are gently pulled toward the cursor.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";

type Circle = {
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
  magnetism: number;
};

function useMousePosition() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  return mouse;
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export type ParticlesProps = {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  refresh?: boolean;
  color?: string;
  vx?: number;
  vy?: number;
  style?: CSSProperties;
};

export function Particles({
  className = "",
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = "#ffffff",
  vx = 0,
  vy = 0,
  ...props
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const circles = useRef<Circle[]>([]);
  const mousePos = useMousePosition();
  const mouse = useRef({ x: 0, y: 0 });
  const canvasSize = useRef({ w: 0, h: 0 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  const rafId = useRef<number | null>(null);

  const rgb = hexToRgb(color);

  useEffect(() => {
    if (canvasRef.current) ctxRef.current = canvasRef.current.getContext("2d");
    initCanvas();
    animate();
    const onResize = () => initCanvas();
    window.addEventListener("resize", onResize);
    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const { w, h } = canvasSize.current;
    const x = mousePos.x - rect.left - w / 2;
    const y = mousePos.y - rect.top - h / 2;
    const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2;
    if (inside) {
      mouse.current.x = x;
      mouse.current.y = y;
    }
  }, [mousePos]);

  useEffect(() => {
    initCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  function initCanvas() {
    resizeCanvas();
    drawParticles();
  }

  function resizeCanvas() {
    if (!containerRef.current || !canvasRef.current || !ctxRef.current) return;
    canvasSize.current.w = containerRef.current.offsetWidth;
    canvasSize.current.h = containerRef.current.offsetHeight;
    canvasRef.current.width = canvasSize.current.w * dpr;
    canvasRef.current.height = canvasSize.current.h * dpr;
    canvasRef.current.style.width = `${canvasSize.current.w}px`;
    canvasRef.current.style.height = `${canvasSize.current.h}px`;
    ctxRef.current.scale(dpr, dpr);
    circles.current = [];
    for (let i = 0; i < quantity; i++) {
      drawCircle(circleParams());
    }
  }

  function circleParams(): Circle {
    return {
      x: Math.floor(Math.random() * canvasSize.current.w),
      y: Math.floor(Math.random() * canvasSize.current.h),
      translateX: 0,
      translateY: 0,
      size: Math.floor(Math.random() * 2) + size,
      alpha: 0,
      targetAlpha: parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)),
      dx: (Math.random() - 0.5) * 0.1,
      dy: (Math.random() - 0.5) * 0.1,
      magnetism: 0.1 + Math.random() * 4,
    };
  }

  function drawCircle(c: Circle, update = false) {
    if (!ctxRef.current) return;
    ctxRef.current.translate(c.translateX, c.translateY);
    ctxRef.current.beginPath();
    ctxRef.current.arc(c.x, c.y, c.size, 0, 2 * Math.PI);
    ctxRef.current.fillStyle = `rgba(${rgb.join(", ")}, ${c.alpha})`;
    ctxRef.current.fill();
    ctxRef.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!update) circles.current.push(c);
  }

  function clearCtx() {
    if (!ctxRef.current) return;
    ctxRef.current.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);
  }

  function drawParticles() {
    clearCtx();
    for (let i = 0; i < quantity; i++) drawCircle(circleParams());
  }

  function remap(v: number, a1: number, b1: number, a2: number, b2: number) {
    const r = ((v - a1) * (b2 - a2)) / (b1 - a1) + a2;
    return r > 0 ? r : 0;
  }

  function animate() {
    clearCtx();
    circles.current.forEach((c, i) => {
      const edges = [
        c.x + c.translateX - c.size,
        canvasSize.current.w - c.x - c.translateX - c.size,
        c.y + c.translateY - c.size,
        canvasSize.current.h - c.y - c.translateY - c.size,
      ];
      const closest = edges.reduce((a, b) => Math.min(a, b));
      const remapClosest = parseFloat(remap(closest, 0, 20, 0, 1).toFixed(2));
      if (remapClosest > 1) {
        c.alpha += 0.02;
        if (c.alpha > c.targetAlpha) c.alpha = c.targetAlpha;
      } else {
        c.alpha = c.targetAlpha * remapClosest;
      }
      c.x += c.dx + vx;
      c.y += c.dy + vy;
      c.translateX +=
        (mouse.current.x / (staticity / c.magnetism) - c.translateX) / ease;
      c.translateY +=
        (mouse.current.y / (staticity / c.magnetism) - c.translateY) / ease;
      drawCircle(c, true);
      if (
        c.x < -c.size ||
        c.x > canvasSize.current.w + c.size ||
        c.y < -c.size ||
        c.y > canvasSize.current.h + c.size
      ) {
        circles.current.splice(i, 1);
        drawCircle(circleParams());
      }
    });
    rafId.current = requestAnimationFrame(animate);
  }

  return (
    <div
      className={cn("pointer-events-none", className)}
      ref={containerRef}
      aria-hidden="true"
      {...props}
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
