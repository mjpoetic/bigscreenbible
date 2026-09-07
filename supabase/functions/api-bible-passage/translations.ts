export type ApiBibleTranslationCode = "NIV" | "NLT" | "NASB2020" | "CEV" | "NKJV";

export type ApiBibleSummary = {
  id: string;
  abbreviation?: string;
  abbreviationLocal?: string;
  name?: string;
  nameLocal?: string;
  copyright?: string;
};

export const supportedApiBibleTranslations: ApiBibleTranslationCode[] = ["NIV", "NLT", "NASB2020", "CEV", "NKJV"];

function normalizedLabel(value: unknown) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function matchesTranslation(
  bible: ApiBibleSummary,
  code: ApiBibleTranslationCode,
) {
  const abbreviation = normalizedLabel(
    bible.abbreviationLocal || bible.abbreviation,
  );
  const name = normalizedLabel(bible.nameLocal || bible.name);
  if (code === "CEV") {
    return abbreviation === "CEV" || name === "CONTEMPORARYENGLISHVERSION";
  }
  if (code === "NKJV") {
    return abbreviation === "NKJV" || name === "NEWKINGJAMESVERSION";
  }
  if (code === "NIV") {
    return abbreviation === "NIV" || name.includes("NEWINTERNATIONALVERSION");
  }
  if (code === "NLT") {
    return abbreviation === "NLT" || name.includes("NEWLIVINGTRANSLATION");
  }
  return (
    ["NASB2020", "NASB20", "NASB"].includes(abbreviation) ||
    name.includes("NEWAMERICANSTANDARDBIBLE2020") ||
    (name.includes("NEWAMERICANSTANDARDBIBLE") && name.includes("2020")) ||
    name === "NEWAMERICANSTANDARDBIBLENASB"
  );
}

