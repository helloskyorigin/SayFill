# SayFill — Speak once. Fill everything. 🎙️

**Firefox Android + Firefox desktop + Chrome desktop voice form filler.** Say your answers in Hindi, English, Hinglish or another supported language, review the AI suggestions, and fill supported form fields without automatic submission.

## Project layout

| Directory | Purpose |
|---|---|
| `extension/` | Shared source for both browser extensions |
| `scripts/build-extensions.mjs` | Creates Firefox + Chrome browser-specific manifests |
| `api/`, `lib/` | Vercel Function endpoints powered by Groq |
| `public/` | Static landing website, demo form and legal pages on the same Vercel deployment |
| `backend/` | Older standalone Node server retained for local development and its mapping validation tests |

## Build both extensions

```sh
npm run build:extensions
npm test
npm run check
```

Output: `dist/firefox/` and `dist/chrome/`. **Do not upload the entire repository ZIP to an extension store**; zip the contents of the correct browser build folder. Prebuilt `SayFill-Firefox.zip` and `SayFill-Chrome.zip` may also be provided alongside this repository.

### Firefox desktop test (free, no add-on store account)

1. Open Firefox desktop at `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and select `dist/firefox/manifest.json` or an extracted file from `SayFill-Firefox-Desktop-Android.zip`.
3. Open `https://sayfill-five.vercel.app/demo.html`, click SayFill's **toolbar icon**; a **popup** opens (not a sidebar).
4. Review the backend URL (pre-set to `https://sayfill-five.vercel.app`), click **Scan**, speak or type dummy answers, **Understand my answers**, review, and **Fill selected fields**.

Temporary add-ons disappear when Firefox fully restarts.

### Firefox Android: SAME Firefox source package, different install process

Firefox for Android does **not** support `sidebar_action`. This version uses Manifest V3 `action.default_popup`, presented in the Firefox Android **Extensions/Add-ons** menu, and works as a toolbar popup on desktop Firefox. Firefox Android microphone capture still requires device testing and permission; typing a transcript is available as fallback.

**Unsigned ZIP is not a mobile install file.** First submit the **Firefox build ZIP** at [Mozilla Add-on Developer Hub](https://addons.mozilla.org/developers/) for Mozilla signing/review (no Chrome Web Store account needed). Once published/approved, users can install it from `addons.mozilla.org/android` using Firefox Android: menu → Extensions → find SayFill → Add. Alternatively Mozilla supports installing an already **signed** `.xpi` from file. No Mozilla signing, store review or Android device audio test has happened yet.

**Do not claim mobile support is confirmed until tested on actual Android Firefox.** Some sites and microphone permissions may behave differently. The same Firefox package targets both Firefox desktop and Android, not Android Chrome.

### Install Chrome locally

Open `chrome://extensions/`, switch on Developer mode, **Load unpacked**, and select `dist/chrome/`. Click SayFill in toolbar to open Chrome's Side Panel. Other Chromium browsers with the Chrome sidePanel API may work but are not individually tested.

## Deploy API + website to Vercel (no Google Cloud)

1. Import `helloskyorigin/SayFill` into Vercel as an **Other** framework with the **repository root** as project directory. The repo's `vercel.json` uses static output `public/` plus separate `/api/*` functions.
2. Set `GROQ_API_KEY` as a **secret** in Vercel project Environment Variables; never commit it to GitHub or paste it into frontend files.
3. Optional but recommended before sharing: set `SAYFILL_ACCESS_CODE` (private beta access code) and put the same code into your own extension's Settings. This helps restrict casual unauthorized API use but is not a full public authentication or distributed rate-limiting solution.
4. Deploy and open `https://<your-project>.vercel.app/api/health` (`configured: true` means `GROQ_API_KEY` is set). Open the homepage and `/demo.html`.
5. The default SayFill backend points to `https://sayfill-five.vercel.app`; adjust it in the SayFill popup/settings only if using a different deployment. The permission allowlist currently accepts HTTPS hosts under `*.vercel.app` (or `http://localhost:8080` locally); custom domains require a matching manifest permission and new extension build.

Vercel Functions allow ~4.5 MB request bodies, so the extension caps uploads at 4 MB and records for at most 35 seconds per chunk. No database, no account and no automatic submission. **Groq usage and Vercel usage may incur costs.** Enable spending limits/monitoring and production-grade abuse controls before a public launch.

## Local API option

Node 22+:

```sh
cd backend
cp .env.example .env
# add GROQ_API_KEY to .env (never commit)
npm run dev
```

Use `http://localhost:8080` as the extension backend URL while testing. Alternatively use `vercel dev` at the repository root if your Vercel CLI is configured.

## Privacy and limitations

SayFill sends audio, dictated text and **form field labels and options** to your configured API and on to Groq; do not test with sensitive personal data. It does *not* send existing form field values, store profiles, or auto-submit. Protected fields (passwords, OTP, banking/payment details, government ID numbers, consent checkboxes) are excluded from automated matching by the MVP. Complex custom widgets, shadow DOM, cross-origin iframes, some reactive forms, protected pages and CAPTCHA may not work.

Source and automated tests are verified; real browser microphone-to-Groq end-to-end testing and Firefox Android installation/signing are pending. See `docs/BUILD_STATUS.md`.
