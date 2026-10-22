# Noobscrub Games

Official studio site for noobscrubgames.com.

## Develop

```bash
npm install
npm run dev
```

## Deploy

Every push to `main` deploys through the GitHub Actions workflow in `.github/workflows/deploy.yml`. To redeploy without a push, open the Actions tab, pick Deploy and click Run workflow. It needs two repository secrets: `CLOUDFLARE_API_TOKEN` (a token from the "Edit Cloudflare Workers" template) and `CLOUDFLARE_ACCOUNT_ID`.

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

## Game cards

The three game cards on the homepage (`public/img/cards/`) are built from real gameplay frames in `art-src/cards/`, captured from each game's own renderer, with lettering in Crazy Weapon Man's 5x7 bitmap font. To change a frame, crop or colour, edit `tools/build-cards.py` and rebuild (needs Python with Pillow):

```bash
python3 tools/build-cards.py
```
