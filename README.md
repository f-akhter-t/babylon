# Babylon

Babylon is a civic issue reporting app for Chattogram. Citizens drop a pin on a map to report a problem such as a pothole, overflowing bins or a broken street light, then follow it until it is fixed. City departments work through the issues assigned to them, and an admin checks each fix against its photo before it is closed and keeps an eye on how every department is doing.

> **Backend and frontend.** The Express backend in `backend/` serves the data, accounts and the admin, department and citizen work. The frontend talks to it through `frontend/src/services/http.js`.

## Stack

- React 19 and react-router-dom 7
- Vite 8
- Tailwind CSS 4 (theme tokens in `frontend/src/index.css`)
- Leaflet with react-leaflet for the maps, Recharts for the accountability chart
- ESLint 10
- Backend: Node.js, Express 5, MongoDB (Atlas) with Mongoose 9, JWT sign-in, Zod checks
- Email codes: Nodemailer through Gmail
- AI helpers (translate, report assistant, summaries): Gemini, called from the server only
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
| `npm run seed`        | Seeds everything: public, department, admin and citizen data. Safe to run twice. |
| `npm run seed:public` | Only the public data (three accounts, 12 issues, votes).                     |
| `npm run seed:admin`  | Only the admin data (44 issues, 5 identity checks, 5 citizens).              |
| `npm run seed:citizen` | Only the citizen data (two citizens with their reports, votes and notices). |
| `npm run clean:seed`  | Shows which demo rows (emails ending in `.test`) are in your database. Add `-- --yes` to remove them. Real accounts and reports stay. |
| `npm run token -- <role> <email> [department]` | Prints a sign-in token for Postman. Roles: `citizen`, `department`, `admin`. |
| `npm test`            | Runs all backend tests. They use fakes, so no database, Gemini or CLIP is needed. |

The seed refuses to run when `NODE_ENV=production`. To start again from nothing, drop your database in Atlas, then run `npm run seed`. To remove only the demo rows and keep real ones, run `npm run clean:seed` to see what would go, then `npm run clean:seed -- --yes`. It refuses to run when `NODE_ENV=production`, like the seed.

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
| `EMAIL_MODE`     | no     | Email codes for forgot password, the staff email check and the citizen email check. `dev`: the code is always `123456` and nothing is sent. `smtp`: a random code is emailed through Gmail. Anything else turns them off. `dev` is refused when `NODE_ENV=production`. |
| `EMAIL_USER`     | for `smtp` | The Gmail address the codes are sent from.                                              |
| `EMAIL_APP_PASSWORD` | for `smtp` | That account's Gmail app password (16 letters, spaces allowed). Not the normal password. |
| `PHONE_CODE_MODE` | no    | `dev` accepts the fixed demo code `123456` for phone checks. Anything else turns phone codes off. No SMS is sent. |
| `GEMINI_API_KEY` | for the AI helpers | Your own Gemini key. Without it the AI helpers answer 503 and the rest of the app works. |
| `GEMINI_MODEL`   | no     | The Gemini model to call. Default `gemini-3.5-flash`.                                       |
| `STAFF_ACCESS_CODE` | for staff sign-up | The one code a new staff member types on `/staff/signup`. Missing means nobody can sign up as staff. |
| `DEPARTMENT_CODES` | for staff setup | JSON on one line: each department and the code that proves a department officer belongs to it. |
| `EMPLOYEE_ROSTER` | for staff setup | JSON on one line: the Employee IDs each department (and `admin`) may claim. |
| `NODE_ENV`       | no     | `production` on the live site. It turns off the seed and token scripts, and makes the app trust Vercel's proxy so the rate limits count each visitor by their own address. |

The staff values (`STAFF_ACCESS_CODE`, `DEPARTMENT_CODES`, `EMPLOYEE_ROSTER`) are server settings only. `backend/.env.example` shows the shape with made-up values; the three seeded demo accounts below are already set up and do not need them.

**CLIP decision for the live site:** not decided yet. After the live check, write one line here: `CLIP_ENABLED=true` if it loads within the memory limit and answers in a few seconds, otherwise `false`. With CLIP off, reports are still created, they just keep priority medium. CLIP always works on a laptop for the demo.

**Email codes (forgot password):** `POST /api/auth/forgot-password` sends a 6-digit code to the account's email, and `POST /api/auth/reset-password` takes the email, the code and a new password. The code works for 10 minutes, one use, three wrong tries lock it, and a new one can be asked for after 30 seconds. The answer to forgot-password is the same whether or not the email has an account. Locally use `EMAIL_MODE=dev` (code `123456`); to receive real email on your own machine, follow "Real email codes on your own machine" below. A free Gmail account can send about 500 emails a day. The live site must use `smtp`: with `EMAIL_MODE=dev` and `NODE_ENV=production` the codes are switched off.

**Staff email check:** a staff account that is still setting up must also verify its email address. `POST /api/auth/staff/email-code` sends a code to the address the account signed up with (it cannot be sent anywhere else), `POST /api/auth/staff/email-verify` checks it, and `POST /api/auth/staff/finish` answers 409 until it is done. Staff who finished their setup earlier are not asked again. Because of this, a new staff account cannot finish setup while email codes are off, so the live site needs `EMAIL_MODE=smtp` working.

**Citizen email check:** a citizen can verify the email address on their profile. `POST /api/citizen/profile/email-code` sends a code to the address the account signed up with, `POST /api/citizen/profile/email-verify` checks it, and `GET /api/citizen/profile` then shows `emailVerified: true`. It is optional and never blocks a citizen from reporting, voting or anything else.

#### Real email codes on your own machine

