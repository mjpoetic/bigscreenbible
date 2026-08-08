export type YouVersionTranslationCode = "AMP" | "NIRV";

export type YouVersionBibleSummary = {
  id?: number | string;
  abbreviation?: string;
  localized_abbreviation?: string;
  title?: string;
  localized_title?: string;
  copyright?: string;
  info?: string;
  publisher_url?: string;
  youversion_deep_link?: string;
};

export const supportedYouVersionTranslations: YouVersionTranslationCode[] = [
  "AMP",
  "NIRV",
];

export const fallbackYouVersionTranslationNames: Record<
  YouVersionTranslationCode,
  string
> = {
  AMP: "Amplified Bible",
  NIRV: "New International Reader's Version",
};

function normalizedLabel(value: unknown) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function matchesYouVersionTranslation(
  bible: YouVersionBibleSummary,
  code: YouVersionTranslationCode,
) {
  const abbreviation = normalizedLabel(
    bible.localized_abbreviation || bible.abbreviation,
  );
  const title = normalizedLabel(bible.localized_title || bible.title);

  if (code === "AMP") {
    return (
      abbreviation === "AMP" ||
      (title.includes("AMPLIFIEDBIBLE") && !title.includes("CLASSIC"))
    );
  }
  if (code === "NIRV") {
    return (
      abbreviation === "NIRV" ||
      title.includes("NEWINTERNATIONALREADERSVERSION")
    );
  }
  return false;
}
