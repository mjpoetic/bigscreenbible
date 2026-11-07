/* Website and native shells all enter the same review and saved-list workflow. */
(() => {
  const storageKey = 'lw_imported_passages_v1';
  if ('serviceWorker' in navigator && !window.Capacitor?.isNativePlatform?.()) {
    navigator.serviceWorker.register('./push-sw.js', { scope: './' }).catch(() => {});
  }
  let dialog, review = [], opener, generation = 0;
  let previewLoads = 0;
  const previewWaiters = [];
  const listPositions = new Map();
  const esc = value => escapeHtml(String(value));
  function readLists() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(saved) ? saved.filter(item => item && typeof item.id === 'string' && typeof item.title === 'string' && Array.isArray(item.refs)).slice(0, 100) : [];
    } catch { return []; }
  }
  function writeLists(lists) {
    try { localStorage.setItem(storageKey, JSON.stringify(lists)); return true; }
    catch { showToast('The passage list could not be saved. Device storage may be full.'); return false; }
  }
  function shell(title) {
    generation++;
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'passage-import-dialog';
      dialog.setAttribute('aria-labelledby', 'passageImportHeading');
      document.body.append(dialog);
      dialog.addEventListener('close', () => opener?.isConnected && opener.focus());
      dialog.addEventListener('keydown', event => event.stopPropagation());
    }
    if (!dialog.open) { opener = document.activeElement; dialog.showModal(); }
    dialog.innerHTML = `<header><h2 id="passageImportHeading">${esc(title)}</h2><button type="button" class="ghost-btn" data-import-close aria-label="Close imported passages">Close</button></header><div class="passage-import-body"></div>`;
    dialog.querySelector('[data-import-close]').onclick = () => dialog.close();
    dialog.querySelector('[data-import-close]').focus();
    dialog.scrollTop = 0;
    return dialog.querySelector('.passage-import-body');
  }
  function home() {
    const body = shell('Imported passages');
    body.innerHTML = `<p>Find Bible references in a devotional, message, or study text.</p><button class="primary-btn" data-import-new>Import from text</button><p class="muted">Lists are saved on this device. Your verse highlights, bookmarks, and notes use the usual app storage and sync settings.</p><div class="passage-import-saved">${readLists().map(list => `<article><button class="ghost-btn" data-import-list="${esc(list.id)}">${esc(list.title)} · ${list.refs.length} passages</button><button class="text-btn danger-text" data-import-delete="${esc(list.id)}" aria-label="Delete ${esc(list.title)}">Delete</button></article>`).join('') || '<p>No imported lists yet.</p>'}</div>`;
    body.querySelector('[data-import-new]').onclick = () => compose();
    body.querySelectorAll('[data-import-list]').forEach(button => button.onclick = () => showList(button.dataset.importList));
    body.querySelectorAll('[data-import-delete]').forEach(button => button.onclick = () => {
      if (!window.confirm('Delete this passage list? Your verse annotations will be kept.')) return;
      if (writeLists(readLists().filter(list => list.id !== button.dataset.importDelete))) home();
    });
  }
  function compose(text) {
    const body = shell('Import from text');
    let draft = {};
    try { draft = JSON.parse(localStorage.getItem('lw_passage_import_draft') || '{}'); } catch {}
    body.innerHTML = `<label>List name<input id="passageImportTitle" maxlength="120" placeholder="My devotional passages"></label><label>Devotional or study text<textarea id="passageImportText" rows="9" maxlength="100000" placeholder="Paste text containing references such as Luke 1:37"></textarea></label><div class="passage-import-actions"><button class="primary-btn" data-import-find>Find passages</button><button class="ghost-btn" data-import-home>Saved lists</button><button class="ghost-btn" data-import-discard>Discard draft</button><label class="passage-import-file">Import a text file<input type="file" accept=".txt,text/plain" data-import-file></label></div><p role="status" data-import-status></p><div data-import-review></div>`;
    const input = body.querySelector('textarea');
    const title = body.querySelector('#passageImportTitle');
    input.value = text ?? draft.text ?? '';
    title.value = text != null ? String(text).split('\n').find(line => line.trim())?.slice(0, 120) || '' : draft.title || '';
    const remember = () => { try { localStorage.setItem('lw_passage_import_draft', JSON.stringify({ text: input.value, title: title.value })); } catch {} };
    input.oninput = () => { remember(); body.querySelector('[data-import-review]').replaceChildren(); };
    title.oninput = remember;
    body.querySelector('[data-import-home]').onclick = home;
    body.querySelector('[data-import-discard]').onclick = () => { localStorage.removeItem('lw_passage_import_draft'); compose(''); };
    body.querySelector('[data-import-file]').onchange = async event => {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 400000) { body.querySelector('[data-import-status]').textContent = 'Please choose a smaller text file.'; return; }
      try { const value = await file.text(); if (value.length > 100000) throw new Error('Please import no more than 100,000 characters.'); input.value = value; input.oninput(); }
      catch (error) { body.querySelector('[data-import-status]').textContent = error.message; }
    };
    const find = () => {
      remember();
      body.querySelector('[data-import-review]').replaceChildren();
      if (dataLoading || !Object.keys(bibleData).length) { body.querySelector('[data-import-status]').textContent = 'Bible data is still loading. Please try again in a moment.'; return; }
      try { review = BSBPassageImport.extract(input.value, bookAliases, bibleData); }
      catch (error) { body.querySelector('[data-import-status]').textContent = error.message; return; }
      body.querySelector('[data-import-status]').textContent = review.length ? `${review.length} passages found. Review references before saving.` : 'No references found. Share or paste the devotional text itself; a webpage link alone does not include its text.';
      const region = body.querySelector('[data-import-review]');
      region.innerHTML = review.map((item, index) => `<article class="passage-import-candidate"><label><input type="checkbox" data-import-select="${index}" ${item.error ? 'disabled' : 'checked'}>Include passage</label><label>Reference<input data-import-correct="${index}" value="${esc(item.ref)}" aria-describedby="importIssue${index}"></label><p id="importIssue${index}" class="muted">${esc(item.error || `${item.verses.length} ${item.verses.length === 1 ? 'verse' : 'verses'}`)}</p><div data-import-preview="${index}"></div></article>`).join('') + (review.length ? '<button class="primary-btn" data-import-save>Save passage list</button>' : '');
      region.querySelectorAll('[data-import-correct]').forEach(field => field.onchange = () => {
        const index = Number(field.dataset.importCorrect);
        let matches = [];
        try { matches = BSBPassageImport.extract(field.value, bookAliases, bibleData); } catch {}
        const item = matches.length === 1 && !matches[0].error ? matches[0] : null;
        const checkbox = region.querySelector(`[data-import-select="${index}"]`);
        checkbox.disabled = !item; checkbox.checked = Boolean(item);
        if (item) review[index] = item;
        region.querySelector(`#importIssue${index}`).textContent = item ? `${item.verses.length} verses` : 'Enter one valid reference, such as John 3:16–18.';
        const preview = region.querySelector(`[data-import-preview="${index}"]`); preview.dataset.previewRef = ""; preview.replaceChildren();
        if (item) void previewPassage(preview, item.ref, generation);
      });
      review.forEach((item, index) => { if (!item.error) void previewPassage(region.querySelector(`[data-import-preview="${index}"]`), item.ref, generation); });
      region.querySelector('[data-import-save]')?.addEventListener('click', () => {
        const refs = [...new Set([...region.querySelectorAll('[data-import-select]:checked:not(:disabled)')].map(box => review[Number(box.dataset.importSelect)].ref))];
        if (!refs.length) { body.querySelector('[data-import-status]').textContent = 'Select at least one valid passage.'; return; }
        const lists = readLists();
        if (lists.length >= 100) { body.querySelector('[data-import-status]').textContent = 'You have 100 saved lists. Delete a list before adding another.'; return; }
        const list = { id: crypto.randomUUID(), title: title.value.trim().slice(0, 120) || 'Imported passages', refs, createdAt: new Date().toISOString() };
        if (!writeLists([list, ...lists])) return;
        localStorage.removeItem('lw_passage_import_draft');
        showList(list.id);
      });
    };
    body.querySelector('[data-import-find]').onclick = find;
    input.focus();
    if (text != null) find();
  }
  async function previewPassage(target, ref, token) {
    const parsed = parsePassageReference(ref);
    if (!parsed || !target) return;
    const version = state.versions[0] || 'BSB';
    target.dataset.previewRef = ref;
    target.textContent = `Loading ${translationDisplayCode(version)}…`;
    if (previewLoads >= 3) await new Promise(resolve => previewWaiters.push(resolve));
    previewLoads++;
    try {
      if (token !== generation || !target.isConnected || target.dataset.previewRef !== ref) return;
      if (isRemoteTranslation(version)) await ensureRemoteBibleVersion(version, parsed.key, { rerender: false });
      else { await loadBibleVersion(version); rebuildBibleData(); }
    } catch { /* The existing preview renderer discloses any fallback. */ }
    finally { previewLoads--; previewWaiters.shift()?.(); }
    if (token !== generation || !target.isConnected || target.dataset.previewRef !== ref) return;
    target.innerHTML = referencePreviewPassageMarkup(ref, version);
    target.querySelector('.reference-preview-actions')?.remove();
  }
  function showList(id) {
    const list = readLists().find(item => item.id === id);
    if (!list) return home();
    const body = shell(list.title);
    const token = generation;
    const previews = [];
    body.innerHTML = `<div class="passage-import-actions"><button class="ghost-btn" data-import-home>All lists</button><button class="ghost-btn" data-import-new>Import another text</button></div><p>${list.refs.length} passages · ${esc(translationDisplayCode(state.versions[0] || 'BSB'))}. Open a passage to highlight, bookmark, or add notes.</p>${list.refs.slice(0, 100).map((ref, index) => `<article class="passage-import-candidate"><div data-import-preview="${index}"></div><div class="passage-import-actions"><button class="primary-btn" data-import-open="${index}">Open passage</button><button class="ghost-btn" data-import-context="${index}">Read in context</button></div></article>`).join('')}`;
    body.querySelector('[data-import-home]').onclick = home;
    body.querySelector('[data-import-new]').onclick = () => compose();
    list.refs.slice(0, 100).forEach((ref, index) => {
      const preview = body.querySelector(`[data-import-preview="${index}"]`);
      const valid = BSBPassageImport.extract(String(ref), bookAliases, bibleData);
      if (valid.length !== 1 || valid[0].error || valid[0].ref !== ref) { preview.textContent = 'This saved reference is unavailable.'; body.querySelector(`[data-import-open="${index}"]`).disabled = true; body.querySelector(`[data-import-context="${index}"]`).disabled = true; return; }
      previews.push(previewPassage(preview, ref, generation));
      const open = context => {
        listPositions.set(id, { scrollTop: dialog.scrollTop, index });
        dialog.close();
        state.mode = "reader";
        if (gotoReference(ref, { focusedPassage: !context, closeLibrary: true })) showReturn(list);
      };
      body.querySelector(`[data-import-open="${index}"]`).onclick = () => open(false);
      body.querySelector(`[data-import-context="${index}"]`).onclick = () => open(true);
    });
    void Promise.all(previews).then(() => {
      const position = listPositions.get(id);
      if (token !== generation || !dialog.open || !position) return;
      dialog.scrollTop = position.scrollTop;
      body.querySelector(`[data-import-open="${position.index}"]`)?.focus({ preventScroll: true });
    });
  }
  function showReturn(list) {
    let button = document.getElementById('passageImportReturn');
    if (!button) { button = document.createElement('button'); button.id = 'passageImportReturn'; button.className = 'ghost-btn passage-import-return'; document.body.append(button); }
    button.textContent = `← ${list.title}`;
    button.onclick = () => { button.remove(); showList(list.id); };
    button.setAttribute('aria-label', `Return to imported list: ${list.title}`);
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-open-passage-import]')) home();
  });
  // Acknowledge only once the text is recoverable in this webview.
  window.bsbReceiveSharedText = text => {
    if (typeof text !== 'string' || text.length > 100000 || dataLoading || !Object.keys(bibleData).length) return false;
    if (dialog?.open) return false;
    try {
      const draft = JSON.parse(localStorage.getItem('lw_passage_import_draft') || '{}');
      if (draft.text && draft.text !== text) return false;
      localStorage.setItem('lw_passage_import_draft', JSON.stringify({ text }));
    } catch { return false; }
    compose(text);
    return true;
  };
  const params = new URLSearchParams(location.search);
  const inboxId = params.get('import-shared');
  if (inboxId && /^[a-f0-9-]{36}$/i.test(inboxId)) {
    const key = `${location.origin}/__shared_passages/${inboxId}`;
    let attempts = 0;
    const receive = async () => {
      if (++attempts > 200) return; // Retain the inbox entry for the next reload.
      if (dataLoading) { setTimeout(receive, 300); return; }
      try {
        const cache = await caches.open('bsb-share-inbox');
        const response = await cache.match(key);
        if (response && window.bsbReceiveSharedText(await response.text())) {
          await cache.delete(key);
          const url = new URL(location.href); url.searchParams.delete('import-shared'); history.replaceState(null, '', url);
        } else if (response) {
          if (!dialog?.open && attempts === 1) {
            compose();
            dialog.querySelector('[data-import-status]').textContent = 'Another shared text is waiting. Finish or discard this draft, then close the panel to review it.';
          }
          setTimeout(receive, 500);
        }
      } catch { showToast('Shared text could not be opened. Please use Import from text.'); }
    };
    void receive();
  }
})();
