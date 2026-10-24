'use strict';
const ext = globalThis.browser || globalThis.chrome;
const $ = id => document.getElementById(id);
const state = {tabId: null, fields: [], recording: false, recorder: null, stream: null, chunks: [], pending: [], busy: false, backend: 'https://sayfill-five.vercel.app', accessCode: ''};
const ui = {
  status: $('status'), scan: $('scanBtn'), pageTitle: $('pageTitle'), pageInfo: $('pageInfo'),
  record: $('recordBtn'), recordLabel: $('recordLabel'), speech: $('speechText'),
  understand: $('understandBtn'), review: $('reviewSection'), assignments: $('assignments'),
  count: $('matchedCount'), missing: $('missing'), fill: $('fillBtn'),
  settings: $('settings'), backendUrl: $('backendUrl'), settingsToggle: $('settingsToggle'), saveSettings: $('saveSettings'), accessCode: $('accessCode')
};
function setStatus(text, type = '') {
  ui.status.textContent = text;
  ui.status.className = 'status' + (type ? ' ' + type : '');
}
function setBusy(busy) {
  state.busy = busy;
  ui.scan.disabled = busy;
  ui.record.disabled = busy && !state.recording;
  ui.understand.disabled = busy;
  ui.fill.disabled = busy;
}
function normalizeBackend(raw) {
  try {
    const url = new URL(raw.trim());
    const local = /^(localhost|127\.0\.0\.1)$/.test(url.hostname);
    if (!(url.protocol === 'https:' || (url.protocol === 'http:' && local))) throw Error('Use HTTPS, or localhost for development');
    if (url.username || url.password || url.search || url.hash) throw Error('Provide a plain service URL');
    if (!(local || url.hostname.endsWith('.vercel.app'))) throw Error('Use a Vercel .vercel.app URL (or localhost).');
    return url.origin;
  } catch (e) { throw Error(e.message || 'Invalid backend URL'); }
}
async function scanPage() {
  if (state.busy) return;
  setBusy(true);
  ui.review.classList.add('hidden');
  try {
    const [tab] = await ext.tabs.query({active: true, currentWindow: true});
    if (!Number.isInteger(tab?.id) || !/^https?:\/\//.test(tab.url || '')) throw Error('Open a normal http(s) form page (not chrome://, Web Store, or a browser settings page).');
    state.tabId = tab.id;
    await ext.scripting.executeScript({target: {tabId: tab.id}, files: ['content.js']});
    const result = await ext.tabs.sendMessage(tab.id, {type: 'SAYFILL_SCAN'});
    state.fields = result.fields || [];
    ui.pageTitle.textContent = state.fields.length ? state.fields.length + ' fillable fields found' : 'No supported form fields found';
    ui.pageInfo.textContent = tab.title || result.url || 'Current tab';
    setStatus(state.fields.length ? 'Form connected. Speak your answers or type them below.' : 'Try a page with visible form fields; hidden steps and embedded third-party frames are not supported.', state.fields.length ? 'success' : '');
  } catch (e) {
    state.tabId = null;
    state.fields = [];
    ui.pageTitle.textContent = 'Cannot read this page';
    setStatus(e.message || 'Could not access the form. Reopen SayFill from the browser toolbar to grant this tab access.', 'error');
  } finally {setBusy(false);}
}
function clearRecording() {
  state.recording = false;
  ui.record.classList.remove('recording');
  ui.recordLabel.textContent = 'Tap to speak';
  ui.record.setAttribute('aria-label', 'Start recording');
  if (state.stream) state.stream.getTracks().forEach(t => t.stop());
  state.stream = null;
}
async function send(path, options) {
  const response = await fetch(state.backend + path, {...options, headers: {...(options?.headers || {}), ...(state.accessCode ? {'X-SayFill-Access': state.accessCode} : {})}});
  let data;
  try {data = await response.json();} catch {throw Error('Backend did not return JSON. Check your Vercel or localhost URL.');}
  if (!response.ok) throw Error(data.error || 'Server error (' + response.status + ')');
  return data;
}
async function startRecording() {
  try {
    if (!navigator.mediaDevices?.getUserMedia || !globalThis.MediaRecorder) throw Error('Microphone recording is not available here. You can type instead.');
    const stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true}});
    const mimeType = ['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/webm','audio/ogg','audio/mp4'].find(t => MediaRecorder.isTypeSupported(t));
    if (!mimeType) {stream.getTracks().forEach(t => t.stop()); throw Error('This browser cannot produce a supported audio recording.');}
    state.stream = stream;
    state.chunks = [];
    const recorder = new MediaRecorder(stream, {mimeType});
    state.recorder = recorder;
    recorder.ondataavailable = ev => {if (ev.data.size) state.chunks.push(ev.data);};
    recorder.onerror = () => {clearRecording(); setStatus('Audio recording failed. Please try again.', 'error');};
    recorder.onstop = async () => {
      const audio = new Blob(state.chunks, {type: mimeType});
      if (audio.size > 4 * 1024 * 1024) {clearRecording(); setStatus('Recording too large. Please record a shorter message.', 'error'); return;}
      clearRecording();
      if (!audio.size) {setStatus('No audio recorded. Try again.', 'error'); return;}
      setBusy(true);
      setStatus('Transcribing your speech with AI...');
      try {
        const result = await send('/api/transcribe', {method: 'POST', headers: {'Content-Type': mimeType}, body: audio});
        ui.speech.value = [ui.speech.value.trim(), result.text].filter(Boolean).join('\n');
        setStatus('Voice transcribed. Check the text, then click Understand my answers.', 'success');
      } catch (e) {setStatus(e.message, 'error');} finally {setBusy(false);}
    };
    recorder.start();
    state.recording = true;
    ui.record.classList.add('recording');
    ui.recordLabel.textContent = 'Recording... tap to stop';
    ui.record.setAttribute('aria-label', 'Stop recording');
    setStatus('Listening. Speak naturally in your preferred language.');
    // Stop before oversized uploads; the user can record another chunk afterward.
    setTimeout(() => {if (state.recording && state.recorder === recorder) recorder.stop();}, 35000);
  } catch (e) {clearRecording(); setStatus(e.message || 'Microphone permission denied.', 'error');}
}
function toggleRecording() {
  if (state.recording) {state.recorder.stop(); return;}
  if (!state.busy) startRecording();
}
function makeReviewRow(assignment, index) {
  const field = state.fields.find(f => f.id === assignment.fieldId);
  if (!field) return null;
  const row = document.createElement('div'); row.className = 'assignment';
  const check = document.createElement('input'); check.type = 'checkbox'; check.checked = true; check.setAttribute('aria-label', 'Include ' + field.label);
  const wrapper = document.createElement('div');
  const label = document.createElement('label'); label.textContent = field.label;
  let editor;
  if (field.kind === 'select' || field.kind === 'radio') {
    editor = document.createElement('select');
    field.options.forEach(opt => {const o = document.createElement('option'); o.value = opt.value; o.textContent = opt.label; editor.appendChild(o);});
    editor.value = String(assignment.value);
  } else if (field.kind === 'checkbox') {
    editor = document.createElement('select');
    for (const v of ['true','false']) {const o = document.createElement('option'); o.value = v; o.textContent = v === 'true' ? 'Yes' : 'No'; editor.appendChild(o);}
    editor.value = String(assignment.value);
  } else {
    editor = document.createElement('input'); editor.type = 'text'; editor.value = String(assignment.value); editor.maxLength = 500;
  }
  label.htmlFor = 'value-' + index; editor.id = label.htmlFor;
  row.append(check); wrapper.append(label, editor); row.append(wrapper);
  return {row, check, editor, field};
}
let editableRows = [];
async function understand() {
  if (state.busy) return;
  const speech = ui.speech.value.trim();
  if (!speech) {setStatus('Please record or type your answers first.', 'error'); return;}
  if (!state.fields.length || !state.tabId) {setStatus('Scan a form page first.', 'error'); return;}
  setBusy(true); setStatus('Matching your answers to fields. Nothing will be filled until you review.');
  try {
    const result = await send('/api/map', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({speech, fields: state.fields})});
    editableRows = [];
    ui.assignments.replaceChildren();
    result.assignments.forEach((item, i) => {
      const built = makeReviewRow(item, i);
      if (built) {editableRows.push(built); ui.assignments.appendChild(built.row);}
    });
    ui.count.textContent = editableRows.length + ' matched';
    ui.review.classList.remove('hidden');
    const missing = Array.isArray(result.missing) ? result.missing : [];
    ui.missing.classList.toggle('hidden', !missing.length);
    ui.missing.textContent = missing.length ? 'Still needed: ' + missing.map(x => x.label).slice(0, 8).join(', ') + '. You can say these details next, or fill them manually.' : '';
    setStatus(editableRows.length ? 'Review the proposed answers below, then click Fill selected fields.' : 'Could not confidently match any answers. Try giving clearer details.', editableRows.length ? 'success' : '');
  } catch (e) {setStatus(e.message, 'error');} finally {setBusy(false);}
}
async function fillForm() {
  if (state.busy) return;
  const assignments = editableRows.filter(x => x.check.checked).map(x => ({fieldId: x.field.id, value: x.field.kind === 'checkbox' ? x.editor.value === 'true' : x.editor.value}));
  if (!assignments.length) {setStatus('Select at least one answer to fill.', 'error'); return;}
  setBusy(true);
  try {
    const result = await ext.tabs.sendMessage(state.tabId, {type: 'SAYFILL_APPLY', assignments});
    const ok = result.applied?.length || 0, skipped = result.skipped?.length || 0;
    setStatus(ok + ' fields filled' + (skipped ? '; ' + skipped + ' could not be filled' : '') + '. Check the form yourself before submitting.', ok ? 'success' : 'error');
  } catch (e) {setStatus('Could not fill: page may have navigated. Scan again.', 'error');} finally {setBusy(false);}
}
async function init() {
  const saved = await ext.storage.local.get(['backendUrl','accessCode']);
  if (saved.backendUrl) state.backend = saved.backendUrl;
  state.accessCode = saved.accessCode || '';
  ui.accessCode.value = state.accessCode;
  ui.backendUrl.value = state.backend;
  ui.settingsToggle.addEventListener('click', () => ui.settings.classList.toggle('hidden'));
  ui.saveSettings.addEventListener('click', async () => {
    try {state.backend = normalizeBackend(ui.backendUrl.value); state.accessCode = ui.accessCode.value.trim(); await ext.storage.local.set({backendUrl: state.backend, accessCode: state.accessCode}); ui.settings.classList.add('hidden'); setStatus('Backend URL saved.', 'success');}
    catch (e) {setStatus(e.message, 'error');}
  });
  ui.scan.addEventListener('click', scanPage);
  ui.record.addEventListener('click', toggleRecording);
  ui.understand.addEventListener('click', understand);
  ui.fill.addEventListener('click', fillForm);
  if (!state.backend.startsWith('https://') && state.backend !== 'http://localhost:8080') state.backend = 'https://sayfill-five.vercel.app';
  ui.backendUrl.value = state.backend;
  await scanPage();
}
init().catch(e => setStatus(e.message || 'Could not initialize SayFill.', 'error'));
