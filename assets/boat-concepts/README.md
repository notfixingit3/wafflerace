# Boat Concepts — Wafflerace Asset Library

This folder contains documentation and original generations for Wafflerace boat sprites.

## Boat Collections System

Boats are organized into themed **collections**:

```
assets/boats/collections/
├── default/           # Original 50 general waffle boats
│   ├── png/
│   ├── webp/          (preferred)
│   └── originals/
└── flags-of-us/       # One boat per U.S. state featuring the state flag
    ├── png/
    ├── webp/
    └── originals/
```

**Browse the collections visually:**
- [Default Collection](../boats/collections/default/README.md)
- [Flags of US Collection](../boats/collections/flags-of-us/README.md)

**Background collections** are organized the same way:
- [Background Collections](../backgrounds/README.md)
- [Default Backgrounds](../backgrounds/collections/default/README.md)
- [Nature Backgrounds (planned)](../backgrounds/collections/nature/README.md)

Each collection should follow the same internal structure for consistency.

### Using Collections in the Race

You can select a boat collection by adding the `collection` query parameter to the race URL:

Examples:
- `/race?collection=default`
- `/race?collection=flags-of-us`

You can combine it with other parameters, e.g.:
`/race?collection=flags-of-us&names=Alice,Bob&duration=60&spectator=1`

## Strict Rules for New Generations

**🚨 CRITICAL RULE — EVERY BOAT MUST FACE RIGHT**

**Boats must always be facing and moving to the RIGHT** (bow clearly pointing to the right side of the image). 

This rule applies to **every single boat** created for **any** collection or theme. The entire race system is built around left-to-right movement. Left-facing boats will look broken in the animation.

All other rules:
1. **Flag position**: The racing flag must be on the **left side / back / stern** of the boat, trailing behind (not on the front).
2. **Background**: Pure transparent (no backgrounds, no water, no extra elements).
3. **Framing**: Keep the full boat + waffle reasonably centered with some breathing room.
4. **Aesthetic**: Warm, syrupy, golden-hour, rich amber/brown/gold palette. Heavy maple syrup drips encouraged.
5. **Style consistency**: Keep visual consistency within a collection.

## Strict Rules for New Generations

**🚨 CRITICAL RULE — EVERY BOAT MUST FACE RIGHT**

This is the single most important rule when creating boats:

**Boats must always be facing and moving to the RIGHT** (bow clearly pointing to the right side of the image).

This rule applies to **every single boat** created for any collection or theme. The entire race system is built around left-to-right movement. Left-facing boats will look broken in the animation.

All other rules:

All other rules:
2. **Flag position**: The racing flag must be on the **left side / back / stern** of the boat, trailing behind (not on the front).
3. **Background**: Pure transparent (no backgrounds, no water, no extra elements).
4. **Framing**: Keep the full boat + waffle reasonably centered with some breathing room. Avoid extreme close-ups or tiny boats.
5. **Aesthetic**: Warm, syrupy, golden-hour, rich amber/brown/gold palette. Heavy maple syrup drips are encouraged. Cozy but premium "2026" illustration quality.
6. **Style consistency**: Mix of cute cartoon, rich painterly, and detailed styles is good for variety, but keep the same overall world (no photorealistic or anime styles unless we decide to expand themes later).

## How to Generate More (Grok / xAI Imagine)

Use the image generation tool with very specific prompts.

### Recommended Base Prompt Structure

```
Side view of a [DESCRIPTION OF WAFFLE + PERSONALITY] in a [DESCRIPTION OF BOAT], **boat facing RIGHT with bow clearly pointing to the right side of the frame**, [FLAG DESCRIPTION] flag attached to the left side / stern / back of the boat and trails behind to the left, warm syrupy golden lighting, rich amber and brown tones, transparent background, clean composition suitable for game sprite, high quality digital art, no text
```

### Good Variation Sources
- Waffle type: classic, Belgian, round, chocolate chip, blueberry, pumpkin spice, dark rye, strawberry, etc.
- Personality/expression: happy, determined, goofy, cool, sleepy, fierce, cheeky, elegant, grumpy, adventurous
- Accessories: chef hat, sunglasses, scarf, goggles, tiny hard hat, bow tie, party hat, etc.
- Boat style: simple pine, dark mahogany with brass, vintage, racing shell, chunky rowboat, steampunk, futuristic, weathered, polished, etc.
- Flag style: triangular pennant, long flowing banner, solid colors, patterns, tattered, luxurious silk, etc.

### Example Strong Prompts

See the existing 50 images + the prompts used to generate them for reference.

## Naming Convention & Asset Structure

**Current recommended structure:**

```
assets/boats/collections/[collection-name]/
├── png/           # Transparent PNG sprites
├── webp/          # Optimized WebP sprites (preferred)
└── originals/     # Source AI generations (JPG)
```

See the `scripts/convert-to-webp.js` helper (or `npm run convert:webp`).

**Important:** Always generate boats **facing right** (see critical rule above).

## Long-term Goal

We want **thousands** of unique boat variants over time.

This will allow:
- Extremely high visual variety even with 50+ simultaneous racers
- Themed races (holiday, streamer-specific, community submissions, etc.)
- Future features like "choose your boat" or unlockable skins

## Workflow for Large Batches

1. Generate 20–50 at a time using the image tool.
2. Quickly review for the strict rules above — **especially that the boat is facing RIGHT**.
3. Convert to WebP + PNG using the helper script:
   ```bash
   npm run convert:boats
   ```
4. Copy the resulting files into the correct collection:
   - `assets/boats/collections/[collection-name]/webp/`
   - `assets/boats/collections/[collection-name]/png/` (optional fallback)
5. Update this README if you discover new useful prompt techniques.
6. Commit with a Scooby-Doo quote at the end of the message (project rule).

## Future Ideas

- Layered sprites (separate boat + waffle + flag layers for more mixing)
- Different sizes / perspectives
- Weather variants (rainy, snowy, syrup storm)
- Themed packs (pirate, space, medieval, etc.)

---

*Every commit that touches this folder should end with a random Scooby-Doo quote.*