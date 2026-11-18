// Keep reference parsing in the reader, which supports book aliases and spoken references.
export function passageUrl(reference, translation = "BSB", mode = "reader") {
  const ref = reference.trim();
  if (!ref) throw new Error("Enter a Bible reference, such as John 3:16–18.");
  if (ref.length > 200) throw new Error("Keep the reference under 200 characters.");
  if (!["reader", "big", "parallel"].includes(mode)) throw new Error("Choose a display mode.");
  const url = new URL("https://bigscreenbible.com/");
  url.searchParams.set("ref", ref.replaceAll("–", "-").replaceAll("—", "-"));
  url.searchParams.set("version", translation.trim().toUpperCase() || "BSB");
  url.searchParams.set("mode", mode);
  return url.toString();
}
