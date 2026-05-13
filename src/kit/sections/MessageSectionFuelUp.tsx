"use client";

/**
 * MessageSectionFuelUp
 * Extracted from Spylt-awward-clone/src/sections/MessageSection.jsx.
 *
 * Pattern:
 *   - Two-line message with per-word color tween driven by scroll
 *   - A clip-path "wipe" reveal sandwich between the two messages
 *   - Paragraph words rise + rotate on enter
 */
import { useRef } from "react";
import { gsap, useGSAP, SplitText } from "@/kit/_utils/gsap-setup";

export type MessageSectionFuelUpProps = {
  firstMessage?: string;
  highlight?: string;
  secondMessage?: string;
  paragraph?: string;
  className?: string;
};

export function MessageSectionFuelUp({
  firstMessage = "Stir up your fearless past and",
  highlight = "Fuel Up",
  secondMessage = "your future with every gulp of Perfect Protein",
  paragraph = "Rev up your rebel spirit and feed the adventure of life with Blaze, where you're one chug away from epic nostalgia and fearless fun.",
  className,
}: MessageSectionFuelUpProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const first = SplitText.create(".first-message", { type: "words" });
      const second = SplitText.create(".second-message", { type: "words" });
      const para = SplitText.create(".message-content p", {
        type: "words, lines",
        linesClass: "paragraph-line",
      });

      gsap.to(first.words, {
        color: "#faeade",
        ease: "power1.in",
        stagger: 1,
        scrollTrigger: {
          trigger: ".message-content",
          start: "top center",
          end: "30% center",
          scrub: true,
        },
      });
      gsap.to(second.words, {
        color: "#faeade",
        ease: "power1.in",
        stagger: 1,
        scrollTrigger: {
          trigger: ".second-message",
          start: "top center",
          end: "bottom center",
          scrub: true,
        },
      });

      gsap
        .timeline({
          delay: 1,
          scrollTrigger: { trigger: ".msg-text-scroll", start: "top 60%" },
        })
        .to(".msg-text-scroll", {
          duration: 1,
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          ease: "circ.inOut",
        });

      gsap
        .timeline({
          scrollTrigger: { trigger: ".message-content p", start: "top center" },
        })
        .from(para.words, {
          yPercent: 300,
          rotate: 3,
          ease: "power1.inOut",
          duration: 1,
          stagger: 0.01,
        });

      return () => {
        first.revert();
        second.revert();
        para.revert();
      };
    },
    { scope: ref }
  );

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      className={`message-content ${className ?? ""}`}
    >
      <div className="container relative mx-auto flex items-center justify-center py-28">
        <div className="h-full w-full">
          <div className="msg-wrapper text-center text-4xl font-black uppercase md:text-7xl">
            <h1 className="first-message text-blaze-muted">{firstMessage}</h1>
            <div
              style={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)" }}
              className="msg-text-scroll my-4 inline-block"
            >
              <div className="bg-blaze-accent2 px-5 pb-5 pt-3 md:pt-0">
                <h2 className="text-blaze-bg">{highlight}</h2>
              </div>
            </div>
            <h1 className="second-message text-blaze-muted">{secondMessage}</h1>
          </div>
          <div className="mt-10 flex items-center justify-center md:mt-20">
            <div className="flex max-w-md items-center justify-center overflow-hidden px-10">
              <p className="text-blaze-text">{paragraph}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
