# PRONAB / SYSTEM

Pronab Chakraborty's portfolio. A static site with GSAP/ScrollTrigger, Lenis,
Three.js, and an interactive Dijkstra visualizer. No build step is required.

## Run locally

From this directory, run `python3 -m http.server 8085`, then open
`http://localhost:8085`. Serve over HTTP so browser ES modules load correctly.

## Verify

Install development dependencies with `npm ci`, then run `npm run verify`.
The single regression script starts and closes its own local server and Chrome.
Set `CHROME_PATH` if Chrome is not installed at a standard macOS/Linux path.
It checks six viewport widths, local references, network/console errors,
forward/reverse traversal, ScrollTrigger counts, lifecycle behavior, reduced
motion, and interactive controls. It writes no screenshots or reports.

## Production files

Deploy `index.html`, `css/`, `js/`, and `assets/` to a static HTTP host.
Dependencies are vendored under `js/vendor/`; production does not need
`node_modules/`, package files, or the verification script. Keep package files
and the readable source in the maintenance checkout.

- `js/app.js`: initialization and navigation.
- `js/modules/`: scroll, hero, live telemetry, work prototypes, principles,
  performance, Three.js core, Nexus, About, and Contact.
- `js/algorithm.js`: graph data and accessible Dijkstra visualizer.
- `assets/`: referenced runtime media, responsive variants, icons, and social image.

Initialize pinned chapters before downstream triggers. Nexus owns its exit;
About owns its entrance/exit; Contact owns its entrance. Preserve reduced-motion
rules and the visibility guards around render loops and prototype timers.
Modules live for the lifetime of this single-page document; there is no client
router or repeated mounting lifecycle.

When updating GSAP, Lenis, or Three.js, update the package lockfile and the
corresponding vendored browser files together, retaining upstream license
headers. Three.js requires both `three.module.js` and `three.core.js`.
Preserve the original portrait assets; do not substitute generated likenesses.
