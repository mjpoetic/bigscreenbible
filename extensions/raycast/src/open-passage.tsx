import { Action, ActionPanel, Detail, Form, List, Toast, getPreferenceValues, open, showToast, useNavigation } from '@raycast/api';
import { useState } from 'react';
import { passageUrl } from './passage.mjs';
import { escapeMarkdown, translations } from './scripture.mjs';
import { isReference, onlineTranslations } from './search.mjs';
import { findVerses, getPassage, getCrossReferences } from './data';

type Values = { reference: string; translation: string; kind: string };
type Passage = { reference: string; version: string; name: string; source: string; verses: { n: number; text: string }[]; text: string; copyright?: string };
const openShortcut = { modifiers: ['cmd'] as ('cmd')[], key: 'return' as const };
const allTranslations = [...translations, ...onlineTranslations];

function ModeActions({ reference, version }: { reference: string; version: string }) {
  return <ActionPanel.Submenu title="Open in Mode">
    <Action.OpenInBrowser title="Reader" url={passageUrl(reference, version)} />
    <Action.OpenInBrowser title="Big Screen" url={passageUrl(reference, version, 'big')} />
    <Action.OpenInBrowser title="Parallel Study" url={passageUrl(reference, version, 'parallel')} />
    <Action.OpenInBrowser title="Memorize" url={passageUrl(reference, version, 'memorize')} />
    {['word-search', 'crossword', 'hidden-word'].map(game => <Action.OpenInBrowser key={game} title={`Set Up ${game === 'word-search' ? 'Word Search' : game === 'crossword' ? 'Crossword' : 'Hidden Word'}`} url={passageUrl(reference, version, 'trivia', game)} />)}
  </ActionPanel.Submenu>;
}

function CrossReferenceAction({ reference, version }: { reference: string; version: string }) {
  const { push } = useNavigation();
  async function show() {
    try { push(<CrossReferences reference={reference} version={version} items={await getCrossReferences(reference)} />); }
    catch (error) { await showToast({ style: Toast.Style.Failure, title: 'Could not load cross-references', message: String(error) }); }
  }
  return <Action title="Show Cross-References" shortcut={{ modifiers: ['cmd', 'shift'], key: 'x' }} onAction={show} />;
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
        <Action title="Read Related Passage" onAction={() => read(hit.reference)} />
        <Action.OpenInBrowser title="Open in Big Screen Bible" url={passageUrl(hit.reference, version)} shortcut={openShortcut} />
        <ModeActions reference={hit.reference} version={version} />
        <Action.OpenInBrowser title="Cross-Reference Source (CC-BY)" url="https://www.openbible.info/labs/cross-references/" />
      </ActionPanel>} />)}
    </List.Section>
  </List>;
}

function PassageView({ passage }: { passage: Passage }) {
  const url = passageUrl(passage.reference, passage.version);
  const markdown = `# ${escapeMarkdown(passage.reference)}\n\n${escapeMarkdown(passage.name)} (${passage.version})\n\n${passage.verses.map(({ n, text }) => `**${n}** ${escapeMarkdown(text)}`).join('\n\n')}\n\n---\n\n${escapeMarkdown(passage.copyright || '')}\n\n[Translation source and rights](${passage.source})`;
  return <Detail navigationTitle={passage.reference} markdown={markdown} actions={<ActionPanel>
    <Action.CopyToClipboard title="Copy Scripture Text" content={passage.text} />
    <CrossReferenceAction reference={passage.reference} version={passage.version} />
    <Action.OpenInBrowser title="Open in Big Screen Bible" url={url} shortcut={openShortcut} />
    <ModeActions reference={passage.reference} version={passage.version} />
    <Action.CopyToClipboard title="Copy Passage Link" content={url} shortcut={{ modifiers: ['cmd', 'shift'], key: 'c' }} />
  </ActionPanel>} />;
}
function Results({ data, version, query }: { data: any; version: string; query: string }) {
  const { push } = useNavigation();
  const [loading, setLoading] = useState(false);
  async function view(ref: string) {
    setLoading(true);
    try { push(<PassageView passage={await getPassage(ref, version)} />); }
    catch (error) { await showToast({ style: Toast.Style.Failure, title: 'Could not load passage', message: String(error) }); }
    finally { setLoading(false); }
  }
  return <List isLoading={loading} isShowingDetail navigationTitle={`Results: ${query}`} searchBarPlaceholder="Filter these results">
    <List.EmptyView title="No Matching Verses" description="Try fewer words or another translation. Press Escape to search again." />
    <List.Section title={`${version} · ${data.results.length} shown${Number.isFinite(data.total) ? ` of ${data.total}` : ' (provider limit)'}`}>
      {data.results.map((hit: any) => <List.Item key={hit.ref} title={hit.ref} detail={<List.Item.Detail markdown={`## ${escapeMarkdown(hit.ref)}\n\n${escapeMarkdown(hit.text)}\n\n${escapeMarkdown(data.copyright || '')}`} />} actions={<ActionPanel>
        <Action title="Read Passage" onAction={() => view(hit.ref)} />
        <CrossReferenceAction reference={hit.ref} version={version} />
        <Action.OpenInBrowser title="Open in Big Screen Bible" url={passageUrl(hit.ref, version)} shortcut={openShortcut} />
        <ModeActions reference={hit.ref} version={version} />
        <Action.CopyToClipboard title="Copy Scripture Text" content={`${hit.ref} (${version})\n\n${hit.text}\n\n${data.copyright || ''}`} />
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
    <Action.SubmitForm title="Search Scripture" shortcut={{ modifiers: [], key: "return" }} onSubmit={(values: Values) => submit(values)} />
    <Action.SubmitForm title="Open Passage in Big Screen Bible" shortcut={openShortcut} onSubmit={(values: Values) => submit(values, true)} />
  </ActionPanel>}>
    <Form.TextField id="reference" title="Search" placeholder={'John 3:16–18 or "love one another"'} error={error} onChange={() => setError(undefined)} />
    <Form.Dropdown id="translation" title="Translation" defaultValue={allTranslations.includes(preferred) ? preferred : 'BSB'}>
      {allTranslations.map(code => <Form.Dropdown.Item key={code} value={code} title={`${code === 'NASB2020' ? 'NASB' : code} · ${translations.includes(code) ? 'Offline' : 'Online'}`} />)}
    </Form.Dropdown>
    <Form.Dropdown id="kind" title="Search Type" defaultValue="auto">
      <Form.Dropdown.Item value="auto" title="Automatic" /><Form.Dropdown.Item value="reference" title="Passage Reference" /><Form.Dropdown.Item value="words" title="Words or Phrase" />
    </Form.Dropdown>
    <Form.Description text={'Enter searches inside Raycast. Use quotation marks for an exact phrase. Command–Enter opens a reference on the website; for word searches, select a result then press Command–Enter. Online translations need internet. Local results show up to 50 matches; online results use the provider limit.'} />
  </Form>;
}
