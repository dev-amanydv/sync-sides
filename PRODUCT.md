# Product

## Register

product

## Users

People recording podcasts, interviews, and remote conversations in the browser. They arrive with a meeting link, need camera/mic working fast, and stay focused on the conversation — the UI must serve the call, not compete with it. Hosts additionally manage recording and post-processing (merging chunks, side-by-side composition).

## Product Purpose

SyncSides is a meeting-recording platform (Riverside-style): participants meet over WebRTC peer-to-peer video, each side records locally in the browser, chunks upload to the backend, and ffmpeg merges them into a single side-by-side video. Success = a call that connects instantly, controls that are obvious under pressure, and recordings that survive the session.

## Brand Personality

Calm, precise, studio-grade. Dark by default — the product is used while on camera, often in dim rooms; the interface should recede like a control room, letting the video be the brightest thing on screen.

## Anti-references

- Zoom's utilitarian gray clutter and stacked toolbars.
- Consumer-y gradients, glassmorphism-as-decoration, playful blobs.
- Generic Tailwind-default blue/gray dashboards.

## Design Principles

1. **Video is the hero.** Chrome overlays fade away; every control floats over the stage and hides when idle.
2. **State is always legible.** Recording, connection, mute — a glance answers "am I live?" without hunting.
3. **One vocabulary.** Same button shapes, same panel anatomy, same toast anatomy on every surface (lobby, room, dashboard).
4. **Fast over choreographed.** 150–300ms ease-out transitions; no page-load theatre inside the app.

## Accessibility & Inclusion

- Body/UI text ≥ 4.5:1 against dark surfaces (`#D0D3D9`+ on `#0E0F11`).
- Every icon-only control has `title` + `aria-label`; toggles expose pressed state.
- `prefers-reduced-motion` disables entrance/breathe animations.

## Established Visual System (from code)

Dark UI: bg `#08090A`, surfaces `#0E0F11`/`#16171A`, hairlines `white/6–8%`, ink `#F7F8F8`/`#D0D3D9`, muted `#8A8F98`, accent indigo `#5E6AD2` (hover `#6E79D6`), success `#4CB782`, danger `#EB5757`, warning `#F2C94C`. Geist Sans for UI, Geist Mono for IDs/timers. Radii: `rounded-lg/xl/2xl`. Entrance: `lobby-rise` (0.7s expo-out).
