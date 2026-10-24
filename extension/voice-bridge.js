// Trusted first-party recorder → transient local transcript for Firefox popup.
(() => {
  const api = globalThis.browser || globalThis.chrome;
  const origin = 'https://sayfill-five.vercel.app';
  if (location.origin !== origin || location.pathname !== '/voice.html') return;
  window.addEventListener('message', async event => {
    if (event.source !== window || event.origin !== origin) return;
    const data = event.data;
    if (data?.source !== 'sayfill-voice-page' || data.type !== 'TRANSCRIPT') return;
    if (typeof data.text !== 'string' || !data.text.trim() || data.text.length > 5000) return;
    try {
      await api.storage.local.set({pendingVoiceTranscript:{text:data.text.trim(), time:Date.now()}});
      window.postMessage({source:'sayfill-extension',type:'SAVED'},origin);
    } catch {
      window.postMessage({source:'sayfill-extension',type:'SAVE_FAILED'},origin);
    }
  });
})();
