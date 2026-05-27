<p align="center">
  <svg width="240" height="90" viewBox="0 0 240 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Water / waves -->
    <path d="M10 72 Q 40 60 70 72 Q 100 84 130 72 Q 160 60 190 72 Q 220 84 240 72" stroke="#C48A3A" stroke-width="3" fill="none"/>
    <path d="M10 78 Q 40 68 70 78 Q 100 88 130 78 Q 160 68 190 78 Q 220 88 240 78" stroke="#A86F2E" stroke-width="2" fill="none"/>

    <!-- Boat -->
    <path d="M65 58 L 175 58 L 190 72 L 50 72 Z" fill="#3F2A1D"/>
    <path d="M70 58 L 170 58 L 180 66 L 60 66 Z" fill="#5C4033"/>

    <!-- Waffle body -->
    <circle cx="120" cy="42" r="18" fill="#F4C95F"/>
    <!-- Waffle grid -->
    <path d="M105 30 L 135 30 M105 36 L 135 36 M105 42 L 135 42 M105 48 L 135 48 M105 54 L 135 54" stroke="#D4A017" stroke-width="1.5"/>
    <path d="M108 27 L 108 57 M114 27 L 114 57 M120 27 L 120 57 M126 27 L 126 57 M132 27 L 132 57" stroke="#D4A017" stroke-width="1.5"/>

    <!-- Syrup drip -->
    <path d="M128 54 Q 132 62 129 68" stroke="#8B5A2B" stroke-width="2.5" fill="none" stroke-linecap="round"/>

    <!-- Little arms / paddles -->
    <circle cx="102" cy="38" r="3" fill="#3F2A1D"/>
    <circle cx="138" cy="38" r="3" fill="#3F2A1D"/>

    <!-- Paddle -->
    <line x1="145" y1="48" x2="168" y2="62" stroke="#5C4033" stroke-width="3" stroke-linecap="round"/>
    <rect x="165" y="58" width="12" height="7" rx="1" fill="#3F2A1D" transform="rotate(25 171 61)"/>
  </svg>
</p>

<h1 align="center">Wafflerace</h1>

<p align="center">
  <strong>A warm, syrupy, waffle-themed animated race for random selection.</strong>
</p>

<p align="center">
  The cozy cousin of the classic browser duck race — built for streamers, giveaways, raffles, and fun decision-making moments.
</p>

<p align="center">
  <strong>🧇 Waffles paddling little boats across the finish line.</strong><br>
  First one across wins.
</p>

<p align="center">
  <a href="https://github.com/notfixingit3/wafflerace/actions"><img src="https://img.shields.io/badge/Go-1.25-00ADD8?logo=go" alt="Go"></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker" alt="Docker"></a>
  <a href="https://templ.guide/"><img src="https://img.shields.io/badge/Templ-Used-FF6B6B?logo=go" alt="Templ"></a>
  <a href="https://daisyui.com/"><img src="https://img.shields.io/badge/DaisyUI-5.0-5A0EF8?logo=tailwindcss" alt="DaisyUI"></a>
</p>

---

## What is this?

Wafflerace is a lightweight web app for running fun, animated random selection races.

Paste a list of names, set the race length, and watch waffles paddle little boats across the screen with natural, variable-speed movement. First one to the finish wins.

Same satisfying energy as the classic duck race tools streamers love, but make it syrupy.

This is a companion project to [Project Syrup](https://github.com/notfixingit3/waffle) and is designed to eventually integrate into it.

---

## Current Status

**Early development.** Not ready for use yet.

Planned MVP features:
- Paste list of names (one per line)
- Adjustable race duration
- Smooth canvas-based animation (up to ~50 participants)
- Continuous "feels alive" physics-style racing with variable speeds and bobbing movement
- Clear winner announcement + results list
- Re-run with the same list
- Syrupy but creative waffle-in-boat visual style
- Docker Compose setup for easy running

---

## Tech Stack

- **Backend**: Go + Gin
- **Frontend**: Templ + HTMX + Tailwind CSS + DaisyUI
- **Animation**: HTML Canvas (for smooth performance at higher participant counts)
- **Packaging**: Docker + Docker Compose
- **Philosophy**: Keep it simple and boring. Readable names over clever ones.

---

## Relationship to Project Syrup

Wafflerace is a companion project to [Project Syrup](https://github.com/notfixingit3/waffle).

The long-term goal is to be able to use (or embed) the race functionality inside the main waffle application when needed for random draws, giveaways, or fun community moments.

For now it is developed as its own focused tool.

---

## Development

Active work happens on the `dev` branch.

The `main` branch is kept stable and contains the current README plus minimal supporting files.

### Local Development (once implemented)

```bash
docker compose up --build
```

Then open http://localhost:8080

### Commit Messages

Every commit should include a random Scooby-Doo quote somewhere in the message body. Examples:

- "Ruh-roh!"
- "Zoinks!"
- "Jinkies!"
- "Would you do it for a Scooby Snack?"
- "Puppy Power!"

---

## Special Thanks

Wafflerace exists because two glass artists kept running great waffles the hard way.

[**Dani Boo Glass**](https://www.instagram.com/dani_boo_glass/)  
[![Dani Boo Glass on Instagram](https://img.shields.io/badge/Instagram-dani__boo__glass-E4405F?logo=instagram&logoColor=white)](https://www.instagram.com/dani_boo_glass/)

[**Crysis Designs**](https://www.instagram.com/crysis_designs/)  
[![Crysis Designs on Instagram](https://img.shields.io/badge/Instagram-crysis__designs-E4405F?logo=instagram&logoColor=white)](https://www.instagram.com/crysis_designs/)

Special shout out to [Dani Boo Glass](https://www.instagram.com/dani_boo_glass/) and [Crysis Designs](https://www.instagram.com/crysis_designs/) for creating the original Waffle and for driving me nuts watching them copy/paste spot lists over and over again in chat.

---

## License

MIT — do whatever you want.

---

<p align="center">
  If this project helps you run smoother races, consider buying me a coffee:
</p>

<p align="center">
  <a href="https://www.buymeacoffee.com/notfixingit">
    <img src="https://img.shields.io/badge/Buy%20Me%20A%20Coffee-FFDD00?logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" />
  </a>
</p>

---

<p align="center">
  <em>Built with 🧇, maple syrup, and a concerning number of late nights.</em>
</p>
