# Verifying the backend independently

With the dev server running (`npm run dev` from the repo root):

```bash
# 1. Health/status — shows whether an AI key is configured
curl http://localhost:3000/api/status

# 2. Canned demo diagnosis (deterministic, heuristic engine only)
curl http://localhost:3000/api/demo

# 3. Full POST round-trip with the sample payload in this folder
curl -X POST http://localhost:3000/api/diagnose \
  -H "Content-Type: application/json" \
  -d @samples/demo-request.json
```

Expected for (3): JSON with `causes[0].id === "cv-axle-wear"` at ~72%
confidence, `steering-shaft-column` and `strut-mount` in the top ranks, an
overall verdict of "Drive gently and get it checked soon", a
`whatToCheckFirst` list, and a `mechanicScript` paragraph. With an
`ANTHROPIC_API_KEY` configured, `mode` becomes `"ai-enhanced"` and causes
gain `aiNote` fields.

Validation check — a bad request returns structured errors:

```bash
curl -X POST http://localhost:3000/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{"vehicle":{"make":"","model":"","year":1900},"symptomText":"hm","contexts":[]}'
```
