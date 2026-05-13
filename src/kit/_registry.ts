/**
 * Kit registry — every component shipped in `src/kit/*`.
 *
 * Listing here drives the /kit gallery page, the planner asset picker, and
 * the compiler's component resolver. When you add a new component, add it
 * here too.
 */

export type KitCategory =
  | "hero"
  | "section"
  | "navigation"
  | "footer"
  | "text"
  | "video"
  | "slider"
  | "carousel"
  | "cards"
  | "effects"
  | "3d"
  | "ecommerce"
  | "skills"
  | "loaders";

export type KitEntry = {
  /** Component identifier exported from `import`. */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** Folder bucket — useful for filtering / grouping. */
  category: KitCategory;
  /** Path relative to /src for the component file. */
  path: string;
  /** librarysite project the pattern originated in. */
  source:
    | "Spylt"
    | "Mojito"
    | "Fizzi"
    | "Personal-Portfolio"
    | "SpacePortfolio"
    | "Ironhill"
    | "paralax"
    | "bee"
    | "site-gloria"
    | "blaze";
  /** Short, one-sentence description. */
  description: string;
};

export const kitRegistry: KitEntry[] = [
  // ─── HEROES ───────────────────────────────────────────────────────────
  {
    id: "HeroSplitTextChug",
    name: "Hero — SplitText Chug",
    category: "hero",
    path: "kit/heroes/HeroSplitTextChug.tsx",
    source: "Spylt",
    description:
      "Big SplitText headline + clip-path subtitle + scroll-rotated card.",
  },
  {
    id: "HeroSplitTextGradient",
    name: "Hero — SplitText Gradient",
    category: "hero",
    path: "kit/heroes/HeroSplitTextGradient.tsx",
    source: "Mojito",
    description:
      "Gradient char reveal + paragraph line stagger + scrubbed background video.",
  },
  {
    id: "HeroProduct3D",
    name: "Hero — Product 3D",
    category: "hero",
    path: "kit/heroes/HeroProduct3D.tsx",
    source: "Fizzi",
    description:
      "Stacked word entrance, scroll-driven body-color tween, pairs with an R3F scene.",
  },
  {
    id: "HeroFlipWords",
    name: "Hero — Flip Words",
    category: "hero",
    path: "kit/heroes/HeroFlipWords.tsx",
    source: "Personal-Portfolio",
    description:
      "Two-line greeting + animated word-cycler middle line + closing static line.",
  },

  // ─── SECTIONS ─────────────────────────────────────────────────────────
  {
    id: "MessageSectionFuelUp",
    name: "Message — Fuel Up",
    category: "section",
    path: "kit/sections/MessageSectionFuelUp.tsx",
    source: "Spylt",
    description: "Two-line message with per-word color tween + clip highlight band.",
  },
  {
    id: "BenefitSection",
    name: "Benefits — Clip Stack",
    category: "section",
    path: "kit/sections/BenefitSection.tsx",
    source: "Spylt",
    description: "Sequential clip-path reveal of an array of titled benefit cards.",
  },
  {
    id: "NutritionSection",
    name: "Nutrition Section",
    category: "section",
    path: "kit/sections/NutritionSection.tsx",
    source: "Spylt",
    description: "Char-staggered title + word-rise paragraph + nutrient data row.",
  },
  {
    id: "FlavorScrollSection",
    name: "Flavor Scroll Section",
    category: "section",
    path: "kit/sections/FlavorScrollSection.tsx",
    source: "Spylt",
    description: "Composite of FlavorTitleSticky + HorizontalSliderPinned.",
  },
  {
    id: "TestimonialVideoPin",
    name: "Testimonials — Video Pin",
    category: "section",
    path: "kit/sections/TestimonialVideoPin.tsx",
    source: "Spylt",
    description: "Parallax titles + pinned grid of hover-play testimonial videos.",
  },
  {
    id: "AboutGridReveal",
    name: "About — Grid Reveal",
    category: "section",
    path: "kit/sections/AboutGridReveal.tsx",
    source: "Mojito",
    description: "Word-split heading + staggered image grid reveal on scroll.",
  },
  {
    id: "ListsParallaxLeaves",
    name: "Lists — Parallax Leaves",
    category: "section",
    path: "kit/sections/ListsParallaxLeaves.tsx",
    source: "Mojito",
    description: "Two-column menu lists with scroll-parallaxed leaf decorations.",
  },
  {
    id: "CocktailMenuSwitcher",
    name: "Cocktail Menu Switcher",
    category: "section",
    path: "kit/sections/CocktailMenuSwitcher.tsx",
    source: "Mojito",
    description: "Tabbed feature slider with state-driven slide-in animations.",
  },
  {
    id: "MaskedScrollReveal",
    name: "Masked Scroll Reveal",
    category: "section",
    path: "kit/sections/MaskedScrollReveal.tsx",
    source: "Mojito",
    description: "Pinned mask-scaled image reveal with surrounding fade-out.",
  },
  {
    id: "ContactFooterLeaves",
    name: "Contact Footer Leaves",
    category: "section",
    path: "kit/sections/ContactFooterLeaves.tsx",
    source: "Mojito",
    description: "Word-split contact heading + structured blocks + parallax leaves.",
  },
  {
    id: "AlternatingText3D",
    name: "Alternating Text 3D",
    category: "section",
    path: "kit/sections/AlternatingText3D.tsx",
    source: "Fizzi",
    description: "Pinned alternating left/right rows with cross-fading body bg.",
  },
  {
    id: "ScrollProgressTimeline",
    name: "Scroll Progress Timeline",
    category: "section",
    path: "kit/sections/ScrollProgressTimeline.tsx",
    source: "Personal-Portfolio",
    description: "Vertical timeline whose track grows with scroll progress.",
  },
  {
    id: "ContactForm",
    name: "Contact Form",
    category: "section",
    path: "kit/sections/ContactForm.tsx",
    source: "Personal-Portfolio",
    description: "Name/email/message form with toast feedback (backend-agnostic).",
  },

  // ─── NAVIGATION ───────────────────────────────────────────────────────
  {
    id: "LogoNavBar",
    name: "Nav — Logo",
    category: "navigation",
    path: "kit/navigation/LogoNavBar.tsx",
    source: "Spylt",
    description: "Fixed minimal logo-only nav.",
  },
  {
    id: "InlineLinkNavBar",
    name: "Nav — Inline Links",
    category: "navigation",
    path: "kit/navigation/InlineLinkNavBar.tsx",
    source: "Mojito",
    description: "Inline-anchor nav with scroll-triggered translucent background.",
  },
  {
    id: "MobileBackdropNavBar",
    name: "Nav — Mobile Backdrop",
    category: "navigation",
    path: "kit/navigation/MobileBackdropNavBar.tsx",
    source: "Personal-Portfolio",
    description: "Frosted-glass nav that collapses to a motion-animated mobile menu.",
  },

  // ─── FOOTERS ──────────────────────────────────────────────────────────
  {
    id: "ChugFooter",
    name: "Footer — Chug",
    category: "footer",
    path: "kit/footers/ChugFooter.tsx",
    source: "Spylt",
    description: "Hashtag hero + socials + link columns + newsletter row.",
  },
  {
    id: "CircleBadgeFooter",
    name: "Footer — Circle Badge",
    category: "footer",
    path: "kit/footers/CircleBadgeFooter.tsx",
    source: "Fizzi",
    description: "Wordmark footer with an oversized rotating circle badge.",
  },

  // ─── TEXT ─────────────────────────────────────────────────────────────
  {
    id: "ClipPathTitle",
    name: "Clip Path Title",
    category: "text",
    path: "kit/text/ClipPathTitle.tsx",
    source: "Spylt",
    description: "Banded heading clipped by a controllable polygon.",
  },
  {
    id: "BigTextSection",
    name: "Big Text Section",
    category: "text",
    path: "kit/text/BigTextSection.tsx",
    source: "Fizzi",
    description: "Full-bleed multi-line typography landing block.",
  },
  {
    id: "FlipWords",
    name: "Flip Words",
    category: "text",
    path: "kit/text/FlipWords.tsx",
    source: "Personal-Portfolio",
    description: "Cycles through a list of words with spring-based blur exit.",
  },

  // ─── VIDEO ────────────────────────────────────────────────────────────
  {
    id: "VideoCircleReveal",
    name: "Video — Circle Reveal",
    category: "video",
    path: "kit/video/VideoCircleReveal.tsx",
    source: "Spylt",
    description: "Pinned video whose circle clip-path expands across scroll.",
  },

  // ─── SLIDERS / CAROUSELS ──────────────────────────────────────────────
  {
    id: "HorizontalSliderPinned",
    name: "Horizontal Slider Pinned",
    category: "slider",
    path: "kit/sliders/HorizontalSliderPinned.tsx",
    source: "Spylt",
    description: "Pinned section that translates a row horizontally on scroll.",
  },
  {
    id: "FlavorTitleSticky",
    name: "Flavor Title Sticky",
    category: "slider",
    path: "kit/sliders/FlavorTitleSticky.tsx",
    source: "Spylt",
    description: "Three-line title with char-staggered reveal + parallax lines.",
  },
  {
    id: "FlavorCarousel3D",
    name: "Flavor Carousel 3D",
    category: "carousel",
    path: "kit/carousels/FlavorCarousel3D.tsx",
    source: "Fizzi",
    description: "Tabbed 3D-product carousel with 8-spin transitions.",
  },

  // ─── CARDS ────────────────────────────────────────────────────────────
  {
    id: "DraggableCard",
    name: "Draggable Card",
    category: "cards",
    path: "kit/cards/DraggableCard.tsx",
    source: "Personal-Portfolio",
    description: "Drag-constrained pill / image card.",
  },
  {
    id: "CopyButton",
    name: "Copy Button",
    category: "cards",
    path: "kit/cards/CopyButton.tsx",
    source: "Personal-Portfolio",
    description: "Click-to-copy button with morphing labels.",
  },
  {
    id: "ProjectListRow",
    name: "Project List Row",
    category: "cards",
    path: "kit/cards/ProjectListRow.tsx",
    source: "Personal-Portfolio",
    description: "Full-width project entry with hover-preview cursor companion.",
  },

  // ─── EFFECTS ──────────────────────────────────────────────────────────
  {
    id: "ParallaxBackgroundLayers",
    name: "Parallax Background Layers",
    category: "effects",
    path: "kit/effects/ParallaxBackgroundLayers.tsx",
    source: "Personal-Portfolio",
    description: "Stacked image layers parallaxing on scroll.",
  },
  {
    id: "Particles",
    name: "Particles",
    category: "effects",
    path: "kit/effects/Particles.tsx",
    source: "Personal-Portfolio",
    description: "Canvas particle field that drifts toward the cursor.",
  },
  {
    id: "OrbitingCircles",
    name: "Orbiting Circles",
    category: "effects",
    path: "kit/effects/OrbitingCircles.tsx",
    source: "Personal-Portfolio",
    description: "Children orbit a centre point along a CSS-animated circle.",
  },
  {
    id: "Globe",
    name: "Globe",
    category: "effects",
    path: "kit/effects/Globe.tsx",
    source: "Personal-Portfolio",
    description: "Interactive `cobe` globe with inertia rotation.",
  },
  {
    id: "Alert",
    name: "Alert",
    category: "effects",
    path: "kit/effects/Alert.tsx",
    source: "Personal-Portfolio",
    description: "Bottom-right toast with success/danger variants.",
  },
  {
    id: "CircleText",
    name: "Circle Text",
    category: "effects",
    path: "kit/effects/CircleText.tsx",
    source: "Fizzi",
    description: "SVG circular badge with text-on-a-circle.",
  },
  {
    id: "WavyCircles",
    name: "Wavy Circles",
    category: "effects",
    path: "kit/effects/WavyCircles.tsx",
    source: "Fizzi",
    description: "Two rotating wavy blobs for a centred backdrop.",
  },
  {
    id: "CenteredLogoHeader",
    name: "Centered Logo Header",
    category: "effects",
    path: "kit/effects/CenteredLogoHeader.tsx",
    source: "Fizzi",
    description: "Compact centred wordmark for hero compositions.",
  },

  // ─── 3D ───────────────────────────────────────────────────────────────
  {
    id: "FloatingModel",
    name: "Floating Model",
    category: "3d",
    path: "kit/3d/FloatingModel.tsx",
    source: "Fizzi",
    description: "Wrap any 3D mesh in drei's <Float>.",
  },
  {
    id: "GltfModel",
    name: "GLTF Model",
    category: "3d",
    path: "kit/3d/GltfModel.tsx",
    source: "Fizzi",
    description: "Load + render an arbitrary GLTF via drei's useGLTF.",
  },
  {
    id: "Bubbles",
    name: "Bubbles",
    category: "3d",
    path: "kit/3d/Bubbles.tsx",
    source: "Fizzi",
    description: "Instanced rising bubbles inside an R3F canvas.",
  },
  {
    id: "Skydive3D",
    name: "Skydive 3D",
    category: "3d",
    path: "kit/3d/Skydive3D.tsx",
    source: "Fizzi",
    description: "Spinning model + drifting clouds + word-by-word floating text.",
  },

  // ─── LOADERS ─────────────────────────────────────────────────────────
  {
    id: "CanvasLoader",
    name: "Canvas Loader",
    category: "loaders",
    path: "kit/effects/CanvasLoader.tsx",
    source: "Personal-Portfolio",
    description: "Drei <Html> overlay that displays GLTF loading progress.",
  },
];
