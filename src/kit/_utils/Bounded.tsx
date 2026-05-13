"use client";

import { forwardRef, type ElementType, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Bounded section wrapper. Standardises max-width + padding.
 * Extracted from Fizzi-3D-Website/src/components/Bounded.tsx.
 */
type BoundedProps<T extends ElementType = "section"> = {
  as?: T;
  className?: string;
} & HTMLAttributes<HTMLElement>;

export const Bounded = forwardRef<HTMLElement, BoundedProps>(function Bounded(
  { as: As = "section", className, children, ...rest },
  ref
) {
  return (
    <As
      ref={ref as React.Ref<HTMLElement>}
      className={cn("px-4 py-10 sm:px-6 md:py-14 lg:py-20", className)}
      {...rest}
    >
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </As>
  );
});
