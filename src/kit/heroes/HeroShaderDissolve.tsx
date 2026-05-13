"use client";

/**
 * Hero with a GLSL noise-dissolve overlay that wipes vertically on scroll.
 * Generalised from Ironhill-section-rebuild's hero.
 *
 * Renders a fullscreen `<canvas>` behind your content; an fBm noise field
 * dissolves the overlay color from bottom to top as the user scrolls past
 * the hero. Use Lenis (already in the kit) for the smoothest result.
 *
 * - Content slots: `topLeft`, `topRight`, `centerTitle`, `description`,
 *   `bottomLeft`, `bottomRight` (use these to position the hero copy).
 * - `color` is the overlay color (typically the page background) — when the
 *   shader dissolves, the underlying media (video, image, or another
 *   canvas) shows through.
 * - `spread` (0.0 – 1.0) controls how chaotic / soft the dissolve edge is.
 * - `speed` is a scrollProgress multiplier (1 = full hero scroll, 1.5 = wipes faster).
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";

export type HeroShaderDissolveProps = {
  /** Hex color of the dissolving overlay. Default light cream. */
  color?: string;
  /** Noise edge softness — higher = more chaotic, lower = harder edge. */
  spread?: number;
  /** Scroll-progress multiplier. */
  speed?: number;
  /** Optional background media that shows through the dissolve. */
  backgroundVideoSrc?: string;
  backgroundImageSrc?: string;
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
  centerTitle?: React.ReactNode;
  description?: React.ReactNode;
  bottomLeft?: React.ReactNode;
  bottomRight?: React.ReactNode;
  className?: string;
};

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
uniform float uProgress;
uniform vec2 uResolution;
uniform vec3 uColor;
uniform float uSpread;
varying vec2 vUv;

float Hash(vec2 p) {
  vec3 p2 = vec3(p.xy, 1.0);
  return fract(sin(dot(p2, vec3(37.1, 61.7, 12.4))) * 3758.5453123);
}

float noise(in vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f *= f * (3.0 - 2.0 * f);
  return mix(
    mix(Hash(i + vec2(0.0, 0.0)), Hash(i + vec2(1.0, 0.0)), f.x),
    mix(Hash(i + vec2(0.0, 1.0)), Hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  v += noise(p * 1.0) * 0.5;
  v += noise(p * 2.0) * 0.25;
  v += noise(p * 4.0) * 0.125;
  return v;
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  vec2 centeredUv = (uv - 0.5) * vec2(aspect, 1.0);

  float dissolveEdge = uv.y - uProgress * 1.2;
  float noiseValue = fbm(centeredUv * 15.0);
  float d = dissolveEdge + noiseValue * uSpread;

  float pixelSize = 1.0 / uResolution.y;
  float alpha = 1.0 - smoothstep(-pixelSize, pixelSize, d);

  gl_FragColor = vec4(uColor, alpha);
}
`;

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? {
        r: parseInt(m[1], 16) / 255,
        g: parseInt(m[2], 16) / 255,
        b: parseInt(m[3], 16) / 255,
      }
    : { r: 0.89, g: 0.89, b: 0.89 };
}

export function HeroShaderDissolve({
  color = "#ebf5df",
  spread = 0.5,
  speed = 1,
  backgroundVideoSrc,
  backgroundImageSrc,
  topLeft,
  topRight,
  centerTitle,
  description,
  bottomLeft,
  bottomRight,
  className = "",
}: HeroShaderDissolveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = heroRef.current;
    if (!canvas || !hero) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
    });

    const rgb = hexToRgb(color);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uProgress: { value: 0 },
        uResolution: {
          value: new THREE.Vector2(hero.offsetWidth, hero.offsetHeight),
        },
        uColor: { value: new THREE.Vector3(rgb.r, rgb.g, rgb.b) },
        uSpread: { value: spread },
      },
      transparent: true,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      renderer.setSize(hero.offsetWidth, hero.offsetHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      material.uniforms.uResolution.value.set(
        hero.offsetWidth,
        hero.offsetHeight
      );
    };
    resize();
    window.addEventListener("resize", resize);

    let scrollProgress = 0;
    let raf = 0;
    const tick = () => {
      material.uniforms.uProgress.value = scrollProgress;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onScroll = () => {
      const rect = hero.getBoundingClientRect();
      const heroHeight = hero.offsetHeight;
      const passed = -rect.top;
      const maxScroll = heroHeight - window.innerHeight;
      scrollProgress = Math.min(Math.max(passed / maxScroll, 0) * speed, 1.1);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      material.dispose();
      renderer.dispose();
    };
  }, [color, spread, speed]);

  return (
    <section
      ref={heroRef}
      className={`relative h-[200vh] w-full overflow-hidden ${className}`}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {backgroundVideoSrc ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 z-0 h-full w-full object-cover"
            src={backgroundVideoSrc}
          />
        ) : backgroundImageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={backgroundImageSrc}
            alt=""
            className="absolute inset-0 z-0 h-full w-full object-cover"
          />
        ) : null}

        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 h-full w-full"
        />

        <div className="relative z-20 flex h-full w-full flex-col justify-between p-6 sm:p-12">
          <div className="flex items-start justify-between">
            <div>{topLeft}</div>
            <div>{topRight}</div>
          </div>
          <div className="flex flex-col items-center text-center">
            {centerTitle}
            {description ? <div className="mt-4">{description}</div> : null}
          </div>
          <div className="flex items-end justify-between">
            <div>{bottomLeft}</div>
            <div>{bottomRight}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
