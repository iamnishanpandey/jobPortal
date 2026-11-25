# CC CareerCloud (Full Stack)

This project now runs as a full-stack website:
- `frontend/` is the React app.
- `backend/` is the Express + MongoDB API.
- In production, backend serves the built frontend.

## Run in Development

Open two terminals:

1. Backend
```bash
npm --prefix backend run dev
```

2. Frontend
```bash
npm --prefix frontend run dev
```

Frontend dev server proxies `/api` to `http://localhost:5001`.

## Build + Run as One Website

```bash
npm run build
npm start
```

This builds the frontend and starts the backend server, which serves `frontend/dist`.

## Seed Demo Job Postings

```bash
npm run seed:jobs
```

This creates:
- 1 recruiter account
- 15 companies
- 105 seed job postings (minimum target: 100)

Seed jobs are stored in MongoDB (persistent database records), not in memory.
On backend startup, the app checks job count and auto-seeds only if total jobs are below 100.

To disable automatic startup seeding:
- Set `SEED_JOBS_ON_STARTUP=false`

Demo recruiter login:
- Email: `recruiter@jobportal.demo`
- Password: `Recruiter@123`
