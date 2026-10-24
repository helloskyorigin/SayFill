import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
for(const file of ['lib/api-core.js','api/health.js','api/map.js','api/transcribe.js','extension/background.js','extension/content.js','extension/sidepanel.js','scripts/build-extensions.mjs']) {
  execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'inherit'});
}
execFileSync(process.execPath,[path.join(root,'scripts/build-extensions.mjs')],{stdio:'inherit'});
for(const target of ['firefox','chrome']) {
  const m=JSON.parse(fs.readFileSync(path.join(root,'dist',target,'manifest.json'),'utf8'));
  if(m.manifest_version!==3)throw Error('bad manifest');
  if(target==='firefox') {
    if(m.sidebar_action)throw Error('Firefox Android cannot use a sidebar');
    if(m.action?.default_popup!=='sidepanel.html')throw Error('Firefox mobile/desktop popup missing');
    if(!m.browser_specific_settings?.gecko?.id)throw Error('Firefox Gecko ID missing');
  }
  if(target==='chrome'&&!m.side_panel)throw Error('missing Chrome panel');
}
console.log('SayFill syntax + browser manifests passed');
