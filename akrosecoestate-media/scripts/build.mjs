// Builds the GitHub Pages site into _site/:
//  - copies images/, videos/ and blog/ (except files starting with "_")
//  - writes 480/1000/1600px AVIF, WebP and JPEG versions of every JPEG/PNG
//    in images/, named photo-480.avif, photo-480.webp, photo-480.jpg, …
//  - writes blog/index.json: every article's front matter, newest first
// Fails on an invalid article, so a broken post never reaches the website.
// Run by .github/workflows/publish.yml on every push; `npm run build` locally.
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const OUT = '_site'
// Must match WIDTHS in the website's src/media.js.
const WIDTHS = [480, 1000, 1600]
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(p)
    else yield p
  }
}

const exists = (p) => fs.access(p).then(() => true, () => false)

// Skips work already done by an earlier local run (CI always starts clean).
async function upToDate(out, src) {
  const [o, s] = await Promise.all([fs.stat(out).catch(() => null), fs.stat(src)])
  return o && o.mtimeMs >= s.mtimeMs
}

async function copy(src) {
  const out = path.join(OUT, src)
  if (await upToDate(out, src)) return
  await fs.mkdir(path.dirname(out), { recursive: true })
  await fs.copyFile(src, out)
}

async function variants(src) {
  const base = path.join(OUT, src).replace(/\.[^.]+$/, '')
  const jobs = []
  for (const w of WIDTHS) {
    // Never upscale: a 1000px original gives a 1000px "-1600" file too.
    const resized = () => sharp(src).rotate().resize({ width: w, withoutEnlargement: true })
    const targets = {
      avif: (img) => img.avif({ quality: 50, effort: 4 }),
      webp: (img) => img.webp({ quality: 75 }),
      jpg: (img) => img.flatten({ background: '#ffffff' }).jpeg({ quality: 78, mozjpeg: true }),
    }
    for (const [ext, encode] of Object.entries(targets)) {
      const out = `${base}-${w}.${ext}`
      if (!(await upToDate(out, src))) jobs.push(encode(resized()).toFile(out))
    }
  }
  await Promise.all(jobs)
  return jobs.length
}

// Same rules as parseFrontMatter in the website's src/blog.js.
function parseFrontMatter(raw) {
  const match = raw.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/)
  if (!match) return null
  const meta = {}
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*?)\s*$/)
    if (!m) continue
    let value = m[2]
    if (/^".*"$/.test(value)) {
      try { value = JSON.parse(value) } catch { value = value.slice(1, -1) }
    } else if (/^'.*'$/.test(value)) {
      value = value.slice(1, -1).replace(/''/g, "'")
    } else {
      value = value.replace(/\s+#.*$/, '')
    }
    meta[m[1]] = value
  }
  return meta
}

async function article(file) {
  const slug = path.basename(file, '.md')
  const fail = (msg) => { throw new Error(`${file}: ${msg}`) }
  if (!SLUG.test(slug)) fail('file name must be lowercase letters, numbers and dashes, e.g. my-article.md')
  const meta = parseFrontMatter(await fs.readFile(file, 'utf8'))
  if (!meta) fail('missing front matter (the lines between --- at the top)')
  if (!meta.title) fail('missing title')
  if (!DATE.test(meta.date || '') || isNaN(Date.parse(meta.date))) fail('date must be YYYY-MM-DD')
  const image = meta.image || ''
  if (image && !/^https?:\/\//.test(image) && !(await exists(image.replace(/^(\.{0,2}\/)+/, '')))) {
    fail(`image not found in this repo: ${image}`)
  }
  return { slug, title: meta.title, date: meta.date, description: meta.description || '', image }
}

let images = 0
let encoded = 0
for await (const file of walk('images')) {
  await copy(file)
  if (/\.(jpe?g|png)$/i.test(file)) {
    images++
    encoded += await variants(file)
  }
}
console.log(`images: ${images} originals, ${encoded} variants written`)

if (await exists('videos')) for await (const file of walk('videos')) await copy(file)

const posts = []
for await (const file of walk('blog')) {
  if (!file.endsWith('.md')) continue
  posts.push(await article(file))
  await copy(file)
}
posts.sort((a, b) => b.date.localeCompare(a.date))
await fs.mkdir(path.join(OUT, 'blog'), { recursive: true })
await fs.writeFile(path.join(OUT, 'blog', 'index.json'), JSON.stringify(posts, null, 2))
console.log(`blog: ${posts.length} articles -> ${OUT}/blog/index.json`)
