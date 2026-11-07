/* Multiple imported references share the Reader's typography and annotation store. */
(() => {
  let active = null;
  let repaintQueued = false;
  const esc = value => escapeHtml(String(value));
  function entriesFor(list) {
    return [...new Set(Array.isArray(list?.refs) ? list.refs.slice(0, 100) : [])].flatMap(ref => {
      if (typeof ref !== 'string') return [];
      let matches;
      try { matches = BSBPassageImport.extract(ref, bookAliases, bibleData); } catch { return []; }
      return matches.length === 1 && !matches[0].error && matches[0].ref === ref ? [matches[0]] : [];
    });
  }
  function isActive() {
    return Boolean(active && state.mode === 'reader' && !state.sharedPassage && !state.isVerseOfDayActive
      && state.reference === active.anchor && state.verse === active.anchorVerse);
  }
  function leave() { active = null; }
  function open(list, callbacks = {}) {
    const entries = entriesFor(list);
    if (!entries.length) { showToast('This list has no available passages.'); return false; }
    if (!gotoReference(entries[0].ref, { focusedPassage: true, closeLibrary: true })) return false;
    state.sharedPassage = null;
    state.selectedVerses = [];
    state.pendingVerseFocus = false;
    state.pendingVerseHalo = false;
    active = { list, entries, callbacks, anchor: state.reference, anchorVerse: state.verse, version: '', snapshots: new Map() };
    document.getElementById('passageImportReturn')?.remove();
    render();
    document.querySelector('.scripture')?.scrollTo({ top: 0 });
    return true;
  }
  function repaint() {
    if (repaintQueued) return;
    repaintQueued = true;
    requestAnimationFrame(() => {
      repaintQueued = false;
      if (isActive()) renderPreservingReaderScroll();
    });
  }
  async function afterRender() {
    if (!isActive()) return;
    const view = active;
    const version = state.versions[0] || 'BSB';
    if (view.version === version) return;
    view.version = version;
    view.snapshots = new Map();
    if (!isRemoteTranslation(version)) {
      try { await loadBibleVersion(version); } catch { /* Keep the bundled fallback available. */ }
      if (active !== view || view.version !== version) return;
      rebuildBibleData();
    }
    const pending = [...view.entries];
    async function worker() {
      while (pending.length && active === view && view.version === version) {
        const entry = pending.shift();
        try {
          if (isRemoteTranslation(version)) await ensureRemoteBibleVersion(version, entry.key, { rerender: false });
        } catch { /* An unavailable requested version is explicitly labelled below. */ }
        if (active !== view || view.version !== version) return;
        const selected = new Set(entry.verses);
        const verses = (bibleData[entry.key]?.verses || []).filter(v => selected.has(v.n)).map(v => JSON.parse(JSON.stringify(v)));
        const available = !(window.bsbOffline?.active && isRemoteTranslation(version)) && verses.length && verses.every(v => String(v[version] || '').trim());
        const shownVersion = available ? version : 'BSB';
        view.snapshots.set(entry.ref, { verses, version: shownVersion, requested: version });
        repaint();
      }
    }
    await Promise.all(Array.from({ length: 3 }, worker));
  }
  function verseReferences(entries = active?.entries || []) {
    return [...new Set(entries.flatMap(entry => entry.verses.map(n => `${entry.key}:${n}`)))];
  }
  function persistAnnotations(key, next, kind) {
    try { localStorage.setItem(key, JSON.stringify(next)); }
    catch { showToast('Changes could not be saved. Device storage may be full.'); return false; }
    state[kind] = next;
    scheduleCloudSync();
    repaint();
    return true;
  }
  function bookmarkAll() {
    if (!isActive()) return;
    const refs = active.entries.map(entry => entry.ref);
    const missing = refs.filter(ref => !state.bookmarks.includes(ref));
    if (!missing.length) { showToast('All passages are already bookmarked.'); return; }
    if (persistAnnotations('lw_bookmarks', [...missing, ...state.bookmarks], 'bookmarks')) showToast(`${missing.length} passages bookmarked`);
  }
  function highlightReferences(refs, color) {
    if (!isActive() || (!highlightColors.includes(color) && color !== 'none')) return;
    const allowed = new Set(verseReferences());
    const next = { ...state.highlights };
    for (const ref of refs) {
      if (!allowed.has(ref)) continue;
      if (color === 'none') delete next[ref];
      else next[ref] = color;
    }
    if (persistAnnotations('lw_highlights', next, 'highlights')) showToast(color === 'none' ? 'Highlights removed' : 'Verses highlighted');
  }
  function palette(reference = 'all') {
    return `<div class="imported-highlight-palette" role="group" aria-label="Choose highlight color">${highlightColors.map(color => `<button class="highlight-swatch highlight-${color}" type="button" data-import-highlight="${color}" data-import-target="${esc(reference)}" aria-label="Highlight ${reference === 'all' ? 'all imported verses' : esc(reference)} ${color}" data-tooltip="${color}"></button>`).join('')}<button class="highlight-swatch highlight-remove" type="button" data-import-highlight="none" data-import-target="${esc(reference)}" aria-label="Remove ${reference === 'all' ? 'all imported highlights' : 'highlight'}">${icons.clear}</button></div>`;
  }
  function markup() {
    if (!isActive()) return '';
    const view = active;
    const version = state.versions[0] || 'BSB';
    const allBookmarked = view.entries.every(entry => state.bookmarks.includes(entry.ref));
    return `<div class="imported-passage-reader" aria-label="${esc(view.list.title)}">
      <header class="imported-reader-header"><h1>${esc(view.list.title)}</h1><div class="passage-import-actions"><button class="ghost-btn" type="button" data-import-manage>Saved lists</button><button class="ghost-btn" type="button" data-import-edit>Edit references</button></div></header>
      ${view.entries.map((entry, index) => {
        const snapshot = view.version === version ? view.snapshots.get(entry.ref) : null;
        const shownVersion = snapshot?.version || version;
        const verses = snapshot ? uniqueVersionVerses(snapshot.verses, shownVersion) : [];
        return `<section class="verse-of-day-reader shared-passage-reader imported-reader-passage" aria-labelledby="importedReference${index}">
          <h2 class="section-title" id="importedReference${index}">${esc(entry.ref)} <span>(${esc(translationDisplayCode(shownVersion))})</span></h2>
          ${snapshot && shownVersion !== version ? `<p class="muted imported-version-notice">${esc(translationDisplayCode(version))} is unavailable for this passage. Showing ${esc(translationDisplayCode(shownVersion))}.</p>` : ''}
          ${!snapshot ? `<p class="muted" role="status">Loading ${esc(translationDisplayCode(version))}…</p>` : verses.map(verse => {
            const ref = `${entry.key}:${verse.n}`;
            const color = state.highlights[ref];
            const content = verse[shownVersion] ? renderStrongText(verse, shownVersion, entry.key) : '<span class="muted">Scripture text is unavailable for this verse.</span>';
            return `<p class="verse-of-day-copy imported-reader-verse"><button class="focused-verse-number" type="button" data-import-verse-menu="${esc(ref)}" aria-label="Actions for ${esc(ref)}" aria-haspopup="dialog">${versionVerseLabel(verse, shownVersion)}</button> <span class="paragraph-verse ${highlightClassForColor(color)}" ${highlightStyleForColor(color)}>${content}</span>${publisherFootnoteButtonMarkup(verse, shownVersion, entry.key)}${state.notes[ref] ? `<button class="imported-note-indicator" type="button" data-import-note="${esc(ref)}" aria-label="Edit note for ${esc(ref)}">${icons.note}</button>` : ''}</p>`;
          }).join('')}
          <div class="focused-passage-actions"><button class="ghost-btn verse-of-day-read-button" type="button" data-import-context="${index}"><span aria-hidden="true">${icons.book}</span><span>Read full chapter</span></button><button class="ghost-btn" type="button" data-import-passage-note="${index}"><span aria-hidden="true">${icons.note}</span><span>${state.notes[entry.ref] ? 'Edit note' : 'Note'}</span></button></div>
          ${snapshot ? apiBibleAttributionMarkup([shownVersion], 'reference-preview-attribution', entry.key) : ''}
        </section>`;
      }).join('')}
      <footer class="imported-reader-footer"><h2>Save these passages</h2><div class="focused-passage-actions"><button class="ghost-btn" type="button" data-import-bookmark-all ${allBookmarked ? 'disabled' : ''}><span aria-hidden="true">${icons.bookmark}</span><span>${allBookmarked ? 'All bookmarked' : 'Bookmark all'}</span></button><details class="imported-highlight-options"><summary class="ghost-btn"><span aria-hidden="true">${icons.highlighter}</span><span>Highlight all</span></summary>${palette()}</details></div></footer>
    </div>`;
  }
  function readChapter(index) {
    if (!isActive()) return;
    const view = active;
    const entry = view.entries[index];
    if (!entry) return;
    const scrollTop = document.querySelector('.scripture')?.scrollTop || 0;
    leave();
    if (!gotoReference(entry.ref, { closeLibrary: true })) return;
    const button = document.createElement('button');
    document.getElementById('passageImportReturn')?.remove();
    button.id = 'passageImportReturn';
    button.className = 'ghost-btn passage-import-return';
    button.textContent = `← ${view.list.title}`;
    button.onclick = () => {
      if (!gotoReference(view.entries[0].ref, { focusedPassage: true, closeLibrary: true })) return;
      state.sharedPassage = null; state.selectedVerses = []; state.pendingVerseFocus = false; state.pendingVerseHalo = false;
      active = view; active.anchor = state.reference; active.anchorVerse = state.verse;
      button.remove(); render();
      document.querySelector('.scripture')?.scrollTo({ top: scrollTop });
    };
    document.body.append(button);
  }
  document.addEventListener('click', event => {
    if (!isActive() || !(event.target instanceof Element)) return;
    const button = event.target.closest('[data-publisher-footnote]');
    if (!button?.closest('.imported-passage-reader')) return;
    const key = button.dataset.footnoteChapter;
    const version = button.dataset.footnoteVersion;
    const entry = active.entries.find(item => item.key === key && item.verses.includes(Number(button.dataset.publisherFootnote)));
    const verse = active.snapshots.get(entry?.ref)?.verses.find(item => item.n === Number(button.dataset.publisherFootnote));
    if (!publisherFootnotesForVerse(verse, version).length) return;
    event.preventDefault(); event.stopPropagation();
    if (document.getElementById('studyPopup')?.studyPopupAnchor === button) return closeStudyPopup();
    showStudyPopup(button, publisherFootnotePopupMarkup(verse, version, key), `${key}:${versionVerseLabel(verse, version)} (${translationDisplayCode(version)})`, { className: 'publisher-footnote-popup' });
  }, true);
  document.addEventListener('click', event => {
    if (!isActive() || !(event.target instanceof Element)) return;
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-import-bookmark-all')) return bookmarkAll();
    if (button.hasAttribute('data-import-highlight')) {
      const ref = button.dataset.importTarget;
      closeStudyPopup();
      return highlightReferences(ref === 'all' ? verseReferences() : [ref], button.dataset.importHighlight);
    }
    if (button.hasAttribute('data-import-manage')) return active.callbacks.onManage?.();
    if (button.hasAttribute('data-import-edit')) return active.callbacks.onEdit?.();
    if (button.hasAttribute('data-import-context')) return readChapter(Number(button.dataset.importContext));
    if (button.hasAttribute('data-import-passage-note')) return openNoteComposer(active.entries[Number(button.dataset.importPassageNote)]?.ref, button);
    if (button.hasAttribute('data-import-note')) { const ref = button.dataset.importNote; closeStudyPopup(); return openNoteComposer(ref, button); }
    if (button.hasAttribute('data-import-verse-bookmark')) {
      const ref = button.dataset.importVerseBookmark;
      if (!verseReferences().includes(ref)) return;
      const next = state.bookmarks.includes(ref) ? state.bookmarks.filter(item => item !== ref) : [ref, ...state.bookmarks];
      closeStudyPopup();
      return persistAnnotations('lw_bookmarks', next, 'bookmarks');
    }
    if (button.hasAttribute('data-import-verse-menu')) {
      const ref = button.dataset.importVerseMenu;
      if (!verseReferences().includes(ref)) return;
      const popup = showStudyPopup(button, `<div class="passage-import-actions"><button class="ghost-btn" type="button" data-import-note="${esc(ref)}">${state.notes[ref] ? 'Edit note' : 'Add note'}</button><button class="ghost-btn" type="button" data-import-verse-bookmark="${esc(ref)}">${state.bookmarks.includes(ref) ? 'Remove bookmark' : 'Bookmark'}</button></div>${palette(ref)}`, `Actions for ${ref}`);
      popup.querySelector('button')?.focus();
    }
  });
  window.BSBImportedReader = { open, isActive, leave, markup, afterRender, bookmarkAll, highlightReferences, verseReferences };
})();
