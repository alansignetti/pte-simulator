// Renderers for all 20 PTE task types. Each renderer is an async function
// `render(host, item)` that mounts UI into `host` (a DOM element) and resolves
// with the candidate's response payload. app.js handles scoring & result display.

import { CONTENT, getTaskMeta, randomItem } from "./content.js";
import { getGeneratedFor } from "./generation.js";
import {
  speak,
  stopSpeaking,
  createRecorder,
  createSpeechRecognizer,
} from "./audio.js";
import { renderChart, describeChartData } from "./chart.js";
import {
  scoreReadAloud,
  scoreRepeatSentence,
  scoreDescribeImage,
  scoreRetellLecture,
  scoreAnswerShortQuestion,
  scoreSummarizeWrittenText,
  scoreEssay,
  scoreSummarizeSpokenText,
  scoreMCMA,
  scoreMCSA,
  scoreReorder,
  scoreFillBlanks,
  scoreWriteFromDictation,
  scoreHighlightIncorrectWords,
} from "./scoring.js";

// ----------------- shared helpers -----------------

export function setTopbarTimer(secondsRemaining) {
  const el = document.getElementById("timer");
  if (!el) return;
  if (secondsRemaining == null) {
    el.textContent = "";
    el.classList.remove("warn");
    return;
  }
  const m = Math.floor(secondsRemaining / 60);
  const s = Math.floor(secondsRemaining % 60);
  el.textContent = `${m}:${s.toString().padStart(2, "0")}`;
  el.classList.toggle("warn", secondsRemaining <= 10);
}

export function setTaskLabel(text) {
  const el = document.getElementById("task-label");
  if (el) el.textContent = text || "";
}

function clearTimer() { setTopbarTimer(null); }

function escapeHtml(s) {
  return String(s).replace(/[<>&"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;",
  }[c]));
}

function wordCount(s) {
  return (s || "").trim().split(/\s+/).filter(Boolean).length;
}

// Merge AI-generated items into the random pool for a given task type.
function pool(taskId, baseArray) {
  const generated = getGeneratedFor(taskId);
  return generated.length ? [...baseArray, ...generated] : baseArray;
}

// One-shot injection: when set, the next pick() for that taskId uses
// the injected item and then clears it. Lets the "Generate & practise"
// flow guarantee the user gets the freshly-generated item.
const injected = {};
export function injectItem(taskId, item) {
  injected[taskId] = item;
}
function pick(taskId, baseArray) {
  if (injected[taskId]) {
    const it = injected[taskId];
    delete injected[taskId];
    return it;
  }
  return randomItem(pool(taskId, baseArray));
}

// The single in-flight countdown, exposed via abortActiveTask so the topbar
// "Exit" / "Home" buttons can stop it cleanly. Without this, an old
// countdown keeps writing to #timer after the user has navigated away,
// making the topbar timer appear "stuck" or carry over to the next task.
let activeCountdown = null;

function countdown(seconds, onTick) {
  let cancelled = false;
  const start = performance.now();
  const promise = new Promise((resolve) => {
    function step() {
      if (cancelled) return resolve("cancel");
      const elapsed = (performance.now() - start) / 1000;
      const remaining = Math.max(0, seconds - elapsed);
      onTick?.(remaining);
      setTopbarTimer(remaining);
      if (remaining <= 0) return resolve("done");
      requestAnimationFrame(step);
    }
    step();
  });
  const handle = {
    promise,
    cancel: () => {
      cancelled = true;
      if (activeCountdown === handle) activeCountdown = null;
    },
  };
  activeCountdown = handle;
  return handle;
}

// Called by app.js when the user exits a task / examination mid-way.
// Cancels the running countdown, clears the topbar timer, and stops any
// TTS playback so the home page lands in a clean state.
export function abortActiveTask() {
  if (activeCountdown) {
    activeCountdown.cancel();
    activeCountdown = null;
  }
  setTopbarTimer(null);
  setTaskLabel("");
  stopSpeaking();
}

// Generic speaking-task flow: prep phase (display only), then recording phase.
async function runSpeakingFlow({
  host,
  prepSeconds,
  recordSeconds,
  contentHTML,
  recordingExtraHTML = "",
  speakBefore = null, // async function called before recording (e.g. play lecture)
}) {
  host.innerHTML = `
    <div class="panel task-content">
      <div class="instruction" id="phase-msg">Prepare to respond. Recording will start automatically.</div>
      <div id="task-body">${contentHTML}</div>
      <div class="recorder">
        <div class="row">
          <span class="rec-indicator" id="rec-dot"></span>
          <span id="rec-status">Waiting…</span>
          <span class="spacer"></span>
          <button class="secondary" id="finish-btn" disabled>Finish early</button>
        </div>
        <div class="audio-level"><div class="audio-level-bar" id="level"></div></div>
        ${recordingExtraHTML}
      </div>
      <p class="small muted">Tip: speak clearly into your microphone. Speech is transcribed using your browser's recognition API.</p>
    </div>
  `;

  const phaseMsg = host.querySelector("#phase-msg");
  const recStatus = host.querySelector("#rec-status");
  const recDot = host.querySelector("#rec-dot");
  const finishBtn = host.querySelector("#finish-btn");
  const levelBar = host.querySelector("#level");

  if (speakBefore) {
    phaseMsg.textContent = "Listen carefully…";
    await speakBefore();
  }

  // Prep phase
  if (prepSeconds > 0) {
    phaseMsg.textContent = `Preparation: ${prepSeconds}s. Recording starts when this ends.`;
    const cd = countdown(prepSeconds);
    await cd.promise;
  }

  // Start microphone
  let recorder, recognizer;
  try {
    recorder = await createRecorder({
      onLevel: (l) => {
        levelBar.style.width = `${Math.min(100, l * 200)}%`;
      },
    });
  } catch (e) {
    host.innerHTML += `<div class="error">Microphone access denied. Please allow microphone access and try again.</div>`;
    throw e;
  }
  recognizer = createSpeechRecognizer({ lang: "en-US" });

  recorder.start();
  recognizer.start();
  recDot.classList.add("recording");
  recStatus.textContent = "Recording…";
  finishBtn.disabled = false;
  phaseMsg.textContent = "Speak now.";

  const cd = countdown(recordSeconds);
  let earlyFinish = false;
  finishBtn.addEventListener("click", () => {
    earlyFinish = true;
    cd.cancel();
  });

  await cd.promise;
  clearTimer();
  recDot.classList.remove("recording");
  recStatus.textContent = "Processing…";
  const blob = await recorder.stop();
  recognizer.stop();
  await new Promise((r) => setTimeout(r, 300)); // let final speech result settle
  const rawTranscript = recognizer.getTranscript();
  recStatus.textContent = "Done.";

  // Edit step: let the user listen back, fix recognizer mistakes, then submit.
  const finalTranscript = await reviewTranscriptStep(host, blob, rawTranscript);
  return { blob, transcript: finalTranscript, rawTranscript, earlyFinish };
}

