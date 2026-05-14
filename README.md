# PTE Academic Simulator

A free, browser-based practice simulator for the **PTE Academic** English exam,
covering all 20 official task types with real audio recording and AI-powered
scoring. Built with vanilla JavaScript — no framework, no backend, no build step.

**🔗 Live demo:** https://alansignetti.github.io/pte-simulator/

![Built with: Vanilla JS · ES Modules · Claude API · No backend](https://img.shields.io/badge/Built%20with-Vanilla%20JS-yellow) ![License: MIT](https://img.shields.io/badge/License-MIT-blue)

---

## What it is

This tool simulates the four sections of the PTE Academic exam:

- **Speaking** — Read Aloud, Repeat Sentence, Describe Image, Re-tell Lecture, Answer Short Question
- **Writing** — Summarize Written Text, Write Essay
- **Reading** — Multiple Choice, Re-order Paragraphs, Fill in the Blanks (×2)
- **Listening** — Summarize Spoken Text, Highlight Correct Summary, Write from Dictation, and 5 more

Subjective tasks are scored by **Claude** using rubrics modelled on Pearson's
official 0-90 scoring scale. Objective tasks (MCQ, fill-in-blanks, etc.) are
scored locally with deterministic rules.

## Quick start

The simulator runs entirely in the browser. You have three options for using it:

### Option 1 — Use the hosted version (easiest)

Open https://alansignetti.github.io/pte-simulator/ in **Chrome** or any
Chromium-based browser (Edge, Brave, Arc). On first visit, you'll be prompted to
pick a scoring mode:

- **Manual scoring** (free) — paste prompts into claude.ai using your existing
  plan (Free, Pro, Team — any works).
- **API scoring** (paid) — paste your own Anthropic API key, costs ~AUD 0.15
  per mini-exam.
- **Objective tasks only** — skip both; you can still practise MCQ, FIB,
  Re-order, and Write-from-Dictation tasks for free.

### Option 2 — Run it locally

```bash
git clone https://github.com/alansignetti/pte-simulator.git
cd pte-simulator
python3 -m http.server 8080
# open http://localhost:8080 in Chrome
```

Any static web server works (`npx serve`, Caddy, nginx, etc.). The simulator
needs to be served over HTTP — opening `index.html` directly won't work because
ES modules and microphone access require an HTTPS or `localhost` context.

### Option 3 — Deploy your own copy to GitHub Pages

```bash
# Fork this repo, then in your fork:
# Settings → Pages → Source: "Deploy from a branch" → main / (root) → Save
```

After 1–2 minutes your fork will be live at
`https://<your-username>.github.io/pte-simulator/`. No build step needed —
GitHub Pages serves the files as-is.

## Features

- ✅ **All 20 PTE task types** with realistic timing
- 🎙 **Microphone recording** via MediaRecorder + live transcription via Web Speech API
- 🔊 **Text-to-speech** for Listening tasks using your system voices
- 🤖 **AI-powered scoring** for subjective tasks using PTE-style rubrics
- 🎲 **Unlimited content** — "Generate" button on each task creates fresh items with Claude
- 📊 **Progress tracking** — per-task averages, best scores, sparkline trends, weak-spot detection
- 💸 **Zero-cost manual mode** — paste prompts into claude.ai instead of using the API
- 🎯 **9 mini-exam variants** including Classic, Quick Start, Speaking Focus, Drill, Random Mix, and the Full 20-task exam
- ✏️ **Editable transcripts** — listen back to your recording and fix recognizer errors before scoring
- 🗺 **7 chart types** for Describe Image (bar, line, pie, table, process flowchart, map of Australia, combo bar+line)

## Browser support

| Browser    | Speaking  | Listening | Reading/Writing |
|------------|-----------|-----------|-----------------|
| Chrome     | ✅ Full   | ✅ Full   | ✅ Full         |
| Edge       | ✅ Full   | ✅ Full   | ✅ Full         |
| Brave/Arc  | ✅ Full   | ✅ Full   | ✅ Full         |
| Safari     | ⚠️ Partial | ✅ Full   | ✅ Full         |
| Firefox    | ❌ No SR  | ✅ Full   | ✅ Full         |

Speech recognition is the limiting factor — Firefox lacks the API entirely,
Safari's implementation is unreliable. Reading, Writing, and Listening work in
every modern browser.

## Tech stack

- **JavaScript** (ES2022, native ES modules)
- **HTML5** with `<dialog>` elements
- **CSS3** (no preprocessor)
- **Inline SVG** for chart rendering
- **Anthropic Claude API** for scoring and content generation

### Browser APIs used

- `MediaRecorder` (audio capture)
- `SpeechSynthesis` (TTS for Listening tasks)
- `webkitSpeechRecognition` (live speech-to-text)
- `AudioContext` / `AnalyserNode` (audio level meter)
- `localStorage` (settings, history, generated content)
- `Clipboard API` (manual scoring copy)
- `HTMLDialogElement` (modals)

## Architecture

```
index.html (shell + dialogs)
    │
    ▼
app.js — home, router, exam mode, settings, dashboard
    │
    ├─→ tasks.js     (20 renderers + editable transcript step)
    │       └─→ chart.js (SVG chart renderers)
    ├─→ scoring.js   (PTE rubrics + local scoring)
    │       └─→ api.js  (Claude API or manual paste-dialog)
    ├─→ audio.js     (TTS + MediaRecorder + STT with auto-restart)
    ├─→ history.js   (localStorage-backed score history)
    ├─→ generation.js (per-task AI content generators)
    └─→ content.js   (static question bank + task metadata)
```

The app uses no global state container — modules communicate through plain
function imports.

## Project structure

```
pte-simulator/
├── index.html        # Shell with dialogs
├── styles.css        # All styles
├── app.js            # Home, router, settings, exam, dashboard
├── tasks.js          # The 20 task renderers
├── content.js        # Static question bank + task metadata
├── scoring.js        # PTE-style rubrics + local scoring rules
├── api.js            # Claude API client (with manual-mode fallback)
├── audio.js          # TTS / recording / speech recognition
├── chart.js          # SVG chart renderers (bar/line/pie/table/process/map)
├── history.js        # localStorage score tracking
├── generation.js     # AI-powered content generation per task
├── LICENSE           # MIT
├── .nojekyll         # Disables Jekyll processing on GitHub Pages
└── README.md         # This file
```

## Security & privacy

- The simulator runs entirely in your browser. Nothing is sent to any server
  except (optionally) directly to Anthropic's API when API mode is enabled.
- Your API key is stored only in `localStorage`. It never leaves your
  browser. Anyone who shares your browser profile has access to it — clear it
  via Settings if you're on a shared machine.
- Score history and generated content are stored in `localStorage` and stay on
  your device.
- The Anthropic API call uses the
  `anthropic-dangerous-direct-browser-access` header, which is acceptable for
  this single-user, local-context use case.

## Limitations

- Speech recognition isn't perfect — non-native accents may be transcribed with
  errors. The editable-transcript step lets you fix this before scoring.
- AI scores are approximations of PTE scoring, not official results. They use
  rubrics modelled on Pearson's published criteria but the actual scoring
  algorithm is proprietary.
- TTS voices are whatever your operating system provides. For the most
  realistic experience, use a high-quality system voice (on macOS: Karen,
  Daniel, Samantha).

## Contributing

Contributions are welcome. Things I'd love help with:

- More question content in `content.js`
- Better TTS integration (ElevenLabs adapter?)
- Spaced-repetition scheduling
- Calibration against real PTE results

Open an issue or pull request on GitHub.

## Licence

MIT — see [LICENSE](LICENSE).

## Author

**Alan Signetti** — Frontend / Full-Stack Developer on the Sunshine Coast,
Australia. Built this while preparing for the PTE myself as part of a
skilled-migration pathway. If this saves you some money or time on prep tools,
or helps you in your own migration journey, that makes me happy.

- LinkedIn: https://www.linkedin.com/in/alan-signetti-demand
- GitHub: https://github.com/alansignetti
- Portfolio: https://www.alansignetti.com
