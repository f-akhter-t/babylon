# Babylon

Babylon is a civic issue reporting app for Chattogram. Citizens drop a pin on a map to report a problem such as a pothole, overflowing bins or a broken street light, then follow it until it is fixed. City departments work through the issues assigned to them, and an admin checks each fix against its photo before it is closed and keeps an eye on how every department is doing.

> **Backend and frontend.** The Express backend in `backend/` serves the data, accounts and the admin, department and citizen work. The frontend talks to it through `frontend/src/services/http.js`. Anything a page still reads from `frontend/src/mock/` is waiting for its backend step.

## Stack

- React 19 and react-router-dom 7
- Vite 8
- Tailwind CSS 4 (theme tokens in `frontend/src/index.css`)
- Leaflet with react-leaflet for the maps, Recharts for the accountability chart
- ESLint 10
- Backend: Node.js, Express 5, MongoDB (Atlas) with Mongoose 9, JWT sign-in, Zod checks
- Photo severity (F1): CLIP through `@huggingface/transformers`

## Running it

You need Node.js 20.19 or newer (or 22.12 or newer).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite prints the local address, which is http://localhost:5173 by default.

| Script            | What it does                                       |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Starts the dev server with hot reload.             |
| `npm run build`   | Builds the production site into `frontend/dist`.   |
| `npm run preview` | Serves the production build locally to check it.  |
| `npm run lint`    | Runs ESLint over the frontend.                     |
| `npm test`        | Runs the service tests (`frontend/tests/`).        |

### Backend

You need Node.js 20.19 or newer, and a MongoDB database (a free MongoDB Atlas M0 cluster works).

```bash
cd backend
npm install
cp .env.example .env     # on Windows PowerShell: Copy-Item .env.example .env
```

Open `backend/.env` and fill in `MONGODB_URI` and `JWT_SECRET` (see "Environment variables"). Give each person their own database name in the URI, for example `babylon_meheri`, so nobody overwrites anyone else's data.

```bash
npm run seed             # fills your database with demo data (safe to run again)
npm run dev              # http://localhost:5000, restarts on every change
```

Check it: open http://localhost:5000/api/health. It answers `{"success":true,...,"data":{"status":"up"}}`.

| Script                | What it does                                                                 |
| --------------------- | ---------------------------------------------------------------------------- |
| `npm start`           | Starts the server once.                                                      |
| `npm run dev`         | Starts the server and restarts it when a file changes.                       |
| `npm run seed`        | Seeds everything: public, department and admin data. Safe to run twice.      |
| `npm run seed:public` | Only the public data (three accounts, 12 issues, votes).                     |
| `npm run seed:admin`  | Only the admin data (44 issues, 5 identity checks, 5 citizens).              |
| `npm run token -- <role> <email> [department]` | Prints a sign-in token for Postman. Roles: `citizen`, `department`, `admin`. |
| `npm test`            | Runs all backend tests. They use fakes, so no database, Gemini or CLIP is needed. |

The seed refuses to run when `NODE_ENV=production`. To start again from nothing, drop your database in Atlas, then run `npm run seed`.

### Frontend with the backend

Start the backend first, then the frontend:

```bash
cd frontend
npm run dev           # http://localhost:5173
```

In development Vite forwards every `/api` request to `http://localhost:5000` (see `frontend/vite.config.js`), so there is nothing to configure. If your backend uses another port, change it there. For a deployed site, set `VITE_API_URL` to the backend address, for example `https://api.example.com/api`.

All requests go through `frontend/src/services/http.js`. It adds the sign-in token, returns the reply's `data`, and turns every failure into an `Error` with `message`, `code` and (for forms) `field`.

### Environment variables

The backend reads these from `backend/.env` (copy `backend/.env.example`). On Vercel, add the same names under Project Settings, Environment Variables. Keys stay on the server and never go in the frontend.

| Name             | Needed | What it is                                                                                  |
| ---------------- | ------ | ------------------------------------------------------------------------------------------- |
| `MONGODB_URI`    | yes    | MongoDB connection string. The database name at the end picks your database.               |
| `JWT_SECRET`     | yes    | Secret that signs sign-in tokens. At least 16 characters.                                   |
| `PORT`           | no     | Port for the server. Default `5000`.                                                        |
| `CLIENT_ORIGIN`  | no     | The frontend address allowed by CORS. Default `http://localhost:5173`.                      |
| `JWT_EXPIRES_IN` | no     | How long a token lasts. Default `7d`.                                                       |
| `CLIP_ENABLED`   | no     | `true` to score report photos with CLIP (F1). Default off. The first use downloads about 150 MB, and the model needs memory, so turn it on only on a host that can hold it. |
| `NODE_ENV`       | no     | `production` on the live site. It turns off the seed and token scripts.                     |

