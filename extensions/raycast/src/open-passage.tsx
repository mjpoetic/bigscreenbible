import { Action, ActionPanel, Detail, Form, Icon, List, Toast, getPreferenceValues, open, showToast, useNavigation } from '@raycast/api';
import { useState } from 'react';
import { passageUrl } from './passage.mjs';
import { escapeMarkdown, translations } from './scripture.mjs';
import { isReference, onlineTranslations } from './search.mjs';
import { findVerses, getPassage, getCrossReferences, searchAllTranslations } from './data';

type Values = { reference: string; translation: string; kind: string };
type Passage = { reference: string; version: string; name: string; source: string; verses: { n: number; text: string }[]; text: string; copyright?: string };
const openShortcut = { modifiers: ['cmd'] as ('cmd')[], key: 'return' as const };
const allTranslations = [...translations, ...onlineTranslations];

function ModeActions({ reference, version }: { reference: string; version: string }) {
  return <ActionPanel.Submenu title="Open in Mode" icon={Icon.AppWindowGrid2x2}>
    <Action.OpenInBrowser title="Reader" icon={Icon.Book} url={passageUrl(reference, version)} />
    <Action.OpenInBrowser title="Big Screen" icon={Icon.Desktop} url={passageUrl(reference, version, 'big')} />
    <Action.OpenInBrowser title="Parallel Study" icon={Icon.AppWindowSidebarLeft} url={passageUrl(reference, version, 'parallel')} />
    <Action.OpenInBrowser title="Memorize" icon={Icon.Bookmark} url={passageUrl(reference, version, 'memorize')} />
    {['word-search', 'crossword', 'hidden-word'].map(game => <Action.OpenInBrowser icon={Icon.GameController} key={game} title={`Set Up ${game === 'word-search' ? 'Word Search' : game === 'crossword' ? 'Crossword' : 'Hidden Word'}`} url={passageUrl(reference, version, 'trivia', game)} />)}
  </ActionPanel.Submenu>;
}

function CrossReferenceAction({ reference, version }: { reference: string; version: string }) {
  const { push } = useNavigation();
  async function show() {
    try { push(<CrossReferences reference={reference} version={version} items={await getCrossReferences(reference)} />); }
    catch (error) { await showToast({ style: Toast.Style.Failure, title: 'Could not load cross-references', message: String(error) }); }
  }
  return <Action title="Show Cross-References" icon={Icon.Network} shortcut={{ modifiers: ['cmd', 'shift'], key: 'x' }} onAction={show} />;
}
function CrossReferences({ reference, version, items }: { reference: string; version: string; items: {reference: string; label: string; sources: string[]}[] }) {
  const { push } = useNavigation();
  const [loading, setLoading] = useState(false);
  async function read(target: string) {
    if (loading) return;
    setLoading(true);
    try { push(<PassageView passage={await getPassage(target, version)} />); }
    catch (error) { await showToast({ style: Toast.Style.Failure, title: 'Could not load related passage', message: String(error) }); }
    finally { setLoading(false); }
  }
  return <List isLoading={loading} navigationTitle={`Cross-References: ${reference}`} searchBarPlaceholder="Filter related references">
    <List.EmptyView title="No Cross-References" description="The bundled catalog has no related verses for this passage." />
    <List.Section title={`${items.length} related passages · ${version}`} subtitle="OpenBible.info · CC-BY">
      {items.map(hit => <List.Item key={hit.reference} title={hit.label} subtitle={`From ${hit.sources.join(', ')}`} actions={<ActionPanel>
        <Action title="Read Related Passage" icon={Icon.Book} onAction={() => read(hit.reference)} />
        <Action.OpenInBrowser title="Open in Big Screen Bible" icon={Icon.Globe} url={passageUrl(hit.reference, version)} shortcut={openShortcut} />
        <ModeActions reference={hit.reference} version={version} />
        <Action.OpenInBrowser title="Cross-Reference Source (CC-BY)" icon={Icon.Info} url="https://www.openbible.info/labs/cross-references/" />
      </ActionPanel>} />)}
    </List.Section>
  </List>;
}

