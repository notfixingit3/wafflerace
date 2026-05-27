# Boat Collections

This directory contains themed collections of boat sprites for Wafflerace.

## Available Collections

| Collection       | Description                              | Link |
|------------------|------------------------------------------|------|
| **Default**      | The original set of 50 general waffle boats | [Browse Default Collection](collections/default/README.md) |
| **Flags of US**  | One boat per U.S. state featuring the official state flag (complete) | [Browse Flags of US](collections/flags-of-us/README.md) |
| **Flags of the World** | Top 50 most populous countries (first 5 complete) | [Browse Flags of the World](collections/flags-of-world/README.md) |

## How to Use

You can load any collection in the race by using the `collection` query parameter:

```
/race?collection=default
/race?collection=flags-of-us
```

## Structure

Each collection follows this layout:

```
collections/[collection-name]/
├── png/        # Transparent PNG sprites
├── webp/       # Optimized WebP sprites (recommended)
└── originals/  # Source files (usually JPG)
```

## Adding New Collections

See the [Boat Concepts documentation](../boat-concepts/README.md) for guidelines on creating new boat collections.