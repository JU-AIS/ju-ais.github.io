# JU AIS website

Static site for Jönköping University AI Student Association. Astro, vanilla TypeScript, CSS. Deployed to GitHub Pages.

## Run

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # output in dist/
```

## Where things live

| What | Where |
|---|---|
| Name, Join/Discord links, emails | `src/config.ts` |
| Colors and fonts | `src/styles/theme.css` |
| Logo | `public/logo.svg` (light bg), `public/logo-dark.svg` (dark bg), `public/favicon.svg` |
| Events | `src/content/events/<slug>/index.md` (+ images in the same folder) |

## Add an event

Create `src/content/events/<slug>/index.md`:

```md
---
title: Prompt Battle
date: 2026-12-08T18:00:00+01:00
location: Rio, Jönköping University
type: social            # hackathon | lecture | workshop | social | company visit
cover: ./cover.jpg      # optional, keep under ~2–3 MB
coverAlt: Students at the battle
signup: https://forms.gle/...
photos: [./1.jpg, ./2.jpg]   # optional recap photos for past events
---

Description in markdown.
```

The event links directly to its modal at `/#<slug>` and `/events#<slug>`. Events move to "Past events" the day after `date`; a nightly GitHub Action rebuilds the site.

## Deploy

Push to `main`. Requires repo Settings → Pages → Source: GitHub Actions.
