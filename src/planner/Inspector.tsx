"use client";

import { usePlannerStore } from "./store";
import { EASINGS, PATH_COLORS } from "./defaults";
import type { Easing, Marker, Path, Section, Viewport, Waypoint } from "./types";

export function Inspector() {
  const map = usePlannerStore((s) => s.map);
  const sel = usePlannerStore((s) => s.selection);
  const setNotes = usePlannerStore((s) => s.setNotes);

  let content: React.ReactNode = null;

  if (!sel) {
    content = (
      <div className="flex flex-col gap-3 p-4 text-xs text-blaze-muted">
        <p>
          Nothing selected. Pick a tool, click the canvas to add markers /
          waypoints, then click any item to edit it here.
        </p>
        <p className="text-blaze-muted/70">
          The exported JSON is portable — drop it next to a 3D model and the
          <span className="text-blaze-accent"> CoordinateMapPlayer </span>
          will play your authored animation on the page.
        </p>
        <label className="mt-3 flex flex-col gap-1">
          <span>Notes</span>
          <textarea
            value={map.notes ?? ""}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Author notes (saved with the map)…"
            rows={4}
            className="w-full rounded-md border border-blaze-line bg-blaze-bg px-2 py-1 text-xs"
          />
        </label>
      </div>
    );
  } else if (sel.kind === "marker") {
    const m = map.markers.find((x) => x.id === sel.id);
    if (m) content = <MarkerInspector marker={m} />;
  } else if (sel.kind === "path") {
    const p = map.paths.find((x) => x.id === sel.id);
    if (p) content = <PathInspector path={p} />;
  } else if (sel.kind === "waypoint") {
    const path = map.paths.find((x) => x.id === sel.pathId);
    const w = path?.waypoints.find((x) => x.id === sel.id);
    if (path && w) content = <WaypointInspector path={path} waypoint={w} />;
  } else if (sel.kind === "section") {
    const s = map.sections.find((x) => x.id === sel.id);
    if (s) content = <SectionInspector section={s} />;
  } else if (sel.kind === "viewport") {
    const v = map.viewports.find((x) => x.id === sel.id);
    if (v) content = <ViewportInspector viewport={v} />;
  }

  return (
    <aside className="hidden h-full w-72 shrink-0 flex-col overflow-y-auto border-l border-blaze-line bg-blaze-surface md:flex">
      <div className="border-b border-blaze-line px-3 py-2 text-xs uppercase tracking-wider text-blaze-muted">
        Inspector
      </div>
      {content}
    </aside>
  );
}

function MarkerInspector({ marker }: { marker: Marker }) {
  const update = usePlannerStore((s) => s.updateMarker);
  const remove = usePlannerStore((s) => s.deleteMarker);
  return (
    <div className="flex flex-col gap-3 p-4 text-xs">
      <Field
        label="Name"
        value={marker.name}
        onChange={(v) => update(marker.id, { name: v })}
      />
      <NumField
        label="Scroll progress (0–1)"
        value={marker.scrollProgress}
        step={0.01}
        min={0}
        max={1}
        onChange={(v) => update(marker.id, { scrollProgress: v })}
      />
      <NumField
        label="Canvas X"
        value={marker.canvas.x}
        onChange={(v) =>
          update(marker.id, { canvas: { ...marker.canvas, x: v } })
        }
      />
      <NumField
        label="Canvas Y"
        value={marker.canvas.y}
        onChange={(v) =>
          update(marker.id, { canvas: { ...marker.canvas, y: v } })
        }
      />
      <ActionPicker
        action={marker.action}
        onChange={(action) => update(marker.id, { action })}
      />
      <DeleteButton onDelete={() => remove(marker.id)} label="Delete marker" />
    </div>
  );
}