You do not need this for normal work: with the default `EMAIL_MODE=dev` nothing is sent and every code is `123456`. Do it only when you want to see a real email arrive.

1. Pick a Gmail account you can sign in to (a spare one is best) and turn on 2-Step Verification: Google Account, Security, 2-Step Verification.
2. Create an app password for it: Google Account, Security, 2-Step Verification, App passwords. Google shows 16 letters once, in groups of four. Copy them.
3. In **your own** `backend/.env` (never `.env.example`) set:

   ```
   EMAIL_MODE=smtp
   EMAIL_USER=your-address@gmail.com
   EMAIL_APP_PASSWORD=abcd efgh ijkl mnop
   ```

4. Stop the backend and start it again with `npm run dev`. It reads `.env` only when it starts.
5. Try it: open `/forgot-password`, or press **Send code** on the Email verification card of the citizen profile (`/profile`). The code arrives in the inbox of **the account's own email address**, not in the `EMAIL_USER` inbox. The seeded `@babylon.test` addresses are not real inboxes, so sign up with an address you can open.

Good to know:

- Never put the app password in the repo, a chat, a screenshot or a commit. `backend/.env` is not committed; keep it that way.
- `503 email-unavailable` means Gmail refused the login or could not be reached. Check that 2-Step Verification is on and that `EMAIL_APP_PASSWORD` is the app password, not the normal one.
- If the backend prints `EMAIL_MODE=smtp needs EMAIL_USER and EMAIL_APP_PASSWORD`, one of the two lines is empty and email codes are off.
- To go back, set `EMAIL_MODE=dev` and restart.

To measure CLIP on a laptop: `node scripts/clip-check.mjs C:\path\to\photo.jpg` (from `backend/`). It prints the priority, the score, and the load time and memory used.

### Testing the backend by hand with Postman

The Postman files are in `backend/postman/`: `auth-public.json`, `citizen.json`, `citizen-profile.json`, `department.json` and `admin.json`. Import one with Ctrl+O in Postman.

- The requests have no scripts. You send each one by hand and read the answer.
- Every request has a Description with the status and body you should get back.
- `baseUrl` is `http://localhost:5000/api`, so paths never repeat `/api`.
- Get tokens with `npm run token` and paste them into the collection variables (`adminToken`, `departmentToken`, `citizenToken`). Copy ids from earlier answers by hand.
- Each collection needs clean data. Drop your database, run the seed for that panel, start the server, then send the requests in order. Do not mix seeds from several panels in one database.
- Write each result in the team's testing log. That log is the proof, not Postman's own runner.

## Deploying the backend on Vercel

1. Create a Vercel project from the `backend/` folder. (The Vercel project and its entry file are set up by Farhana; the backend is ready for it: it connects to the database on demand and keeps the connection.)
2. Add the environment variables above. Use one `MONGODB_URI` for the live database (for example `babylon_live`) and a long random `JWT_SECRET`. Set `CLIENT_ORIGIN` to the frontend address and `NODE_ENV=production`. Set `EMAIL_MODE=smtp` with `EMAIL_USER` and `EMAIL_APP_PASSWORD` (the live site cannot use `dev`, and a staff account cannot finish setup without working email codes), plus the three staff values and `GEMINI_API_KEY` if the AI helpers are wanted.
3. The database connects on the first request and is reused afterwards, so a cold start works. In Atlas, allow the addresses Vercel uses under Network Access, and remove any `0.0.0.0/0` rule when the project ends.
4. Seed the live database once, on purpose, from a laptop: set `MONGODB_URI` to the live database in a temporary `.env`, and run the seed scripts with `NODE_ENV` unset. The seed refuses to run when `NODE_ENV=production`. Do not do this twice.

## Demo accounts

Every account uses the password `password123`.

| Role       | Email                  | Sign in at     |
| ---------- | ---------------------- | -------------- |
| Citizen    | `citizen@babylon.test` | `/login`       |
| Department | `roads@babylon.test`   | `/staff/login` |
| Admin      | `admin@babylon.test`   | `/staff/login` |

New citizens sign up at `/signup`. New department and admin accounts sign up at `/staff/signup` with the staff access code (`STAFF_ACCESS_CODE` in `backend/.env`), then finish a short setup on their profile: department code (department staff only), Employee ID, name and job title, a phone code and an email code (a photo is optional). Until "Finish setup" is done the server refuses the account on its panel routes. The three accounts above are already set up, so they skip all of it.

The sign-in pages list these accounts only while the app runs with `npm run dev`, or on a build made with `VITE_SHOW_DEMO_ACCOUNTS=true`. A normal production build hides them; the accounts stay in the seed.

These accounts are for the demo only. They are not real credentials, and they are visible in the seed on purpose. The staff access code, department codes and Employee ID list are server settings and never appear in the frontend. A real service would give each staff member a personal invitation instead of one shared code.

## Folder layout

```
babylon/
├── backend/
│   ├── src/
│   │   ├── app.js, server.js, routes.js   the app, the entry point and the route mounts
│   │   ├── admin/ auth/ citizen/ department/ public/   one folder per panel: routes, controller, service
│   │   ├── shared/service/                code every panel uses: issues, alerts, stats, CLIP, Gemini, email and phone codes
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
        ├── pages/      one folder per page (Home, Map, Feed, Report, Profile, staff panels…)
        ├── services/   http.js and the API files; accounts and the session (auth.js)
        └── utils/      small helpers for dates, maps, images and form rules
```

A backend request goes `routes -> controller -> service -> model`. Only services import models, and a panel imports only its own files, `models/`, `shared/service/`, `utils/` and `constants/`. Answers look like `{ success, message, data }`, and errors like `{ success: false, code, message, field? }`.
