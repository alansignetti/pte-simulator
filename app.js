// App shell: home picker, settings, exam mode, score display.

import { TASKS, getTaskMeta } from "./content.js";
import { runTask, setTopbarTimer, setTaskLabel, injectItem, abortActiveTask } from "./tasks.js";
import { micUnavailableReason } from "./audio.js";
import { generateForTask, hasGenerator, generatedCount } from "./generation.js";
import {
  getEnglishVoices,
  getPreferredVoiceName,
  setPreferredVoiceName,
  getRate,
  setRate,
  speak,
} from "./audio.js";
import { hasApiKey, getApiKey, setApiKey, isManualMode, setManualMode } from "./api.js";
import * as history from "./history.js";

const app = document.getElementById("app");

function escapeHtml(s) {
  return String(s).replace(/[<>&"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;",
  }[c]));
}

// ----------------- view tracking + top-bar state -----------------
let currentView = "home"; // home | about | progress | task | exam

function setView(view) {
  currentView = view;
  document.getElementById("about-btn").classList.toggle("active", view === "about");
  document.getElementById("exit-task-btn").style.display = (view === "task" || view === "exam") ? "" : "none";
}

// Wrapper so we don't pollute renderHome with state code.
function goHome() {
  abortActiveTask();
  setView("home");
  renderHome();
}

// ----------------- maker / social -----------------
const MAKER = {
  name: "Alan Signetti",
  linkedin: "https://www.linkedin.com/in/alan-signetti-demand",
  github: "https://github.com/alansignetti",
  portfolio: "https://www.alansignetti.com",
};

