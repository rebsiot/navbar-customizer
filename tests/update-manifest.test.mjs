import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../module.json', import.meta.url), 'utf8'));
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const workflow = readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');
const stable = 'https://raw.githubusercontent.com/rebsiot/navbar-customizer/update-channel/module.json';

test('stable manifest URL is independent of the release version', () => {
  assert.equal(manifest.id, 'foundry-nav-order');
  assert.equal(manifest.title, 'AFT Navbar+');
  assert.equal(manifest.manifest, stable);
  assert.equal(pkg.version, manifest.version);
});

test('download stays versioned so future upgrades and rollbacks are deterministic', () => {
  assert.equal(manifest.download,
    'https://github.com/rebsiot/navbar-customizer/releases/download/v' +
    manifest.version + '/foundry-nav-order-' + manifest.version + '.zip');
});

test('CI promotes stable branch only after successful validation and release', () => {
  const checked = workflow.indexOf('Verify module syntax and tests');
  const packaged = workflow.indexOf('Assemble and verify version-matched package');
  const released = workflow.indexOf('Publish versioned beta ZIP and manifest');
  const promoted = workflow.indexOf('Promote permanent update channel only after release is verified');
  assert.ok(checked > 0 && checked < packaged && packaged < released && released < promoted);
  assert.match(workflow, /contents\/module\.json/);
  assert.match(workflow, /ref=update-channel/);
  assert.match(workflow, /grep -Fxq 'module\.json'/);
  assert.match(workflow, /\.version == \$version and \.download == \$download and \.manifest == \$manifest/);
});
