# Akros Eco Estate media (Konkok/cms)

Photos, videos and blog articles for [akrosecoestate.com](https://akrosecoestate.com).
Published with GitHub Pages; the website loads everything from here.

```
images/
  properties/<villa>/   villa photos (voukamvilia, gardenia, dafni, elia, thymari, rodia)
  gallery/              photos used only in the homepage gallery
  general/              estate-wide photos (views, chapel, …)
  blog/                 article cover and inline images
  hero/                 (the hero poster stays in the website repo for load speed)
videos/
  hero/                 hero-loop.mp4 (1080p), hero-loop-720.mp4 (phones), promo.mp4
blog/
  <slug>.md             one article per file; _TEMPLATE.md shows the format
scripts/build.mjs       builds the published site (_site/)
(the publish workflow is at the repo root: .github/workflows/publish.yml)
```

Paths in the website and in articles are relative to this repo, e.g.
`images/blog/my-photo.jpg`.

## Publishing a blog article

1. In `blog/`, create `my-article-name.md` (lowercase, numbers, dashes). The file
   name becomes the address: `/blog/my-article-name`.
2. Start it with front matter, then write Markdown (see `blog/_TEMPLATE.md`):

   ```
   ---
   title: "5 Day Trips from Nea Epidavros"
   date: "2026-11-03"
   description: "One or two sentences for the blog list, Google and social previews."
   image: "images/blog/5-day-trips-from-nea-epidavros.jpg"
   ---
   ```
3. Upload the cover image (and any inline images) to `images/blog/`.
4. Commit to `main`.

The **Publish media** action then validates the article, builds image sizes,
publishes to GitHub Pages and triggers a rebuild of the website, which
prerenders the article for search engines and adds it to `sitemap.xml`.
Allow about 5–10 minutes. If the action fails (red ✗ under *Actions*), its log
names the file and the problem; nothing is published until it is fixed.

## Images

Upload JPEG or PNG originals, ideally 1600–2400px wide. The build writes
480/1000/1600px AVIF, WebP and JPEG versions next to each one
(`photo-480.avif`, …); the website picks the right one per screen. Originals
are never enlarged, so a 1000px photo tops out at 1000px.

## Videos

GitHub Pages bandwidth is limited (see below), so compress before committing.
Masters live in `_masters/` locally (git-ignored, keep a backup elsewhere):

```sh
# 1080p background loop, no audio, ~5 Mbps
ffmpeg -i master.mp4 -an -c:v libx264 -preset slow -crf 23 -maxrate 5M -bufsize 10M \
  -pix_fmt yuv420p -movflags +faststart videos/hero/hero-loop.mp4
# 720p version for phones, ~2.5 Mbps
ffmpeg -i master.mp4 -an -vf scale=-2:720 -c:v libx264 -preset slow -crf 24 -maxrate 2500k -bufsize 5M \
  -pix_fmt yuv420p -movflags +faststart videos/hero/hero-loop-720.mp4
# promo with audio
ffmpeg -i master.mp4 -c:v libx264 -preset slow -crf 23 -maxrate 5M -bufsize 10M \
  -c:a aac -b:a 128k -pix_fmt yuv420p -movflags +faststart videos/hero/promo.mp4
```

Keep every file under 50 MB (GitHub warns above 50 MB and rejects above 100 MB).

## One-time setup

1. This folder lives in the **public** repo https://github.com/Konkok/cms; the
   workflow is at the repo root in `.github/workflows/publish.yml`.
2. *Settings → Pages → Build and deployment → Source:* **GitHub Actions**.
3. In Vercel: project → *Settings → Git → Deploy Hooks* → create a hook
   (name `media`, branch `main`) and copy its URL.
4. Here: *Settings → Secrets and variables → Actions → New repository secret*
   `VERCEL_DEPLOY_HOOK_URL` = that URL. It is a secret: anyone with it can
   trigger builds, so never commit it.
5. In Vercel: *Settings → Environment Variables* → `VITE_ASSET_BASE_URL` =
   `https://konkok.github.io/cms/` (Production and Preview),
   then redeploy.

## Limits

GitHub Pages: 1 GB published size, a soft 100 GB/month bandwidth limit, and
~10 builds/hour. The hero video is by far the largest cost: about 32 MB per
desktop visit and 15 MB per phone visit, so 100 GB covers roughly 3,000–6,500
homepage visits a month with the video. If traffic grows past that, move the
videos to a dedicated video host.

Local build: `npm ci && npm run build` (output in `_site/`).
