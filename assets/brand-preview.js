/* Opt-in, browser-local typography preview. No remote writes or arbitrary CSS. */
(() => {
  if (new URLSearchParams(location.search).get('brand-preview') !== '1') return;
  const key = 'bsb_brand_preview_v1';
  const fonts = {
    Cinzel: '"Cinzel", "Libre Baskerville", Georgia, serif',
    'Libre Baskerville': '"Libre Baskerville", Georgia, serif',
    Literata: '"Literata", Georgia, serif',
    Lora: '"Lora", Georgia, serif',
    'Crimson Text': '"Crimson Text", Georgia, serif',
    Inter: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    Figtree: '"Figtree", Arial, sans-serif',
    Manrope: '"Manrope", Arial, sans-serif',
    Georgia: 'Georgia, serif',
    'System sans': 'system-ui, sans-serif',
  };
  const defaults = { title: 'Cinzel', subtitle: 'Inter', weight: 900, scale: 100, spacing: 0 };
  const normalize = (value) => {
    const result = { ...defaults };
    if (!value || typeof value !== 'object') return result;
    for (const name of ['title', 'subtitle']) if (Object.hasOwn(fonts, value[name])) result[name] = value[name];
    for (const [name, min, max, step] of [['weight', 400, 900, 100], ['scale', 70, 140, 5], ['spacing', -2, 6, 0.1]]) {
      if (typeof value[name] === 'number' && Number.isFinite(value[name])) result[name] = Math.round(Math.min(max, Math.max(min, value[name])) / step) * step;
    }
    return result;
  };
  let settings;
  try { settings = normalize(JSON.parse(localStorage.getItem(key))); } catch { settings = { ...defaults }; }
  const root = document.documentElement;
  root.dataset.brandPreview = 'true';
  function apply() {
    root.style.setProperty('--brand-title-font', fonts[settings.title]);
    root.style.setProperty('--brand-subtitle-font', fonts[settings.subtitle]);
    root.style.setProperty('--preview-brand-weight', settings.weight);
    root.style.setProperty('--preview-brand-scale', settings.scale / 100);
    root.style.setProperty('--preview-brand-spacing', `${settings.spacing}px`);
  }
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    const panel = document.createElement('aside');
    panel.className = 'brand-preview-panel';
    panel.setAttribute('aria-label', 'Brand Preview');
    panel.innerHTML = `<details open><summary>Brand Preview <small>this browser only</small></summary>
      <div class="brand-preview-fields">
      <p>Changes appear only with <b>?brand-preview=1</b>. Font weights depend on the available font files.</p>
      <label>Title font <select name="title"></select></label>
      <label>Subtitle font <select name="subtitle"></select></label>
      <label>Title weight <input name="weight" type="range" min="400" max="900" step="100"><output></output></label>
      <label>Title size (%) <input name="scale" type="range" min="70" max="140" step="5"><output></output></label>
      <label>Title spacing (px) <input name="spacing" type="range" min="-2" max="6" step="0.1"><output></output></label>
      <div class="brand-preview-actions"><button type="button" data-action="replay">Replay loading</button><button type="button" data-action="copy">Copy settings</button><button type="button" data-action="reset">Reset defaults</button><button type="button" data-action="exit">Exit preview</button></div>
      <a href="./about.html?brand-preview=1">Preview About page</a> · <a href="./?brand-preview=1">Preview reader</a>
      <textarea aria-label="Settings to copy" readonly hidden></textarea><p role="status" aria-live="polite"></p>
      </div></details>`;
    document.body.append(panel);
    const status = panel.querySelector('[role="status"]');
    for (const select of panel.querySelectorAll('select')) {
      for (const name of Object.keys(fonts)) select.add(new Option(name, name));
    }
    function sync() {
      for (const control of panel.querySelectorAll('[name]')) {
        control.value = settings[control.name];
        const output = control.parentElement.querySelector('output');
        if (output) output.value = control.value;
      }
    }
    sync();
    panel.addEventListener('input', (event) => {
      const control = event.target;
      if (!Object.hasOwn(defaults, control.name)) return;
      settings = normalize({ ...settings, [control.name]: control.tagName === 'SELECT' ? control.value : Number(control.value) });
      apply(); sync();
      try { localStorage.setItem(key, JSON.stringify(settings)); status.textContent = 'Saved in this browser for preview URLs only.'; }
      catch { status.textContent = 'Preview applied. Browser storage is unavailable.'; }
    });
    panel.addEventListener('click', async (event) => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action === 'reset') {
        settings = { ...defaults }; apply(); sync();
        try { localStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
        status.textContent = 'Published defaults restored.';
      }
      if (action === 'exit') {
        const url = new URL(location.href); url.searchParams.delete('brand-preview'); location.href = url.href;
      }
      if (action === 'copy') {
        const text = `Brand Preview\n${JSON.stringify(settings, null, 2)}\nTitle stack: ${fonts[settings.title]}\nSubtitle stack: ${fonts[settings.subtitle]}`;
        const field = panel.querySelector('textarea'); field.value = text;
        try { await navigator.clipboard.writeText(text); status.textContent = 'Settings copied.'; }
        catch { field.hidden = false; field.focus(); field.select(); status.textContent = 'Select and copy these settings.'; }
      }
      if (action === 'replay' && !document.querySelector('.brand-preview-loading')) {
        const overlay = document.createElement('dialog');
        overlay.className = 'brand-preview-loading';
        overlay.innerHTML = `<div class="loading-card"><img class="loading-logo-mark" src="./assets/brand-mark.png?v=20260713-polished" width="420" height="220" alt=""><h1>Big Screen Bible</h1><div class="loading-spinner" aria-hidden="true"></div><p>Loading full Bible texts...</p><button type="button" autofocus>Close preview</button></div>`;
        document.body.append(overlay);
        overlay.querySelector('button').onclick = () => overlay.close();
        overlay.addEventListener('close', () => overlay.remove());
        overlay.showModal();
      }
    });
  }, { once: true });
})();
