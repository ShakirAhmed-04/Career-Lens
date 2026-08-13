# CareerLens

An AI-powered career platform (MERN stack) with resume upload & AI analysis, an AI chat mentor, a skill-gap roadmap, progress tracking, and an interactive **Resume Builder** that exports both an ATS-friendly and a Simple/styled PDF (auto-fit to 1-2 pages).

## Project structure

```
careerlens/
├── client/     # React 19 + Vite frontend
└── server/     # Express + MongoDB backend (auth, AI, resume parsing)
```

## Tech stack

- **Client:** React, React Router, Vite, Tailwind CSS, Axios, Framer Motion, jsPDF (resume export), Lucide icons
- **Server:** Express, MongoDB/Mongoose, Passport (Google OAuth), express-session + connect-mongo, Multer (resume upload), Google Gemini API (AI features)

## Running locally

### 1. Server

```bash
cd server
npm install
cp .env.example .env   # fill in the values, see below
npm run dev             # or: node server.js
```

The server listens on `http://localhost:5000` by default.

### 2. Client

```bash
cd client
npm install
cp .env.example .env    # VITE_API_URL can stay empty for local dev
npm run dev
```

The client runs on `http://localhost:5173`. In dev, Vite proxies `/api` and `/auth` requests to `http://localhost:5000` (see `client/vite.config.js`), so `VITE_API_URL` can be left empty locally.

## Environment variables

### `server/.env`

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string (use MongoDB Atlas for production) |
| `GEMINI_API_KEY` | Google Gemini API key, used for AI resume analysis and chat |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials. Authorized redirect URI must be `<SERVER_URL>/auth/google/callback` |
| `SESSION_SECRET` / `JWT_SECRET` | Long random strings used to sign sessions/tokens |
| `CLIENT_URL` | URL of the deployed frontend, used for CORS and post-login redirects |
| `PORT` | Port to listen on (most hosts set this automatically) |
| `NODE_ENV` | `development` locally, `production` when deployed |

### `client/.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the deployed backend, e.g. `https://careerlens-api.onrender.com`. Leave empty for local dev. |

## Deployment

The client and server are deployed **separately**, because the server relies on persistent sessions and local file uploads, which don't fit Vercel's serverless model well.

### Client → Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel, "Add New Project" and import the repo.
3. Set **Root Directory** to `client`.
4. Framework preset: Vite (auto-detected). Build command `npm run build`, output directory `dist` (defaults are fine).
5. Add the environment variable `VITE_API_URL` = the URL of your deployed backend (see below).
6. Deploy. `client/vercel.json` handles SPA route fallback so client-side routes (e.g. `/dashboard`) work on refresh.

### Server → Render / Railway / Fly.io (recommended)

The Express server uses `express-session` + `connect-mongo` and Multer disk storage for resume uploads — both need a long-running Node process, so deploy it to a Node host rather than as Vercel serverless functions.

1. Create a new Web Service from this repo, **Root Directory** `server`.
2. Build command: `npm install`. Start command: `node server.js`.
3. Add all the environment variables listed above (`server/.env.example`), setting:
   - `CLIENT_URL` to your Vercel URL (e.g. `https://careerlens.vercel.app`)
   - `NODE_ENV=production`
4. In Google Cloud Console, add `<your-server-url>/auth/google/callback` as an authorized redirect URI for your OAuth client.
5. Once deployed, copy the server's URL into the client's `VITE_API_URL` env var on Vercel and redeploy the client.

Because the client and server live on different domains in production, the server already sends the session cookie with `SameSite=None; Secure` and trusts the platform's proxy (`app.set('trust proxy', 1)`) so this cross-domain login flow works out of the box once `NODE_ENV=production` is set.

## Resume Builder

The Resume Builder (`client/src/pages/ResumeBuilder.jsx`) is fully client-side (drafts are stored in `localStorage`) and generates two real, downloadable PDFs via `client/src/utils/resumePdf.js`:

- **ATS-friendly PDF** — plain single-column layout, no color/graphics, built for parsing software.
- **Simple PDF** — the same content with light styling for human readers.

Both automatically shrink font size as needed so the export always fits in 1-2 pages.

## Notes / known limitations

- Resume uploads (`server/uploads/`) are stored on local disk. On hosts with ephemeral filesystems (e.g. free tiers that restart often), previously uploaded files may not persist across restarts/deploys — for durability at scale, swap Multer's disk storage for an object store (S3, Cloudinary, etc.).
