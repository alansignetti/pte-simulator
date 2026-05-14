// TTS (text-to-speech) for Listening tasks and audio recording for Speaking.

const VOICE_KEY = "pte_voice_name";
const RATE_KEY = "pte_voice_rate";

export function getVoices() {
  return new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    if (voices && voices.length) return resolve(voices);
    speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
  });
}

export async function getEnglishVoices() {
  const all = await getVoices();
  return all.filter((v) => v.lang.startsWith("en"));
}

export function getPreferredVoiceName() {
  return localStorage.getItem(VOICE_KEY) || "";
}

export function setPreferredVoiceName(name) {
  localStorage.setItem(VOICE_KEY, name);
}

export function getRate() {
  return parseFloat(localStorage.getItem(RATE_KEY) || "1.0");
}

export function setRate(r) {
  localStorage.setItem(RATE_KEY, String(r));
}

export async function speak(text, { onEnd, voiceName } = {}) {
  return new Promise(async (resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    const voices = await getVoices();
    const preferred =
      voiceName || getPreferredVoiceName() || "Karen" || "Daniel" || "Samantha";
    const match = voices.find((v) => v.name === preferred) ||
                  voices.find((v) => v.lang.startsWith("en-AU")) ||
                  voices.find((v) => v.lang.startsWith("en-GB")) ||
                  voices.find((v) => v.lang.startsWith("en"));
    if (match) u.voice = match;
    u.rate = getRate();
    u.onend = () => {
      onEnd?.();
      resolve();
    };
    u.onerror = () => resolve();
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  speechSynthesis.cancel();
}

// Returns null if microphone access is available, or an explanatory string
// if it's blocked by the browser context (file://, non-localhost HTTP, etc).
// Use this for pre-flight checks before starting a Speaking task.
export function micUnavailableReason() {
  if (window.isSecureContext === false) {
    return (
      "Your browser is blocking microphone access because the page isn't a secure context. " +
      "Speaking tasks need either HTTPS or http://localhost. " +
      "If you opened the file directly (file://), start a local server instead: " +
      "`cd pte-simulator && python3 -m http.server 8080` and open http://localhost:8080."
    );
  }
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
    return (
      "Microphone access is not available in this browser context. " +
      "Make sure you're on http://localhost or HTTPS, and using Chrome / Edge / Brave / Arc. " +
      "Firefox does not support the Speech Recognition API required for transcription."
    );
  }
  return null;
}

// Audio recorder for Speaking tasks. Returns { start, stop, getBlob }.
// Also captures live audio levels so the UI can show a meter.
export async function createRecorder({ onLevel } = {}) {
  const reason = micUnavailableReason();
  if (reason) throw new Error(reason);

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
      throw new Error(
        "You denied microphone access. To enable it: click the 🔒 icon next to the URL " +
        "in your browser's address bar, set Microphone to 'Allow', and reload the page. " +
        "On macOS also check System Settings → Privacy & Security → Microphone."
      );
    }
    if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
      throw new Error("No microphone detected. Plug one in and reload the page.");
    }
    throw new Error("Could not access the microphone: " + e.message);
  }
  const mr = new MediaRecorder(stream);
  const chunks = [];
  mr.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  // Audio level meter via Web Audio API
  let levelTimer = null;
  if (onLevel) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);
    levelTimer = setInterval(() => {
      analyser.getByteTimeDomainData(buf);
      let max = 0;
      for (const v of buf) max = Math.max(max, Math.abs(v - 128));
      onLevel(max / 128);
    }, 80);
  }

  let blob = null;
  return {
    start() {
      chunks.length = 0;
      mr.start();
    },
    async stop() {
      return new Promise((resolve) => {
        mr.onstop = () => {
          blob = new Blob(chunks, { type: "audio/webm" });
          stream.getTracks().forEach((t) => t.stop());
          if (levelTimer) clearInterval(levelTimer);
          resolve(blob);
        };
        mr.stop();
      });
    },
    getBlob: () => blob,
  };
}

// Web Speech Recognition (Chrome/Safari) running alongside MediaRecorder.
// Auto-restarts if the engine ends prematurely on silence — Chrome closes
// the session after ~3-5s of no speech, but we want to keep capturing
// until the task explicitly stops.
export function createSpeechRecognizer({ lang = "en-US", onFinal, onInterim } = {}) {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) {
    return {
      start() {},
      stop() {},
      getTranscript: () => "",
      unsupported: true,
    };
  }
  const rec = new Rec();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = lang;

  let finalText = "";
  let shouldKeepRunning = false;

  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) {
        finalText += r[0].transcript + " ";
        onFinal?.(r[0].transcript);
      } else {
        interim += r[0].transcript;
      }
    }
    if (interim) onInterim?.(interim);
  };
  rec.onerror = (e) => {
    // "no-speech" and "aborted" are recoverable — onend will restart.
    if (e.error && e.error !== "no-speech" && e.error !== "aborted") {
      shouldKeepRunning = false;
    }
  };
  rec.onend = () => {
    if (!shouldKeepRunning) return;
    // Restart on next tick to avoid InvalidStateError.
    setTimeout(() => {
      if (shouldKeepRunning) {
        try { rec.start(); } catch (_) {}
      }
    }, 100);
  };

  return {
    start() {
      shouldKeepRunning = true;
      try { rec.start(); } catch (_) {}
    },
    stop() {
      shouldKeepRunning = false;
      try { rec.stop(); } catch (_) {}
    },
    getTranscript: () => finalText.trim(),
    unsupported: false,
  };
}
