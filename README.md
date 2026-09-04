# Vault

A one-page tool: open it on your work machine, drop in files/zips or paste a link,
and it lands in a Google Drive folder you already own. Open your Drive at home to
grab it. No login screen — access is a secret link.

## 1. Google Drive setup (one-time)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a
   new project (any name, e.g. "vault").
2. **APIs & Services → Library** → search "Google Drive API" → Enable.
3. **APIs & Services → Credentials → Create Credentials → Service account.**
   Give it any name, skip the optional role/access steps, click Done.
4. Open the new service account → **Keys** tab → **Add Key → Create new key → JSON**.
   This downloads a `.json` file — keep it private, never commit it to git.
5. In Google Drive, create a folder (e.g. "Vault") that you'll upload into.
   Right-click it → **Share** → paste the service account's email address
   (looks like `something@your-project.iam.gserviceaccount.com`, found inside
   the JSON file as `client_email`) → give it **Editor** access.
6. Copy the folder's ID from its URL:
   `drive.google.com/drive/folders/`**`THIS_PART`**

## 2. Generate your access token

Run this once, locally, and save the output:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

This becomes your `ACCESS_KEY`. Nobody else can open your Vault without it.

## 3. Deploy to Vercel

1. Push this project to a GitHub repo (private is fine).
2. Go to [vercel.com/new](https://vercel.com/new) → import that repo.
3. Before the first deploy, open **Settings → Environment Variables** and add:
   - `ACCESS_KEY` — the token from step 2
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — the entire contents of the downloaded
     JSON key file, pasted as one line
   - `DRIVE_FOLDER_ID` — the folder ID from step 1.6
4. Deploy.

## 4. Bookmark your link

Your app URL will be something like `https://vault-yourname.vercel.app`.
Visit it once as:

```
https://vault-yourname.vercel.app/?key=YOUR_ACCESS_KEY
```

This sets a cookie so future visits need no query param — bookmark the clean
URL after that first visit. Open the bookmark on your work browser and the
upload page is ready immediately, no login step.

## Notes and limits

- **File size:** Vercel serverless functions cap request bodies (a few MB on
  the Hobby plan). This build handles everyday files and reasonably sized
  zips comfortably; for very large archives, split them or upgrade to a
  resumable/direct-to-Drive upload flow later.
- **Security:** the token lives in a cookie after first visit (`HttpOnly`,
  not readable by page scripts). If you ever think it's leaked, just generate
  a new `ACCESS_KEY` in Vercel's dashboard and redeploy — the old link stops
  working instantly.
- **Local dev:** copy `.env.example` to `.env.local`, fill in the three
  values, then `npm install && npm run dev`.