function socialLinksHTML() {
  const linkedinIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.59 0 4.26 2.36 4.26 5.43v6.31zM5.34 7.43a2.06 2.06 0 11.01-4.12 2.06 2.06 0 010 4.12zm1.78 13.02H3.56V9h3.56v11.45z"/></svg>`;
  const githubIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-1.93c-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.34.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.93 10.93 0 015.74 0c2.18-1.49 3.14-1.18 3.14-1.18.62 1.58.23 2.75.11 3.04.73.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.39-5.26 5.68.41.35.78 1.05.78 2.12v3.14c0 .3.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12c0-6.35-5.15-11.5-11.5-11.5z"/></svg>`;
  const portfolioIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.93 8zM12 4.07c.83 1.2 1.48 2.53 1.91 3.93h-3.82c.43-1.4 1.08-2.73 1.91-3.93zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 015.08 16zm2.95-8H5.08a7.987 7.987 0 014.33-3.56A15.65 15.65 0 008.03 8zM12 19.93c-.83-1.2-1.48-2.53-1.91-3.93h3.82c-.43 1.4-1.08 2.73-1.91 3.93zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>`;
  return `
    <div class="social-links">
      <a class="social-link" href="${MAKER.linkedin}" target="_blank" rel="noopener noreferrer">${linkedinIcon}<span>LinkedIn</span></a>
      <a class="social-link" href="${MAKER.github}" target="_blank" rel="noopener noreferrer">${githubIcon}<span>GitHub</span></a>
      <a class="social-link" href="${MAKER.portfolio}" target="_blank" rel="noopener noreferrer">${portfolioIcon}<span>Portfolio</span></a>
    </div>
  `;
}

function makerFooterHTML() {
  return `
    <div class="maker-footer">
      <div class="credit">Built by <strong>${MAKER.name}</strong> · open source under MIT</div>
      ${socialLinksHTML()}
    </div>
  `;
}

// ----------------- home -----------------
function renderHome() {
  setTopbarTimer(null);
  setTaskLabel("");
  const sections = ["Speaking", "Writing", "Reading", "Listening"];
  const byType = Object.fromEntries(sections.map((s) => [s, []]));
  for (const t of TASKS) byType[t.section]?.push(t);

  const sectionsHTML = sections.map((s) => `
    <h3 class="section-heading">${s}</h3>
    <div class="home-grid">
      ${byType[s].map((t) => {
        const genCount = generatedCount(t.id);
        const canGen = hasGenerator(t.id);
        return `
          <div class="task-card" data-id="${t.id}">
            <div class="code">
              ${t.code}
              ${canGen ? `<button class="gen-btn" data-gen="${t.id}" title="Generate a fresh item with AI" aria-label="Generate">🎲</button>` : ""}
            </div>
            <div class="title">${t.name}</div>
            <div class="desc">${describeTask(t)}</div>
            ${genCount ? `<div class="small muted" style="margin-top:4px;">+${genCount} AI-generated</div>` : ""}
          </div>
        `;
      }).join("")}
    </div>
  `).join("");

  const miniExamCards = Object.entries(MINI_EXAMS).map(([id, meta]) => `
    <div class="task-card mini-exam-card" data-exam="${id}" style="border-left-color: var(--pte-blue);">
      <div class="code">${meta.code}</div>
      <div class="title">${meta.name}</div>
      <div class="desc">${meta.desc}</div>
    </div>
  `).join("");

  const totalEntries = history.getAll().length;
  app.innerHTML = `
    <div class="panel">
      <h1>PTE Academic — Practice Simulator</h1>
      <p>Click any task to practise it individually, or pick a mini-exam variant below.</p>
      ${renderBrowserBanner()}
      ${renderScoringModeBanner()}
      <div class="row" style="margin-top:12px;">
        <button class="secondary" id="show-progress">📊 Progress${totalEntries ? ` (${totalEntries} attempts)` : ""}</button>
        <button class="secondary" id="open-about">📖 About this project</button>
      </div>
    </div>
    <h3 class="section-heading">Mini-exam variants</h3>
    <div class="home-grid">${miniExamCards}</div>
    <h3 class="section-heading">Section blocks</h3>
    <div class="row" style="margin-bottom:16px;">
      <button class="secondary" id="speaking-block">Speaking block</button>
      <button class="secondary" id="writing-block">Writing block</button>
      <button class="secondary" id="reading-block">Reading block</button>
      <button class="secondary" id="listening-block">Listening block</button>
    </div>
    ${sectionsHTML}
    ${makerFooterHTML()}
  `;

  document.getElementById("show-progress").addEventListener("click", renderProgress);
  document.getElementById("open-about").addEventListener("click", renderDocs);
  app.querySelectorAll(".task-card:not(.mini-exam-card)").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".gen-btn")) return; // handled below
      runSingleTask(card.dataset.id);
    });
  });
  app.querySelectorAll(".gen-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.gen;
      await generateAndPractise(taskId, btn);
    });
  });
  app.querySelectorAll(".mini-exam-card").forEach((card) => {
    card.addEventListener("click", () => {
      const exam = MINI_EXAMS[card.dataset.exam];
      const tasks = typeof exam.tasks === "function" ? exam.tasks() : exam.tasks;
      startExam(tasks, exam.name);
    });
  });

  document.getElementById("speaking-block").addEventListener("click", () => startExam(byType.Speaking.map((t) => t.id), "Speaking block"));
  document.getElementById("writing-block").addEventListener("click", () => startExam(byType.Writing.map((t) => t.id), "Writing block"));
  document.getElementById("reading-block").addEventListener("click", () => startExam(byType.Reading.map((t) => t.id), "Reading block"));
  document.getElementById("listening-block").addEventListener("click", () => startExam(byType.Listening.map((t) => t.id), "Listening block"));
}

// ----------------- about / docs -----------------
function renderDocs() {
  setTopbarTimer(null);
  setTaskLabel("");
  setView("about");
  app.innerHTML = `
    <div class="back-row">
      <button class="back-link" id="docs-back-top">← Back to home</button>
      <span class="muted small">You're viewing: About</span>
    </div>
    <div class="docs">
      <header class="docs-hero">
        <h1>PTE Academic Simulator</h1>
        <p class="tagline">
          A browser-based practice tool that replicates all 20 task types of the Pearson Test of
          English Academic, with AI-powered scoring and unlimited AI-generated practice content.
        </p>
        <div class="badges">
          <span class="badge">Vanilla JS</span>
          <span class="badge">ES Modules</span>
          <span class="badge">Claude API</span>
          <span class="badge">~4,000 LOC</span>
          <span class="badge">No backend</span>
          <span class="badge">No build step</span>
        </div>
      </header>

      <section class="docs-section">
        <h2>What it is</h2>
        <p>
          The PTE Academic is the English proficiency exam Pearson uses for university admission
          and Australian skilled-migration points. This simulator faithfully recreates all 20
          official task types across Speaking, Writing, Reading, and Listening — with real
          microphone recording, text-to-speech for listening sections, and AI scoring that mirrors
          the official rubrics.
        </p>
        <p>
          It runs entirely in the browser. No backend, no build step, no framework — just static
          files served from any web server. Settings, history, and AI-generated content persist
          in <code>localStorage</code>.
        </p>
      </section>

      <section class="docs-section">
        <h2>Why I built it</h2>
        <p>
          I needed to score 8.0+ on the PTE for a skilled-migration application. Commercial prep
          tools cost AUD 30-60 per month and are limited in variety; I wanted something I could
          customise, extend with AI, and own end-to-end. It also became an excuse to dig into
          browser APIs I rarely touch in day-to-day frontend work — speech recognition, media
          recording, Web Audio analysers, and synthesised speech.
        </p>
      </section>

      <section class="docs-section">
        <h2>Key features</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <div class="icon">🎙</div>
            <div class="ftitle">Real audio recording</div>
            <div class="fdesc">MediaRecorder captures your voice; Web Speech Recognition transcribes in parallel for AI scoring.</div>
          </div>
          <div class="feature-card">
            <div class="icon">🤖</div>
            <div class="ftitle">AI-powered scoring</div>
            <div class="fdesc">Claude evaluates subjective tasks using PTE-style rubrics, returning a 0-90 score per dimension plus feedback.</div>
          </div>
          <div class="feature-card">
            <div class="icon">🎲</div>
            <div class="ftitle">Unlimited content</div>
            <div class="fdesc">A "Generate" button on every task asks Claude to produce a fresh item matching the existing schema.</div>
          </div>
          <div class="feature-card">
            <div class="icon">📊</div>
            <div class="ftitle">Progress tracking</div>
            <div class="fdesc">Every attempt is logged. The dashboard shows per-task averages, best/last scores, sparklines, and weak spots.</div>
          </div>
          <div class="feature-card">
            <div class="icon">💸</div>
            <div class="ftitle">Zero-cost mode</div>
            <div class="fdesc">Optional "manual scoring" copies prompts to your clipboard so you can paste into claude.ai — no API key, no cost.</div>
          </div>
          <div class="feature-card">
            <div class="icon">🎯</div>
            <div class="ftitle">9 exam variants</div>
            <div class="fdesc">Classic, Quick, Speaking/Writing/Reading/Listening focus, Drill, Random Mix, and Full 20-task exam.</div>
          </div>
        </div>
      </section>

      <section class="docs-section">
        <h2>Tech stack</h2>
        <div class="stack-row">
          <span class="stack-chip">JavaScript (ES2022)</span>
          <span class="stack-chip">ES Modules</span>
          <span class="stack-chip">HTML5 / CSS3</span>
          <span class="stack-chip">Inline SVG</span>
          <span class="stack-chip api">Anthropic Claude API</span>
        </div>
        <h3>Browser APIs used</h3>
        <div class="stack-row">
          <span class="stack-chip">MediaRecorder</span>
          <span class="stack-chip">SpeechSynthesis</span>
          <span class="stack-chip">SpeechRecognition</span>
          <span class="stack-chip">Web Audio (AnalyserNode)</span>
          <span class="stack-chip">localStorage</span>
          <span class="stack-chip">Clipboard API</span>
          <span class="stack-chip">HTML <code>&lt;dialog&gt;</code></span>
        </div>
        <p class="muted small" style="margin-top:8px;">
          No frameworks, no bundlers, no transpilation. Files are served as-is and the
          browser handles module resolution.
        </p>
      </section>

      <section class="docs-section">
        <h2>Architecture</h2>
        <p>
          The app is a single-page application split into focused modules with one responsibility
          each. Communication flows through plain function imports — no event bus, no global
          state container.
        </p>
        <div class="arch-diagram">┌────────────────────────────────────────────────────────────┐
│                    index.html (shell + dialogs)            │
└──────────────────────────┬─────────────────────────────────┘
                           │ imports
                           ▼
┌────────────────────────────────────────────────────────────┐
│  app.js — home, router, exam mode, settings, dashboard     │
└──┬────────┬────────┬─────────┬─────────┬──────────┬────────┘
   │        │        │         │         │          │
   ▼        ▼        ▼         ▼         ▼          ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│tasks │ │scoring│ │ api  │ │ history │ │generation│ │ audio   │
│ .js  │ │  .js  │ │ .js  │ │   .js   │ │   .js    │ │  .js    │
└──┬───┘ └──┬───┘ └──┬───┘ └─────────┘ └─────────┘ └─────────┘
   │        │        │
   ▼        │        ▼
┌──────┐    │   ┌─────────────────────┐
│chart │    │   │  Anthropic API      │
│ .js  │    │   │  (or manual paste)  │
└──────┘    │   └─────────────────────┘
   │        │
   ▼        ▼
┌──────────────┐
│  content.js  │  static question bank + task metadata
└──────────────┘</div>
        <h3>Two scoring modes</h3>
        <ul>
          <li><strong>API mode:</strong> the browser calls Anthropic directly using the
              <code>anthropic-dangerous-direct-browser-access</code> header. Acceptable here
              because the user is the only one with access to their localStorage and to the key.</li>
          <li><strong>Manual mode:</strong> the same prompts are rendered into a copy-paste dialog,
              letting users score for free by pasting into claude.ai. The two modes are
              swappable behind a single feature flag in <code>api.js</code>.</li>
        </ul>
      </section>

      <section class="docs-section">
        <h2>The 20 task types</h2>
        <table class="task-table">
          <thead>
            <tr><th>Section</th><th>Task</th><th>Code</th><th>Scoring</th></tr>
          </thead>
          <tbody>
            <tr><td>Speaking</td><td>Read Aloud</td><td>RA</td><td>AI rubric</td></tr>
            <tr><td>Speaking</td><td>Repeat Sentence</td><td>RS</td><td>AI rubric</td></tr>
            <tr><td>Speaking</td><td>Describe Image</td><td>DI</td><td>AI rubric</td></tr>
            <tr><td>Speaking</td><td>Re-tell Lecture</td><td>RL</td><td>AI rubric</td></tr>
            <tr><td>Speaking</td><td>Answer Short Question</td><td>ASQ</td><td>Hybrid</td></tr>
            <tr><td>Writing</td><td>Summarize Written Text</td><td>SWT</td><td>AI rubric</td></tr>
            <tr><td>Writing</td><td>Write Essay</td><td>WE</td><td>AI rubric</td></tr>
            <tr><td>Reading</td><td>R&amp;W Fill in the Blanks</td><td>R&amp;W FIB</td><td>Local</td></tr>
            <tr><td>Reading</td><td>Multiple Choice — Multiple</td><td>MCMA-R</td><td>Local</td></tr>
            <tr><td>Reading</td><td>Re-order Paragraphs</td><td>RO</td><td>Local</td></tr>
            <tr><td>Reading</td><td>Reading Fill in the Blanks</td><td>R FIB</td><td>Local</td></tr>
            <tr><td>Reading</td><td>Multiple Choice — Single</td><td>MCSA-R</td><td>Local</td></tr>
            <tr><td>Listening</td><td>Summarize Spoken Text</td><td>SST</td><td>AI rubric</td></tr>
            <tr><td>Listening</td><td>Multiple Choice — Multiple</td><td>MCMA-L</td><td>Local</td></tr>
            <tr><td>Listening</td><td>Listening Fill in the Blanks</td><td>L FIB</td><td>Local</td></tr>
            <tr><td>Listening</td><td>Highlight Correct Summary</td><td>HCS</td><td>Local</td></tr>
            <tr><td>Listening</td><td>Multiple Choice — Single</td><td>MCSA-L</td><td>Local</td></tr>
            <tr><td>Listening</td><td>Select Missing Word</td><td>SMW</td><td>Local</td></tr>
            <tr><td>Listening</td><td>Highlight Incorrect Words</td><td>HIW</td><td>Local</td></tr>
            <tr><td>Listening</td><td>Write from Dictation</td><td>WFD</td><td>Local</td></tr>
          </tbody>
        </table>
        <p class="small muted">
          Local scoring uses deterministic rules (word matches, adjacent-pair counts for
          re-order, set intersection for multi-choice). AI scoring uses Claude with rubrics
          modelled on Pearson's published criteria.
        </p>
      </section>

      <section class="docs-section">
        <h2>Engineering challenges</h2>
        <div class="challenge">
          <div class="ctitle">1. Speech recognition stops on silence</div>
          <div class="cbody">
            Chrome's Web Speech Recognition closes the session after a few seconds of silence,
            which mid-sentence pauses easily trigger. Fixed by tracking a "should-keep-running"
            flag and re-starting the recognizer in <code>onend</code> whenever the recording
            window is still active, while preserving the accumulated final transcript across
            restarts.
          </div>
        </div>
        <div class="challenge">
          <div class="ctitle">2. Scoring with imperfect transcripts</div>
          <div class="cbody">
            Speech recognition isn't perfect, especially for non-native accents — and Claude's
            score is only as good as the text it sees. Solved by adding a "review transcript"
            step after recording: the user listens back to their audio with an inline player
            and edits the transcript before submitting it for scoring.
          </div>
        </div>
        <div class="challenge">
          <div class="ctitle">3. SVG charts without a library</div>
          <div class="cbody">
            Describe Image needs varied visuals (bar, line, pie, table, process flowchart,
            map of Australia, combo bar+line). I wrote each renderer as a pure function that
            returns an SVG string sized for the container. No Chart.js, no D3 — keeps the
            bundle at zero.
          </div>
        </div>
        <div class="challenge">
          <div class="ctitle">4. Schema-aware AI generation</div>
          <div class="cbody">
            Each of the 20 task types has its own shape (different fields, options arrays,
            blank markers, paragraph ordering, etc). The generation module has a per-task
            prompt that asks Claude to produce JSON matching the existing schema exactly,
            so generated items drop into the random pool seamlessly.
          </div>
        </div>
        <div class="challenge">
          <div class="ctitle">5. Zero-cost manual scoring</div>
          <div class="cbody">
            Many users can't or won't add a credit card to use the Anthropic API. Added a
            "manual scoring mode" where the same scoring prompts open in a copy-paste dialog —
            the user pastes into claude.ai (using their existing Pro/Team plan or free tier),
            then pastes the JSON response back. Same scoring quality, zero API cost.
          </div>
        </div>
        <div class="challenge">
          <div class="ctitle">6. Browser-direct Claude API calls</div>
          <div class="cbody">
            Anthropic blocks browser-origin requests by default to discourage embedding keys in
            shipped code. Since this is a local, single-user app, the
            <code>anthropic-dangerous-direct-browser-access</code> header is appropriate — the
            key lives only in the user's <code>localStorage</code> and never leaves their
            machine.
          </div>
        </div>
      </section>

      <section class="docs-section">
        <h2>Run it locally</h2>
        <p>Any static web server works. The simplest:</p>
        <pre><code>cd pte-simulator
python3 -m http.server 8080
# open http://localhost:8080 in Chrome</code></pre>
        <p>
          Chrome is recommended because it has the best support for the Web Speech Recognition
          API used during Speaking tasks.
        </p>
        <h3>First-time setup</h3>
        <ul>
          <li>Click ⚙ <strong>Settings</strong> in the top bar.</li>
          <li>Either paste an Anthropic API key (paid; ~AUD 0.15 per mini-exam) <em>or</em> tick
              <strong>Manual scoring mode</strong> (free, paste prompts into claude.ai).</li>
          <li>Pick a TTS voice — on macOS, <code>Karen</code> (en-AU) or <code>Daniel</code>
              (en-GB) sound closest to the actual PTE narrator.</li>
        </ul>
      </section>

      <section class="docs-section">
        <h2>What I'd add next</h2>
        <ul>
          <li>Native audio scoring once Anthropic adds audio input — would remove the
              transcription bottleneck for Speaking.</li>
          <li>Spaced-repetition scheduling that prioritises tasks scoring below a target.</li>
          <li>Calibration: compare AI scores against a few real PTE results to estimate bias.</li>
          <li>Optional ElevenLabs voices for more authentic Listening audio.</li>
          <li>Export progress as CSV for tracking outside the app.</li>
        </ul>
      </section>

      <section class="docs-section">
        <h2>A note for fellow PTE candidates</h2>
        <p>
          I built this while preparing for the PTE myself, as part of an Australian
          skilled-migration pathway. If you're navigating the same process — visa renewals,
          ACS skills assessments, EOI submissions — I hope this saves you some money on prep
          tools and gives you unlimited variety to practise with. Forks and pull requests are
          welcome; feel free to reach out if you want to chat about migration, PTE strategy, or
          collaborate on improvements.
        </p>
      </section>

      <section class="docs-section">
        <h2>About the maker</h2>
        <div class="maker-card">
          <div class="maker-name">${MAKER.name}</div>
          <div class="maker-bio">
            Frontend / Full-Stack Developer based on the Sunshine Coast, Australia.
            Six years of professional experience with React, TypeScript, Angular, and Node.js.
            This project is open source under the MIT licence — feel free to fork, learn from
            it, or use it as a starting point for your own ideas.
          </div>
          ${socialLinksHTML()}
        </div>
      </section>

      <footer class="docs-footer">
        <span>Built by ${MAKER.name} · MIT licence · 2026</span>
        <button class="primary" id="docs-back">← Back to practice</button>
      </footer>
    </div>
  `;
  app.querySelector("#docs-back").addEventListener("click", goHome);
  app.querySelector("#docs-back-top").addEventListener("click", goHome);
  window.scrollTo(0, 0);
}

// ----------------- progress dashboard -----------------
function renderProgress() {
  setTopbarTimer(null);
  setTaskLabel("");
  setView("progress");
  const sectionAgg = history.sectionSummary();
  const taskAgg = history.summary().sort((a, b) => a.section.localeCompare(b.section) || a.taskName.localeCompare(b.taskName));
  const weak = history.weakSpots(3);
  const total = history.getAll().length;

  if (total === 0) {
    app.innerHTML = `
      <div class="back-row">
        <button class="back-link" id="prog-back-top">← Back to home</button>
        <span class="muted small">You're viewing: Progress</span>
      </div>
      <div class="panel">
        <h1>📊 Progress</h1>
        <p>No attempts recorded yet. Practise some tasks and your scores will appear here.</p>
        <button class="primary" id="home">Back to home</button>
      </div>
    `;
    app.querySelector("#home").addEventListener("click", goHome);
    app.querySelector("#prog-back-top").addEventListener("click", goHome);
    return;
  }

  const sectionRows = sectionAgg.map((s) => `
    <div class="score-item" style="text-align:left;">
      <div class="num">${s.mean}</div>
      <div class="label">${escapeHtml(s.section)} (${s.count} attempts)</div>
    </div>
  `).join("");

  const weakBanner = weak.length
    ? `
      <div style="background:#fff8dc; border:1px solid #e8d77a; padding:12px; border-radius:4px; margin:12px 0;">
        <strong>🎯 Weakest tasks to drill:</strong>
        <ul style="margin:8px 0 0 18px; padding:0;">
          ${weak.map((w) => `
            <li>
              <a href="#" class="weak-link" data-id="${w.taskId}">${escapeHtml(w.taskName)}</a>
              — average ${w.mean} across ${w.count} attempts
            </li>
          `).join("")}
        </ul>
      </div>
    ` : "";

  const taskRows = taskAgg.map((t) => {
    const spark = renderSparkline(t.recent.map((r) => r.overall));
    return `
      <tr>
        <td style="padding:6px 8px;"><span class="muted small">${escapeHtml(t.section)}</span> · ${escapeHtml(t.taskName)}</td>
        <td style="padding:6px 8px; text-align:right;">${t.count}</td>
        <td style="padding:6px 8px; text-align:right;">${t.mean}</td>
        <td style="padding:6px 8px; text-align:right;">${t.best}</td>
        <td style="padding:6px 8px; text-align:right;">${t.last}</td>
        <td style="padding:6px 8px;">${spark}</td>
      </tr>
    `;
  }).join("");

  app.innerHTML = `
    <div class="back-row">
      <button class="back-link" id="prog-back-top">← Back to home</button>
      <span class="muted small">You're viewing: Progress · ${total} attempts</span>
    </div>
    <div class="panel">
      <h1>📊 Progress</h1>
      <p class="muted">${total} attempts recorded. Scores in PTE 0-90 scale (approximate).</p>
      <h3>Section averages</h3>
      <div class="score-grid">${sectionRows}</div>
      ${weakBanner}
      <h3>By task type</h3>
      <table style="width:100%; border-collapse:collapse; font-size:13px;">
        <thead>
          <tr style="background:#f4f8fa; text-align:left;">
            <th style="padding:6px 8px;">Task</th>
            <th style="padding:6px 8px; text-align:right;">N</th>
            <th style="padding:6px 8px; text-align:right;">Avg</th>
            <th style="padding:6px 8px; text-align:right;">Best</th>
            <th style="padding:6px 8px; text-align:right;">Last</th>
            <th style="padding:6px 8px;">Trend (last 10)</th>
          </tr>
        </thead>
        <tbody>${taskRows}</tbody>
      </table>
      <div class="row" style="margin-top:16px;">
        <button class="primary" id="home">Back to home</button>
        <span class="spacer"></span>
        <button class="danger" id="reset-history">Clear all history</button>
      </div>
    </div>
  `;
  app.querySelector("#home").addEventListener("click", goHome);
  app.querySelector("#prog-back-top").addEventListener("click", goHome);
  app.querySelector("#reset-history").addEventListener("click", () => {
    if (confirm("Delete all recorded scores? This cannot be undone.")) {
      history.clearAll();
      renderProgress();
    }
  });
  app.querySelectorAll(".weak-link").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      runSingleTask(a.dataset.id);
    });
  });
}

function renderSparkline(values) {
  if (!values || values.length === 0) return "";
  const w = 100, h = 24, pad = 2;
  const min = 0, max = 90;
  const pts = values.map((v, i) => {
    const x = pad + (values.length === 1 ? w / 2 : (i / (values.length - 1)) * (w - pad * 2));
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    return `${x},${y}`;
  });
  const last = values[values.length - 1];
  return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <polyline points="${pts.join(" ")}" fill="none" stroke="#00a8cc" stroke-width="1.5" />
      ${pts.map((p) => `<circle cx="${p.split(",")[0]}" cy="${p.split(",")[1]}" r="1.5" fill="#00a8cc" />`).join("")}
      <text x="${w - 2}" y="${h - 2}" font-size="9" text-anchor="end" fill="#666">${last}</text>
    </svg>
  `;
}

