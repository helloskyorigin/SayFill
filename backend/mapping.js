'use strict';

const SAFE_FIELD_KINDS = new Set(['text', 'email', 'tel', 'number', 'date', 'textarea', 'select', 'checkbox', 'radio', 'url']);
const UNSAFE_LABEL = /\b(password|passcode|security code|one.time|otp|captcha|cvv|cvc|card number|credit card|debit card|upi pin|aadhaar|aadhar|social security|ssn|pan number|bank account|routing number|terms|consent|privacy policy|marketing opt.in)\b/i;

function sanitizeFields(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  return input.slice(0, 100).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const id = String(item.id || '').slice(0, 64);
    const label = String(item.label || '').slice(0, 180);
    const kind = String(item.kind || '').toLowerCase();
    if (!/^sf-\d+$/.test(id) || seen.has(id) || !SAFE_FIELD_KINDS.has(kind) || !label || UNSAFE_LABEL.test(label)) return [];
    seen.add(id);
    const options = Array.isArray(item.options)
      ? item.options.slice(0, 40).map((o) => ({value: String(o?.value || '').slice(0, 100), label: String(o?.label || '').slice(0, 140)}))
      : [];
    return [{id, label, kind, required: Boolean(item.required), options}];
  });
}

function validateAssignments(raw, fields) {
  const byId = new Map(fields.map((field) => [field.id, field]));
  const assigned = new Set();
  const assignments = [];
  for (const row of (Array.isArray(raw) ? raw : []).slice(0, fields.length)) {
    if (!row || typeof row !== 'object') continue;
    const fieldId = String(row.fieldId || '');
    const field = byId.get(fieldId);
    if (!field || assigned.has(fieldId)) continue;
    let value;
    if (field.kind === 'checkbox') {
      if (typeof row.value !== 'boolean') continue;
      value = row.value;
    } else {
      if (typeof row.value !== 'string' && typeof row.value !== 'number') continue;
      value = String(row.value).trim().slice(0, 500);
      if (!value) continue;
      if (field.kind === 'number' && !Number.isFinite(Number(value))) continue;
      if (field.kind === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) continue;
      if (field.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) continue;
      if (field.kind === 'select' || field.kind === 'radio') {
        const option = field.options.find((o) => o.value.toLowerCase() === value.toLowerCase() || o.label.toLowerCase() === value.toLowerCase());
        if (!option) continue;
        value = option.value;
      }
    }
    assigned.add(fieldId);
    assignments.push({fieldId, value});
  }
  return assignments;
}

module.exports = {sanitizeFields, validateAssignments, UNSAFE_LABEL};