const passageSizes = [
  { value: 'standard', title: 'Standard Text', prefix: '' },
  { value: 'large', title: 'Large Text', prefix: '### ' },
  { value: 'extra-large', title: 'Extra Large Text', prefix: '## ' },
];

function PassageView({ passage }: { passage: Passage }) {
  const preferences = getPreferenceValues<{ passageSize?: string; passageLayout?: string }>();
  const [size, setSize] = useState(() => passageSizes.find(option => option.value === preferences.passageSize) ?? passageSizes[1]);
  const [singleVerse, setSingleVerse] = useState(preferences.passageLayout === 'verse');
  const [verseIndex, setVerseIndex] = useState(0);
  const url = passageUrl(passage.reference, passage.version);
  const visibleVerses = singleVerse ? passage.verses.slice(verseIndex, verseIndex + 1) : passage.verses;
  const position = singleVerse && passage.verses.length > 1 ? ` · Verse ${verseIndex + 1} of ${passage.verses.length}` : '';
  const scripture = visibleVerses.map(({ n, text }) =>
    `${size.prefix}**${n}** ${escapeMarkdown(text).replace(/\s*\r?\n\s*/g, ' ')}`
  ).join('\n\n');
  const markdown = `# ${escapeMarkdown(passage.reference)}\n\n${escapeMarkdown(passage.name)} (${passage.version})${position}\n\n${scripture}\n\n---\n\n${escapeMarkdown(passage.copyright || '')}\n\n[Translation source and rights](${passage.source})`;
  return <Detail navigationTitle={passage.reference} markdown={markdown} actions={<ActionPanel>
    <Action.CopyToClipboard title="Copy Scripture Text" content={passage.text} />
    <CrossReferenceAction reference={passage.reference} version={passage.version} />
    <Action.OpenInBrowser title="Open in Big Screen Bible" icon={Icon.Globe} url={url} shortcut={openShortcut} />
    <ActionPanel.Submenu title="Passage Display">
      {passageSizes.map(option => <Action key={option.value} title={option.title} onAction={() => setSize(option)} />)}
      <Action title={singleVerse ? 'Show Full Passage' : 'Show One Verse at a Time'} onAction={() => setSingleVerse(!singleVerse)} />
    </ActionPanel.Submenu>
    {singleVerse && verseIndex < passage.verses.length - 1 &&
      <Action title="Next Verse" icon={Icon.ArrowRight} shortcut={{ modifiers: ['cmd'], key: 'arrowRight' }} onAction={() => setVerseIndex(verseIndex + 1)} />}
    {singleVerse && verseIndex > 0 &&
      <Action title="Previous Verse" icon={Icon.ArrowLeft} shortcut={{ modifiers: ['cmd'], key: 'arrowLeft' }} onAction={() => setVerseIndex(verseIndex - 1)} />}
    <ModeActions reference={passage.reference} version={passage.version} />
    <Action.CopyToClipboard title="Copy Passage Link" icon={Icon.Link} content={url} shortcut={{ modifiers: ['cmd', 'shift'], key: 'c' }} />
  </ActionPanel>} />;
}
function Results({ data, version, query }: { data: any; version: string; query: string }) {
  const { push } = useNavigation();
  const [loading, setLoading] = useState(false);
  async function view(ref: string, hitVersion: string, passage?: Passage) {
    setLoading(true);
    try { push(<PassageView passage={passage || await getPassage(ref, hitVersion)} />); }
    catch (error) { await showToast({ style: Toast.Style.Failure, title: 'Could not load passage', message: String(error) }); }
    finally { setLoading(false); }
  }
  return <List isLoading={loading} isShowingDetail navigationTitle={`Results: ${query}`} searchBarPlaceholder="Filter these results">
    <List.EmptyView title="No Matching Verses" description={data.failures?.length ? `Some translations failed: ${data.failures.map((failure: any) => failure.version).join(", ")}. Press Escape to retry.` : "Try fewer words or another translation. Press Escape to search again."} />
    {data.failures?.length > 0 && <List.Section title="Unavailable Translations">{data.failures.map((failure: any) => <List.Item key={failure.version} title={failure.version} icon={Icon.ExclamationMark} detail={<List.Item.Detail markdown={escapeMarkdown(failure.message)} />} />)}</List.Section>}
    <List.Section title={`${version === 'ALL' ? 'All translations' : version} · ${data.results.length} shown${Number.isFinite(data.total) ? ` of ${data.total}` : ' (provider limit)'}`}>
      {data.results.map((hit: any) => <List.Item key={`${hit.version || version}:${hit.ref}`} title={hit.ref} accessories={[{ text: hit.version || version }]} detail={<List.Item.Detail markdown={`## ${escapeMarkdown(hit.ref)}\n\n${escapeMarkdown(hit.text)}\n\n${escapeMarkdown(hit.copyright || data.copyright || '')}`} />} actions={<ActionPanel>
        <Action title="Read Passage" icon={Icon.Book} onAction={() => view(hit.ref, hit.version || version, hit.passage)} />
        <CrossReferenceAction reference={hit.ref} version={hit.version || version} />
        <Action.OpenInBrowser title="Open in Big Screen Bible" icon={Icon.Globe} url={passageUrl(hit.ref, hit.version || version)} shortcut={openShortcut} />
        <ModeActions reference={hit.ref} version={hit.version || version} />
        <Action.CopyToClipboard title="Copy Scripture Text" content={`${hit.ref} (${hit.version || version})\n\n${hit.text}\n\n${hit.copyright || data.copyright || ''}`} />
      </ActionPanel>} />)}
    </List.Section>
  </List>;
}
export default function Command() {
  const preferred = (getPreferenceValues<{ translation?: string }>().translation || 'BSB').trim().toUpperCase();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const { push } = useNavigation();
  async function submit(values: Values, external = false) {
    if (loading) return;
    setLoading(true); setError(undefined);
    try {
      if (!values.reference.trim()) throw new Error('Enter a reference or words to search.');
      const passage = values.kind === 'reference' || (values.kind === 'auto' && isReference(values.reference));
      if (values.translation === 'ALL') {
        push(<Results data={await searchAllTranslations(values.reference, passage)} version="ALL" query={values.reference} />);
        return;
      }
      if (external && passage) { await open(passageUrl(values.reference, values.translation)); return; }
      if (passage) push(<PassageView passage={await getPassage(values.reference, values.translation)} />);
      else push(<Results data={await findVerses(values.reference, values.translation)} version={values.translation} query={values.reference} />);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setError(message);
      await showToast({ style: Toast.Style.Failure, title: 'Lookup Failed', message });
    } finally { setLoading(false); }
  }
  return <Form isLoading={loading} actions={<ActionPanel>
    <Action.SubmitForm title="Search Scripture" icon={Icon.MagnifyingGlass} shortcut={{ modifiers: [], key: "return" }} onSubmit={(values: Values) => submit(values)} />
    <Action.SubmitForm title="Open Passage in Big Screen Bible" icon={Icon.Globe} shortcut={openShortcut} onSubmit={(values: Values) => submit(values, true)} />
  </ActionPanel>}>
    <Form.TextField id="reference" title="Search" placeholder={'John 3:16–18 or "love one another"'} error={error} onChange={() => setError(undefined)} />
    <Form.Dropdown id="translation" title="Translation" defaultValue={(preferred === 'ALL' || allTranslations.includes(preferred)) ? preferred : 'BSB'}>
      <Form.Dropdown.Item value="ALL" title="All translations *" icon={Icon.Globe} />
      {allTranslations.map(code => <Form.Dropdown.Item key={code} value={code} title={`${code === 'NASB2020' ? 'NASB' : code}${translations.includes(code) ? '' : ' *'}`} />)}
    </Form.Dropdown>
    <Form.Dropdown id="kind" title="Search Type" defaultValue="auto">
      <Form.Dropdown.Item value="auto" title="Automatic" /><Form.Dropdown.Item value="reference" title="Passage Reference" /><Form.Dropdown.Item value="words" title="Words or Phrase" />
    </Form.Dropdown>
    <Form.Description text={'Enter searches inside Raycast. Use quotation marks for an exact phrase. Command–Enter opens a reference on the website; for word searches, select a result then press Command–Enter. * Requires internet access. All translations keeps available results if an online service fails. Local results show up to 50 matches; online results use the provider limit.'} />
  </Form>;
}