function isChromiumLike() {
  const ua = navigator.userAgent;
  // Chrome, Edge, Brave, Opera, Arc — all Chromium-based and support SpeechRecognition.
  // Safari has partial support but inconsistent. Firefox lacks it entirely.
  return /Chrome|Chromium|Edg/.test(ua) && !/Firefox/.test(ua);
}

function renderBrowserBanner() {
  const banners = [];
  const micReason = micUnavailableReason();
  if (micReason) {
    banners.push(`
      <div class="error" style="margin-top:12px;">
        <strong>Microphone unavailable.</strong> ${escapeHtml(micReason)}
      </div>
    `);
  }
  if (!isChromiumLike()) {
    banners.push(`
      <div class="error" style="margin-top:12px;">
        <strong>Your browser may not fully support this simulator.</strong>
        The Speaking tasks rely on the Web Speech Recognition API, which is only fully supported
        in Chromium-based browsers (Chrome, Edge, Brave, Arc). Reading, Writing, and Listening
        tasks will work, but Speaking transcription will be unavailable.
      </div>
    `);
  }
  return banners.join("");
}

function renderScoringModeBanner() {
  if (isManualMode()) {
    return `
      <div style="margin-top:16px; background:#eef8fb; border:1px solid var(--pte-accent); padding:10px 14px; border-radius:4px;">
        <strong>Manual scoring mode is ON.</strong> When a subjective task asks for scoring,
        you'll see a dialog with the prompt to paste into claude.ai. Objective tasks score automatically.
      </div>
    `;
  }
  if (!hasApiKey()) {
    return `
      <div class="error" style="margin-top:16px;">
        <strong>No scoring method configured.</strong> Either set an Anthropic API key in
        ⚙ Settings, or enable <em>Manual scoring mode</em> to paste prompts into claude.ai for free.
        Objective tasks (MCQ, FIB, WFD, etc.) work either way.
      </div>
    `;
  }
  return `
    <div style="margin-top:16px; background:#f4f8fa; border:1px solid var(--pte-border); padding:8px 12px; border-radius:4px; font-size:13px;">
      <span class="muted">API mode active — subjective tasks scored via Anthropic API.</span>
    </div>
  `;
}