function PathInspector({ path }: { path: Path }) {
  const update = usePlannerStore((s) => s.updatePath);
  const remove = usePlannerStore((s) => s.deletePath);
  return (
    <div className="flex flex-col gap-3 p-4 text-xs">
      <Field
        label="Name"
        value={path.name}
        onChange={(v) => update(path.id, { name: v })}
      />
      <label className="flex flex-col gap-1">
        <span>Curve kind</span>
        <select
          value={path.kind}
          onChange={(e) =>
            update(path.id, { kind: e.target.value as Path["kind"] })
          }
          className="rounded-md border border-blaze-line bg-blaze-bg px-2 py-1"
        >
          <option value="line">Line</option>
          <option value="bezier">Bezier (smooth)</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span>Color</span>
        <div className="flex flex-wrap gap-1">
          {PATH_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => update(path.id, { color: c })}
              className="h-5 w-5 rounded-sm border"
              style={{
                backgroundColor: c,
                borderColor: path.color === c ? "#fff" : "transparent",
              }}
              title={c}
            />
          ))}
          <input
            type="color"
            value={path.color}
            onChange={(e) => update(path.id, { color: e.target.value })}
            className="h-5 w-7 cursor-pointer rounded-sm border border-blaze-line bg-blaze-bg"
          />
        </div>
      </label>
      <Field
        label="Bind to kit component (optional)"
        value={path.componentId ?? ""}
        onChange={(v) =>
          update(path.id, { componentId: v.trim() || undefined })
        }
        placeholder="e.g. HeroProduct3D"
      />
      <div className="text-blaze-muted">
        {path.waypoints.length} waypoints — drag handles on the canvas, or pick
        individual waypoints from the layers panel to edit them.
      </div>
      <DeleteButton onDelete={() => remove(path.id)} label="Delete path" />
    </div>
  );
}

function WaypointInspector({
  path,
  waypoint,
}: {
  path: Path;
  waypoint: Waypoint;
}) {
  const update = usePlannerStore((s) => s.updateWaypoint);
  const remove = usePlannerStore((s) => s.deleteWaypoint);
  return (
    <div className="flex flex-col gap-3 p-4 text-xs">
      <div className="text-blaze-muted">
        Path: <span className="text-white">{path.name}</span>
      </div>
      <NumField
        label="Scroll progress (0–1)"
        value={waypoint.scrollProgress}
        step={0.01}
        min={0}
        max={1}
        onChange={(v) =>
          update(path.id, waypoint.id, { scrollProgress: v })
        }
      />
      <Heading title="Canvas anchor" />
      <NumField
        label="X (px)"
        value={waypoint.canvas.x}
        onChange={(v) =>
          update(path.id, waypoint.id, {
            canvas: { ...waypoint.canvas, x: v },
          })
        }
      />
      <NumField
        label="Y (px)"
        value={waypoint.canvas.y}
        onChange={(v) =>
          update(path.id, waypoint.id, {
            canvas: { ...waypoint.canvas, y: v },
          })
        }
      />
      <Heading title="3D transform" />
      <NumField
        label="Depth (Z)"
        value={waypoint.depth}
        step={0.1}
        onChange={(v) => update(path.id, waypoint.id, { depth: v })}
      />
      <NumField
        label="Scale"
        value={waypoint.scale}
        step={0.05}
        min={0}
        onChange={(v) => update(path.id, waypoint.id, { scale: v })}
      />
      <NumField
        label="Rotation X (rad)"
        value={waypoint.rotation.x}
        step={0.05}
        onChange={(v) =>
          update(path.id, waypoint.id, {
            rotation: { ...waypoint.rotation, x: v },
          })
        }
      />
      <NumField
        label="Rotation Y (rad)"
        value={waypoint.rotation.y}
        step={0.05}
        onChange={(v) =>
          update(path.id, waypoint.id, {
            rotation: { ...waypoint.rotation, y: v },
          })
        }
      />
      <NumField
        label="Rotation Z (rad)"
        value={waypoint.rotation.z}
        step={0.05}
        onChange={(v) =>
          update(path.id, waypoint.id, {
            rotation: { ...waypoint.rotation, z: v },
          })
        }
      />
      <NumField
        label="Opacity (0–1)"
        value={waypoint.opacity}
        step={0.05}
        min={0}
        max={1}
        onChange={(v) => update(path.id, waypoint.id, { opacity: v })}
      />
      <label className="flex flex-col gap-1">
        <span>Easing to this point</span>
        <select
          value={waypoint.easing}
          onChange={(e) =>
            update(path.id, waypoint.id, {
              easing: e.target.value as Easing,
            })
          }
          className="rounded-md border border-blaze-line bg-blaze-bg px-2 py-1"
        >
          {EASINGS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </label>
      <DeleteButton
        onDelete={() => remove(path.id, waypoint.id)}
        label="Delete waypoint"
      />
    </div>
  );
}

function SectionInspector({ section }: { section: Section }) {
  const update = usePlannerStore((s) => s.updateSection);
  const remove = usePlannerStore((s) => s.deleteSection);
  return (
    <div className="flex flex-col gap-3 p-4 text-xs">
      <Field
        label="Name"
        value={section.name}
        onChange={(v) => update(section.id, { name: v })}
      />
      <NumField
        label="Height (px)"
        value={section.height}
        min={80}
        onChange={(v) => update(section.id, { height: v })}
      />
      <Field
        label="CSS class (optional)"
        value={section.className ?? ""}
        onChange={(v) =>
          update(section.id, { className: v.trim() || undefined })
        }
        placeholder="e.g. hero-section"
      />
      <DeleteButton
        onDelete={() => remove(section.id)}
        label="Delete section"
      />
    </div>
  );
}

function ViewportInspector({ viewport }: { viewport: Viewport }) {
  const update = usePlannerStore((s) => s.updateViewport);
  const remove = usePlannerStore((s) => s.deleteViewport);
  return (
    <div className="flex flex-col gap-3 p-4 text-xs">
      <Field
        label="Name"
        value={viewport.name}
        onChange={(v) => update(viewport.id, { name: v })}
      />
      <NumField
        label="Width (px)"
        value={viewport.width}
        min={240}
        onChange={(v) => update(viewport.id, { width: v })}
      />
      <NumField
        label="Height (px)"
        value={viewport.height}
        min={400}
        onChange={(v) => update(viewport.id, { height: v })}
      />
      <Field
        label="Media query"
        value={viewport.mediaQuery ?? ""}
        onChange={(v) =>
          update(viewport.id, { mediaQuery: v.trim() || undefined })
        }
        placeholder="(min-width: 1024px)"
      />
      <DeleteButton
        onDelete={() => remove(viewport.id)}
        label="Delete viewport"
      />
    </div>
  );
}

function Heading({ title }: { title: string }) {
  return (
    <div className="mt-1 border-t border-blaze-line pt-2 text-[10px] uppercase tracking-wider text-blaze-muted">
      {title}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-blaze-line bg-blaze-bg px-2 py-1"
      />
    </label>
  );
}

function NumField({
  label,
  value,
  step = 1,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
        className="rounded-md border border-blaze-line bg-blaze-bg px-2 py-1"
      />
    </label>
  );
}

function DeleteButton({
  onDelete,
  label,
}: {
  onDelete: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onDelete}
      className="mt-3 rounded-md border border-rose-700/50 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
    >
      {label}
    </button>
  );
}

