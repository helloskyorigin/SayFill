import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const manifest = (browser) => JSON.parse(fs.readFileSync(path.join(root, 'dist', browser, 'manifest.json'), 'utf8'));

test('Firefox build supports Android popup and desktop popup from same artifact', () => {
  const ff = manifest('firefox');
  assert.equal(ff.manifest_version, 3);
  assert.equal(ff.action.default_popup, 'sidepanel.html');
  assert.equal(ff.sidebar_action, undefined);
  assert.equal(ff.side_panel, undefined);
  assert.equal(ff.background.scripts[0], 'background.js');
  assert.equal(ff.browser_specific_settings.gecko.id, 'sayfill@skyorigin.app');
  assert.ok(ff.permissions.includes('activeTab'));
  assert.ok(ff.permissions.includes('scripting'));
});

test('Chrome desktop retains side panel behavior', () => {
  const ch = manifest('chrome');
  assert.equal(ch.side_panel.default_path, 'sidepanel.html');
  assert.equal(ch.action.default_popup, undefined);
  assert.equal(ch.background.service_worker, 'background.js');
});

test('Both builds default to the deployed backend without hardcoding secrets', () => {
  for (const target of ['firefox', 'chrome']) {
    const ui = fs.readFileSync(path.join(root, 'dist', target, 'sidepanel.js'), 'utf8');
    assert.match(ui, /https:\/\/sayfill-five\.vercel\.app/);
    assert.doesNotMatch(ui, /gsk_[a-zA-Z0-9]+/);
  }
});
