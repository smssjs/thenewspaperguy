# RSS Reader Pages Deploy

This folder is ready for GitHub Pages.

## Files
- `index.html` — main app entry point for GitHub Pages

## Important note
This app is mostly self-contained, but RSS loading depends on public proxy endpoints used by the page's JavaScript. GitHub Pages can host the static HTML, but it does not provide a backend. If one of those public proxies is unavailable, some feeds may fail to load.

## Publish steps
1. Create a new GitHub repository, for example `rss-reader`.
2. In this folder, run:
   ```bash
   git branch -M main
   git add .
   git commit -m "Initial GitHub Pages site"
   git remote add origin https://github.com/YOUR_USERNAME/rss-reader.git
   git push -u origin main
   ```
3. On GitHub, open:
   `Settings -> Pages`
4. Set:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Your site URL will be:
   `https://YOUR_USERNAME.github.io/rss-reader/`

## Local preview
Open `index.html` in a browser, or serve the folder with a local static server.
