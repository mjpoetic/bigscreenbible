export function cleanQuotedProviderText(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/^"+|"+$/g, "")
    .trim();
}

export function cleanPlainText(value: unknown) {
  return decodeHtmlEntities(String(value || ""))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s*¶+\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_match, hex) => String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(
      /&#(\d+);/g,
      (_match, decimal) => String.fromCodePoint(parseInt(decimal, 10)),
    );
}