function describeTask(t) {
  const secs = t.time ? ` · ${t.time}s` : "";
  switch (t.id) {
    case "readAloud": return "Read a short text aloud" + secs;
    case "repeatSentence": return "Repeat a spoken sentence" + secs;
    case "describeImage": return "Describe a chart or image" + secs;
    case "retellLecture": return "Summarise a short lecture" + secs;
    case "answerShortQuestion": return "One-word answers" + secs;
    case "summarizeWrittenText": return "One-sentence summary (5-75 words)";
    case "writeEssay": return "200-300 word essay";
    case "readingFillBlanksRW": return "Choose words from dropdowns";
    case "readingMCMA": return "Pick multiple correct answers";
    case "reorderParagraphs": return "Drag paragraphs into order";
    case "readingFillBlanks": return "Drag words into blanks";
    case "readingMCSA": return "Pick one correct answer";
    case "summarizeSpokenText": return "50-70 word summary of audio";
    case "listeningMCMA": return "Listen, pick multiple";
    case "listeningFillBlanks": return "Type missing words while listening";
    case "highlightCorrectSummary": return "Choose best summary";
    case "listeningMCSA": return "Listen, pick one";
    case "selectMissingWord": return "Guess the beeped-out word";
    case "highlightIncorrectWords": return "Click words that differ from audio";
    case "writeFromDictation": return "Type the dictated sentence";
    default: return "";
  }
}

