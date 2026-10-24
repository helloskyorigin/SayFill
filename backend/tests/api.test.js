'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

async function openPort() {
  return new Promise(resolve => {const sock=net.createServer();sock.listen(0,'127.0.0.1',()=>{const port=sock.address().port;sock.close(()=>resolve(port));});});
}

test('backend health, audio and field mapping contracts using mock Groq', async () => {
  const port=await openPort();
  const cwd=path.resolve(__dirname,'..');
  const child=spawn(process.execPath,['--require',path.join(__dirname,'mock-groq.js'),'server.js'],{
    cwd, env:{...process.env, PORT:String(port), GROQ_API_KEY:'test-placeholder'},stdio:['ignore','pipe','pipe']
  });
  try {
    let live=false;
    for(let n=0;n<30;n++) {
      try {const response=await fetch('http://127.0.0.1:'+port+'/api/health');if(response.ok){live=true;break;}}catch{}
      await new Promise(r=>setTimeout(r,60));
    }
    assert.equal(live,true,'API should launch');
    const origin='chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const speech=await fetch('http://127.0.0.1:'+port+'/api/transcribe',{method:'POST',headers:{'Content-Type':'audio/webm',Origin:origin},body:Buffer.from('test-audio')});
    assert.equal(speech.status,200);
    assert.equal(speech.headers.get('access-control-allow-origin'),origin);
    assert.match((await speech.json()).text,/Rahul Kumar/);
    const mapped=await fetch('http://127.0.0.1:'+port+'/api/map',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({speech:'My name is Rahul Kumar',fields:[{id:'sf-1',label:'Full Name',kind:'text',required:true}]})});
    assert.equal(mapped.status,200);
    assert.deepEqual((await mapped.json()).assignments,[{fieldId:'sf-1',value:'Rahul Kumar'}]);
    const forbidden=await fetch('http://127.0.0.1:'+port+'/api/health',{headers:{Origin:'https://untrusted.example'}});
    assert.equal(forbidden.status,403);
  } finally {child.kill('SIGTERM');}
});
