"use client";

/**
 * ScrollProgressTimeline
 * Generalised from Personal-Portfolio/src/components/Timeline.jsx.
 *
 * Vertical timeline where the highlighted track grows as the user scrolls
 * through the section. Each item has a sticky-positioned date/title block.
 */
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export type TimelineItem = {
  date: string;
  title?: string;
  job?: string;
  contents: string[];
};

export type ScrollProgressTimelineProps = {
  heading?: string;
  data: TimelineItem[];
};

export function ScrollProgressTimeline({
  heading = "My Work Experience",
  data,
}: ScrollProgressTimelineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [data]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });
  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="px-6 py-20" ref={containerRef}>
      <h2 className="font-display text-4xl">{heading}</h2>
      <div ref={ref} className="relative pb-20 mx-auto">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:pt-40 md:gap-10"
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute -left-[15px] w-10 rounded-full bg-blaze-surface flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-neutral-800 border dark:border-neutral-700 p-2" />
              </div>
              <div className="flex-col hidden gap-2 text-xl font-bold md:flex md:pl-20 md:text-4xl text-neutral-500">
                <h3>{item.date}</h3>
                {item.title ? <h3 className="text-3xl text-neutral-400">{item.title}</h3> : null}
                {item.job ? <h3 className="text-3xl text-neutral-500">{item.job}</h3> : null}
              </div>
            </div>

            <div className="relative w-full pl-20 pr-4 md:pl-4">
              <div className="block mb-4 text-2xl font-bold text-left text-neutral-300 md:hidden ">
                <h3>{item.date}</h3>
                {item.job ? <h3>{item.job}</h3> : null}
              </div>
              {item.contents.map((c, i) => (
                <p key={i} className="mb-3 font-normal text-neutral-400">{c}</p>
              ))}
            </div>
          </div>
        ))}
        <div
          style={{ height: height + "px" }}
          className="absolute md:left-1 left-1 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent via-neutral-700 to-transparent [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{ height: heightTransform, opacity: opacityTransform }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-purple-500 via-blaze-accent2/50 to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
