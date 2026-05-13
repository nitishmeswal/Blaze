"use client";

import { Toolbar } from "./Toolbar";
import { Canvas } from "./Canvas";
import { Layers } from "./Layers";
import { Inspector } from "./Inspector";
import { useEffect } from "react";
import { usePlannerStore } from "./store";

export function PlannerLayout() {
  const setTool = usePlannerStore((s) => s.setTool);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "v") setTool("select");
      else if (e.key === "m") setTool("marker");
      else if (e.key === "p") setTool("path");
      else if (e.key === "s") setTool("section");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setTool]);

  return (
    <div className="flex h-[100dvh] flex-col bg-blaze-bg text-blaze-text">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        <Layers />
        <Canvas />
        <Inspector />
      </div>
    </div>
  );
}
