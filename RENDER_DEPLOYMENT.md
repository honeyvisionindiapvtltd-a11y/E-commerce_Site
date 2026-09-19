# Render Backend Deployment

## 1. Deploy the service

Create a Render Blueprint from this repository and select `render.yaml`. The service uses `backend` as its root directory, runs `npm ci`, and starts with `npm start`.

The `starter` plan is intentional: Render free web services sleep after inactivity and cannot provide an always-on backend.

## 2. Required environment variables

Set these in the Render service:

- `NODE_ENV=production`
- `MONGODB_URI`: a MongoDB Atlas connection string
- `JWT_SECRET`: a long random secret
- `FRONTEND_URL`: the deployed web frontend origin, for example `https://honeyvision.in`

Add payment, email, SMS, maps, and AI variables only when those features are enabled. Keep all secrets in Render environment variables, never in Git.

## 3. MongoDB Atlas

Allow Render's outbound connections in the Atlas network access rules. Use the database name `honeyvision` in the connection string or let the backend append it.

## 4. Health check

Render checks:

```text
GET /api/health
```

Expected response:

```json
{"status":"ok","message":"HoneyVision API is running"}
```

The server binds to Render's `PORT`, listens on `0.0.0.0`, and keeps retrying MongoDB in production during transient outages. API requests that require the database return `503` until the database is available.

## 5. Public API URL and APK

After deployment, use the Render URL or a custom HTTPS domain. For the APK, set `VITE_API_URL` in `frontend/.env.production` to the final API URL with `/api`, for example:

```env
VITE_API_URL=https://api.example.com/api
```

Configure DNS for the custom API domain and add it to Render before rebuilding the APK. Then build and install:

```powershell
cd frontend
npm run cap:build:android
```

The current `api.honeyvision.in` hostname must have a working DNS record and Render/HTTPS routing before it can be used by the APK.