// Editable transcript step. Shows audio playback + textarea with the
// recognizer's output, and lets the user clean it up before scoring.
async function reviewTranscriptStep(host, blob, rawTranscript) {
  return new Promise((resolve) => {
    const audioURL = URL.createObjectURL(blob);
    const reviewWrap = document.createElement("div");
    reviewWrap.className = "panel task-content";
    reviewWrap.style.marginTop = "16px";
    reviewWrap.innerHTML = `
      <h3>Review transcript before scoring</h3>
      <p class="small muted">
        Speech recognition is imperfect — listen to your recording and fix any words the
        recognizer missed or got wrong. The scoring uses this transcript, so accurate text
        gives you a fairer score.
      </p>
      <audio controls src="${audioURL}" style="width:100%; margin:8px 0;"></audio>
      <textarea class="essay" id="transcript-edit" style="min-height:120px;">${escapeHtml(rawTranscript)}</textarea>
      <div class="row" style="margin-top:8px;">
        <button class="secondary" id="reset-transcript">Reset to original</button>
        <span class="spacer"></span>
        <button class="primary" id="submit-transcript">Submit for scoring →</button>
      </div>
    `;
    host.appendChild(reviewWrap);

    const ta = reviewWrap.querySelector("#transcript-edit");
    ta.focus();
    reviewWrap.querySelector("#reset-transcript").addEventListener("click", () => {
      ta.value = rawTranscript;
    });
    reviewWrap.querySelector("#submit-transcript").addEventListener("click", () => {
      URL.revokeObjectURL(audioURL);
      resolve(ta.value.trim());
    });
  });
}

// ----------------- task renderers -----------------