// ----------------- AI generation -----------------
async function generateAndPractise(taskId, triggerBtn) {
  if (!hasApiKey() && !isManualMode()) {
    alert("To generate fresh items, either set an Anthropic API key in Settings, or enable Manual scoring mode (free).");
    return;
  }
  const original = triggerBtn?.textContent;
  if (triggerBtn) {
    triggerBtn.textContent = "⏳";
    triggerBtn.disabled = true;
  }
  try {
    const item = await generateForTask(taskId);
    injectItem(taskId, item);
    runSingleTask(taskId);
  } catch (e) {
    alert("Generation failed: " + e.message);
    if (triggerBtn) {
      triggerBtn.textContent = original;
      triggerBtn.disabled = false;
    }
  }
}

// ----------------- single-task run -----------------
let abortRequested = false;
async function runSingleTask(taskId) {
  setView("task");
  abortRequested = false;
  try {
    const result = await runTask(taskId, app);
    setView("home");
    history.addScore(taskId, result?.score);
    showScore(result, taskId, () => goHome());
  } catch (e) {
    setView("home");
    if (abortRequested) { goHome(); return; }
    showError(e, () => goHome());
  }
}

// ----------------- mini-exam variants -----------------
// Each variant shuffles task order at runtime so even the same preset
// feels different each time.
function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ALL_TASK_IDS = TASKS.map((t) => t.id);
const BY_SECTION = {
  Speaking: TASKS.filter((t) => t.section === "Speaking").map((t) => t.id),
  Writing: TASKS.filter((t) => t.section === "Writing").map((t) => t.id),
  Reading: TASKS.filter((t) => t.section === "Reading").map((t) => t.id),
  Listening: TASKS.filter((t) => t.section === "Listening").map((t) => t.id),
};

