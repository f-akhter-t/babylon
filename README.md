# Babylon

Babylon is a civic issue reporting app for Bangladesh. Citizens drop a pin on a map to report a problem such as a pothole, overflowing bins or a broken street light, then follow it until it is fixed. City departments work through the issues assigned to them, and an admin checks each fix against its photo before it is closed and keeps an eye on how every department is doing.

> **Mock data.** There is no server yet. Every issue, account and report lives in the browser: sample data in `frontend/src/mock/`, and anything you create in `localStorage`, `sessionStorage` or IndexedDB. Clearing site data resets the app.

## Stack

- React 19 and react-router-dom 7
- Vite 8
- Tailwind CSS 4 (theme tokens in `frontend/src/index.css`)
- Leaflet with react-leaflet for the maps, Recharts for the accountability chart
- ESLint 10

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

### Backend

The backend is a placeholder; all data is mocked in the frontend for now. `backend/` holds empty starter files and has nothing to install or run yet.

## Demo accounts

Every account uses the password `password123`.

| Role       | Email                  | Sign in at     |
| ---------- | ---------------------- | -------------- |
| Citizen    | `citizen@babylon.test` | `/login`       |
| Department | `roads@babylon.test`   | `/staff/login` |
| Admin      | `admin@babylon.test`   | `/staff/login` |

New staff accounts are created at `/staff/signup` with the access code `BABYLON-STAFF-2026`.

These accounts and the access code are for the demo only. They are not real credentials, and they are visible in the source on purpose. A real backend would give each staff member a personal invitation instead of one shared code.

## Folder layout

```
babylon/
├── backend/            placeholder, empty for now
└── frontend/
    ├── public/         favicon, images and videos
    └── src/
        ├── App.jsx     the routes
        ├── index.css   Tailwind theme tokens and global styles
        ├── components/
        │   ├── layout/ Navbar, Footer, Logo and the staff panel layout
        │   └── ui/     shared pieces such as Button, StatusPill and LoadError
        ├── hooks/      shared React hooks
        ├── mock/       sample issues, departments, home page slides and identity checks
        ├── pages/      one folder per page (Home, Map, Feed, Report, Profile, staff panels…)
        ├── services/   the mock API (api.js), accounts (auth.js) and browser stores
        └── utils/      small helpers for dates, maps, images and form rules
```
