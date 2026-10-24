import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const common = path.join(root, 'extension');

for (const target of ['firefox', 'chrome']) {
  const dest = path.join(root, 'dist', target);
  fs.rmSync(dest, {recursive: true, force: true});
  fs.mkdirSync(dest, {recursive: true});
  for (const file of fs.readdirSync(common)) {
    if (file === 'manifest.json') continue;
    fs.copyFileSync(path.join(common, file), path.join(dest, file));
  }
  const m = {
    manifest_version: 3,
    name: 'SayFill — Speak once. Fill everything.',
    short_name: 'SayFill',
    description: 'Fill supported website forms by speaking Hindi, English, Hinglish or other languages. Review every answer first.',
    version: '0.4.0',
    permissions: ['activeTab', 'scripting', 'storage'],
    host_permissions: ['https://*.vercel.app/*', 'http://localhost:8080/*'],
    action: {
      default_title: 'Open SayFill',
      default_icon: {16: 'icon16.png', 32: 'icon32.png'}
    },
    icons: {16:'icon16.png',32:'icon32.png',48:'icon48.png',128:'icon128.png'},
    content_security_policy: {extension_pages: "script-src 'self'; object-src 'self'"}
  };
  if (target === 'firefox') {
    // Firefox for Android DOES NOT support sidebar_action. The action popup
    // opens as a mobile overlay and works as a desktop toolbar popup as well.
    m.action.default_popup = 'sidepanel.html';
    m.content_scripts = [{matches:['https://sayfill-five.vercel.app/voice.html*'], js:['voice-bridge.js'], run_at:'document_start'}];
    m.browser_specific_settings = {
      gecko: {
        id: 'sayfill@skyorigin.app',
        strict_min_version: '140.0',
        data_collection_permissions: {required: ['websiteContent', 'personallyIdentifyingInfo', 'personalCommunications']}
      },
      // Explicitly mark Android as supported when AMO evaluates this package.
      // No desktop-only sidebars, Windows APIs, or service workers.
    };
    m.background = {scripts: ['background.js']};
  } else {
    m.minimum_chrome_version = '114';
    m.permissions.push('sidePanel');
    m.background = {service_worker: 'background.js'};
    m.side_panel = {default_path: 'sidepanel.html'};
  }
  fs.writeFileSync(path.join(dest, 'manifest.json'), JSON.stringify(m, null, 2) + '\n');
  console.log(`${target}: ${dest}`);
}
