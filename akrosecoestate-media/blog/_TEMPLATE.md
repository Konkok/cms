---
title: "Your article title"
date: "2026-11-03"
description: "One or two sentences shown on the blog list, in Google results and when the link is shared."
image: "images/blog/your-cover-image.jpg"
---

How to publish an article:

1. Copy this file into `blog/` and rename it. The file name becomes the address:
   `best-beaches-near-epidavros.md` → `/blog/best-beaches-near-epidavros`.
   Use lowercase letters, numbers and dashes only.
2. Fill in the four lines between the `---` marks. Keep the quotes.
   - `title` and `date` are required. `date` is YYYY-MM-DD and sets the order (newest first).
   - `description` is strongly recommended (Google and social previews use it).
   - `image` is optional: a path in this repo, such as `images/blog/my-photo.jpg`,
     or a full `https://` address.
3. Upload images to `images/blog/` (JPEG or PNG). Smaller versions in modern
   formats are generated automatically when the site is published.
4. Write the article below the second `---` in Markdown:

## A heading

Normal paragraphs, **bold**, *italic*, [a link to another site](https://example.com),
[a link to this site](/#availability) and lists:

- one
- two

1. first
2. second

> A quote or tip.

![Image description](images/blog/your-image.jpg)

Files whose name starts with `_` (like this one) are never published.
