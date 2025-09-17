# Needix — Notifications & Reminders

This project supports:

- Local notifications on iOS/Android via Capacitor
- Web Notifications (while tab is open)
- Web Push (background) via Service Worker and VAPID (optional)
- Server-side reminder dispatch via Vercel Cron (optional)

## Web Push Setup (Vercel)

1) Generate VAPID keys (one-time)

```
npx web-push generate-vapid-keys
```

Copy the generated public/private keys.

2) Add env vars on Vercel Project → Settings → Environment Variables

- `VAPID_PUBLIC_KEY=...`
- `VAPID_PRIVATE_KEY=...`
- `VAPID_SUBJECT=mailto:you@example.com` (or your site URL)
- `NEXT_PUBLIC_ENABLE_WEB_PUSH=1`

Deploy. The dashboard Reminders panel will show Web Push controls. Click “Subscribe Push” then “Send Push Test”.

## Server-Side Scheduling (Cron)

Background delivery requires a small store and a cron task to send due reminders even when the user is offline.

We support Upstash Redis. Create an Upstash Redis database and add these env vars in Vercel:

- `UPSTASH_REDIS_REST_URL=...`
- `UPSTASH_REDIS_REST_TOKEN=...`

Then add a Vercel Cron Job (Project → Settings → Cron Jobs):

- Path: `/api/cron/dispatch-reminders`
- Schedule: every 5 minutes (`*/5 * * * *`)

### How it works

- When you subscribe to Web Push (Reminders panel → Subscribe), the client saves your PushSubscription to `/api/push/save-subscription`.
- When reminders are enabled, the dashboard uploads a snapshot of your reminder settings and subscription items to `/api/reminders/snapshot` (lead days, time of day, timezone offset, and minimal item data).
- The cron route `/api/cron/dispatch-reminders` scans all snapshots, determines which renewals are due in the current window, and sends a push via the saved subscription.

Notes:

- If Upstash env vars are not set, the server-side scheduling is a no-op (web push test still works client-side).
- The cron route uses a 5‑minute window to tolerate schedule skew; adjust in `app/api/cron/dispatch-reminders/route.ts` if you schedule at a different cadence.

## iOS/Android Local Notifications

The Capacitor app includes `@capacitor/local-notifications`. On iOS, run once to install pods:

```
export LANG=en_US.UTF-8
npx cap sync ios
```

Then open `ios/App/App.xcworkspace` in Xcode and run on device. Local notifications fire at your selected reminder time.

## Google OAuth (local)

Use `http://localhost:3000`, not a LAN IP. In Google Cloud Console add:

- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

For quick testing without Google:

- `.env.local`
  - `ENABLE_DEV_AUTH=1`
  - `NEXT_PUBLIC_ENABLE_DEV_AUTH=1`

The Sign‑in page exposes a “Development Login” button when enabled.

