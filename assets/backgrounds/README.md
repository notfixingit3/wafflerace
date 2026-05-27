# Background Collections

This directory contains themed collections of background assets for Wafflerace.

## Available Collections

| Collection     | Description                              | Link |
|----------------|------------------------------------------|------|
| **Default**    | The original set of 20 syrup river backgrounds used for parallax | [Browse Default Backgrounds](collections/default/README.md) |
| **Nature**     | Nature-themed backgrounds (in progress — 5/30 generated) | [Nature Collection](collections/nature/README.md) |

## Current Status

- **Default collection**: 20 backgrounds complete and optimized (WebP + JPG). Full visual gallery available in the collection page.
- **Nature collection**: Folder structure + loader support ready. 5/30 images generated (first batch).

## How to Use

Select a background collection on the setup screen or via URL parameter:

- `?bg=nature` or `?background=nature`
- Combine with boat collections: `/race?collection=flags-of-us&bg=nature`

The three parallax layers (far / mid / near-water) are chosen randomly from the selected collection each race.

## Structure

Each background collection follows this layout:

```
collections/[collection-name]/
├── jpg/        # Original / high-quality JPGs
└── webp/       # Optimized WebP versions (recommended for performance)
```

## Adding New Collections

See the main documentation for guidelines on creating new background collections.

## Related

- [Boat Collections](../boats/README.md)
- [Boat Concepts Documentation](../boat-concepts/README.md)