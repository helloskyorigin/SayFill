'use strict';
// Test-only HTTP mock: never used in production. Helps verify the proxy contract.
globalThis.fetch = async (url, options) => {
  if (url.endsWith('/audio/transcriptions')) {
    return {ok: true, json:async () => ({text:'My name is Rahul Kumar and my city is Patna'})};
  }
  if (url.endsWith('/chat/completions')) {
    const request = JSON.parse(options.body);
    const payload = JSON.parse(request.messages[1].content);
    const field = payload.fields.find(x => x.label.toLowerCase().includes('full name'));
    return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({assignments:field?[{fieldId:field.id,value:'Rahul Kumar'}]:[]})}}]})};
  }
  return {ok:false,status:404,json:async()=>({})};
};
