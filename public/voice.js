// Android Firefox microphone runs on this HTTPS page, not in an extension popup.
(() => {
  const $ = id => document.getElementById(id);
  const mic = $('mic'), status = $('status'), hint = $('hint'), transcript = $('transcript');
  let recorder, stream, chunks = [], recording = false, startedAt = 0;
  function show(text, error=false) {status.textContent=text; status.className=error?'error':'';status.id='status';}
  function clear() {
    recording=false;mic.setAttribute('aria-pressed','false');mic.textContent='🎙';hint.textContent='Tap to speak';
    if (stream) stream.getTracks().forEach(track=>track.stop());
    stream=null;
  }
  function sendToExtension() {
    const text=transcript.value.trim();
    if(!text) return show('Please record or enter an answer first.',true);
    window.postMessage({source:'sayfill-voice-page',type:'TRANSCRIPT',text:text.slice(0,5000)},location.origin);
    show('Sending to SayFill… If extension is not detected, use Copy text.');
  }
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin || event.source!==window || event.data?.source!=='sayfill-extension')return;
    const ok=event.data.type==='SAVED';
    show(ok?'✅ Saved! Switch to your form tab, reopen SayFill, and tap Understand my answers.':'Could not save. Use Copy text and paste into SayFill.',!ok);
  });
  mic.addEventListener('click',async()=>{
    if(recording){recorder.stop();return;}
    try {
      if(!navigator.mediaDevices?.getUserMedia || !globalThis.MediaRecorder) throw Error('Microphone recording not supported.');
      stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mime=['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/webm','audio/ogg','audio/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
      if(!mime) throw Error('No supported audio recording format.');
      recorder=new MediaRecorder(stream,{mimeType:mime});chunks=[];startedAt=Date.now();
      recorder.ondataavailable=event=>{if(event.data?.size)chunks.push(event.data);};
      recorder.onerror=()=>{clear();show('Recording failed. Check browser microphone permissions.',true);};
      recorder.onstop=async()=>{
        const audio=new Blob(chunks,{type:mime});clear();
        if(!audio.size || audio.size>4*1024*1024){show('Audio is empty or too large. Record a shorter message.',true);return;}
        show('Transcribing your speech with Groq AI…');mic.disabled=true;
        try {
          const code=$('code').value.trim();
          const response=await fetch('/api/transcribe',{method:'POST',headers:{'Content-Type':mime,...(code?{'X-SayFill-Access':code}:{})},body:audio});
          const data=await response.json();
          if(!response.ok) throw Error(data.error||'AI transcription failed ('+response.status+')');
          transcript.value=data.text||'';$('result').style.display='block';sendToExtension();
        } catch(e) {show(e.message||'Transcription failed. Check your API key.',true);}
        finally{mic.disabled=false;}
      };
      recorder.start();recording=true;mic.setAttribute('aria-pressed','true');mic.textContent='■';hint.textContent='Recording — tap to stop';
      show('Listening. Speak naturally in your preferred language.');
      setTimeout(()=>{if(recording&&Date.now()-startedAt>=30000)recorder.stop();},30000);
    } catch(e) {
      clear();
      show('Microphone blocked. Android Settings → Apps → Firefox Nightly → Permissions → Microphone → Allow. ('+(e.message||e.name)+')',true);
    }
  });
  $('saveBtn').addEventListener('click',sendToExtension);
  $('copyBtn').addEventListener('click',async()=>{
    try {await navigator.clipboard.writeText(transcript.value);show('Copied. Return to SayFill and paste your text.');}
    catch {transcript.focus();transcript.select();show('Long-press selected text to copy.');}
  });
})();
