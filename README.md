# Guangyu Photo Lab (光屿 · 智能构图裁切)

A lightweight, zero-framework photo retouching playground built with Vite and vanilla JavaScript. Load a photo, get composition-aware cropping, light/color adjustments, and an instant scoring report — all client-side.

**Live demo:** https://shu0819-sjy.github.io/guangyu-photo-lab/ (auto-deployed from `main` via GitHub Actions)

> UI text is Chinese-language; the feature set is summarized in English below.

## Features

| Module | What it does |
|---|---|
| **Smart crop** (构图裁切) | Composition presets (rule-of-thirds, centered, minimal, cinematic 2.39:1), free/1:1→16:9 aspect ratios, zoom & offset tuning |
| **Light** (光影) | Brightness/shadow shaping with live preview |
| **Color** (色彩) | Style presets (landscape / portrait / film / commercial / mono) plus per-channel (R/O/Y/G/C/B/M) fine-tuning via CSS filters |
| **Score report** (评分) | Rule-based quality scoring across composition (30) / light (25) / color (25) / detail (20), with defect notes and improvement suggestions; report history is kept locally |

All processing happens in the browser — no uploads, no backend, no dependencies at runtime (only Vite for dev/build).

## Quick start

```bash
npm install
npm run dev      # dev server (0.0.0.0)
npm run build    # production build to dist/
npm run preview  # preview the build
```

## Project structure

```
src/
  main.js      # app shell: state, composition plans, ratio options
  light.js     # light module
  color.js     # color presets & channel tuning
  detail.js    # detail module
  score.js     # scoring report engine + local history
.github/
  workflows/deploy-pages.yml   # Pages deployment (Node 20, npm ci, vite build)
```

## Notes

- The scoring engine is rule-based (weighted heuristics), not a trained model — scores are indicative guidance, not ground truth.
- Sample assets under `public/` are placeholder SVGs.

## License

Source-available for personal and academic study. No license is granted for commercial use unless one is added explicitly.
