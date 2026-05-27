# Boat Concepts — Wafflerace Asset Library

This folder contains high-quality AI-generated boat + waffle racer sprites for the Wafflerace canvas animation.

## Current Status
- **50 right-facing boats** (boat-right-01.jpg through boat-right-50.jpg)
- All boats face **right** (bow pointing to the right side of the image)
- All have a flag attached to the **left side / stern** (trailing behind as if the boat is moving right through wind)
- Transparent backgrounds, optimized for use as canvas sprites via `ctx.drawImage()`

## Strict Rules for New Generations

When creating more boats, these rules are **non-negotiable** for the animation to work correctly:

1. **Direction**: Boat must be facing and moving to the **right** (bow clearly on the right side of the frame).
2. **Flag position**: The racing flag must be on the **left side / back / stern** of the boat, trailing behind (not on the front).
3. **Background**: Pure transparent (no backgrounds, no water, no extra elements).
4. **Framing**: Keep the full boat + waffle reasonably centered with some breathing room. Avoid extreme close-ups or tiny boats.
5. **Aesthetic**: Warm, syrupy, golden-hour, rich amber/brown/gold palette. Heavy maple syrup drips are encouraged. Cozy but premium "2026" illustration quality.
6. **Style consistency**: Mix of cute cartoon, rich painterly, and detailed styles is good for variety, but keep the same overall world (no photorealistic or anime styles unless we decide to expand themes later).

## How to Generate More (Grok / xAI Imagine)

Use the image generation tool with very specific prompts.

### Recommended Base Prompt Structure

```
Side view of a [DESCRIPTION OF WAFFLE + PERSONALITY] in a [DESCRIPTION OF BOAT], boat facing right with bow clearly pointing to the right, [FLAG DESCRIPTION] flag attached to the left side / stern / back of the boat and trails behind to the left, warm syrupy golden lighting, rich amber and brown tones, transparent background, clean composition suitable for game sprite, high quality digital art, no text
```

### Good Variation Sources
- Waffle type: classic, Belgian, round, chocolate chip, blueberry, pumpkin spice, dark rye, strawberry, etc.
- Personality/expression: happy, determined, goofy, cool, sleepy, fierce, cheeky, elegant, grumpy, adventurous
- Accessories: chef hat, sunglasses, scarf, goggles, tiny hard hat, bow tie, party hat, etc.
- Boat style: simple pine, dark mahogany with brass, vintage, racing shell, chunky rowboat, steampunk, futuristic, weathered, polished, etc.
- Flag style: triangular pennant, long flowing banner, solid colors, patterns, tattered, luxurious silk, etc.

### Example Strong Prompts

See the existing 50 images + the prompts used to generate them for reference.

## Naming Convention

Always use:
`boat-right-NN.jpg`

Where NN is zero-padded (01, 02, ..., 99, 100, etc.).

## Long-term Goal

We want **thousands** of unique boat variants over time.

This will allow:
- Extremely high visual variety even with 50+ simultaneous racers
- Themed races (holiday, streamer-specific, community submissions, etc.)
- Future features like "choose your boat" or unlockable skins

## Workflow for Large Batches

1. Generate 20–50 at a time using the image tool.
2. Quickly review for the 6 strict rules above (especially right-facing + correct flag position).
3. Copy good ones into this folder with correct naming.
4. Update this README if you discover new useful prompt techniques.
5. Commit with a Scooby-Doo quote at the end of the message (project rule).

## Future Ideas

- Layered sprites (separate boat + waffle + flag layers for more mixing)
- Different sizes / perspectives
- Weather variants (rainy, snowy, syrup storm)
- Themed packs (pirate, space, medieval, etc.)

---

*Every commit that touches this folder should end with a random Scooby-Doo quote.*