import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const run = (command, args) => execFileSync(command, args, { cwd: root, stdio: "inherit" });
run("npm", ["run", "build:mobile"]);
run("npx", ["cap", "sync", "ios"]);
const configPath = new URL("../ios/App/App/capacitor.config.json", import.meta.url);
const config = JSON.parse(readFileSync(configPath, "utf8"));
delete config.server;
writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
console.log("iOS now uses the local bundle. Run npm run cap:open:ios to restore the live website before release.");
if (process.argv.includes("--open")) run("npx", ["cap", "open", "ios"]);
