import test from 'node:test';
import assert from 'node:assert/strict';
import {health,transcribe,map} from '../lib/api-core.js';

test('Vercel health GET is available without API key', async()=>{
  const response=health(new Request('https://sayfill.vercel.app/api/health'));
  assert.equal(response.status,200);
  assert.equal((await response.json()).service,'sayfill-api');
});
test('Firefox and Chrome extension origins are allowed', async()=>{
  const ff=health(new Request('https://sayfill.vercel.app/api/health',{headers:{origin:'moz-extension://123e4567-e89b-12d3-a456-426614174000'}}));
  const ch=health(new Request('https://sayfill.vercel.app/api/health',{headers:{origin:'chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}}));
  assert.match(ff.headers.get('access-control-allow-origin'),/moz-extension/);
  assert.match(ch.headers.get('access-control-allow-origin'),/chrome-extension/);
});
test('POST requires Groq configuration',async()=>{
  const old=process.env.GROQ_API_KEY; delete process.env.GROQ_API_KEY;
  const res=await map(new Request('https://sayfill.vercel.app/api/map',{method:'POST',body:JSON.stringify({speech:'Rahul',fields:[{id:'sf-1',label:'Full name',kind:'text'}]})}));
  assert.equal(res.status,503);
  if(old)process.env.GROQ_API_KEY=old;
});
test('Firefox transcription accepts audio/ogg via Groq mock',async()=>{
  const old=global.fetch; const key=process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY='test_key';
  global.fetch=async (u,opts)=>{
    assert.equal(u,'https://api.groq.com/openai/v1/audio/transcriptions');
    assert.match(opts.headers.Authorization,/test_key/);
    assert.equal(opts.body.get('file').name,'speech.ogg');
    return Response.json({text:'Mera naam Rahul hai'});
  };
  try {
    const req=new Request('https://sayfill.vercel.app/api/transcribe',{method:'POST',headers:{'content-type':'audio/ogg'},body:new Uint8Array([1,2,3,4])});
    const res=await transcribe(req);assert.equal(res.status,200);assert.equal((await res.json()).text,'Mera naam Rahul hai');
  } finally{global.fetch=old;if(key)process.env.GROQ_API_KEY=key;else delete process.env.GROQ_API_KEY;}
});
test('Vercel mapper validates assignments returned by Groq',async()=>{
  const old=global.fetch;const key=process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY='test_key';
  global.fetch=async()=>Response.json({choices:[{message:{content:JSON.stringify({assignments:[{fieldId:'sf-1',value:'Rahul Kumar'},{fieldId:'sf-2',value:'secret'}]})}}]});
  try{
    const req=new Request('https://sayfill.vercel.app/api/map',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({speech:'Mera naam Rahul Kumar hai',fields:[{id:'sf-1',label:'Full name',kind:'text',required:true},{id:'sf-2',label:'Password',kind:'text'}]})});
    const res=await map(req);assert.equal(res.status,200);const data=await res.json();
    assert.deepEqual(data.assignments,[{fieldId:'sf-1',value:'Rahul Kumar'}]);
  }finally{global.fetch=old;if(key)process.env.GROQ_API_KEY=key;else delete process.env.GROQ_API_KEY;}
});
