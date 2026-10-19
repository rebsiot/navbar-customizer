import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const manifest = JSON.parse(read("module.json"));

test("Foundry identifies this existing module as AFT Navbar+", () => {
  assert.equal(manifest.id, "foundry-nav-order");
  assert.equal(manifest.title, "AFT Navbar+");
  assert.equal(manifest.version, "0.1.9");
  assert.equal(manifest.manifest, "https://raw.githubusercontent.com/rebsiot/navbar-customizer/update-channel/module.json");
});

test("settings dialog, entry, errors and release display use AFT Navbar+", () => {
  const main = read("scripts/main.mjs");
  const ui = read("scripts/organizer.mjs");
  const workflow = read(".github/workflows/release.yml");
  assert.match(main, /name: "AFT Navbar\+ — Arrange Icon Order"/);
  assert.match(ui, /title: "AFT Navbar\+ — Arrange Icon Order"/);
  assert.match(workflow, /--title "AFT Navbar\+ \$\{RELEASE_TAG\} \(Beta\)"/);
  assert.doesNotMatch(main + ui + workflow, /AFT Navbar Customizer|Navigation Organizer/);
  assert.match(read("README.md"), /^# AFT Navbar\+/);
  assert.match(read("RELEASE-NOTES.md"), /^# AFT Navbar\+/);
});