function pickN(arr, n) {
  return shuffled(arr).slice(0, n);
}

const MINI_EXAMS = {
  classic: {
    code: "Classic",
    name: "Classic Mini-Exam",
    desc: "Balanced 9-task sample touching every section (~30 min)",
    tasks: () => shuffled([
      "readAloud", "describeImage", "answerShortQuestion",
      "summarizeWrittenText",
      "readingMCMA", "reorderParagraphs",
      "summarizeSpokenText", "highlightCorrectSummary", "writeFromDictation",
    ]),
  },
  quick: {
    code: "Quick",
    name: "Quick Start",
    desc: "5 short tasks, one from each section (~12 min)",
    tasks: () => [
      ...pickN(BY_SECTION.Speaking.filter((id) => id !== "retellLecture"), 1),
      ...pickN(BY_SECTION.Writing.filter((id) => id !== "writeEssay"), 1),
      ...pickN(BY_SECTION.Reading, 1),
      ...pickN(BY_SECTION.Listening.filter((id) => id !== "summarizeSpokenText"), 2),
    ],
  },
  speakingFocus: {
    code: "Speaking",
    name: "Speaking Focus",
    desc: "All 5 Speaking tasks + 2 Listening warm-ups",
    tasks: () => [
      ...pickN(BY_SECTION.Listening.filter((id) => ["writeFromDictation", "selectMissingWord", "listeningMCSA"].includes(id)), 2),
      ...shuffled(BY_SECTION.Speaking),
    ],
  },
  writingFocus: {
    code: "Writing",
    name: "Writing Focus",
    desc: "Essay + SWT + SST + 2 Reading items",
    tasks: () => [
      "summarizeWrittenText",
      ...pickN(BY_SECTION.Reading, 2),
      "summarizeSpokenText",
      "writeEssay",
    ],
  },
  readingFocus: {
    code: "Reading",
    name: "Reading Focus",
    desc: "All 5 Reading tasks + 2 Writing items",
    tasks: () => [
      ...shuffled(BY_SECTION.Reading),
      "summarizeWrittenText",
    ],
  },
  listeningFocus: {
    code: "Listening",
    name: "Listening Focus",
    desc: "6 Listening tasks + 1 Speaking",
    tasks: () => [
      ...pickN(BY_SECTION.Listening, 6),
      ...pickN(BY_SECTION.Speaking.filter((id) => id !== "retellLecture"), 1),
    ],
  },
  weakSpot: {
    code: "Drill",
    name: "Drill (small + objective)",
    desc: "9 quick objective tasks for fast skill checks — no API needed",
    tasks: () => shuffled([
      "readingMCSA", "readingMCMA", "reorderParagraphs", "readingFillBlanks", "readingFillBlanksRW",
      "listeningMCSA", "listeningFillBlanks", "selectMissingWord", "writeFromDictation",
    ]),
  },
  random: {
    code: "Random",
    name: "Random Mix",
    desc: "8 tasks chosen randomly across all sections — different every time",
    tasks: () => pickN(ALL_TASK_IDS, 8),
  },
  fullSet: {
    code: "Full",
    name: "Full Set (all 20)",
    desc: "Every task type once. ~90 minutes — closest to a real exam.",
    tasks: () => [
      ...shuffled(BY_SECTION.Speaking),
      ...shuffled(BY_SECTION.Writing),
      ...shuffled(BY_SECTION.Reading),
      ...shuffled(BY_SECTION.Listening),
    ],
  },
};

