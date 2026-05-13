"use client";

/**
 * Skydive3D
 * Generalised from Fizzi-3D-Website/src/slices/SkyDive/Scene.tsx.
 *
 * Spinning model + drifting clouds + word-by-word floating text, all pinned
 * and scrubbed against scroll. Plug in any 3D primitive via the `renderModel`
 * render-prop.
 */
import { useRef, type ReactNode } from "react";
import * as THREE from "three";
import { Cloud, Clouds, Environment, Text } from "@react-three/drei";
import { gsap, useGSAP } from "@/kit/_utils/gsap-setup";
import { useMediaQuery } from "@/kit/_hooks/useMediaQuery";

export type Skydive3DProps = {
  sentence?: string | null;
  /** Render-prop for the centre object. Receives a `ref` for animation. */
  renderModel?: (modelRef: React.MutableRefObject<THREE.Group | null>) => ReactNode;
  envHdr?: string;
  bodyColorEnd?: string;
  fontUrl?: string;
};

export function Skydive3D({
  sentence,
  renderModel,
  envHdr,
  bodyColorEnd = "#C0F0F5",
  fontUrl,
}: Skydive3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const canRef = useRef<THREE.Group | null>(null);
  const cloud1Ref = useRef<THREE.Group>(null);
  const cloud2Ref = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Group>(null);
  const wordsRef = useRef<THREE.Group>(null);

  const ANGLE = 75 * (Math.PI / 180);
  const getX = (d: number) => d * Math.cos(ANGLE);
  const getY = (d: number) => d * Math.sin(ANGLE);
  const xy = (d: number) => ({ x: getX(d), y: getY(-1 * d) });

  useGSAP(() => {
    if (!cloudsRef.current || !canRef.current || !wordsRef.current) return;

    gsap.set(cloudsRef.current.position, { z: 10 });
    gsap.set(canRef.current.position, xy(-4));
    gsap.set(
      wordsRef.current.children.map((w) => w.position),
      { ...xy(7), z: 2 }
    );

    gsap.to(canRef.current.rotation, {
      y: Math.PI * 2,
      duration: 1.7,
      repeat: -1,
      ease: "none",
    });

    const DISTANCE = 15;
    const DURATION = 6;
    gsap.set([cloud2Ref.current!.position, cloud1Ref.current!.position], xy(DISTANCE));
    gsap.to(cloud1Ref.current!.position, {
      y: `+=${getY(DISTANCE * 2)}`,
      x: `+=${getX(DISTANCE * -2)}`,
      ease: "none",
      repeat: -1,
      duration: DURATION,
    });
    gsap.to(cloud2Ref.current!.position, {
      y: `+=${getY(DISTANCE * 2)}`,
      x: `+=${getX(DISTANCE * -2)}`,
      ease: "none",
      repeat: -1,
      delay: DURATION / 2,
      duration: DURATION,
    });

    gsap
      .timeline({
        scrollTrigger: {
          trigger: ".skydive",
          pin: true,
          start: "top top",
          end: "+=2000",
          scrub: 1.5,
        },
      })
      .to("body", { backgroundColor: bodyColorEnd, overwrite: "auto", duration: 0.1 })
      .to(cloudsRef.current.position, { z: 0, duration: 0.3 }, 0)
      .to(canRef.current.position, { x: 0, y: 0, duration: 0.3, ease: "back.out(1.7)" })
      .to(
        wordsRef.current.children.map((w) => w.position),
        {
          keyframes: [
            { x: 0, y: 0, z: -1 },
            { ...xy(-7), z: -7 },
          ],
          stagger: 0.3,
        },
        0
      )
      .to(canRef.current.position, {
        ...xy(4),
        duration: 0.5,
        ease: "back.in(1.7)",
      })
      .to(cloudsRef.current.position, { z: 7, duration: 0.5 });
  });

  return (
    <group ref={groupRef}>
      <group rotation={[0, 0, 0.5]}>
        {renderModel ? (
          renderModel(canRef)
        ) : (
          <group ref={(el) => { canRef.current = el; }}>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#ff5a1f" />
            </mesh>
          </group>
        )}
      </group>
      <Clouds ref={cloudsRef}>
        <Cloud ref={cloud1Ref} bounds={[10, 10, 2]} />
        <Cloud ref={cloud2Ref} bounds={[10, 10, 2]} />
      </Clouds>
      <group ref={wordsRef}>
        {sentence ? <ThreeText sentence={sentence} fontUrl={fontUrl} /> : null}
      </group>
      <ambientLight intensity={2} color="#9DDEFA" />
      {envHdr ? <Environment files={envHdr} environmentIntensity={1.5} /> : null}
    </group>
  );
}

function ThreeText({
  sentence,
  fontUrl,
  color = "#F97315",
}: {
  sentence: string;
  fontUrl?: string;
  color?: string;
}) {
  const words = sentence.toUpperCase().split(" ");
  const material = new THREE.MeshLambertMaterial();
  const isDesktop = useMediaQuery("(min-width: 950px)", true);
  return (
    <>
      {words.map((word, i) => (
        <Text
          key={`${i}-${word}`}
          scale={isDesktop ? 1 : 0.5}
          color={color}
          material={material}
          font={fontUrl}
          fontWeight={900}
          anchorX="center"
          anchorY="middle"
          characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ!,.?'"
        >
          {word}
        </Text>
      ))}
    </>
  );
}
