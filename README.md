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

## Game intros

`public/js/splash.js` (the Noobscrub Games logo skits) and `public/sol-intro.html` (the Siege of Legends opening cinematic) are generated from the game repo. After changing them in [Dirzo/manatorium](https://github.com/Dirzo/manatorium), rebuild:

```bash
node tools/build-intros.mjs ../manatorium
```
