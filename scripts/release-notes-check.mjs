import { readFileSync } from "node:fs";
import vm from "node:vm";

export function releaseNotesMarkup(version) {
  const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
  const start = source.indexOf("function appReleaseNotesMarkup(");
  const end = source.indexOf("\nfunction appUpdateControls(", start);
  const context = vm.createContext({ appVersion: version, escapeHtml: value => String(value)
    .replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;") });
  return vm.runInContext(`${source.slice(start, end)}; appReleaseNotesMarkup()`, context);
}

export function checkReleaseNotes(version) {
  const markup = releaseNotesMarkup(version);
  if (!markup.includes(`data-release-version="${version}"`)) {
    throw new Error(`Add release notes for ${version} to appReleaseNotesMarkup() in assets/bible-app.js before versioning or publishing.`);
  }
  if ((markup.match(/data-release-version=/g) || []).length < 5) {
    throw new Error("Keep at least five updates in the bundled release history.");
  }
}
