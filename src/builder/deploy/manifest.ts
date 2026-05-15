/**
 * Manifest of files that must be copied verbatim into every
 * generated Blaze deploy. Paths are relative to the Blaze repo root
 * (where the API route runs); each is mirrored at the SAME path in
 * the generated project so `@/kit/...` and `@/builder/...` imports
 * resolve without source rewriting.
 *
 * Keep this list lean — anything in here ships in every deploy and
 * increases zip / Vercel-upload size.
 */
export const RUNTIME_FILES: readonly string[] = [
  // ─── kit primitives & shared helpers ───────────────────────────
  "src/kit/_data/mojito.ts",
  "src/kit/_data/spylt.ts",
  "src/kit/_hooks/useLenis.ts",
  "src/kit/_hooks/useMediaQuery.ts",
  "src/kit/_hooks/useReady.ts",
  "src/kit/_hooks/useScrollReveal.ts",
  "src/kit/_registry.ts",
  "src/kit/_utils/Bounded.tsx",
  "src/kit/_utils/TextSplitter.tsx",
  "src/kit/_utils/ViewCanvas.tsx",
  "src/kit/_utils/easings.ts",
  "src/kit/_utils/gsap-setup.ts",
  "src/kit/_utils/motionVariants.ts",

  // ─── kit 3D primitives ─────────────────────────────────────────
  "src/kit/3d/Bubbles.tsx",
  "src/kit/3d/FloatingModel.tsx",
  "src/kit/3d/GltfModel.tsx",
  "src/kit/3d/Skydive3D.tsx",
  "src/kit/3d/StarsBackground.tsx",

  // ─── cards, carousels, effects, footers, heroes ────────────────
  "src/kit/cards/CopyButton.tsx",
  "src/kit/cards/DraggableCard.tsx",
  "src/kit/cards/ProjectGalleryCard.tsx",
  "src/kit/cards/ProjectListRow.tsx",
  "src/kit/carousels/FlavorCarousel3D.tsx",
  "src/kit/effects/Alert.tsx",
  "src/kit/effects/CanvasLoader.tsx",
  "src/kit/effects/CenteredLogoHeader.tsx",
  "src/kit/effects/CircleText.tsx",
  "src/kit/effects/Globe.tsx",
  "src/kit/effects/OrbitingCircles.tsx",
  "src/kit/effects/ParallaxBackgroundLayers.tsx",
  "src/kit/effects/Particles.tsx",
  "src/kit/effects/ScrollParallax.tsx",
  "src/kit/effects/WavyCircles.tsx",
  "src/kit/footers/ChugFooter.tsx",
  "src/kit/footers/CircleBadgeFooter.tsx",
  "src/kit/footers/CommunityColumnsFooter.tsx",
  "src/kit/heroes/HeroFlipWords.tsx",
  "src/kit/heroes/HeroProduct3D.tsx",
  "src/kit/heroes/HeroShaderDissolve.tsx",
  "src/kit/heroes/HeroSpaceMedia.tsx",
  "src/kit/heroes/HeroSplitTextChug.tsx",
  "src/kit/heroes/HeroSplitTextGradient.tsx",
  "src/kit/navigation/InlineLinkNavBar.tsx",
  "src/kit/navigation/LogoNavBar.tsx",
  "src/kit/navigation/MobileBackdropNavBar.tsx",
  "src/kit/navigation/PillSocialNavBar.tsx",
  "src/kit/runtime/CoordinateMapPlayer.tsx",
  "src/kit/runtime/coordinateMap.ts",
  "src/kit/sections/AboutGridReveal.tsx",
  "src/kit/sections/AlternatingText3D.tsx",
  "src/kit/sections/BenefitSection.tsx",
  "src/kit/sections/CocktailMenuSwitcher.tsx",
  "src/kit/sections/ContactFooterLeaves.tsx",
  "src/kit/sections/ContactForm.tsx",
  "src/kit/sections/FlavorScrollSection.tsx",
  "src/kit/sections/ListsParallaxLeaves.tsx",
  "src/kit/sections/MaskedScrollReveal.tsx",
  "src/kit/sections/MessageSectionFuelUp.tsx",
  "src/kit/sections/NutritionSection.tsx",
  "src/kit/sections/PortraitAboutCard.tsx",
  "src/kit/sections/ScrollProgressTimeline.tsx",
  "src/kit/sections/SkillsGrid.tsx",
  "src/kit/sections/TestimonialVideoPin.tsx",
  "src/kit/sliders/FlavorTitleSticky.tsx",
  "src/kit/sliders/HorizontalSliderPinned.tsx",
  "src/kit/text/BigTextSection.tsx",
  "src/kit/text/ClipPathTitle.tsx",
  "src/kit/text/FlipWords.tsx",
  "src/kit/text/ScrollWordFader.tsx",
  "src/kit/video/VideoCircleReveal.tsx",

  // ─── shared cn helper ──────────────────────────────────────────
  "src/lib/cn.ts",

  // ─── builder runtime needed at render time ─────────────────────
  "src/builder/types.ts",
  "src/builder/componentMap.ts",
  "src/builder/components/SiteRenderer.tsx",
  "src/builder/components/BackgroundLayer.tsx",
  "src/builder/components/ThreeDLayer.tsx",
  "src/builder/threeD/easing.ts",
  "src/builder/threeD/models.ts",
  "src/builder/threeD/motion.ts",
];

/**
 * Verbatim copies of project-config files. Pulled from the running
 * Blaze repo at request time so they stay in sync as we evolve.
 */
export const CONFIG_FILES: readonly string[] = [
  "src/app/globals.css",
  "tailwind.config.ts",
  "postcss.config.mjs",
];
