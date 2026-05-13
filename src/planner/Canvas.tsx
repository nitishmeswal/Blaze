"use client";

/**
 * The drawable canvas. SVG-based for clean lines and effortless hit-testing.
 *
 * Behaviours:
 * - Renders the active viewport as a framed rectangle.
 * - Renders section dividers as horizontal bands inside the frame.
 * - Renders paths for the active viewport (lines or quadratic-smoothed curves).
 * - Renders waypoints as draggable squares.
 * - Renders markers as draggable circles.
 * - Click empty space adds a marker / starts-or-extends a path / inserts a
 *   section depending on the current tool.
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { usePlannerStore } from "./store";
import type { Marker, Path, Section, Vec2, Viewport, Waypoint } from "./types";

const SCALE_MIN = 0.25;
const SCALE_MAX = 1.5;

export function Canvas() {
  const map = usePlannerStore((s) => s.map);
  const viewportId = usePlannerStore((s) => s.currentViewportId);
  const tool = usePlannerStore((s) => s.tool);
  const draftPathId = usePlannerStore((s) => s.draftPathId);
  const addMarker = usePlannerStore((s) => s.addMarker);
  const startPath = usePlannerStore((s) => s.startPath);
  const addWaypoint = usePlannerStore((s) => s.addWaypoint);
  const addSection = usePlannerStore((s) => s.addSection);
  const select = usePlannerStore((s) => s.select);

  const viewport = useMemo<Viewport | undefined>(
    () => map.viewports.find((v) => v.id === viewportId),
    [map.viewports, viewportId]
  );

  const sections = useMemo(
    () => map.sections.filter((s) => s.viewportId === viewportId),
    [map.sections, viewportId]
  );
  const paths = useMemo(
    () => map.paths.filter((p) => p.viewportId === viewportId),
    [map.paths, viewportId]
  );
  const markers = useMemo(
    () => map.markers.filter((m) => m.viewportId === viewportId),
    [map.markers, viewportId]
  );

  const [zoom, setZoom] = useState(0.5);
  const frameRef = useRef<HTMLDivElement>(null);

  if (!viewport) {
    return (
      <div className="flex flex-1 items-center justify-center text-blaze-muted">
        No viewport selected.
      </div>
    );
  }

  const totalScrollPx = viewport.height; // scrollProgress 0..1 maps to canvas Y 0..viewport.height

  const toCanvas = (event: ReactPointerEvent<SVGElement>): Vec2 | null => {
    const svg = event.currentTarget.ownerSVGElement ?? (event.currentTarget as unknown as SVGSVGElement);
    const target = svg as SVGSVGElement;
    const pt = target.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = target.getScreenCTM();
    if (!ctm) return null;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const handleCanvasClick = (event: ReactPointerEvent<SVGElement>) => {
    if (event.button !== 0) return;
    const pt = toCanvas(event);
    if (!pt) return;
    if (pt.x < 0 || pt.x > viewport.width || pt.y < 0 || pt.y > viewport.height)
      return;
    const scrollProgress = clamp(pt.y / totalScrollPx, 0, 1);

    if (tool === "marker") {
      addMarker({ canvas: { x: pt.x, y: pt.y }, scrollProgress });
    } else if (tool === "path") {
      const pid = draftPathId ?? startPath();
      addWaypoint(pid, { canvas: { x: pt.x, y: pt.y }, scrollProgress });
    } else if (tool === "section") {
      const top = sections.reduce((acc, s) => acc + s.height, 0);
      addSection({ name: `Section ${sections.length + 1}`, height: Math.max(120, pt.y - top) });
    } else {
      // select tool — clicking empty space clears selection
      select(null);
    }
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[#06080a]">
      <ZoomBar zoom={zoom} setZoom={setZoom} viewport={viewport} />
      <div className="relative h-full w-full overflow-auto p-12">
        <div
          ref={frameRef}
          style={{
            width: viewport.width * zoom,
            height: viewport.height * zoom,
          }}
          className="relative mx-auto"
        >
          <svg
            viewBox={`0 0 ${viewport.width} ${viewport.height}`}
            preserveAspectRatio="xMidYMin meet"
            className="block h-full w-full rounded-md border border-blaze-line bg-[#0c1116] shadow-2xl"
            onPointerDown={handleCanvasClick}
          >
            <GridLayer viewport={viewport} />
            <SectionLayer sections={sections} viewport={viewport} />
            <PathLayer paths={paths} viewport={viewport} />
            <MarkerLayer markers={markers} totalScrollPx={totalScrollPx} />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ZoomBar({
  zoom,
  setZoom,
  viewport,
}: {
  zoom: number;
  setZoom: (z: number) => void;
  viewport: Viewport;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-blaze-line bg-blaze-surface/60 px-4 py-1 text-xs text-blaze-muted">
      <span>{viewport.name}</span>
      <span className="text-blaze-muted/60">·</span>
      <span>
        {viewport.width} × {viewport.height} px
      </span>
      <div className="ml-auto flex items-center gap-2">
        <span>Zoom</span>
        <input
          type="range"
          min={SCALE_MIN}
          max={SCALE_MAX}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-32 accent-blaze-accent"
        />
        <span className="w-10 text-right">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}

function GridLayer({ viewport }: { viewport: Viewport }) {
  // Major gridline every 100px, minor every 25px. Used to give the user a
  // sense of scale while authoring.
  const cells: number[] = [];
  for (let y = 0; y < viewport.height; y += 100) cells.push(y);
  return (
    <g>
      <defs>
        <pattern
          id="planner-grid-minor"
          width={25}
          height={25}
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 25 0 L 0 0 0 25"
            fill="none"
            stroke="#1c232a"
            strokeWidth={0.5}
          />
        </pattern>
        <pattern
          id="planner-grid-major"
          width={100}
          height={100}
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 100 0 L 0 0 0 100"
            fill="none"
            stroke="#27313b"
            strokeWidth={1}
          />
        </pattern>
      </defs>
      <rect width={viewport.width} height={viewport.height} fill="url(#planner-grid-minor)" />
      <rect width={viewport.width} height={viewport.height} fill="url(#planner-grid-major)" />
      {cells
        .filter((y) => y % 500 === 0)
        .map((y) => (
          <g key={`ruler-${y}`}>
            <line
              x1={0}
              x2={viewport.width}
              y1={y}
              y2={y}
              stroke="#384552"
              strokeDasharray="3 6"
              strokeWidth={0.5}
            />
            <text x={6} y={y - 4} fontSize={12} fill="#677787">
              {y}px
            </text>
          </g>
        ))}
    </g>
  );
}

function SectionLayer({
  sections,
  viewport,
}: {
  sections: Section[];
  viewport: Viewport;
}) {
  const updateSection = usePlannerStore((s) => s.updateSection);
  const select = usePlannerStore((s) => s.select);
  const selection = usePlannerStore((s) => s.selection);

  let top = 0;
  return (
    <g>
      {sections.map((s) => {
        const y = top;
        top += s.height;
        const selected =
          selection?.kind === "section" && selection.id === s.id;
        return (
          <g
            key={s.id}
            onPointerDown={(e) => {
              e.stopPropagation();
              select({ kind: "section", id: s.id });
            }}
            className="cursor-pointer"
          >
            <rect
              x={0}
              y={y}
              width={viewport.width}
              height={s.height}
              fill={selected ? "#ff5a1f08" : "transparent"}
              stroke={selected ? "#ff5a1f" : "#384552"}
              strokeWidth={selected ? 2 : 1}
              strokeDasharray="4 6"
            />
            <text x={12} y={y + 22} fontSize={14} fill="#cbd5e1">
              {s.name}
            </text>
            <text x={12} y={y + 40} fontSize={12} fill="#677787">
              {s.height}px
            </text>
            {/* drag handle for height */}
            <DraggableHorizontalLine
              y={y + s.height}
              width={viewport.width}
              onDrag={(dy) =>
                updateSection(s.id, {
                  height: Math.max(80, s.height + dy),
                })
              }
            />
          </g>
        );
      })}
    </g>
  );
}

