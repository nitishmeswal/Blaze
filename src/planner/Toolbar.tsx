"use client";

import { useRef } from "react";
import { usePlannerStore } from "./store";
import type { PlannerTool, Viewport } from "./types";

const TOOLS: Array<{ id: PlannerTool; label: string; hint: string }> = [
  { id: "select", label: "Select", hint: "V" },
  { id: "marker", label: "Marker", hint: "M" },
  { id: "path", label: "Path", hint: "P" },
  { id: "section", label: "Section", hint: "S" },
];

export function Toolbar() {
  const map = usePlannerStore((s) => s.map);
  const viewportId = usePlannerStore((s) => s.currentViewportId);
  const tool = usePlannerStore((s) => s.tool);
  const setTool = usePlannerStore((s) => s.setTool);
  const setViewport = usePlannerStore((s) => s.setViewport);
  const rename = usePlannerStore((s) => s.rename);
  const reset = usePlannerStore((s) => s.reset);
  const loadMap = usePlannerStore((s) => s.loadMap);
  const startPath = usePlannerStore((s) => s.startPath);
  const finishPath = usePlannerStore((s) => s.finishPath);
  const draftPathId = usePlannerStore((s) => s.draftPathId);

  const fileRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(map, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${map.name.replace(/\s+/g, "-").toLowerCase() || "map"}.coordinatemap.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (typeof parsed !== "object" || !parsed?.version) {
          throw new Error("Not a CoordinateMap");
        }
        loadMap(parsed);
      } catch (err) {
        console.error("Failed to import map", err);
        // eslint-disable-next-line no-alert
        alert("Could not parse that file. Make sure it's a CoordinateMap JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="flex items-center gap-3 border-b border-blaze-line bg-blaze-surface px-4 py-2 text-sm">
      <input
        value={map.name}
        onChange={(e) => rename(e.target.value)}
        className="w-48 rounded-md border border-blaze-line bg-blaze-bg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blaze-accent"
        aria-label="Map name"
      />

      <ViewportPicker viewports={map.viewports} value={viewportId} onChange={setViewport} />

      <div className="mx-2 h-6 w-px bg-blaze-line" />

      <div className="flex items-center gap-1">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            className={`rounded-md border px-2 py-1 text-xs ${
              tool === t.id
                ? "border-blaze-accent bg-blaze-accent/20 text-white"
                : "border-blaze-line bg-blaze-bg text-blaze-muted hover:text-white"
            }`}
            title={`${t.label} (${t.hint})`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tool === "path" ? (
        draftPathId ? (
          <button
            onClick={finishPath}
            className="ml-2 rounded-md bg-blaze-accent px-2 py-1 text-xs text-black"
          >
            Finish path
          </button>
        ) : (
          <button
            onClick={() => startPath()}
            className="ml-2 rounded-md border border-blaze-line bg-blaze-bg px-2 py-1 text-xs text-white"
          >
            Start new path
          </button>
        )
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-blaze-line bg-blaze-bg px-2 py-1 text-xs text-blaze-muted hover:text-white"
        >
          Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importJson(file);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        <button
          onClick={exportJson}
          className="rounded-md bg-blaze-accent px-3 py-1 text-xs font-medium text-black hover:bg-blaze-accent2"
        >
          Export JSON
        </button>
        <button
          onClick={() => {
            if (confirm("Reset the entire map?")) reset();
          }}
          className="rounded-md border border-blaze-line bg-blaze-bg px-2 py-1 text-xs text-blaze-muted hover:text-white"
        >
          Reset
        </button>
      </div>
    </header>
  );
}

function ViewportPicker({
  viewports,
  value,
  onChange,
}: {
  viewports: Viewport[];
  value: string;
  onChange: (id: string) => void;
}) {
  const addViewport = usePlannerStore((s) => s.addViewport);
  const current = viewports.find((v) => v.id === value);

  return (
    <div className="flex items-center gap-1">
      <select
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__add__") {
            const id = addViewport({
              name: `Custom (${viewports.length + 1})`,
              width: 1280,
              height: 4000,
            });
            onChange(id);
            return;
          }
          onChange(v);
        }}
        className="rounded-md border border-blaze-line bg-blaze-bg px-2 py-1 text-xs"
      >
        {viewports.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name} ({v.width}×{v.height})
          </option>
        ))}
        <option value="__add__">+ New custom viewport</option>
      </select>
      {current ? (
        <span className="text-xs text-blaze-muted">
          {current.width} × {current.height} px
        </span>
      ) : null}
    </div>
  );
}
