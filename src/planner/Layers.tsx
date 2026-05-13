"use client";

import { usePlannerStore } from "./store";

export function Layers() {
  const map = usePlannerStore((s) => s.map);
  const viewportId = usePlannerStore((s) => s.currentViewportId);
  const selection = usePlannerStore((s) => s.selection);
  const select = usePlannerStore((s) => s.select);
  const deleteMarker = usePlannerStore((s) => s.deleteMarker);
  const deletePath = usePlannerStore((s) => s.deletePath);
  const deleteSection = usePlannerStore((s) => s.deleteSection);
  const deleteWaypoint = usePlannerStore((s) => s.deleteWaypoint);

  const sections = map.sections.filter((s) => s.viewportId === viewportId);
  const paths = map.paths.filter((p) => p.viewportId === viewportId);
  const markers = map.markers.filter((m) => m.viewportId === viewportId);

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-blaze-line bg-blaze-surface md:flex">
      <div className="border-b border-blaze-line px-3 py-2 text-xs uppercase tracking-wider text-blaze-muted">
        Layers
      </div>
      <Group title={`Sections (${sections.length})`}>
        {sections.length === 0 ? (
          <Empty hint="Pick the Section tool then click the canvas to add" />
        ) : (
          sections.map((s) => (
            <Row
              key={s.id}
              label={s.name}
              hint={`${s.height}px`}
              active={selection?.kind === "section" && selection.id === s.id}
              onClick={() => select({ kind: "section", id: s.id })}
              onDelete={() => deleteSection(s.id)}
            />
          ))
        )}
      </Group>
      <Group title={`Paths (${paths.length})`}>
        {paths.length === 0 ? (
          <Empty hint="Pick the Path tool and click to add waypoints" />
        ) : (
          paths.map((p) => (
            <div key={p.id}>
              <Row
                label={p.name}
                hint={`${p.waypoints.length} wp · ${p.kind}`}
                color={p.color}
                active={selection?.kind === "path" && selection.id === p.id}
                onClick={() => select({ kind: "path", id: p.id })}
                onDelete={() => deletePath(p.id)}
              />
              {p.waypoints.map((w, idx) => (
                <SubRow
                  key={w.id}
                  label={`wp${idx + 1}`}
                  hint={`${(w.scrollProgress * 100).toFixed(0)}%`}
                  active={
                    selection?.kind === "waypoint" && selection.id === w.id
                  }
                  onClick={() =>
                    select({ kind: "waypoint", pathId: p.id, id: w.id })
                  }
                  onDelete={() => deleteWaypoint(p.id, w.id)}
                />
              ))}
            </div>
          ))
        )}
      </Group>
      <Group title={`Markers (${markers.length})`}>
        {markers.length === 0 ? (
          <Empty hint="Pick the Marker tool then click the canvas" />
        ) : (
          markers.map((m) => (
            <Row
              key={m.id}
              label={m.name}
              hint={`${(m.scrollProgress * 100).toFixed(0)}%`}
              active={selection?.kind === "marker" && selection.id === m.id}
              onClick={() => select({ kind: "marker", id: m.id })}
              onDelete={() => deleteMarker(m.id)}
            />
          ))
        )}
      </Group>
    </aside>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-blaze-muted">
        {title}
      </div>
      <div className="flex flex-col gap-px">{children}</div>
    </div>
  );
}

function Empty({ hint }: { hint: string }) {
  return <div className="px-3 py-1 text-[11px] text-blaze-muted/60">{hint}</div>;
}

function Row({
  label,
  hint,
  active,
  color,
  onClick,
  onDelete,
}: {
  label: string;
  hint: string;
  active: boolean;
  color?: string;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-blaze-line/30 ${
        active ? "bg-blaze-accent/20" : ""
      }`}
    >
      {color ? (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      ) : null}
      <span className="truncate">{label}</span>
      <span className="ml-auto text-blaze-muted">{hint}</span>
      <span
        role="button"
        aria-label="Delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="ml-1 text-blaze-muted hover:text-rose-400"
      >
        ×
      </span>
    </button>
  );
}

function SubRow(props: Omit<Parameters<typeof Row>[0], "color">) {
  return (
    <div className="pl-3">
      <Row {...props} />
    </div>
  );
}