function DraggableHorizontalLine({
  y,
  width,
  onDrag,
}: {
  y: number;
  width: number;
  onDrag: (dy: number) => void;
}) {
  const dragRef = useRef<{ startY: number } | null>(null);
  const onDown = (e: ReactPointerEvent<SVGLineElement>) => {
    e.stopPropagation();
    (e.target as SVGLineElement).setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY };
  };
  const onMove = (e: ReactPointerEvent<SVGLineElement>) => {
    if (!dragRef.current) return;
    const dy = e.clientY - dragRef.current.startY;
    onDrag(dy);
    dragRef.current.startY = e.clientY;
  };
  const onUp = () => {
    dragRef.current = null;
  };
  return (
    <line
      x1={0}
      x2={width}
      y1={y}
      y2={y}
      stroke="transparent"
      strokeWidth={10}
      className="cursor-ns-resize"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
    />
  );
}

function PathLayer({ paths, viewport }: { paths: Path[]; viewport: Viewport }) {
  return (
    <g>
      {paths.map((p) => (
        <PathRenderer key={p.id} path={p} viewport={viewport} />
      ))}
    </g>
  );
}

function PathRenderer({ path, viewport }: { path: Path; viewport: Viewport }) {
  const select = usePlannerStore((s) => s.select);
  const selection = usePlannerStore((s) => s.selection);
  const updateWaypoint = usePlannerStore((s) => s.updateWaypoint);

  const pathD = buildPathD(path);
  const isPathSelected =
    selection?.kind === "path" && selection.id === path.id;

  return (
    <g>
      {pathD ? (
        <path
          d={pathD}
          stroke={path.color}
          strokeWidth={isPathSelected ? 3 : 2}
          fill="none"
          opacity={isPathSelected ? 1 : 0.85}
          onPointerDown={(e) => {
            e.stopPropagation();
            select({ kind: "path", id: path.id });
          }}
          style={{ cursor: "pointer" }}
        />
      ) : null}
      {path.waypoints.map((w, idx) => (
        <WaypointMarker
          key={w.id}
          pathId={path.id}
          waypoint={w}
          color={path.color}
          index={idx}
          viewport={viewport}
          onDrag={(canvas) => {
            const scrollProgress = clamp(canvas.y / viewport.height, 0, 1);
            updateWaypoint(path.id, w.id, { canvas, scrollProgress });
          }}
        />
      ))}
    </g>
  );
}

