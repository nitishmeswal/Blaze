"use client";

/**
 * FlavorScrollSection
 * Composes FlavorTitleSticky + HorizontalSliderPinned into the original
 * Spylt FlavorSection layout (left column title, right column slider).
 */
import {
  HorizontalSliderPinned,
  type SlideItem,
} from "@/kit/sliders/HorizontalSliderPinned";
import { FlavorTitleSticky } from "@/kit/sliders/FlavorTitleSticky";

export type FlavorScrollSectionProps = {
  title?: { topLine?: string; highlight?: string; bottomLine?: string };
  items: SlideItem[];
  className?: string;
};

export function FlavorScrollSection({
  title,
  items,
  className,
}: FlavorScrollSectionProps) {
  return (
    <section className={`flavor-section relative h-screen ${className ?? ""}`}>
      <div className="relative flex h-full flex-col items-center lg:flex-row">
        <div className="h-80 flex-none md:mt-20 xl:mt-0 lg:h-full lg:w-[57%]">
          <FlavorTitleSticky {...title} />
        </div>
        <div className="h-full">
          <HorizontalSliderPinned items={items} />
        </div>
      </div>
    </section>
  );
}
