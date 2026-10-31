# Deploying on Vercel

The live app is two Vercel projects made from this one repository, in front of one MongoDB Atlas database:

| Project | Root directory | Live address |
| ------- | -------------- | ------------ |
| Frontend | `frontend/` | https://babylon-frontend.vercel.app |
| Backend | `backend/` | https://babylon-backend.vercel.app (check it: [`/api/health`](https://babylon-backend.vercel.app/api/health)) |

Both projects deploy from the `main` branch.

## Backend

1. Create a Vercel project from the `backend/` folder. Vercel runs `backend/src/app.js`, which exports the Express app. The app connects to the database on the first request and keeps the connection, so a cold start works.
2. Add the environment variables from [SETUP.md](SETUP.md#environment-variables). Use one `MONGODB_URI` for the live database (for example `babylon_live`) and a long random `JWT_SECRET`. Set `CLIENT_ORIGIN` to the frontend address and `NODE_ENV=production`. Set `EMAIL_MODE=smtp` with `EMAIL_USER` and `EMAIL_APP_PASSWORD` (the live site cannot use `dev`, and a staff account cannot finish setup without working email codes), plus the three staff values and `GEMINI_API_KEY` if the AI helpers are wanted.
3. In Atlas, allow the addresses Vercel uses under Network Access, and remove any `0.0.0.0/0` rule when the project ends.
4. Seed the live database once, on purpose, from a laptop: set `MONGODB_URI` to the live database in a temporary `.env`, and run the seed scripts with `NODE_ENV` unset. The seed refuses to run when `NODE_ENV=production`. Do not do this twice.

CLIP stays on for the live site. If the host runs out of memory, reports are still created with priority medium.

## Frontend

1. Create a second Vercel project from the `frontend/` folder with the Vite preset: build command `npm run build`, output directory `dist`.
2. Set `VITE_API_URL` to the backend address plus `/api` (for example `https://babylon-backend.vercel.app/api`). Vite reads it at build time, so redeploy the frontend after changing it.
3. `frontend/vercel.json` sends every path to `index.html`, so links such as `/issues/123` still work when opened directly or refreshed.
