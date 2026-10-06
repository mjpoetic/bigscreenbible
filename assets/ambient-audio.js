/* Ambient playback is opt-in and independent of Scripture rerenders. */
(() => {
  "use strict";
  const catalog = Object.freeze([
    { key: "rain", name: "Gentle rain", src: "./assets/audio/ambient/rain.mp3", seconds: 23, credit: "Rain recording by Ylmir · CC0" },
    { key: "ocean", name: "Ocean waves", src: "./assets/audio/ambient/ocean.mp3", seconds: 56, credit: "Ocean recording by SamsterBirdies · CC0" },
    { key: "brown", name: "Brown noise", credit: "A deep, soft noise generated on your device" },
    { key: "pink", name: "Pink noise", credit: "A balanced noise generated on your device" },
    { key: "white", name: "White noise", credit: "A brighter noise generated on your device" },
    { key: "piano", name: "Peaceful piano", src: "./assets/audio/ambient/peaceful-piano.mp3", seconds: 96, music: true, credit: "Original instrumental for Big Screen Bible" },
    { key: "grace", name: "Amazing Grace · Lo-fi", src: "./assets/audio/ambient/grace-lofi.mp3", seconds: 87.27271875, music: true, credit: "Original arrangement of the traditional hymn tune NEW BRITAIN" },
  ]);
  const storageKey = "bsb_ambient_preferences_v1";
  const percent = (v, fallback) => Number.isFinite(Number(v)) ? Math.max(0, Math.min(100, Number(v))) : fallback;
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(storageKey) || "{}") || {}; } catch { /* Use defaults. */ }
  const preferences = {
    sound: catalog.some(s => s.key === stored.sound) ? stored.sound : "rain",
    volume: percent(stored.volume ?? 35, 35),
    rain: percent(stored.rain ?? 0, 0),
    minutes: [0, 15, 30, 60].includes(stored.minutes) ? stored.minutes : 0,
  };
  let context = null, getContext = null, master = null;
  let playing = false, loading = false, request = 0, deadline = 0, ticker = 0;
  let message = "Ready when you are";
  const buffers = new Map();
  const voices = [];
  const selected = () => catalog.find(s => s.key === preferences.sound);
  const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(preferences)); } catch { /* Playback still works. */ } };
  const active = () => playing || loading;
  function publish() {
    syncControls();
    document.dispatchEvent(new CustomEvent("bsb-ambient-change"));
  }
  function syncControls() {
    for (const [attribute, value] of [["sound", preferences.sound], ["timer", String(preferences.minutes)]]) {
      document.querySelectorAll(`[data-ambient-${attribute}]`).forEach(select => {
        select.value = value;
        const label = select.selectedOptions[0]?.textContent.trim() || "";
        const trigger = select.closest("[data-settings-choice]")?.querySelector("[data-settings-choice-toggle]");
        if (trigger) {
          trigger.querySelector(".settings-choice-selected").textContent = label;
          trigger.setAttribute("aria-label", `${select.getAttribute("aria-label")}, ${label}`);
        }
      });
    }
    document.querySelectorAll("[data-ambient-play]").forEach(button => {
      button.textContent = active() ? (loading ? "Cancel" : "Pause") : "Play";
      button.setAttribute("aria-label", `${active() ? "Pause" : "Play"} ambient sounds`);
      button.setAttribute("aria-pressed", String(active()));
    });
    const remaining = deadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 60000)) : 0;
    const status = loading ? "Loading sound…" : playing
      ? `Playing ${selected().name}${deadline ? ` · ${remaining} min left` : ""}` : message;
    document.querySelectorAll("[data-ambient-status]").forEach(node => { if (node.textContent !== status) node.textContent = status; });
    document.querySelectorAll("[data-ambient-now]").forEach(node => {
      node.textContent = active() ? selected().name : "";
      node.hidden = !active();
    });
    document.querySelectorAll("[data-ambient-quick-pause]").forEach(node => { node.hidden = !active(); });
    document.querySelectorAll("[data-ambient-rain-group]").forEach(node => { node.hidden = !selected().music; });
    document.querySelectorAll("[data-ambient-credit]").forEach(node => { node.textContent = selected().credit; });
    for (const kind of ["volume", "rain"]) {
      document.querySelectorAll(`[data-ambient-${kind}]`).forEach(node => {
        node.value = String(preferences[kind]);
        node.setAttribute("aria-valuetext", `${preferences[kind]} percent`);
      });
      document.querySelectorAll(`[data-ambient-${kind}-output]`).forEach(node => { node.textContent = `${preferences[kind]}%`; });
    }
  }
  function clearVoices(fade = 0.18) {
    const now = context?.currentTime || 0;
    for (const voice of voices.splice(0)) {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
      voice.gain.gain.linearRampToValueAtTime(0, now + fade);
      voice.source.stop(now + fade);
      voice.source.onended = () => { voice.source.disconnect(); voice.gain.disconnect(); };
    }
  }
  function pause(reason = "Paused") {
    request++;
    playing = false;
    loading = false;
    deadline = 0;
    clearInterval(ticker);
    ticker = 0;
    clearVoices();
    message = reason;
    publish();
  }
  function noiseBuffer(kind) {
    const buffer = context.createBuffer(1, Math.round(context.sampleRate * 12), context.sampleRate);
    const samples = buffer.getChannelData(0);
    let brown = 0, b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < samples.length; i++) {
      const white = Math.random() * 2 - 1;
      brown = (brown + white * 0.025) / 1.025;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      samples[i] = kind === "brown" ? brown * 3.5 : kind === "pink" ? (b0 + b1 + b2 + white * 0.1848) * 0.08 : white * 0.22;
    }
    // Remove the join discontinuity without a silent gap.
    const seam = Math.min(512, samples.length / 2);
    const last = samples[samples.length - 1];
    for (let i = 0; i < seam; i++) samples[i] = last * (1 - i / seam) + samples[i] * i / seam;
    return balanceBuffer(buffer);
  }
  function balanceBuffer(buffer) {
    let energy = 0, peak = 0;
    for (let c = 0; c < buffer.numberOfChannels; c++) for (const value of buffer.getChannelData(c)) {
      energy += value * value;
      peak = Math.max(peak, Math.abs(value));
    }
    const rms = Math.sqrt(energy / (buffer.length * buffer.numberOfChannels));
    if (rms > 0) {
      const scale = Math.min(0.065 / rms, 0.7 / peak);
      for (let c = 0; c < buffer.numberOfChannels; c++) {
        const samples = buffer.getChannelData(c);
        for (let i = 0; i < samples.length; i++) samples[i] *= scale;
      }
    }
    return buffer;
  }
  async function bufferFor(sound) {
    if (!buffers.has(sound.key)) {
      const promise = sound.src ? (async () => {
        const response = await fetch(sound.src);
        if (!response.ok) throw new Error("Sound could not be loaded");
        const decoded = await context.decodeAudioData(await response.arrayBuffer());
        // MP3 decoder padding must never become part of the loop clock.
        const length = Math.min(decoded.length, Math.round(sound.seconds * decoded.sampleRate));
        const buffer = context.createBuffer(decoded.numberOfChannels, length, decoded.sampleRate);
        for (let c = 0; c < decoded.numberOfChannels; c++) {
          const channel = buffer.getChannelData(c);
          channel.set(decoded.getChannelData(c).subarray(0, length));
          const last = channel[length - 1];
          for (let i = 0; i < 128; i++) channel[i] = last * (1 - i / 128) + channel[i] * i / 128;
        }
        return balanceBuffer(buffer);
      })() : Promise.resolve(noiseBuffer(sound.key));
      buffers.set(sound.key, promise);
      promise.catch(() => buffers.delete(sound.key));
    }
    return buffers.get(sound.key);
  }
  function addVoice(buffer, layer, level) {
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    source.loopEnd = buffer.duration;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(level, context.currentTime + 0.5);
    source.connect(gain);
    gain.connect(master);
    source.start();
    voices.push({ source, gain, layer });
  }
  function scheduleVolume() {
    if (!master || !context) return;
    const now = context.currentTime;
    const level = preferences.volume / 100;
    master.gain.cancelScheduledValues(now);
    // Recompute from wall time so volume changes cannot cancel the sleep fade.
    const secondsLeft = deadline ? Math.max(0, (deadline - Date.now()) / 1000) : Infinity;
    master.gain.setValueAtTime(level * Math.min(1, secondsLeft / 10), now);
    if (deadline) {
      if (secondsLeft > 10) master.gain.setValueAtTime(level, now + secondsLeft - 10);
      master.gain.linearRampToValueAtTime(0, now + secondsLeft);
    }
    for (const voice of voices) if (voice.layer === "rain") {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(preferences.rain / 100, now, 0.1);
    }
  }
  function resetTimer() {
    deadline = playing && preferences.minutes ? Date.now() + preferences.minutes * 60000 : 0;
    scheduleVolume();
    syncControls();
  }
  async function play(keepTimer = false) {
    if (document.hidden) return;
    const previousDeadline = keepTimer ? deadline : 0;
    const token = ++request;
    clearVoices();
    playing = false;
    loading = true;
    publish();
    try {
      if (!context || context.state === "closed") {
        const Constructor = window.AudioContext || window.webkitAudioContext;
        context = getContext?.() || (Constructor ? new Constructor() : null);
        if (!context) throw new Error("Audio is unavailable");
        master = context.createGain();
        master.connect(context.destination);
        context.addEventListener("statechange", () => {
          if (playing && context.state !== "running") pause("Audio interrupted · press Play to resume");
        });
      }
      // Resume immediately inside the initiating user gesture, before loading files.
      await context.resume();
      const sound = selected();
      const [primary, rain] = await Promise.all([
        bufferFor(sound), sound.music ? bufferFor(catalog[0]) : Promise.resolve(null),
      ]);
      if (token !== request || document.hidden) return;
      if (context.state !== "running") throw new Error("Audio interrupted");
      playing = true;
      loading = false;
      addVoice(primary, "primary", 1);
      if (rain) addVoice(rain, "rain", preferences.rain / 100);
      if (previousDeadline) { deadline = previousDeadline; scheduleVolume(); }
      else resetTimer();
      clearInterval(ticker);
      ticker = setInterval(() => {
        if (deadline && Date.now() >= deadline) pause("Sleep timer finished");
        else syncControls();
      }, 1000);
      publish();
    } catch {
      if (token === request) pause("Unable to play this sound · try again");
    }
  }
  document.addEventListener("click", event => {
    if (event.target.closest?.("[data-ambient-play]")) { if (active()) pause(); else play(); }
    if (event.target.closest?.("[data-ambient-quick-pause]")) pause();
  });
  document.addEventListener("change", event => {
    if (event.target.matches?.("[data-ambient-sound]")) {
      if (!catalog.some(s => s.key === event.target.value)) return;
      preferences.sound = event.target.value;
      save();
      if (active()) play(true); else syncControls();
    }
    if (event.target.matches?.("[data-ambient-timer]")) {
      const value = Number(event.target.value);
      preferences.minutes = [0, 15, 30, 60].includes(value) ? value : 0;
      save();
      resetTimer();
    }
  });
  document.addEventListener("input", event => {
    for (const kind of ["volume", "rain"]) if (event.target.matches?.(`[data-ambient-${kind}]`)) {
      preferences[kind] = percent(event.target.value, preferences[kind]);
      save();
      scheduleVolume();
      syncControls();
    }
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden && active()) pause("Paused while away · press Play to resume"); });
  window.addEventListener("pagehide", () => { if (active()) pause(); });
  window.bsbAmbient = Object.freeze({
    catalog, preferences, selected, active, play, pause, syncControls,
    configure(options) { getContext = options.getContext; },
  });
})();
