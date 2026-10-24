# SayFill Firefox Android + desktop / Vercel build status — 24 October 2026

- [x] Chrome desktop and Firefox desktop/Android Manifest V3 generated from the same extension source.
- [x] Firefox shared action popup (NO sidebar_action) + Gecko ID and data-collection permissions; intended for Firefox desktop + Android.
- [x] Chrome native sidePanel maintained.
- [x] New Vercel `/api/health`, `/api/map` and `/api/transcribe` functions.
- [x] Audio upload constrained to 4 MB to stay below Vercel's 4.5 MB limit.
- [x] Static website + demo under `public/` for Vercel.
- [x] Source syntax + mapping/API mock tests.
- [ ] Live Firefox desktop + Android browser microphone integration test.
- [ ] Firefox Android mobile UI/device verification and store signing.
- [ ] Live Groq API integration (requires user's Vercel GROQ_API_KEY).
- [x] Production project created and latest deployment reports READY on Vercel (website and Groq API need end-to-end smoke checks).
- [ ] Mozilla add-on signing and publishing; Chrome Web Store publishing.

Do not claim the add-on is store-approved or that it works on every website/browser.
