Vercel deployment notes

Purpose
- Ensure the app uses a writable directory on Vercel (Vercel’s build/runtime filesystem is largely read-only).

Recommended environment variable
- Name: LOCAL_DB_DIR
- Value (recommended for Vercel): /tmp/.adis-ot-connect-dashboard/.data
- Reason: `/tmp` is writable at runtime on Vercel. The app falls back to this path when it cannot create the project-local `.data`.

Set the env var in the Vercel dashboard
1. Open your project on Vercel
2. Settings → Environment Variables → Add
   - Key: LOCAL_DB_DIR
   - Value: /tmp/.adis-ot-connect-dashboard/.data
   - Apply to: Preview and Production (or Preview while testing)

Set via Vercel CLI
```bash
npm i -g vercel
vercel env add LOCAL_DB_DIR preview
# paste: /tmp/.adis-ot-connect-dashboard/.data
# repeat for production if desired
```

Redeploy
```bash
# create a preview deployment
vercel
# or production
vercel --prod
```

Check logs after testing login
```bash
vercel logs <project-or-deployment-url> --since 10m
```

Local test (optional)
```bash
pnpm install
pnpm dev
# or
npm install
npm run dev
```

Notes / caveats
- Data written to `/tmp` is ephemeral: it will not persist across cold starts or redeploys. This is fine for testing and small local-first workflows; for real persistence use an external DB.
- If you want true persistent local hosting later, run the app locally and allow the app to use the project-local `.data` directory (no env override needed).
- To reseed the default admin, delete `.data/local-db.json` in the repository root (when running locally) or remove the file under whatever `LOCAL_DB_DIR` you are using.

What changed
- `lib/local-db.ts` now attempts writable fallbacks (project `.data`, system temp dir, `/tmp`) and surfaces clearer errors if none are writable.

If you'd like, I can also add a short GitHub Actions workflow to deploy a preview automatically; tell me if you want that.
