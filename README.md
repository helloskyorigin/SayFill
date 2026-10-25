# PaperCue AI
**Every notice. A clear next step.**

PaperCue helps students turn Hindi/English scholarship, school, exam, or admission notices into evidence-aware action plans.

This repository **replaces the old SayFill extension codebase** by explicit request. The original SayFill content remains recoverable in earlier Git history (before this commit).

## How to run
```bash
npm install
cp .env.example .env.local
# Add GEMINI_API_KEY privately in .env.local
npm run dev
```
For Vercel: import this repo as a Next.js app, set server-side `GEMINI_API_KEY` in the Vercel project settings. Optional `GEMINI_MODEL` defaults to `gemini-2.5-flash`. Never add the real key to Git.

## Features
- Upload PDF/JPG/PNG/WEBP (8 MB max), or paste plain notice text.
- Gemini document analysis with structured JSON validation and explicit unknowns.
- Evidence is **only marked quote-matched for pasted text**, and requires review for uploaded file scans.
- Printable text checklist + `.ics` calendar export; **no automatic reminder notification**.
- Explicitly fictional, offline sample for judge/demo walkthrough.
- Responsive student-friendly UI, no user sign-up or payment.

## Privacy / limitations
Uploads are transmitted to Google Gemini to perform analysis. Do not upload private documents without understanding provider retention. The app does not maintain its own database, and its in-memory rate limit is best-effort only. AI can misread dates or requirements: always verify the original official notice.

## Quality
```bash
npm test
npm run lint
npm run build
```
Requires network access to install dependencies. The real Gemini endpoint cannot be verified without a configured API key. Disclose AI tooling in hackathon submission.
