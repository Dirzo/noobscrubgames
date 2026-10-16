# Noobscrub Games

Official studio site for noobscrubgames.com.

## Develop

```bash
npm install
npm run dev
```

## Deploy

Ensure the domain is an active Cloudflare zone and authenticate Wrangler:

```bash
npx wrangler login
npm run deploy
```

The Worker serves static files from `public/` and maps to `noobscrubgames.com`. GitHub pushes alone do not deploy until CI is configured.
