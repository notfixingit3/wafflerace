# Race Backgrounds — Wafflerace Asset Library

This folder will contain layered background assets for the Wafflerace canvas scene.

## Purpose

The race happens on a horizontal scrolling river/syrup stream. To feel alive and premium in 2026, we want rich, parallax-friendly background layers instead of simple repeating waves.

## Recommended Layering Approach (Canvas)

Typical draw order (back to front):

1. **Sky / Atmosphere** (very slow or static scroll)
2. **Far Banks / Distant Trees** (slow horizontal scroll)
3. **Mid-ground Banks / Syrupy foliage** (medium scroll)
4. **Water surface + ripples** (main layer, scrolls at boat speed or slightly slower)
5. **Near water details / foam / syrup glints** (fastest scroll, subtle)

This creates depth while boats move across the screen.

## Current Status

- Folder created
- No background assets yet (as of this commit)

## Strict Rules for Background Generations

1. **Orientation**: Must be designed for **horizontal scrolling** (wide panoramic images).
2. **Seamless or tileable**: Ideal if the left and right edges can tile reasonably well, or generate very wide images (at least 2000–3000px wide).
3. **Style match**: Warm, syrupy, golden, rich amber/brown/gold palette. Same world as the boats.
4. **No boats or characters**: These are pure environment layers.
5. **Multiple depths**: Generate separate layers for different parallax speeds when possible.
6. **Transparent or clean alpha where needed**: Especially for water layers that will sit over other elements.

## Naming Convention

Use clear, descriptive names with suggested scroll speed hints:

- `sky-slow-01.jpg`
- `far-banks-slow-01.png`
- `mid-banks-medium-01.png`
- `water-main-fast.jpg`
- `water-ripples-fast.png`
- `syrup-glints-veryfast.png`

## How to Generate Good Backgrounds

Use the image generation tool with prompts that emphasize:

- Wide panoramic composition
- Horizontal flow (left to right directionality)
- Syrup/river theme
- Warm cohesive lighting with the boat sprites

### Example Prompt Starters

```
Wide panoramic side-view syrup river scene, warm golden hour lighting, rich amber and brown tones, distant syrupy banks with soft trees, calm flowing water with gentle ripples, high quality digital art, seamless horizontal tiling friendly, no boats, no text, cinematic atmosphere
```

Vary:
- Time of day (golden hour, late afternoon, misty morning, syrup sunset)
- Water state (calm, gentle current, syrupy thick flow, light foam)
- Bank details (dense trees, open fields, rocky, misty, distant hills)
- Mood (cozy, mysterious, epic, peaceful)

## Parallax Implementation Notes (for developers)

In `race.js` (or future refactored version):

- Each layer gets its own `offset` that is multiplied by a speed factor and the global `waveOffset` or time.
- Draw furthest layers first with smallest multiplier.
- Water layer should feel like it's moving under the boats.

Example pseudocode:
```js
const skyOffset   = (time * 8)  % width;   // very slow
const farOffset   = (time * 22) % width;   // slow
const midOffset   = (time * 45) % width;   // medium
const waterOffset = (time * 78) % width;   // fast (close to boat speed)
```

## Long-term Vision

- Large library of mix-and-match layers
- Seasonal / event variants (autumn leaves in syrup, winter frost, etc.)
- Dynamic lighting or time-of-day systems
- Subtle animated elements (slow syrup drips on banks, floating leaves, gentle bubbles)

## Workflow

1. Generate wide background layers in batches.
2. Review for horizontal flow and color harmony with existing boats.
3. Name according to the convention above.
4. Document new techniques in this README.
5. Commit + push (remember the Scooby-Doo quote rule).

---

*Every commit touching this folder must end with a random Scooby-Doo quote.*