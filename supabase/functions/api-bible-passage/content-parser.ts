export type ApiBibleContentNode = {
  name?: string;
  type?: string;
  text?: string;
  attrs?: {
    number?: string;
    verseId?: string;
    verseOrgIds?: string[];
  };
  items?: ApiBibleContentNode[];
};

function verseNumberFromId(value: unknown) {
  const match = String(value || "").match(/\.(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function needsBoundarySpace(existing: string, incoming: string) {
  const previousCharacter = existing.at(-1) || "";
  const nextCharacter = incoming.at(0) || "";
  if (!previousCharacter || !nextCharacter) return false;
  if (/\s/u.test(previousCharacter) || /\s/u.test(nextCharacter)) return false;

  // Keep punctuation attached to the word it belongs to.
  if (/^[,.;:!?…%)\]}”’']/u.test(nextCharacter)) return false;
  if (/[([{“‘]$/u.test(previousCharacter)) return false;

  // Preserve compounds and paths when a formatting node splits at the join.
  if (/[-‐‑‒–—/\\]$/u.test(previousCharacter)) return false;
  if (/^[-‐‑‒–—/\\]/u.test(nextCharacter)) return false;

  return true;
}

export function parseVerseContent(content: ApiBibleContentNode[]) {
  const verseText = new Map<number, string>();
  const paragraphStarts = new Set<number>();
  let currentVerse = 0;

  const appendText = (verseNumber: number, text: string) => {
    if (!verseNumber || !text) return;
    const existing = verseText.get(verseNumber) || "";
    const separator = needsBoundarySpace(existing, text) ? " " : "";
    verseText.set(verseNumber, `${existing}${separator}${text}`);
  };

  const visit = (
    node: ApiBibleContentNode,
    paragraphState: { firstVerse: number },
  ) => {
    if (!node || typeof node !== "object") return;

    if (node.name === "verse") {
      const verseNumber = Number(node.attrs?.number) ||
        verseNumberFromId(node.attrs?.verseId);
      if (verseNumber) {
        currentVerse = verseNumber;
        if (!paragraphState.firstVerse) paragraphState.firstVerse = verseNumber;
      }
      return;
    }

    if (node.type === "text" && typeof node.text === "string") {
      const attributedVerse = verseNumberFromId(node.attrs?.verseId) ||
        verseNumberFromId(node.attrs?.verseOrgIds?.[0]);
      appendText(attributedVerse || currentVerse, node.text);
      return;
    }

    (node.items || []).forEach((item) => visit(item, paragraphState));
  };

  content.forEach((block) => {
    const paragraphState = { firstVerse: 0 };
    visit(block, paragraphState);
    if (block?.name === "para" && paragraphState.firstVerse) {
      paragraphStarts.add(paragraphState.firstVerse);
    }
  });

  return [...verseText.entries()]
    .sort(([a], [b]) => a - b)
    .map(([n, text]) => ({
      n,
      text: text.trim(),
      paragraphStart: paragraphStarts.has(n),
    }))
    .filter(({ text }) => text.length > 0);
}
