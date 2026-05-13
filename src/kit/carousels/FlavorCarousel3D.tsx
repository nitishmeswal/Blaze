"use client";

/**
 * FlavorCarousel3D
 * Generalised from Fizzi-3D-Website/src/slices/Carousel/index.tsx.
 *
 * Product-flavour carousel that spins a 3D model SPINS_ON_CHANGE times when
 * switching, cross-fades the background color, and re-animates the label.
 * The model itself is provided as a render-prop so this component stays
 * stack-agnostic (R3F users pass <FloatingModel><GltfModel/></FloatingModel>).
 */
import { useCallback, useRef, useState, type ReactNode } from "react";
import { gsap } from "@/kit/_utils/gsap-setup";
import type { Group } from "three";

export type FlavorEntry = {
  id: string;
  name: string;
  color: string;
};

export type FlavorCarousel3DProps = {
  flavors: FlavorEntry[];
  /**
   * Render-prop: given the current flavor + the model ref, return the 3D model
   * to mount. The component will call `gsap.to(modelRef.current.rotation, ...)`
   * to spin it on change.
   */
  renderModel: (args: {
    currentIndex: number;
    flavor: FlavorEntry;
    modelRef: React.MutableRefObject<Group | null>;
  }) => ReactNode;
  spinsOnChange?: number;
  heading?: string;
  priceCopy?: string;
  className?: string;
};

export function FlavorCarousel3D({
  flavors,
  renderModel,
  spinsOnChange = 8,
  heading = "Choose a flavor",
  priceCopy = "$1.99",
  className,
}: FlavorCarousel3DProps) {
  const [currentFlavorIndex, setCurrentFlavorIndex] = useState(0);
  // Mirror the state in a ref so changeFlavor sees the latest index even
  // when the user clicks the carousel arrows in rapid succession.
  const currentIndexRef = useRef(0);
  const modelRef = useRef<Group | null>(null);

  const changeFlavor = useCallback(
    (index: number) => {
      if (!modelRef.current) return;
      const prev = currentIndexRef.current;
      const nextIndex = (index + flavors.length) % flavors.length;
      currentIndexRef.current = nextIndex;
      const goingForward = index > prev;
      const tl = gsap.timeline();
      tl.to(
        modelRef.current.rotation,
        {
          y: goingForward
            ? `-=${Math.PI * 2 * spinsOnChange}`
            : `+=${Math.PI * 2 * spinsOnChange}`,
          ease: "power2.inOut",
          duration: 1,
        },
        0
      )
        .to(
          ".background, .wavy-circles-outer, .wavy-circles-inner",
          {
            backgroundColor: flavors[nextIndex].color,
            fill: flavors[nextIndex].color,
            ease: "power2.inOut",
            duration: 1,
          },
          0
        )
        .to(".text-wrapper", { duration: 0.2, y: -10, opacity: 0 }, 0)
        .to({}, { onStart: () => setCurrentFlavorIndex(nextIndex) }, 0.5)
        .to(".text-wrapper", { duration: 0.2, y: 0, opacity: 1 }, 0.7);
    },
    [flavors, spinsOnChange]
  );

  const current = flavors[currentFlavorIndex];

  return (
    <section
      className={`carousel relative grid h-screen grid-rows-[auto,4fr,auto] justify-center overflow-hidden py-12 text-white ${className ?? ""}`}
    >
      <div
        className="background pointer-events-none absolute inset-0 opacity-50"
        style={{ backgroundColor: current.color }}
      />
      <h2 className="relative z-10 text-center text-5xl font-bold">{heading}</h2>
      <div className="relative z-10 grid grid-cols-[auto,auto,auto] items-center">
        <button
          onClick={() => changeFlavor(currentIndexRef.current + 1)}
          aria-label="Previous Flavor"
          className="size-12 rounded-full border-2 border-white bg-white/10 p-3 hover:opacity-100"
        >
          ‹
        </button>
        <div className="aspect-square h-[70vmin] min-h-40">
          {renderModel({ currentIndex: currentFlavorIndex, flavor: current, modelRef })}
        </div>
        <button
          onClick={() => changeFlavor(currentIndexRef.current - 1)}
          aria-label="Next Flavor"
          className="size-12 rounded-full border-2 border-white bg-white/10 p-3 hover:opacity-100"
        >
          ›
        </button>
      </div>
      <div className="text-area relative z-10 mx-auto text-center">
        <div className="text-wrapper text-4xl font-medium">
          <p>{current.name}</p>
        </div>
        <div className="mt-2 text-2xl font-normal opacity-90">{priceCopy}</div>
      </div>
    </section>
  );
}