async function startExam(taskIds, examName = "Exam") {
  setView("exam");
  abortRequested = false;
  const results = [];
  for (let i = 0; i < taskIds.length; i++) {
    if (abortRequested) {
      setView("home");
      goHome();
      return;
    }
    const id = taskIds[i];
    const progressHTML = `
      <div class="exam-progress">
        ${taskIds.map((_, j) => `<div class="step ${j < i ? "done" : j === i ? "current" : ""}"></div>`).join("")}
      </div>
      <div class="muted small" style="margin-bottom:8px;">
        ${escapeHtml(examName)} — task ${i + 1} of ${taskIds.length}
      </div>
    `;
    app.innerHTML = progressHTML;
    try {
      const result = await runTask(id, app);
      if (abortRequested) { setView("home"); goHome(); return; }
      history.addScore(id, result?.score);
      results.push({ taskId: id, result });
      await waitForContinue(app, i < taskIds.length - 1 ? "Next task" : "Show summary", result);
    } catch (e) {
      if (abortRequested) { setView("home"); goHome(); return; }
      console.error(e);
      results.push({ taskId: id, error: e.message });
      await waitForContinue(app, "Skip", null, e.message);
    }
  }
  setView("home");
  showExamSummary(results, examName);
}

function waitForContinue(host, label, result, errMsg) {
  return new Promise((resolve) => {
    const scoreHTML = result?.score ? renderScoreHTML(result) : (errMsg ? `<div class="error">${escapeHtml(errMsg)}</div>` : "");
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      ${scoreHTML}
      <div style="text-align:right; margin-top:12px;">
        <button class="primary" id="continue">${escapeHtml(label)}</button>
      </div>
    `;
    host.appendChild(wrap);
    wrap.querySelector("#continue").addEventListener("click", resolve);
  });
}

function showExamSummary(results, examName = "Exam") {
  const totalScores = results
    .map((r) => r.result?.score?.overall_0_90)
    .filter((n) => typeof n === "number");
  const avg = totalScores.length
    ? Math.round(totalScores.reduce((s, n) => s + n, 0) / totalScores.length)
    : null;

  const rows = results.map((r) => {
    const meta = getTaskMeta(r.taskId);
    const sc = r.result?.score?.overall_0_90;
    return `
      <tr>
        <td>${escapeHtml(meta?.name || r.taskId)}</td>
        <td style="text-align:right;">${sc == null ? "—" : sc}</td>
      </tr>
    `;
  }).join("");

  app.innerHTML = `
    <div class="panel">
      <h1>Exam Summary — ${escapeHtml(examName)}</h1>
      ${avg != null ? `
        <div class="score-panel">
          <h3>Approximate overall score (0-90 scale)</h3>
          <div style="font-size:48px; font-weight:600; color: var(--pte-blue);">${avg}</div>
          <p class="small muted">This is an approximation only — real PTE scoring uses proprietary algorithms.</p>
        </div>
      ` : ""}
      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        <thead>
          <tr style="background:#f4f8fa;">
            <th style="text-align:left; padding:8px;">Task</th>
            <th style="text-align:right; padding:8px;">Score</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:16px;">
        <button class="primary" id="home">Back to home</button>
      </div>
    </div>
  `;
  app.querySelector("#home").addEventListener("click", goHome);
}

// ----------------- score display -----------------
function showScore(result, taskId, onContinue) {
  app.appendChild(htmlToElement(`
    <div>
      ${renderScoreHTML(result)}
      <div style="text-align:right; margin-top:12px;">
        <button class="secondary" id="back">Back to home</button>
        <button class="primary" id="again">Try another ${escapeHtml(getTaskMeta(taskId)?.name || "")}</button>
      </div>
    </div>
  `));
  app.querySelector("#back").addEventListener("click", onContinue);
  app.querySelector("#again").addEventListener("click", () => {
    runSingleTask(taskId);
  });
}

function renderScoreHTML(result) {
  const sc = result?.score || {};
  const overall = sc.overall_0_90 ?? "—";
  const detailKeys = Object.keys(sc).filter(
    (k) => !["overall_0_90", "feedback", "correctIndexes", "raw", "maxRaw", "hits", "total", "pairs", "maxPairs", "correct"].includes(k)
  );
  const dimsHTML = detailKeys.length
    ? `<div class="score-grid">
        ${detailKeys.map((k) => `
          <div class="score-item">
            <div class="num">${sc[k]}</div>
            <div class="label">${escapeHtml(k.replace(/_/g, " "))}</div>
          </div>
        `).join("")}
      </div>`
    : "";

  const objective = sc.hits != null
    ? `<p>${sc.hits} / ${sc.total} correct</p>`
    : sc.pairs != null
    ? `<p>${sc.pairs} / ${sc.maxPairs} adjacent pairs correct</p>`
    : "";

  const transcript = result.transcript
    ? `<details style="margin-top:12px;"><summary>Your transcript</summary><div class="passage">${escapeHtml(result.transcript || "—")}</div></details>`
    : "";
  const written = result.summary || result.essay || result.answer
    ? `<details style="margin-top:12px;"><summary>Your response</summary><div class="passage">${escapeHtml(result.summary || result.essay || result.answer)}</div></details>`
    : "";

  return `
    <div class="score-panel">
      <h3>Score (approximate, 0-90 scale)</h3>
      <div style="font-size:42px; font-weight:600; color: var(--pte-blue);">${overall}</div>
      ${dimsHTML}
      ${objective}
      ${sc.feedback ? `<p><strong>Feedback:</strong> ${escapeHtml(sc.feedback)}</p>` : ""}
      ${transcript}
      ${written}
    </div>
  `;
}

function showError(err, onContinue) {
  app.innerHTML = `
    <div class="panel">
      <h2>Something went wrong</h2>
      <div class="error">${escapeHtml(err.message || String(err))}</div>
      <button class="primary" id="back">Back to home</button>
    </div>
  `;
  app.querySelector("#back").addEventListener("click", onContinue);
}

function htmlToElement(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

// ----------------- settings dialog -----------------
async function openSettings() {
  const dlg = document.getElementById("settings-dialog");
  const keyInput = document.getElementById("api-key-input");
  const voiceSelect = document.getElementById("voice-select");
  const rateInput = document.getElementById("voice-rate");
  const manualToggle = document.getElementById("manual-mode-toggle");
  const apiFieldset = document.getElementById("api-fieldset");

  manualToggle.checked = isManualMode();
  apiFieldset.disabled = manualToggle.checked;
  manualToggle.addEventListener("change", () => {
    apiFieldset.disabled = manualToggle.checked;
  });

  keyInput.value = getApiKey();
  rateInput.value = getRate();

  const voices = await getEnglishVoices();
  const preferred = getPreferredVoiceName();
  voiceSelect.innerHTML = voices
    .map((v) => `<option value="${v.name}" ${v.name === preferred ? "selected" : ""}>${v.name} (${v.lang})</option>`)
    .join("");

  dlg.showModal();
}

document.getElementById("brand-btn").addEventListener("click", () => {
  if (currentView === "task" || currentView === "exam") {
    if (!confirm("Exit the current task and go back to home? Your in-progress response will be lost.")) return;
    abortRequested = true;
    stopAllTaskAudio();
  }
  goHome();
});

document.getElementById("about-btn").addEventListener("click", () => {
  if (currentView === "about") { goHome(); return; }
  if (currentView === "task" || currentView === "exam") {
    if (!confirm("Leave the current task and view About? Your in-progress response will be lost.")) return;
    abortRequested = true;
    stopAllTaskAudio();
  }
  renderDocs();
});

document.getElementById("exit-task-btn").addEventListener("click", () => {
  if (!confirm(currentView === "exam"
    ? "Exit the exam and discard remaining tasks?"
    : "Exit this task? Your in-progress response will be lost.")) return;
  abortRequested = true;
  stopAllTaskAudio();
  setView("home");
  goHome();
});

// Best-effort cleanup when the user bails out mid-task. Cancels the
// active countdown (so the topbar timer resets) and stops TTS. Recorder
// and recognizer instances finish naturally — their DOM updates become
// no-ops once innerHTML clears the elements they were targeting.
function stopAllTaskAudio() {
  abortActiveTask();
}

document.getElementById("settings-btn").addEventListener("click", openSettings);
document.getElementById("save-settings").addEventListener("click", (e) => {
  e.preventDefault();
  setManualMode(document.getElementById("manual-mode-toggle").checked);
  setApiKey(document.getElementById("api-key-input").value);
  setPreferredVoiceName(document.getElementById("voice-select").value);
  setRate(parseFloat(document.getElementById("voice-rate").value));
  document.getElementById("settings-dialog").close();
  renderHome();
});
document.getElementById("test-voice").addEventListener("click", async () => {
  setPreferredVoiceName(document.getElementById("voice-select").value);
  setRate(parseFloat(document.getElementById("voice-rate").value));
  await speak("This is a test of the selected voice for PTE listening tasks.");
});

// ----------------- welcome (first run) -----------------
function maybeShowWelcome() {
  const seen = localStorage.getItem("pte_welcome_seen") === "1";
  const hasAnyConfig = hasApiKey() || isManualMode();
  if (seen || hasAnyConfig) return;

  const dlg = document.getElementById("welcome-dialog");
  const close = (choice) => {
    if (choice === "manual") setManualMode(true);
    localStorage.setItem("pte_welcome_seen", "1");
    dlg.close();
    renderHome();
  };
  document.getElementById("welcome-manual").addEventListener("click", () => close("manual"), { once: true });
  document.getElementById("welcome-api").addEventListener("click", () => {
    close("skip");
    openSettings();
  }, { once: true });
  document.getElementById("welcome-skip").addEventListener("click", () => close("skip"), { once: true });
  dlg.showModal();
}

// ----------------- init -----------------
renderHome();
maybeShowWelcome();
