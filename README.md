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

## Google Drive sync setup
The app now supports per-user subscription sync through Google Drive `appDataFolder`, but you must configure a Google OAuth client first.

1. Open Google Cloud Console.
2. Create or choose a project.
3. Enable the Google Drive API.
4. Configure the OAuth consent screen.
5. Create an OAuth 2.0 `Web application` client.
6. Add this Authorized JavaScript origin:
   - `https://smssjs.github.io`
7. Copy the generated client ID.
8. Open the deployed app, go to Configure, paste the client ID into the `Google OAuth client ID` field, and click `Save Client ID`.
9. Click `Connect Google Drive` and approve Drive access.

Notes:
- The app stores subscriptions in the signed-in user's private Drive `appDataFolder`.
- The synced file name is `thenewspaperguy-subscriptions.json`.
- Local browser storage still works as a fallback and local cache.

## Lean MVP with Firebase
The app also includes a lean MVP layer for:
- Google sign-in through Firebase Auth
- Firestore-backed cloud subscription profiles
- Subscriber counting
- Donation link support

### Morning setup checklist
1. Create a Firebase project.
2. Add a web app to the Firebase project.
3. Enable `Authentication -> Sign-in method -> Google`.
4. Create a Firestore database.
5. Deploy this site with Firebase Hosting.
6. Copy the Firebase web config JSON into the app's `Firebase MVP` panel in Configure.
7. Save your donation URL in the donation field.

### Firebase Hosting deploy
1. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in:
   ```bash
   firebase login
   ```
3. Replace `YOUR_FIREBASE_PROJECT_ID` inside `.firebaserc.template`, then rename it to `.firebaserc`.
4. Deploy:
   ```bash
   firebase deploy
   ```

### Firebase web config fields
Use the object from `Project settings -> Your apps -> SDK setup and configuration`. The app expects JSON with at least:
- `apiKey`
- `authDomain`
- `projectId`
- `appId`

### Firestore data used by the app
- `users/{uid}`
  Stores user profile metadata, feed count, and the user's cloud-synced feeds.
- `global/metrics`
  Stores a simple `subscriberCount` field for MVP tracking.

### Donations
The MVP donation support is a configurable external link. Save a Stripe Payment Link, Buy Me a Coffee URL, Ko-fi URL, or similar into the donation field in the app.

### Notes
- This is an MVP and does not yet include hardened Firestore security rules or Stripe webhook automation.
- Google Drive sync remains available as a user-owned backup path.
