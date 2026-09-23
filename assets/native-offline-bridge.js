/* BSB_NATIVE_OFFLINE_BRIDGE: injected by iOS before any app scripts. */
(() => {
  "use strict";
  const allowedOrigin = location.origin === "https://bigscreenbible.com"
    || (location.protocol === "capacitor:" && location.hostname === "localhost");
  if (!allowedOrigin || window.top !== window) return;
  const seed = __BSB_OFFLINE_SEED__;
  const manifest = __BSB_OFFLINE_MANIFEST__;
  const handler = window.webkit.messageHandlers.bsbOffline;
  // Authentication tokens stay in their original WebKit origin. Only app data
  // crosses origins; account ownership and per-account snapshots travel together.
  const shared = key => key.startsWith("lw_") && !key.startsWith("lw_account_session:");
  const storage = window.localStorage;
  const original = Object.fromEntries(["setItem", "removeItem", "clear"].map(name => [name, Storage.prototype[name]]));
  const previous = Object.fromEntries(Object.keys(storage).filter(shared).map(key => [key, storage.getItem(key)]));
  try {
    if (seed !== null) {
      for (const key of Object.keys(storage)) if (shared(key) && !(key in seed)) original.removeItem.call(storage, key);
      for (const [key, value] of Object.entries(seed)) if (shared(key)) original.setItem.call(storage, key, value);
    }
  } catch {
    // Never replace a good native snapshot with a partially restored one.
    try {
      for (const key of Object.keys(storage)) if (shared(key)) original.removeItem.call(storage, key);
      for (const [key, value] of Object.entries(previous)) original.setItem.call(storage, key, value);
    } catch { /* Native snapshot remains authoritative on the next launch. */ }
    window.bsbOfflineStorageFailed = true;
    return;
  }
  let pending = false;
  const snapshot = () => {
    pending = false;
    const values = {};
    for (const key of Object.keys(storage)) if (shared(key)) values[key] = storage.getItem(key);
    handler.postMessage({ action: "snapshot", values });
  };
  const schedule = () => {
    if (pending) return;
    pending = true;
    queueMicrotask(snapshot);
  };
  for (const name of Object.keys(original)) {
    Storage.prototype[name] = function (...args) {
      const result = original[name].apply(this, args);
      if (this === storage && (name === "clear" || shared(String(args[0])))) schedule();
      return result;
    };
  }
  window.bsbOffline = {
    manifest,
    active: location.protocol === "capacitor:",
    open() {
      window.dispatchEvent(new Event("bsb-before-offline-navigation"));
      snapshot();
      handler.postMessage({ action: "offline" });
    },
    reconnect() {
      window.dispatchEvent(new Event("bsb-before-offline-navigation"));
      snapshot();
      handler.postMessage({ action: "reconnect" });
    },
    ready() { handler.postMessage({ action: "ready" }); },
  };
  // A loaded error/maintenance page is not a ready reader. Older live builds
  // participate too, without requiring a new web release to signal readiness.
  window.addEventListener("DOMContentLoaded", () => {
    const ready = () => Boolean(document.querySelector("#app .scripture, #app .presentation.open"));
    if (ready()) return window.bsbOffline.ready();
    const observer = new MutationObserver(() => {
      if (!ready()) return;
      observer.disconnect();
      window.bsbOffline.ready();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }, { once: true });
  window.addEventListener("pagehide", snapshot);
  window.addEventListener("offline", () => {
    if (!window.bsbOffline.active) window.bsbOffline.open();
  });
  schedule();
})();
