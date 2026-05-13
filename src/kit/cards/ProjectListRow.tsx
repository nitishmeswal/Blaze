"use client";

/**
 * ProjectListRow + ProjectListPreviewCursor
 * Generalised from Personal-Portfolio/src/components/Projects.jsx + sections/Project.jsx.
 *
 * One full-width project row with a "Read More" affordance. Combine with
 * `<ProjectListPreviewCursor>` which floats a preview image alongside the
 * cursor while the row is hovered.
 */
import { useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useScrollReveal } from "@/kit/_hooks/useScrollReveal";

export type Tag = { id: string | number; name: string; path?: string };
export type ProjectListItem = {
  id: string | number;
  title: string;
  description: string;
  subDescription?: string[];
  href: string;
  image: string;
  tags: Tag[];
};

export type ProjectListRowProps = {
  item: ProjectListItem;
  setPreview: (src: string | null) => void;
  index: number;
  onReadMore?: (item: ProjectListItem) => void;
};

export function ProjectListRow({
  item,
  setPreview,
  index,
  onReadMore,
}: ProjectListRowProps) {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <>
      <div
        ref={ref}
        className="reveal flex-wrap items-center justify-between py-10 space-y-14 sm:flex sm:space-y-0"
        style={{ transitionDelay: `${index * 0.1}s` }}
        onMouseEnter={() => setPreview(item.image)}
        onMouseLeave={() => setPreview(null)}
      >
        <div>
          <p className="text-2xl">{item.title}</p>
          <div className="flex gap-5 mt-2 text-blaze-muted">
            {item.tags.map((t) => (
              <span key={t.id}>{t.name}</span>
            ))}
          </div>
        </div>
        <button
          onClick={() => onReadMore?.(item)}
          className="flex items-center gap-1 cursor-pointer"
        >
          Read More →
        </button>
      </div>
      <div className="bg-gradient-to-r from-transparent via-neutral-700 to-transparent h-[1px] w-full" />
    </>
  );
}

export function ProjectListPreviewCursor({
  preview,
}: {
  preview: string | null;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 10, stiffness: 50 });
  const springY = useSpring(y, { damping: 10, stiffness: 50 });

  return (
    <div
      onMouseMove={(e) => {
        x.set(e.clientX + 20);
        y.set(e.clientY + 20);
      }}
      className="absolute inset-0 pointer-events-none"
    >
      {preview ? (
        <motion.img
          src={preview}
          className="fixed top-0 left-0 z-50 object-cover h-56 rounded-lg shadow-lg pointer-events-auto w-80"
          style={{ x: springX, y: springY }}
        />
      ) : null}
    </div>
  );
}

export function ProjectDetailsModal({
  item,
  onClose,
}: {
  item: ProjectListItem;
  onClose: () => void;
}): ReactNode {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center w-full h-full overflow-hidden backdrop-blur-sm">
      <motion.div
        className="relative max-w-2xl border shadow-sm rounded-2xl bg-gradient-to-l from-blaze-bg to-blaze-surface border-white/10"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <button
          onClick={onClose}
          className="absolute p-2 rounded-sm top-5 right-5 bg-blaze-bg hover:bg-gray-500"
          aria-label="Close"
        >
          ×
        </button>
        <img src={item.image} alt={item.title} className="w-full rounded-t-2xl" />
        <div className="p-5">
          <h5 className="mb-2 text-2xl font-bold text-white">{item.title}</h5>
          <p className="mb-3 font-normal text-blaze-muted">{item.description}</p>
          {(item.subDescription ?? []).map((s) => (
            <p key={s} className="mb-3 font-normal text-blaze-muted">{s}</p>
          ))}
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-3">
              {item.tags.map(
                (tag) =>
                  tag.path && (
                    <img
                      key={tag.id}
                      src={tag.path}
                      alt={tag.name}
                      className="rounded-lg size-10"
                    />
                  )
              )}
            </div>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              View Project →
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
