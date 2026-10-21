# Noobscrub Games

Official studio site for noobscrubgames.com.

## Develop

```bash
npm install
npm run dev
```

## Deploy

Cloudflare Workers Builds is connected to this repo: every push to `main` runs `npx wrangler deploy` and puts the site live. Check progress in the Cloudflare dashboard under Workers & Pages, noobscrubgames, Deployments.

To deploy by hand instead:

```bash
npx wrangler login
npm run deploy
```

The Worker serves static files from `public/` and maps to `noobscrubgames.com`.

## Game intros

`public/js/splash.js` (the Noobscrub Games logo skits) and `public/sol-intro.html` (the Siege of Legends opening cinematic) are generated from the game repo. After changing them in [Dirzo/manatorium](https://github.com/Dirzo/manatorium), rebuild:

```bash
node tools/build-intros.mjs ../manatorium
```
