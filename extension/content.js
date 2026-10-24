(() => {
  'use strict';
  if (globalThis.__sayfillContentInstalled) return;
  globalThis.__sayfillContentInstalled = true;
  let activeFields = new Map();
  const unsafe = /\b(password|passcode|otp|one.time|security code|verification code|captcha|cvv|cvc|credit card|debit card|card number|upi pin|aadhaar|aadhar|social security|ssn|pan number|bank account|routing number|terms|consent|privacy policy|marketing opt.in)\b/i;
  const supportedTypes = new Set(['text', 'email', 'tel', 'number', 'date', 'url', 'checkbox', 'radio']);

  function tidy(str) { return String(str || '').replace(/\s+/g, ' ').trim(); }
  function labelFor(element) {
    const explicit = tidy(element.getAttribute('aria-label'));
    const associated = element.labels ? [...element.labels].map(label => tidy(label.innerText || label.textContent)).find(Boolean) : '';
    const fallback = tidy(element.getAttribute('placeholder')) || tidy(element.name) || tidy(element.id);
    const ownLabel = explicit || associated || fallback;
    if (element.type === 'radio') {
      const legend = tidy(element.closest('fieldset')?.querySelector('legend')?.textContent);
      return tidy([legend, ownLabel].filter(Boolean).join(' · ')).slice(0, 180);
    }
    return ownLabel.slice(0, 180);
  }
  function fieldKind(element) {
    if (element.tagName === 'TEXTAREA') return 'textarea';
    if (element.tagName === 'SELECT') return 'select';
    const type = (element.type || 'text').toLowerCase();
    return supportedTypes.has(type) ? type : null;
  }
  function isUsable(element) {
    if (element.disabled || element.readOnly || element.closest('[inert]')) return false;
    if (!element.getClientRects().length) return false;
    const style = getComputedStyle(element);
    if (style.visibility === 'hidden' || style.display === 'none') return false;
    return !element.closest('[aria-hidden="true"]');
  }
  function scan() {
    activeFields = new Map();
    const fields = [];
    const candidates = document.querySelectorAll('input, textarea, select');
    for (const element of candidates) {
      if (fields.length >= 100) break;
      const kind = fieldKind(element);
      if (!kind || !isUsable(element)) continue;
      const label = labelFor(element);
      if (!label || unsafe.test(label) || unsafe.test(tidy(element.autocomplete))) continue;
      const id = 'sf-' + (fields.length + 1);
      const options = [];
      if (kind === 'select') {
        for (const option of Array.from(element.options).slice(0, 40)) {
          if (!option.disabled && option.value !== '') options.push({value: option.value.slice(0, 100), label: tidy(option.textContent).slice(0, 140)});
        }
      } else if (kind === 'radio') {
        options.push({value: String(element.value || 'on').slice(0, 100), label: label.slice(0, 140)});
      }
      activeFields.set(id, element);
      fields.push({id, label, kind, required: element.required, options});
    }
    return {fields, url: location.origin + location.pathname};
  }
  function setNative(element, property, value) {
    const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype :
      element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, property)?.set;
    if (setter) setter.call(element, value);
    else element[property] = value;
  }
  function apply(items) {
    const applied = [], skipped = [];
    for (const item of Array.isArray(items) ? items : []) {
      const field = activeFields.get(item?.fieldId);
      if (!field || !field.isConnected || !isUsable(field)) { skipped.push({fieldId: item?.fieldId, reason: 'Field unavailable; rescan this page'}); continue; }
      const kind = fieldKind(field);
      const label = labelFor(field);
      if (!kind || unsafe.test(label)) { skipped.push({fieldId: item.fieldId, reason: 'Protected field'}); continue; }
      try {
        if (kind === 'checkbox') {
          if (typeof item.value !== 'boolean') throw Error('Expected yes/no');
          setNative(field, 'checked', item.value);
        } else if (kind === 'radio') {
          if (String(item.value) !== String(field.value)) throw Error('Invalid choice');
          setNative(field, 'checked', true);
        } else if (kind === 'select') {
          const option = [...field.options].find(o => !o.disabled && (o.value === String(item.value) || tidy(o.textContent).toLowerCase() === String(item.value).toLowerCase()));
          if (!option) throw Error('Choice not available');
          setNative(field, 'value', option.value);
        } else {
          const value = String(item.value ?? '').slice(0, 500);
          if (kind === 'number' && !Number.isFinite(Number(value))) throw Error('Invalid number');
          if (kind === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error('Invalid date');
          setNative(field, 'value', value);
        }
        field.dispatchEvent(new Event('input', {bubbles: true}));
        field.dispatchEvent(new Event('change', {bubbles: true}));
        applied.push({fieldId: item.fieldId, label});
      } catch (error) { skipped.push({fieldId: item.fieldId, reason: error.message}); }
    }
    return {applied, skipped};
  }
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (message?.type === 'SAYFILL_SCAN') { reply(scan()); return false; }
    if (message?.type === 'SAYFILL_APPLY') { reply(apply(message.assignments)); return false; }
    return false;
  });
})();
