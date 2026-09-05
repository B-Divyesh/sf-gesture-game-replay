# Visual thesis — paper-cut motion lab

## Direction and rationale

The viewer is a **paper-cut diorama**: a small rehearsal stage where a trace can be moved, paused, and compared without ever showing a person. Layered card-stock planes make time and occlusion tangible, while joint markers resemble brass paper fasteners. This is playful enough for classroom-toy makers but precise enough for debugging. It deliberately avoids camera imagery, faces, surveillance motifs, glass dashboards, and generic gradient heroes.

The treatment is a deliberate single light mode, like a physical desk under a warm work lamp. Dark mode is omitted because ink, paper grain, and the distinct stacked depths are integral to the thesis; the page paints every surface explicitly.

## Palette

| Token | Value | Role |
| --- | --- | --- |
| `--paper` | `#F7F0DF` | Warm canvas |
| `--paper-deep` | `#E9DDBE` | Recessed stage |
| `--ink` | `#202722` | Primary text, 13.2:1 on paper |
| `--ink-soft` | `#535D55` | Secondary text, 6.3:1 on paper |
| `--teal` | `#136F63` | Primary action, replay trace |
| `--teal-dark` | `#0A4B43` | Hover/focus and text |
| `--coral` | `#C84E3B` | Comparison rule B and warnings |
| `--mustard` | `#D59A16` | Playhead and joint pins |
| `--leaf` | `#537A46` | Success |
| `--danger` | `#A5372B` | Destructive/error |
| `--night` | `#18312E` | Hero stage backdrop |

Status never relies on color alone: every signal includes a label, shape, pattern, or icon.

## Type and spacing

Headings use the self-hosted **Fraunces** variable serif (OFL-1.1) for a hand-cut editorial silhouette. Controls and body copy use the self-hosted **Atkinson Hyperlegible** regular/bold pair (OFL-1.1), chosen for small coordinate labels and classroom accessibility. Fonts are subset and capped below the 120 KB budget.

Type scale: 16 / 18 / 23 / 32 / clamp(44, 7vw, 76) px. Body leading is 1.55 and reading measure is 68ch. Spacing follows an 8 px base with 4 px for micro-adjustments: 4, 8, 12, 16, 24, 32, 48, 64.

## Shape, depth, and interaction grammar

- Surfaces use slightly irregular clipped corners, 2 px ink edges, and offset solid shadows instead of blur-heavy floating cards.
- Controls feel like labeled paper tabs. Pressing moves them 2 px toward their shadow.
- Timelines are horizontal strips of paper; the mustard playhead pierces all tracks. Confidence is a cut silhouette, while occlusion is a diagonal hatch.
- The skeleton uses direct lines and round fasteners. It remains the visual center; surrounding controls defer to it.
- Focus is a 3 px mustard outline with a dark offset, visible on every surface.
- Every target is at least 44 × 44 px. At 390 px the workbench becomes one column; transport controls wrap, inspector details collapse, and no core action is removed.

## Motion policy

UI transitions last 180–240 ms and only animate transform or opacity. Playhead and skeleton movement directly represent recorded time; paper layers settle once on entry. Nothing decorative loops. Under `prefers-reduced-motion: reduce`, entry movement and smooth scrolling are removed and playback updates become stepped/instant while all state remains visible.

## Asset plan and provenance

`site/assets/hero-paper-stage.webp` is an original generated raster illustration of an anonymous articulated paper figure on a layered rehearsal stage, used only in the introductory hero. No face, camera feed, text, logo, or identifiable person appears. It is generated with the factory `factory-image` deployment through `/opt/fleet/lib/gen-image.sh`, then locally resized/converted to WebP. `site/public/social-paper-stage.webp` is a 1200×630 center crop of that same original for social cards, and `site/public/apple-touch-icon.png` is a 180×180 center crop for device bookmarks. Prompt:

> Use case: stylized-concept. Asset type: wide landing-page hero illustration. A handcrafted paper-cut diorama of an anonymous articulated human pose made from flat card-stock pieces and small brass paper fasteners, standing on a layered tabletop rehearsal stage. Surround it with abstract timestamp strips, joint dots, and two comparison paths; no computer interface. Sophisticated editorial craft, visible paper fibers, crisp cut edges, shallow physical shadows, straight-on slightly elevated view. Palette: warm cream paper, deep forest green backdrop, muted teal, coral, mustard accents. Composition: subject on the right two-thirds with calm negative space on the upper-left, 3:2 landscape. Mood: playful precision, privacy, safe classroom maker tool. No face details, no real person, no camera, no text, no letters, no numbers, no logos, no watermark, no gradients, no glossy 3D plastic.

License/provenance: generated specifically for this product on 2026-08-27 using the factory Azure OpenAI `factory-image` deployment; owned for product use. All remaining diagrams and icons are hand-built in HTML/CSS/canvas as functional interface elements, not external artwork.
