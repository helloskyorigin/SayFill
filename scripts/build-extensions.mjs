import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const common=path.join(root,'extension');
for(const target of ['firefox','chrome']){
  const dest=path.join(root,'dist',target);
  fs.rmSync(dest,{recursive:true,force:true}); fs.mkdirSync(dest,{recursive:true});
  for(const file of fs.readdirSync(common)){
    if(file==='manifest.json')continue;
    fs.copyFileSync(path.join(common,file),path.join(dest,file));
  }
  const m={manifest_version:3,name:'SayFill — Speak once. Fill everything.',short_name:'SayFill',description:'Multilingual voice form filler with user review before applying answers.',version:'0.2.0',permissions:['activeTab','scripting','storage'],host_permissions:['https://*.vercel.app/*','http://localhost:8080/*'],action:{default_title:'Open SayFill',default_icon:{16:'icon16.png',32:'icon32.png'}},icons:{16:'icon16.png',32:'icon32.png',48:'icon48.png',128:'icon128.png'},content_security_policy:{extension_pages:"script-src 'self'; object-src 'self'"}};
  if(target==='firefox') {
    m.browser_specific_settings={gecko:{id:'sayfill@skyorigin.app',strict_min_version:'140.0',data_collection_permissions:{required:['websiteContent','personallyIdentifyingInfo','personalCommunications']}}};
    m.background={scripts:['background.js']};
    m.sidebar_action={default_title:'SayFill',default_panel:'sidepanel.html',default_icon:{16:'icon16.png',32:'icon32.png'}};
  } else {
    m.minimum_chrome_version='114';m.permissions.push('sidePanel');
    m.background={service_worker:'background.js'};m.side_panel={default_path:'sidepanel.html'};
  }
  fs.writeFileSync(path.join(dest,'manifest.json'),JSON.stringify(m,null,2)+'\n');
  console.log(`${target}: ${dest}`);
}