function ActionPicker({
  action,
  onChange,
}: {
  action: Marker["action"];
  onChange: (a: Marker["action"]) => void;
}) {
  const kind = action?.kind ?? "none";
  return (
    <div className="flex flex-col gap-1">
      <span>Action</span>
      <select
        value={kind}
        onChange={(e) => {
          const k = e.target.value;
          if (k === "none") onChange(undefined);
          else if (k === "splitTextReveal") onChange({ kind: k, target: ".reveal" });
          else if (k === "bodyColor") onChange({ kind: k, from: "#000", to: "#fff" });
          else if (k === "pin") onChange({ kind: k, target: ".pin" });
          else if (k === "fade")
            onChange({ kind: k, target: ".fade", from: 0, to: 1 });
        }}
        className="rounded-md border border-blaze-line bg-blaze-bg px-2 py-1"
      >
        <option value="none">— none —</option>
        <option value="splitTextReveal">SplitText reveal</option>
        <option value="bodyColor">Body color tween</option>
        <option value="pin">Pin element</option>
        <option value="fade">Fade element</option>
      </select>
      {action?.kind === "splitTextReveal" || action?.kind === "pin" || action?.kind === "fade" ? (
        <input
          value={action.target}
          onChange={(e) =>
            onChange({ ...action, target: e.target.value } as Marker["action"])
          }
          placeholder=".my-selector"
          className="rounded-md border border-blaze-line bg-blaze-bg px-2 py-1"
        />
      ) : null}
      {action?.kind === "bodyColor" ? (
        <div className="flex gap-2">
          <input
            type="color"
            value={action.from}
            onChange={(e) => onChange({ ...action, from: e.target.value })}
          />
          <input
            type="color"
            value={action.to}
            onChange={(e) => onChange({ ...action, to: e.target.value })}
          />
        </div>
      ) : null}
      {action?.kind === "fade" ? (
        <div className="flex gap-2">
          <input
            type="number"
            step={0.05}
            min={0}
            max={1}
            value={action.from}
            onChange={(e) =>
              onChange({ ...action, from: parseFloat(e.target.value) })
            }
            className="w-20 rounded-md border border-blaze-line bg-blaze-bg px-2 py-1"
          />
          <input
            type="number"
            step={0.05}
            min={0}
            max={1}
            value={action.to}
            onChange={(e) =>
              onChange({ ...action, to: parseFloat(e.target.value) })
            }
            className="w-20 rounded-md border border-blaze-line bg-blaze-bg px-2 py-1"
          />
        </div>
      ) : null}
    </div>
  );
}
