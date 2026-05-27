# Flags of US — Boat Collection

This collection features one boat for each of the 50 United States, with each boat prominently displaying that state's flag.

## Current Boats (50 / 50) — COMPLETE

| Alabama | Alaska | Arizona | Arkansas |
|---------|--------|---------|----------|
| ![Alabama](png/alabama.png) | ![Alaska](png/alaska.png) | ![Arizona](png/arizona.png) | ![Arkansas](png/arkansas.png) |

| California | Colorado | Connecticut | Delaware |
|------------|----------|-------------|----------|
| ![California](png/california.png) | ![Colorado](png/colorado.png) | ![Connecticut](png/connecticut.png) | ![Delaware](png/delaware.png) |

| Florida | Georgia | Hawaii | Idaho |
|---------|---------|--------|-------|
| ![Florida](png/florida.png) | ![Georgia](png/georgia.png) | ![Hawaii](png/hawaii.png) | ![Idaho](png/idaho.png) |

| Illinois | Indiana | Iowa | Kansas |
|----------|---------|------|--------|
| ![Illinois](png/illinois.png) | ![Indiana](png/indiana.png) | ![Iowa](png/iowa.png) | ![Kansas](png/kansas.png) |

| Kentucky | Louisiana | Maine |
|----------|-------------|-------|
| ![Kentucky](png/kentucky.png) | ![Louisiana](png/louisiana.png) | ![Maine](png/maine.png) |

| Maryland |
|----------|
| ![Maryland](png/maryland.png) |

| Massachusetts | Michigan | Minnesota | Mississippi | Missouri |
|---------------|----------|-------------|-------------|----------|
| ![Massachusetts](png/massachusetts.png) | ![Michigan](png/michigan.png) | ![Minnesota](png/minnesota.png) | ![Mississippi](png/mississippi.png) | ![Missouri](png/missouri.png) |

| Montana | Nebraska | Nevada | New Hampshire | New Jersey |
|---------|----------|--------|---------------|------------|
| ![Montana](png/montana.png) | ![Nebraska](png/nebraska.png) | ![Nevada](png/nevada.png) | ![New Hampshire](png/new-hampshire.png) | ![New Jersey](png/new-jersey.png) |

| New Mexico | New York | North Carolina | North Dakota | Ohio |
|------------|----------|----------------|--------------|------|
| ![New Mexico](png/new-mexico.png) | ![New York](png/new-york.png) | ![North Carolina](png/north-carolina.png) | ![North Dakota](png/north-dakota.png) | ![Ohio](png/ohio.png) |

| Oklahoma | Oregon | Pennsylvania | Rhode Island | South Carolina |
|----------|--------|--------------|--------------|----------------|
| ![Oklahoma](png/oklahoma.png) | ![Oregon](png/oregon.png) | ![Pennsylvania](png/pennsylvania.png) | ![Rhode Island](png/rhode-island.png) | ![South Carolina](png/south-carolina.png) |

| South Dakota | Tennessee | Texas | Utah | Vermont |
|--------------|-----------|-------|------|---------|
| ![South Dakota](png/south-dakota.png) | ![Tennessee](png/tennessee.png) | ![Texas](png/texas.png) | ![Utah](png/utah.png) | ![Vermont](png/vermont.png) |

| Virginia | Washington | West Virginia | Wisconsin | Wyoming |
|----------|------------|---------------|-----------|---------|
| ![Virginia](png/virginia.png) | ![Washington](png/washington.png) | ![West Virginia](png/west-virginia.png) | ![Wisconsin](png/wisconsin.png) | ![Wyoming](png/wyoming.png) |

**Collection complete — all 50 U.S. state boats created.**

## Theme Concept
- Each boat represents one US state
- The small triangular racing pennant flag on the back of the boat uses the official state flag
- The overall aesthetic stays consistent with the main "default" waffle boat collection (syrupy, warm, premium cartoon illustration style)

## Current Status
- First batch complete: Alabama → Maine (19 states)
- Maryland is still pending generation
- Files organized in `png/`, `webp/`, and `originals/`

**Completed states:** All 50 U.S. states (Alabama → Wyoming) — collection complete.

## Naming Convention
Files are named after the state in lowercase with no spaces:
- `alabama.png`
- `new-hampshire.webp`
- etc.

## Generation Notes
- Generated in batches of ~20 using Grok Imagine
- Prompts always specify: boat facing **right**, flag on the **stern (left side)**, transparent background
- Style consistency with the default waffle boat collection is important

## Collection Status
**COMPLETE — All 50 U.S. state boats have been created** (Alabama through Wyoming).

The ready-to-use prompt template above remains useful for any future themed collections or variants.
Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana, Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina, North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina, South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia, Wisconsin, Wyoming

## Usage

You can load this collection in the race by adding the `collection` query parameter:

Example:
`/race?collection=flags-of-us&names=Alice,Bob&duration=60`

This will make all boats use the "Flags of US" collection instead of the default set.

You can combine it with spectator mode:
`/race?collection=flags-of-us&spectator=1&id=...`

## Conversion
After generating new JPGs:
```bash
# Copy new JPGs into originals/
npm run convert:webp assets/boats/collections/flags-of-us/png
```