Variables for the AI helpers (the Gemini key) and the staff access codes are added to `backend/.env.example` by the person who owns that feature, each on their own lines.

**CLIP decision for the live site:** not decided yet. After the live check, write one line here: `CLIP_ENABLED=true` if it loads within the memory limit and answers in a few seconds, otherwise `false`. With CLIP off, reports are still created, they just keep priority medium. CLIP always works on a laptop for the demo.

To measure CLIP on a laptop: `node scripts/clip-check.mjs C:\path\to\photo.jpg` (from `backend/`). It prints the priority, the score, and the load time and memory used.

### Testing the backend by hand with Postman

The Postman files are in `backend/postman/`: `auth-public.json`, `citizen.json`, `department.json` and `admin.json`. Import one with Ctrl+O in Postman.

- The requests have no scripts. You send each one by hand and read the answer.
- Every request has a Description with the status and body you should get back.
- `baseUrl` is `http://localhost:5000/api`, so paths never repeat `/api`.
- Get tokens with `npm run token` and paste them into the collection variables (`adminToken`, `departmentToken`, `citizenToken`). Copy ids from earlier answers by hand.
- Each collection needs clean data. Drop your database, run the seed for that panel, start the server, then send the requests in order. Do not mix seeds from several panels in one database.
- Write each result in the team's testing log. That log is the proof, not Postman's own runner.

## Deploying the backend on Vercel

1. Create a Vercel project from the `backend/` folder. (The Vercel project and its entry file are set up by Farhana; the backend is ready for it: it connects to the database on demand and keeps the connection.)
2. Add the environment variables above. Use one `MONGODB_URI` for the live database (for example `babylon_live`) and a long random `JWT_SECRET`. Set `CLIENT_ORIGIN` to the frontend address and `NODE_ENV=production`.
3. The database connects on the first request and is reused afterwards, so a cold start works. In Atlas, allow the addresses Vercel uses under Network Access, and remove any `0.0.0.0/0` rule when the project ends.
4. Seed the live database once, on purpose, from a laptop: set `MONGODB_URI` to the live database in a temporary `.env`, and run the seed scripts with `NODE_ENV` unset. The seed refuses to run when `NODE_ENV=production`. Do not do this twice.

## Demo accounts

Every account uses the password `password123`.

| Role       | Email                  | Sign in at     |
| ---------- | ---------------------- | -------------- |
| Citizen    | `citizen@babylon.test` | `/login`       |
| Department | `roads@babylon.test`   | `/staff/login` |
| Admin      | `admin@babylon.test`   | `/staff/login` |

Staff sign-up (`/staff/signup`) is closed until the staff-accounts step lands; the backend creates citizen accounts only.

These accounts and the access code are for the demo only. They are not real credentials, and they are visible in the seed on purpose. A real backend would give each staff member a personal invitation instead of one shared code.

## Folder layout

```
babylon/
├── backend/
│   ├── src/
│   │   ├── app.js, server.js, routes.js   the app, the entry point and the route mounts
│   │   ├── admin/ auth/ citizen/ department/ public/   one folder per panel: routes, controller, service
│   │   ├── shared/service/                code every panel uses: issues, alerts, stats, CLIP severity
│   │   ├── models/                        Mongoose models (only services import them)
│   │   ├── middlewares/ config/ constants/ utils/
│   ├── scripts/        seed, token and CLIP check scripts
│   ├── postman/        collections to send by hand
│   └── tests/          backend tests (fakes only)
└── frontend/
    ├── public/         favicon, images and videos
    └── src/
        ├── App.jsx     the routes
        ├── index.css   Tailwind theme tokens and global styles
        ├── components/
        │   ├── layout/ Navbar, Footer, Logo and the staff panel layout
        │   └── ui/     shared pieces such as Button, StatusPill and LoadError
        ├── hooks/      shared React hooks
        ├── mock/       sample data for the pages not yet moved to the backend
        ├── pages/      one folder per page (Home, Map, Feed, Report, Profile, staff panels…)
        ├── services/   http.js and the API files; accounts (auth.js) and browser stores
        └── utils/      small helpers for dates, maps, images and form rules
```

A backend request goes `routes -> controller -> service -> model`. Only services import models, and a panel imports only its own files, `models/`, `shared/service/`, `utils/` and `constants/`. Answers look like `{ success, message, data }`, and errors like `{ success: false, code, message, field? }`.