function WaypointMarker({
  pathId,
  waypoint,
  color,
  index,
  viewport,
  onDrag,
}: {
  pathId: string;
  waypoint: Waypoint;
  color: string;
  index: number;
  viewport: Viewport;
  onDrag: (canvas: Vec2) => void;
}) {
  const select = usePlannerStore((s) => s.select);
  const selection = usePlannerStore((s) => s.selection);
  const selected =
    selection?.kind === "waypoint" && selection.id === waypoint.id;

  const dragging = useRef(false);

  const onDown = (e: ReactPointerEvent<SVGElement>) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragging.current = true;
    select({ kind: "waypoint", pathId, id: waypoint.id });
  };
  const onMove = (e: ReactPointerEvent<SVGElement>) => {
    if (!dragging.current) return;
    const svg = (e.currentTarget as SVGElement).ownerSVGElement;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const p = pt.matrixTransform(ctm.inverse());
    onDrag({
      x: clamp(p.x, 0, viewport.width),
      y: clamp(p.y, 0, viewport.height),
    });
  };
  const onUp = () => {
    dragging.current = false;
  };

  const size = 14;
  return (
    <g
      transform={`translate(${waypoint.canvas.x}, ${waypoint.canvas.y})`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      style={{ cursor: "move" }}
    >
      <rect
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        rx={3}
        fill={selected ? "#ffffff" : color}
        stroke={color}
        strokeWidth={selected ? 3 : 1}
      />
      <text
        x={size}
        y={-size / 2 - 2}
        fontSize={11}
        fill="#cbd5e1"
        style={{ pointerEvents: "none" }}
      >
        wp{index + 1} · {(waypoint.scrollProgress * 100).toFixed(0)}%
      </text>
    </g>
  );
}

function MarkerLayer({
  markers,
  totalScrollPx,
}: {
  markers: Marker[];
  totalScrollPx: number;
}) {
  const select = usePlannerStore((s) => s.select);
  const selection = usePlannerStore((s) => s.selection);
  const updateMarker = usePlannerStore((s) => s.updateMarker);

  const dragging = useRef<{ id: string } | null>(null);

  return (
    <g>
      {markers.map((m) => {
        const selected =
          selection?.kind === "marker" && selection.id === m.id;
        return (
          <g
            key={m.id}
            transform={`translate(${m.canvas.x}, ${m.canvas.y})`}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.target as Element).setPointerCapture?.(e.pointerId);
              dragging.current = { id: m.id };
              select({ kind: "marker", id: m.id });
            }}
            onPointerMove={(e) => {
              if (!dragging.current) return;
              const svg = (e.currentTarget as SVGElement).ownerSVGElement;
              if (!svg) return;
              const pt = svg.createSVGPoint();
              pt.x = e.clientX;
              pt.y = e.clientY;
              const ctm = svg.getScreenCTM();
              if (!ctm) return;
              const p = pt.matrixTransform(ctm.inverse());
              updateMarker(m.id, {
                canvas: { x: p.x, y: p.y },
                scrollProgress: clamp(p.y / totalScrollPx, 0, 1),
              });
            }}
            onPointerUp={() => {
              dragging.current = null;
            }}
            style={{ cursor: "move" }}
          >
            <circle
              r={selected ? 9 : 7}
              fill={selected ? "#ffffff" : "#ffd166"}
              stroke="#ff9000"
              strokeWidth={selected ? 3 : 1}
            />
            <text
              x={12}
              y={4}
              fontSize={11}
              fill="#fdd"
              style={{ pointerEvents: "none" }}
            >
              {m.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function buildPathD(path: Path): string | null {
  if (path.waypoints.length === 0) return null;
  const wps = [...path.waypoints].sort((a, b) => a.scrollProgress - b.scrollProgress);
  const first = wps[0].canvas;
  if (wps.length === 1) return `M ${first.x} ${first.y}`;
  if (path.kind === "line") {
    return wps
      .map((w, i) => (i === 0 ? `M ${w.canvas.x} ${w.canvas.y}` : `L ${w.canvas.x} ${w.canvas.y}`))
      .join(" ");
  }
  // bezier: build cubic Bézier with implicit control handles based on neighbours.
  // For simplicity we use a Catmull-Rom→Bézier conversion with tension=0.5.
  return catmullRomToBezier(wps.map((w) => w.canvas));
}

function catmullRomToBezier(points: Vec2[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const d: string[] = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
  }
  return d.join(" ");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