export const RENDERERS = {
  // ===== Speaking =====
  async readAloud(host) {
    const item = pick("readAloud", CONTENT.readAloud);
    const html = `
      <h2>Read Aloud</h2>
      <p class="instruction">Look at the text below. You'll have ${35}s to prepare, then ${40}s to read it aloud.</p>
      <div class="passage">${escapeHtml(item.text)}</div>
    `;
    const { transcript, blob } = await runSpeakingFlow({
      host, prepSeconds: 35, recordSeconds: 40, contentHTML: html,
    });
    const score = await scoreReadAloud({ original: item.text, transcript });
    return { item, transcript, blob, score };
  },

  async repeatSentence(host) {
    const sentence = pick("repeatSentence", CONTENT.repeatSentence);
    const html = `
      <h2>Repeat Sentence</h2>
      <p class="instruction">You'll hear a sentence. After it ends, repeat it exactly.</p>
      <p class="muted">Listening…</p>
    `;
    const { transcript, blob } = await runSpeakingFlow({
      host,
      prepSeconds: 0,
      recordSeconds: 15,
      contentHTML: html,
      speakBefore: async () => {
        await speak(sentence);
        await new Promise((r) => setTimeout(r, 600));
      },
    });
    const score = await scoreRepeatSentence({ original: sentence, transcript });
    return { item: { original: sentence }, transcript, blob, score };
  },

  async describeImage(host) {
    const item = pick("describeImage", CONTENT.describeImage);
    const svg = renderChart(item);
    const html = `
      <h2>Describe Image</h2>
      <p class="instruction">Look at the image. You'll have 25s to prepare, then 40s to describe what it shows.</p>
      ${svg}
    `;
    const { transcript, blob } = await runSpeakingFlow({
      host, prepSeconds: 25, recordSeconds: 40, contentHTML: html,
    });
    const score = await scoreDescribeImage({
      title: item.title,
      dataDescription: describeChartData(item),
      transcript,
    });
    return { item, transcript, blob, score };
  },

  async retellLecture(host) {
    const item = pick("retellLecture", CONTENT.retellLecture);
    const html = `
      <h2>Re-tell Lecture</h2>
      <p class="instruction">Listen to the lecture. You'll have 10s to prepare, then 40s to retell the key points.</p>
      <p class="muted"><strong>${escapeHtml(item.title)}</strong></p>
    `;
    const { transcript, blob } = await runSpeakingFlow({
      host,
      prepSeconds: 10,
      recordSeconds: 40,
      contentHTML: html,
      speakBefore: async () => {
        await speak(item.transcript);
      },
    });
    const score = await scoreRetellLecture({
      originalTranscript: item.transcript,
      transcript,
    });
    return { item, transcript, blob, score };
  },

  async answerShortQuestion(host) {
    const item = pick("answerShortQuestion", CONTENT.answerShortQuestion);
    const html = `
      <h2>Answer Short Question</h2>
      <p class="instruction">You'll hear a short question. Answer with one or a few words.</p>
    `;
    const { transcript, blob } = await runSpeakingFlow({
      host,
      prepSeconds: 0,
      recordSeconds: 10,
      contentHTML: html,
      speakBefore: async () => {
        await speak(item.q);
        await new Promise((r) => setTimeout(r, 400));
      },
    });
    const score = await scoreAnswerShortQuestion({
      question: item.q,
      acceptable: item.a,
      transcript,
    });
    return { item, transcript, blob, score };
  },

  // ===== Writing =====
  async summarizeWrittenText(host) {
    const item = pick("summarizeWrittenText", CONTENT.summarizeWrittenText);
    return new Promise((resolve) => {
      host.innerHTML = `
        <div class="panel task-content">
          <h2>Summarize Written Text</h2>
          <p class="instruction">Read the passage and write a one-sentence summary (5-75 words). 10 minutes.</p>
          <div class="passage">${escapeHtml(item.text)}</div>
          <textarea class="essay" id="response" placeholder="Write your one-sentence summary…"></textarea>
          <div class="word-count"><span id="wc">0</span> words</div>
          <div class="row" style="margin-top:12px;">
            <button class="primary" id="submit">Submit</button>
          </div>
        </div>
      `;
      const ta = host.querySelector("#response");
      const wc = host.querySelector("#wc");
      ta.addEventListener("input", () => { wc.textContent = wordCount(ta.value); });

      const cd = countdown(600);
      cd.promise.then((reason) => {
        if (reason === "done") submit();
      });

      async function submit() {
        cd.cancel(); clearTimer();
        host.querySelector("#submit").disabled = true;
        const summary = ta.value.trim();
        const score = await scoreSummarizeWrittenText({ original: item.text, summary });
        resolve({ item, summary, score });
      }
      host.querySelector("#submit").addEventListener("click", submit);
    });
  },

  async writeEssay(host) {
    const prompt = pick("writeEssay", CONTENT.writeEssay);
    return new Promise((resolve) => {
      host.innerHTML = `
        <div class="panel task-content">
          <h2>Write Essay</h2>
          <p class="instruction">Write a 200-300 word essay on the topic below. 20 minutes.</p>
          <div class="passage">${escapeHtml(prompt)}</div>
          <textarea class="essay" id="response" style="min-height:300px;" placeholder="Write your essay…"></textarea>
          <div class="word-count"><span id="wc">0</span> words</div>
          <div class="row" style="margin-top:12px;">
            <button class="primary" id="submit">Submit</button>
          </div>
        </div>
      `;
      const ta = host.querySelector("#response");
      const wc = host.querySelector("#wc");
      ta.addEventListener("input", () => { wc.textContent = wordCount(ta.value); });

      const cd = countdown(1200);
      cd.promise.then((r) => { if (r === "done") submit(); });

      async function submit() {
        cd.cancel(); clearTimer();
        host.querySelector("#submit").disabled = true;
        const essay = ta.value.trim();
        const score = await scoreEssay({ prompt, essay });
        resolve({ item: { prompt }, essay, score });
      }
      host.querySelector("#submit").addEventListener("click", submit);
    });
  },

  // ===== Reading =====
  async readingFillBlanksRW(host) {
    const item = pick("readingFillBlanksRW", CONTENT.readingFillBlanksRW);
    return new Promise((resolve) => {
      const correct = [];
      const html = item.text.map((seg, idx) => {
        if (typeof seg === "string") return escapeHtml(seg);
        correct[seg.blank] = seg.correct;
        const opts = ["", ...seg.options]
          .map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o || "—")}</option>`)
          .join("");
        return `<select class="blank-dropdown" data-blank="${seg.blank}">${opts}</select>`;
      }).join("");

      host.innerHTML = `
        <div class="panel task-content">
          <h2>Reading & Writing — Fill in the Blanks</h2>
          <p class="instruction">Choose the best word for each blank.</p>
          <div class="passage">${html}</div>
          <button class="primary" id="submit">Submit</button>
        </div>
      `;
      const cd = countdown(180);
      cd.promise.then((r) => { if (r === "done") submit(); });

      function submit() {
        cd.cancel(); clearTimer();
        const answers = correct.map((_, i) => {
          const el = host.querySelector(`select[data-blank="${i}"]`);
          return el?.value || "";
        });
        const score = scoreFillBlanks(answers, correct);
        // Highlight correctness
        host.querySelectorAll("select").forEach((el) => {
          const i = parseInt(el.dataset.blank);
          if (el.value === correct[i]) el.style.background = "#d6f0d6";
          else el.style.background = "#f6d6d6";
        });
        host.querySelector("#submit").disabled = true;
        resolve({ item, answers, correct, score });
      }
      host.querySelector("#submit").addEventListener("click", submit);
    });
  },

  async readingMCMA(host) {
    const item = pick("readingMCMA", CONTENT.readingMCMA);
    return new Promise((resolve) => {
      const opts = item.options.map((o, i) => `
        <label class="mcq-option" data-i="${i}">
          <input type="checkbox" value="${i}" />
          <span>${escapeHtml(o)}</span>
        </label>
      `).join("");
      host.innerHTML = `
        <div class="panel task-content">
          <h2>Multiple Choice — Multiple Answers</h2>
          <p class="instruction">Read the passage and select all statements supported by it.</p>
          <div class="passage">${escapeHtml(item.passage)}</div>
          <p><strong>${escapeHtml(item.question)}</strong></p>
          ${opts}
          <button class="primary" id="submit" style="margin-top:12px;">Submit</button>
        </div>
      `;
      const cd = countdown(120);
      cd.promise.then((r) => { if (r === "done") submit(); });

      host.querySelectorAll(".mcq-option").forEach((opt) => {
        opt.addEventListener("click", (e) => {
          if (e.target.tagName !== "INPUT") {
            const cb = opt.querySelector("input");
            cb.checked = !cb.checked;
          }
          opt.classList.toggle("selected", opt.querySelector("input").checked);
        });
      });

      function submit() {
        cd.cancel(); clearTimer();
        const selected = [...host.querySelectorAll("input:checked")].map((cb) => parseInt(cb.value));
        const score = scoreMCMA(selected, item.correct);
        // Highlight
        host.querySelectorAll(".mcq-option").forEach((opt) => {
          const i = parseInt(opt.dataset.i);
          if (item.correct.includes(i)) opt.classList.add("correct");
          else if (selected.includes(i)) opt.classList.add("incorrect");
        });
        host.querySelector("#submit").disabled = true;
        resolve({ item, selected, score });
      }
      host.querySelector("#submit").addEventListener("click", submit);
    });
  },

  async reorderParagraphs(host) {
    const item = pick("reorderParagraphs", CONTENT.reorderParagraphs);
    // Render in shuffled order; correctOrder = original indices 0..n-1.
    const indexed = item.paragraphs.map((p, i) => ({ i, p }));
    const shuffled = [...indexed].sort(() => Math.random() - 0.5);
    const correctOrder = item.paragraphs.map((_, i) => i);

    return new Promise((resolve) => {
      host.innerHTML = `
        <div class="panel task-content">
          <h2>Re-order Paragraphs</h2>
          <p class="instruction">Drag the paragraphs into the correct order.</p>
          <ul class="reorder-list" id="list">
            ${shuffled.map(({ i, p }) => `
              <li class="reorder-item" draggable="true" data-i="${i}">
                <span class="muted">≡</span> ${escapeHtml(p)}
              </li>
            `).join("")}
          </ul>
          <button class="primary" id="submit">Submit</button>
        </div>
      `;
      const list = host.querySelector("#list");
      let dragEl = null;
      list.addEventListener("dragstart", (e) => {
        dragEl = e.target.closest(".reorder-item");
        dragEl?.classList.add("dragging");
      });
      list.addEventListener("dragend", () => {
        dragEl?.classList.remove("dragging");
        dragEl = null;
      });
      list.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (!dragEl) return;
        const target = e.target.closest(".reorder-item");
        if (!target || target === dragEl) return;
        const rect = target.getBoundingClientRect();
        const before = (e.clientY - rect.top) < rect.height / 2;
        list.insertBefore(dragEl, before ? target : target.nextSibling);
      });

      const cd = countdown(180);
      cd.promise.then((r) => { if (r === "done") submit(); });

      function submit() {
        cd.cancel(); clearTimer();
        const order = [...list.querySelectorAll(".reorder-item")].map((li) => parseInt(li.dataset.i));
        const score = scoreReorder(order, correctOrder);
        // Show correct order
        const wrap = document.createElement("div");
        wrap.innerHTML = `<h3>Correct order:</h3>` +
          item.paragraphs.map((p, i) => `<div class="passage"><strong>${i + 1}.</strong> ${escapeHtml(p)}</div>`).join("");
        host.querySelector(".task-content").appendChild(wrap);
        host.querySelector("#submit").disabled = true;
        resolve({ item, order, correctOrder, score });
      }
      host.querySelector("#submit").addEventListener("click", submit);
    });
  },

  async readingFillBlanks(host) {
    const item = pick("readingFillBlanks", CONTENT.readingFillBlanks);
    return new Promise((resolve) => {
      // Render text with drop targets and a word bank below
      let blankIdx = 0;
      const textHTML = item.text.map((seg) => {
        if (typeof seg === "string") return escapeHtml(seg);
        const i = blankIdx++;
        return `<span class="blank-drop-target" data-blank="${i}"></span>`;
      }).join("");
      const bankHTML = item.bank
        .map((w, i) => `<span class="word-chip" draggable="true" data-word="${escapeHtml(w)}" data-id="bank-${i}">${escapeHtml(w)}</span>`)
        .join("");

      host.innerHTML = `
        <div class="panel task-content">
          <h2>Reading — Fill in the Blanks</h2>
          <p class="instruction">Drag the correct word from the bank into each blank.</p>
          <div class="passage">${textHTML}</div>
          <div class="word-bank" id="bank">${bankHTML}</div>
          <button class="primary" id="submit" style="margin-top:12px;">Submit</button>
        </div>
      `;

      const targets = host.querySelectorAll(".blank-drop-target");
      const bank = host.querySelector("#bank");
      const chips = host.querySelectorAll(".word-chip");

      let dragWord = null, dragChip = null;
      function attachChipDrag(chip) {
        chip.addEventListener("dragstart", (e) => {
          dragWord = chip.dataset.word;
          dragChip = chip;
          chip.classList.add("dragging");
        });
        chip.addEventListener("dragend", () => {
          chip.classList.remove("dragging");
        });
      }
      chips.forEach(attachChipDrag);

      targets.forEach((t) => {
        t.addEventListener("dragover", (e) => { e.preventDefault(); t.classList.add("over"); });
        t.addEventListener("dragleave", () => t.classList.remove("over"));
        t.addEventListener("drop", (e) => {
          e.preventDefault();
          t.classList.remove("over");
          if (!dragWord) return;
          // If target had something, return it to the bank
          const existing = t.dataset.word;
          if (existing) {
            const chip = document.createElement("span");
            chip.className = "word-chip";
            chip.draggable = true;
            chip.dataset.word = existing;
            chip.textContent = existing;
            attachChipDrag(chip);
            bank.appendChild(chip);
          }
          t.textContent = dragWord;
          t.dataset.word = dragWord;
          t.classList.add("filled");
          dragChip?.remove();
          dragWord = null;
          dragChip = null;
        });
        t.addEventListener("click", () => {
          // Click filled target to return word
          if (!t.dataset.word) return;
          const chip = document.createElement("span");
          chip.className = "word-chip";
          chip.draggable = true;
          chip.dataset.word = t.dataset.word;
          chip.textContent = t.dataset.word;
          attachChipDrag(chip);
          bank.appendChild(chip);
          t.textContent = "";
          delete t.dataset.word;
          t.classList.remove("filled");
        });
      });

      const cd = countdown(150);
      cd.promise.then((r) => { if (r === "done") submit(); });

      function submit() {
        cd.cancel(); clearTimer();
        const answers = [...targets].map((t) => t.dataset.word || "");
        const score = scoreFillBlanks(answers, item.correct);
        targets.forEach((t, i) => {
          if ((t.dataset.word || "") === item.correct[i]) t.style.background = "#d6f0d6";
          else t.style.background = "#f6d6d6";
        });
        host.querySelector("#submit").disabled = true;
        resolve({ item, answers, score });
      }
      host.querySelector("#submit").addEventListener("click", submit);
    });
  },

  async readingMCSA(host) {
    const item = pick("readingMCSA", CONTENT.readingMCSA);
    return new Promise((resolve) => {
      const opts = item.options.map((o, i) => `
        <label class="mcq-option" data-i="${i}">
          <input type="radio" name="r" value="${i}" />
          <span>${escapeHtml(o)}</span>
        </label>
      `).join("");
      host.innerHTML = `
        <div class="panel task-content">
          <h2>Multiple Choice — Single Answer</h2>
          <p class="instruction">Read the passage and select the best answer.</p>
          <div class="passage">${escapeHtml(item.passage)}</div>
          <p><strong>${escapeHtml(item.question)}</strong></p>
          ${opts}
          <button class="primary" id="submit" style="margin-top:12px;">Submit</button>
        </div>
      `;
      host.querySelectorAll(".mcq-option").forEach((opt) => {
        opt.addEventListener("click", () => {
          opt.querySelector("input").checked = true;
          host.querySelectorAll(".mcq-option").forEach((o) => o.classList.remove("selected"));
          opt.classList.add("selected");
        });
      });

      const cd = countdown(90);
      cd.promise.then((r) => { if (r === "done") submit(); });

      function submit() {
        cd.cancel(); clearTimer();
        const sel = host.querySelector("input:checked");
        const selectedIdx = sel ? parseInt(sel.value) : -1;
        const score = scoreMCSA(selectedIdx, item.correct);
        host.querySelectorAll(".mcq-option").forEach((opt) => {
          const i = parseInt(opt.dataset.i);
          if (i === item.correct) opt.classList.add("correct");
          else if (i === selectedIdx) opt.classList.add("incorrect");
        });
        host.querySelector("#submit").disabled = true;
        resolve({ item, selectedIdx, score });
      }
      host.querySelector("#submit").addEventListener("click", submit);
    });
  },

  // ===== Listening =====
  async summarizeSpokenText(host) {
    const item = pick("summarizeSpokenText", CONTENT.summarizeSpokenText);
    return new Promise(async (resolve) => {
      host.innerHTML = `
        <div class="panel task-content">
          <h2>Summarize Spoken Text</h2>
          <p class="instruction">
            Listen to the audio (it plays only once), then write a 50-70 word summary.
            You can take notes in the box below while listening. 10 minutes total.
          </p>
          <p><strong>${escapeHtml(item.title)}</strong></p>
          <div id="audio-status" class="muted">▶ Playing audio…</div>
          <textarea class="essay" id="response" placeholder="Take notes here while listening, then write your 50-70 word summary…"></textarea>
          <div class="word-count"><span id="wc">0</span> words</div>
          <div class="row" style="margin-top:12px;">
            <button class="primary" id="submit">Submit for scoring</button>
            <span class="spacer"></span>
            <span id="submit-status" class="small muted"></span>
          </div>
        </div>
      `;
      const ta = host.querySelector("#response");
      const wc = host.querySelector("#wc");
      const submitBtn = host.querySelector("#submit");
      const statusEl = host.querySelector("#submit-status");
      ta.addEventListener("input", () => { wc.textContent = wordCount(ta.value); });
      ta.focus();

      const cd = countdown(600);
      cd.promise.then((r) => { if (r === "done") submit(); });

      // Audio plays once, in parallel with the typing window. Mirrors the
      // real PTE where you only hear it once but timing is on you.
      speak(item.transcript).then(() => {
        host.querySelector("#audio-status").textContent = "✓ Audio finished. Finish your summary and submit.";
      });

      let submitting = false;
      async function submit() {
        if (submitting) return;
        submitting = true;
        cd.cancel(); clearTimer();
        submitBtn.disabled = true;
        statusEl.textContent = "Scoring…";
        const summary = ta.value.trim();
        try {
          const score = await scoreSummarizeSpokenText({
            originalTranscript: item.transcript, summary,
          });
          resolve({ item, summary, score });
        } catch (e) {
          // Re-enable so user can retry (e.g. if API key was wrong)
          submitting = false;
          submitBtn.disabled = false;
          statusEl.textContent = "Scoring failed: " + (e.message || "unknown error") + " — click Submit to retry.";
        }
      }
      submitBtn.addEventListener("click", submit);
    });
  },

  async listeningMCMA(host) {
    const item = pick("listeningMCMA", CONTENT.listeningMCMA);
    return new Promise(async (resolve) => {
      const opts = item.options.map((o, i) => `
        <label class="mcq-option" data-i="${i}">
          <input type="checkbox" value="${i}" disabled />
          <span>${escapeHtml(o)}</span>
        </label>
      `).join("");
      host.innerHTML = `
        <div class="panel task-content">
          <h2>Listening — Multiple Choice, Multiple Answers</h2>
          <p class="instruction">Listen carefully, then select all correct answers.</p>
          <p><strong>${escapeHtml(item.title)}</strong></p>
          <div id="audio-status" class="muted">▶ Playing audio…</div>
          <p style="margin-top:12px;"><strong>${escapeHtml(item.question)}</strong></p>
          ${opts}
          <button class="primary" id="submit" style="margin-top:12px;" disabled>Submit</button>
        </div>
      `;
      await speak(item.transcript);
      host.querySelector("#audio-status").textContent = "✓ Audio finished.";
      host.querySelectorAll(".mcq-option input").forEach((cb) => { cb.disabled = false; });
      host.querySelector("#submit").disabled = false;

      host.querySelectorAll(".mcq-option").forEach((opt) => {
        opt.addEventListener("click", (e) => {
          if (e.target.tagName !== "INPUT") {
            const cb = opt.querySelector("input");
            cb.checked = !cb.checked;
          }
          opt.classList.toggle("selected", opt.querySelector("input").checked);
        });
      });

      const cd = countdown(90);
      cd.promise.then((r) => { if (r === "done") submit(); });

      function submit() {
        cd.cancel(); clearTimer();
        const selected = [...host.querySelectorAll("input:checked")].map((cb) => parseInt(cb.value));
        const score = scoreMCMA(selected, item.correct);
        host.querySelectorAll(".mcq-option").forEach((opt) => {
          const i = parseInt(opt.dataset.i);
          if (item.correct.includes(i)) opt.classList.add("correct");
          else if (selected.includes(i)) opt.classList.add("incorrect");
        });
        host.querySelector("#submit").disabled = true;
        resolve({ item, selected, score });
      }
      host.querySelector("#submit").addEventListener("click", submit);
    });
  },

  async listeningFillBlanks(host) {
    const item = pick("listeningFillBlanks", CONTENT.listeningFillBlanks);
    return new Promise(async (resolve) => {
      // Render template with <input> for each ____
      const parts = item.template.split("_____");
      const html = parts.map((p, i) => {
        return escapeHtml(p) + (i < parts.length - 1 ? `<input type="text" class="blank-input" data-blank="${i}" style="border:1px solid #ccc; border-radius:3px; padding:2px 6px; min-width:100px; margin:0 4px;" />` : "");
      }).join("");

      host.innerHTML = `
        <div class="panel task-content">
          <h2>Listening — Fill in the Blanks</h2>
          <p class="instruction">Listen and type the missing words.</p>
          <p><strong>${escapeHtml(item.title)}</strong></p>
          <div id="audio-status" class="muted">▶ Playing audio…</div>
          <div class="passage" style="line-height:2;">${html}</div>
          <button class="primary" id="submit" disabled>Submit</button>
        </div>
      `;
      await speak(item.transcript);
      host.querySelector("#audio-status").textContent = "✓ Audio finished.";
      host.querySelector("#submit").disabled = false;
      host.querySelector(".blank-input")?.focus();

      const cd = countdown(60);
      cd.promise.then((r) => { if (r === "done") submit(); });

      function submit() {
        cd.cancel(); clearTimer();
        const answers = [...host.querySelectorAll(".blank-input")].map((i) => i.value.trim());
        const score = scoreFillBlanks(answers, item.correct);
        host.querySelectorAll(".blank-input").forEach((inp, i) => {
          if (inp.value.trim().toLowerCase() === item.correct[i].toLowerCase()) inp.style.background = "#d6f0d6";
          else inp.style.background = "#f6d6d6";
        });
        host.querySelector("#submit").disabled = true;
        resolve({ item, answers, score });
      }
      host.querySelector("#submit").addEventListener("click", submit);
    });
  },

  async highlightCorrectSummary(host) {
    const item = pick("highlightCorrectSummary", CONTENT.highlightCorrectSummary);
    return new Promise(async (resolve) => {
      const opts = item.options.map((o, i) => `
        <label class="mcq-option" data-i="${i}">
          <input type="radio" name="r" value="${i}" disabled />
          <span>${escapeHtml(o)}</span>
        </label>
      `).join("");
      host.innerHTML = `
        <div class="panel task-content">
          <h2>Highlight Correct Summary</h2>
          <p class="instruction">Listen to the audio, then choose the best summary.</p>
          <p><strong>${escapeHtml(item.title)}</strong></p>
          <div id="audio-status" class="muted">▶ Playing audio…</div>
          ${opts}
          <button class="primary" id="submit" style="margin-top:12px;" disabled>Submit</button>
        </div>
      `;
      await speak(item.transcript);
      host.querySelector("#audio-status").textContent = "✓ Audio finished.";
      host.querySelectorAll(".mcq-option input").forEach((r) => { r.disabled = false; });
      host.querySelector("#submit").disabled = false;
      host.querySelectorAll(".mcq-option").forEach((opt) => {
        opt.addEventListener("click", () => {
          opt.querySelector("input").checked = true;
          host.querySelectorAll(".mcq-option").forEach((o) => o.classList.remove("selected"));
          opt.classList.add("selected");
        });
      });

      const cd = countdown(90);
      cd.promise.then((r) => { if (r === "done") submit(); });

      function submit() {
        cd.cancel(); clearTimer();
        const sel = host.querySelector("input:checked");
        const selectedIdx = sel ? parseInt(sel.value) : -1;
        const score = scoreMCSA(selectedIdx, item.correct);
        host.querySelectorAll(".mcq-option").forEach((opt) => {
          const i = parseInt(opt.dataset.i);
          if (i === item.correct) opt.classList.add("correct");
          else if (i === selectedIdx) opt.classList.add("incorrect");
        });
        host.querySelector("#submit").disabled = true;
        resolve({ item, selectedIdx, score });
      }
      host.querySelector("#submit").addEventListener("click", submit);
    });
  },

  async listeningMCSA(host) {
    const item = pick("listeningMCSA", CONTENT.listeningMCSA);
    return new Promise(async (resolve) => {
      const opts = item.options.map((o, i) => `
        <label class="mcq-option" data-i="${i}">
          <input type="radio" name="r" value="${i}" disabled />
          <span>${escapeHtml(o)}</span>
        </label>
      `).join("");
      host.innerHTML = `
        <div class="panel task-content">
          <h2>Listening — Multiple Choice, Single Answer</h2>
          <p class="instruction">Listen, then pick the single best answer.</p>
          <p><strong>${escapeHtml(item.title)}</strong></p>
          <div id="audio-status" class="muted">▶ Playing audio…</div>
          <p style="margin-top:12px;"><strong>${escapeHtml(item.question)}</strong></p>
          ${opts}
          <button class="primary" id="submit" style="margin-top:12px;" disabled>Submit</button>
        </div>
      `;
      await speak(item.transcript);
      host.querySelector("#audio-status").textContent = "✓ Audio finished.";
      host.querySelectorAll(".mcq-option input").forEach((r) => { r.disabled = false; });
      host.querySelector("#submit").disabled = false;
      host.querySelectorAll(".mcq-option").forEach((opt) => {
        opt.addEventListener("click", () => {
          opt.querySelector("input").checked = true;
          host.querySelectorAll(".mcq-option").forEach((o) => o.classList.remove("selected"));
          opt.classList.add("selected");
        });
      });

      const cd = countdown(60);
      cd.promise.then((r) => { if (r === "done") submit(); });

      function submit() {
        cd.cancel(); clearTimer();
        const sel = host.querySelector("input:checked");
        const selectedIdx = sel ? parseInt(sel.value) : -1;
        const score = scoreMCSA(selectedIdx, item.correct);
        host.querySelectorAll(".mcq-option").forEach((opt) => {
          const i = parseInt(opt.dataset.i);
          if (i === item.correct) opt.classList.add("correct");
          else if (i === selectedIdx) opt.classList.add("incorrect");
        });
        host.querySelector("#submit").disabled = true;
        resolve({ item, selectedIdx, score });
      }
      host.querySelector("#submit").addEventListener("click", submit);
    });
  },

  async selectMissingWord(host) {
    const item = pick("selectMissingWord", CONTENT.selectMissingWord);
    return new Promise(async (resolve) => {
      const opts = item.options.map((o, i) => `
        <label class="mcq-option" data-i="${i}">
          <input type="radio" name="r" value="${i}" disabled />
          <span>${escapeHtml(o)}</span>
        </label>
      `).join("");
      host.innerHTML = `
        <div class="panel task-content">
          <h2>Select Missing Word</h2>
          <p class="instruction">The last word of the audio is replaced with a beep. Choose the missing word.</p>
          <p><strong>${escapeHtml(item.title)}</strong></p>
          <div id="audio-status" class="muted">▶ Playing audio…</div>
          ${opts}
          <button class="primary" id="submit" style="margin-top:12px;" disabled>Submit</button>
        </div>
      `;
      await speak(item.transcript);
      // Simulate beep with a short oscillator tone
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        gain.gain.value = 0.1;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        setTimeout(() => { osc.stop(); ctx.close(); }, 350);
      } catch (_) {}
      host.querySelector("#audio-status").textContent = "✓ Audio finished.";
      host.querySelectorAll(".mcq-option input").forEach((r) => { r.disabled = false; });
      host.querySelector("#submit").disabled = false;
      host.querySelectorAll(".mcq-option").forEach((opt) => {
        opt.addEventListener("click", () => {
          opt.querySelector("input").checked = true;
          host.querySelectorAll(".mcq-option").forEach((o) => o.classList.remove("selected"));
          opt.classList.add("selected");
        });
      });

      const cd = countdown(30);
      cd.promise.then((r) => { if (r === "done") submit(); });

      function submit() {
        cd.cancel(); clearTimer();
        const sel = host.querySelector("input:checked");
        const selectedIdx = sel ? parseInt(sel.value) : -1;
        const score = scoreMCSA(selectedIdx, item.correct);
        host.querySelectorAll(".mcq-option").forEach((opt) => {
          const i = parseInt(opt.dataset.i);
          if (i === item.correct) opt.classList.add("correct");
          else if (i === selectedIdx) opt.classList.add("incorrect");
        });
        host.querySelector("#submit").disabled = true;
        resolve({ item, selectedIdx, score });
      }
      host.querySelector("#submit").addEventListener("click", submit);
    });
  },

  async highlightIncorrectWords(host) {
    const item = pick("highlightIncorrectWords", CONTENT.highlightIncorrectWords);
    // Compute which displayed words differ from spoken transcript (token-level diff).
    const spokenWords = item.spoken.split(/\s+/);
    const displayWords = item.display.split(/\s+/);
    const wrongIndices = [];
    for (let i = 0; i < displayWords.length; i++) {
      const dw = displayWords[i].replace(/[^a-zA-Z]/g, "").toLowerCase();
      const sw = (spokenWords[i] || "").replace(/[^a-zA-Z]/g, "").toLowerCase();
      if (dw !== sw) wrongIndices.push(i);
    }

    return new Promise(async (resolve) => {
      const wordHTML = displayWords.map((w, i) =>
        `<span class="transcript-word" data-i="${i}">${escapeHtml(w)}</span>`
      ).join(" ");
      host.innerHTML = `
        <div class="panel task-content">
          <h2>Highlight Incorrect Words</h2>
          <p class="instruction">Listen to the audio while reading. Click any word in the text that doesn't match what you hear.</p>
          <p><strong>${escapeHtml(item.title)}</strong></p>
          <div id="audio-status" class="muted">▶ Playing audio…</div>
          <div class="passage" style="line-height:2;">${wordHTML}</div>
          <button class="primary" id="submit" disabled>Submit</button>
        </div>
      `;

      const flagged = new Set();
      host.querySelectorAll(".transcript-word").forEach((w) => {
        w.addEventListener("click", () => {
          const i = parseInt(w.dataset.i);
          if (flagged.has(i)) { flagged.delete(i); w.classList.remove("flagged"); }
          else { flagged.add(i); w.classList.add("flagged"); }
        });
      });

      // Speak the SPOKEN (different) version so user can hear the discrepancy
      await speak(item.spoken);
      host.querySelector("#audio-status").textContent = "✓ Audio finished.";
      host.querySelector("#submit").disabled = false;

      const cd = countdown(60);
      cd.promise.then((r) => { if (r === "done") submit(); });

      function submit() {
        cd.cancel(); clearTimer();
        const score = scoreHighlightIncorrectWords([...flagged], wrongIndices);
        host.querySelectorAll(".transcript-word").forEach((w) => {
          const i = parseInt(w.dataset.i);
          if (wrongIndices.includes(i)) w.classList.add("actually-wrong");
        });
        host.querySelector("#submit").disabled = true;
        resolve({ item, flagged: [...flagged], wrongIndices, score });
      }
      host.querySelector("#submit").addEventListener("click", submit);
    });
  },

  async writeFromDictation(host) {
    const sentence = pick("writeFromDictation", CONTENT.writeFromDictation);
    return new Promise(async (resolve) => {
      host.innerHTML = `
        <div class="panel task-content">
          <h2>Write from Dictation</h2>
          <p class="instruction">Listen carefully, then type the sentence exactly as you heard it.</p>
          <div id="audio-status" class="muted">▶ Playing audio…</div>
          <input type="text" id="response" placeholder="Type what you heard…" disabled
                 style="width:100%; padding:10px; font-size:15px; border:1px solid #ccc; border-radius:4px; margin-top:12px;" />
          <button class="primary" id="submit" style="margin-top:12px;" disabled>Submit</button>
          <div id="reveal" style="margin-top:12px;"></div>
        </div>
      `;
      await speak(sentence);
      host.querySelector("#audio-status").textContent = "✓ Audio finished. Type your answer.";
      const inp = host.querySelector("#response");
      inp.disabled = false;
      inp.focus();
      host.querySelector("#submit").disabled = false;

      const cd = countdown(40);
      cd.promise.then((r) => { if (r === "done") submit(); });

      function submit() {
        cd.cancel(); clearTimer();
        const answer = inp.value.trim();
        const score = scoreWriteFromDictation(answer, sentence);
        host.querySelector("#reveal").innerHTML =
          `<div class="passage"><strong>Correct:</strong> ${escapeHtml(sentence)}</div>`;
        host.querySelector("#submit").disabled = true;
        resolve({ item: { sentence }, answer, score });
      }
      host.querySelector("#submit").addEventListener("click", submit);
    });
  },
};

export async function runTask(taskId, host) {
  const meta = getTaskMeta(taskId);
  setTaskLabel(meta ? `${meta.section} — ${meta.name}` : taskId);
  const fn = RENDERERS[taskId];
  if (!fn) throw new Error(`No renderer for task: ${taskId}`);
  try {
    const result = await fn(host);
    setTaskLabel("");
    clearTimer();
    return result;
  } catch (e) {
    setTaskLabel("");
    clearTimer();
    stopSpeaking();
    throw e;
  }
}
