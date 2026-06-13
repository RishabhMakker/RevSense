# Running RevSense locally

A step-by-step guide to get the app running on your machine. For the full
project overview, features, and architecture, see [README.md](README.md).

## Prerequisites

- **Node.js 20 or newer** — check with `node --version`
- **npm** (ships with Node) — check with `npm --version`

That's it. No database, no Docker, no separate backend server to start.

## 1. Install

From the project root (the folder containing this file):

```bash
npm install
```

This installs both workspaces (`frontend` and `backend`) at once.

## 2. Run the dev server

```bash
npm run dev
```

Then open **http://localhost:3000** in your browser.

- Walk through the wizard at **/diagnose** with your own input, or
- Jump straight to the demo: **http://localhost:3000/diagnose?demo=1** and
  click **Run diagnosis** for an instant sample triage report (no microphone
  or API key needed).

The app is **fully functional with no configuration** — it runs the built-in
rule-based engine. AI enhancement is optional (see below).

## 3. (Optional) Enable AI explanations

The app works without any API key. To let an LLM rewrite the explanations for
your specific case:

```bash
cp frontend/.env.example frontend/.env.local
```

Then open `frontend/.env.local` and uncomment one of:

| Variable | Effect |
|---|---|
| `ANTHROPIC_API_KEY` | Enables Claude-powered explanations |
| `OPENAI_API_KEY` | Alternative provider |
| `OPENROUTER_API_KEY` | Free option — get a key at [openrouter.ai/keys](https://openrouter.ai/keys) and use a `:free` model |
| `AI_PROVIDER` | Force `anthropic` \| `openai` \| `openrouter` \| `none` (default: auto-detect) |
| `AI_MODEL` | Model override (defaults: `claude-opus-4-8` / `gpt-4o-mini` / `nvidia/nemotron-3-super-120b-a12b:free`) |

Restart `npm run dev` after editing. Visit `/api/status` to confirm AI mode is
active. The engine's safety verdict always wins, even with AI on.

## Other commands

All run from the project root:

```bash
npm test           # backend engine tests (vitest)
npm run typecheck  # type-check backend + frontend
npm run lint       # eslint (frontend)
npm run build      # production build
npm run start      # serve the production build (after npm run build)
```

## Verify the backend without the UI

With `npm run dev` running:

```bash
curl http://localhost:3000/api/status        # is an AI key configured?
curl http://localhost:3000/api/demo          # canned demo diagnosis
curl -X POST http://localhost:3000/api/diagnose \
  -H "Content-Type: application/json" \
  -d @samples/demo-request.json               # full round-trip
```

See [samples/README.md](samples/README.md) for expected output.

## Troubleshooting

- **Microphone doesn't work** — browser mic capture requires `https://` or
  `localhost` and explicit permission. The demo flow (`/diagnose?demo=1`)
  needs no microphone.
- **Port 3000 in use** — run on another port: `npm run dev -- -p 3001`.
- **Old Node version** — Next.js 16 needs Node 20+. Upgrade if `node
  --version` is below 20.

## Deploying to Vercel

See the **Deploying to Vercel** section in [README.md](README.md#deploying-to-vercel-free-tier).
