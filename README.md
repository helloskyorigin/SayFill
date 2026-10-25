# PaperCue AI — Notice to Action

Every notice. A clear next step. This student hackathon prototype extracts actions, evidence excerpts, important dates and a checklist from notices.

## Run and deploy
```bash
npm install
cp .env.example .env.local
# Set GROQ_API_KEY (server-side only)
npm test
npm run lint
npm run build
npm run dev
```
Import the repository into Vercel as a Next.js project and set `GROQ_API_KEY` in Vercel Environment Variables. `GROQ_MODEL` is optional (default: `qwen/qwen3.8-27b`, currently a vision-capable preview model requiring Groq access). No Gemini API is called.

## Inputs and evidence
- Paste plain notice text (max 18,000 characters).
- Upload PNG/JPG/WEBP (max 3 MB). Sent as a vision input to Groq; AI-read image quotes are **not independently verified**.
- Upload text-based PDF (max 3 MB); first 10 pages parsed into selectable text server-side via `pdf-parse`. Quotes can be string-matched against extracted text. Scanned PDFs do not work: use a screenshot (PNG/JPG).
- Quote matching demonstrates only string presence, not interpretation accuracy, date correctness, official authority or eligibility.
- Typed JSON validation and conservative date validation. Ambiguous dates should remain unknown.
- Checklist TXT export and .ics calendar file download; no auto-notifications or application submission.
- Fictional demo data is clearly labeled; don't present as real scanning.

## Privacy and limitations
Uploaded text/images go to Groq to run inference. Don't upload IDs or private student records. No app database. In-memory IP limiter is best-effort and not shared between Vercel instances; install a shared limiter/WAF before heavy public traffic. Verify every deadline against the original official notice. Groq account quotas/costs may apply.

## Submission preparation
- [ ] npm install, npm test, npm run lint, npm run build
- [ ] Add server-side GROQ_API_KEY; test real English text, Hindi photo and PDF; check 413 and timeout behavior.
- [ ] Verify mobile layout and readability; produce a 90–120s genuine demo of a live scan.
- [ ] Link repository and deployed URL on Devpost; follow original-build timing rules and disclose Groq + AI coding tools.
