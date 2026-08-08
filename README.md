# AI Voice Diary 🎙️

An AI-powered voice diary web app. Record a voice note and it is transcribed,
stripped of filler words, categorized, and folded into a daily summary — with
support for English and Hindi.

## Features

- **Voice recording** — start / pause / stop / replay in the browser (MediaRecorder API)
- **Speech-to-text** — Google Gemini (free tier), auto-detects spoken language
- **Filler-word removal** — "um", "uh", "hmm" (and Hindi fillers) cleaned by AI
- **AI categorization** — Ideas · Memories · Reflections · Reminders · Important Events
- **Daily summary** — one AI-generated summary stored per diary day
- **Timeline** — browse previous days and entries
- **Multi-language** — English, Hindi, and Telugu (UI + transcription + summaries)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS 4 |
| AI | Gemini 3.6 Flash — transcription, cleanup, categorization, summaries |
| Database + audio storage | Supabase (Postgres + Storage) |
| Hosting | Vercel |

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier).
   Open the SQL Editor and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
   This creates the `entries` and `daily_summaries` tables and a public `audio` storage bucket.

3. **Get a Gemini API key** at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (free tier).

4. **Configure environment** — copy `.env.example` to `.env.local` and fill in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=      # Supabase → Project Settings → API
   SUPABASE_SERVICE_ROLE_KEY=     # Supabase → Project Settings → API (service_role)
   GEMINI_API_KEY=                # Google AI Studio
   ```

5. **Run**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 — microphone access requires `localhost` or HTTPS.

## Deployment (Vercel)

Import the GitHub repo into Vercel, add the three environment variables above,
and deploy. No other configuration is needed.

## Architecture notes & assumptions

- **Single-user demo** — no authentication. All database access goes through
  Next.js API routes using the Supabase service role key; RLS stays enabled so
  the public anon key can't read the tables.
- **Audio flows through the API route** (webm/opus is ~150 KB per minute, well
  under Vercel's 4.5 MB request limit — roughly 20 minutes of audio headroom).
- **One AI call per entry** — Gemini receives the audio and returns transcript,
  cleaned transcript, category, and detected language as structured JSON.
- **Free-tier rate limits** — Gemini free tier allows ~10 requests/min, ample
  for diary usage.

## AI models used

- `gemini-3.6-flash` — speech-to-text, filler-word removal, categorization,
  and daily summaries. (2.5-flash is gated for new API accounts, so the
  newest stable Flash model is used instead.)

## Roadmap

- [x] Phase 1 — scaffold, Supabase schema, typed clients, env config
- [x] Phase 2 — recorder component (start/pause/stop/replay)
- [x] Phase 3 — transcription + AI processing pipeline (`POST/GET /api/entries`)
- [x] Phase 4 — diary timeline UI (day grouping, category badges, raw/clean toggle, audio playback)
- [x] Phase 5 — daily summaries (on-demand generation, stale-summary refresh)
- [x] Phase 6 — English/Hindi/Telugu UI toggle (persisted, localized dates and category labels)
- [ ] Phase 7 — polish and deploy
