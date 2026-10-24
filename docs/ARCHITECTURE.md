# Architecture — SayFill v0.3

- Browser extension: the same UI, form scanner and review/fill code on Firefox and Chrome. `scripts/build-extensions.mjs` generates browser-specific Manifest V3 packages. Firefox desktop + Android use a shared `action.default_popup` and event-page background script; Chrome desktop uses `sidePanel` and a service worker. Firefox Android does not support sidebars.
- Vercel: `public/` static frontend and `api/health.js`, `api/map.js`, `api/transcribe.js` serverless routes. Shared logic in `lib/api-core.js`.
- Groq: audio transcription with whisper-large-v3-turbo, field mapping with llama-3.3-70b-versatile by default. Secret stored only in Vercel environment.
- Privacy: no saved profile and no auto-submit; audio/transcript and form field descriptors sent for AI processing. Review before applying.
- Security: sensitive/consent fields blocked; 4MB upload limit; optional SAYFILL_ACCESS_CODE beta gate. For public release add production-grade per-user quotas and rate limiting.
