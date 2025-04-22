# Buzzd App Deployment Guide for Various Platforms

This guide provides instructions for deploying the Buzzd App on various platforms.

## 1. Common Pre-Deployment Steps

Before deploying to any platform:

1. Ensure your database structure is up-to-date:
   ```bash
   npm run db:push
   ```
2. Create a production build of the frontend:
   ```bash
   npm run build
   ```

## 2. Replit Deployment (Current Approach)

On Replit:

1. Make sure your `.replit.deploy` file contains:
   ```json
   {
     "run": "node ultra-simple-server.js"
   }
   ```
2. Add the DATABASE_URL secret in the Deployment tab
3. Click "Deploy"

## 3. Railway Deployment

Railway offers excellent PostgreSQL support with consistent connections:

1. Sign up for [Railway](https://railway.app/)
2. Create a new project
3. Add a PostgreSQL database to your project
4. Connect your GitHub repository or use the CLI to push your code
5. Add a `railway.json` file to your project:
   ```json
   {
     "schema": "public",
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "npm run build"
     },
     "deploy": {
       "startCommand": "node simplified-server.js",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```
6. In Railway dashboard, set your environment variables:
   - `DATABASE_URL` (Railway will provide this)
   - `NODE_ENV=production`
7. Deploy using the Railway dashboard or CLI

## 4. Render Deployment

Render provides a reliable platform with persistent PostgreSQL:

1. Sign up for [Render](https://render.com/)
2. Create a new web service
3. Connect your GitHub repository
4. Configure the service:
   - **Build Command**: `npm run build`
   - **Start Command**: `node simplified-server.js`
   - **Environment**: Node.js
5. Add a PostgreSQL database from the Render dashboard
6. Set your environment variables:
   - `DATABASE_URL` (copy from Render PostgreSQL dashboard)
   - `NODE_ENV=production`
7. Deploy through the Render dashboard

## 5. Fly.io Deployment

Fly.io provides great performance and is reliable for small projects:

1. Install the [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/)
2. Create a `Dockerfile` in your project root:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY . .
   RUN npm install
   RUN npm run build
   EXPOSE 3000
   CMD ["node", "simplified-server.js"]
   ```
3. Create a `fly.toml` file:
   ```toml
   app = "buzzd-app"
   
   [http_service]
     internal_port = 3000
     force_https = true
   
   [env]
     NODE_ENV = "production"
   ```
4. Run `fly launch` to create your app
5. Create a PostgreSQL database: `fly postgres create`
6. Connect your app to the database: `fly postgres attach --app buzzd-app`
7. Deploy: `fly deploy`

## 6. Heroku Deployment

1. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Create a `Procfile` in your project root:
   ```
   web: node simplified-server.js
   ```
3. Log in to Heroku: `heroku login`
4. Create a Heroku app: `heroku create buzzd-app`
5. Add a PostgreSQL database: `heroku addons:create heroku-postgresql:hobby-dev`
6. Push your code: `git push heroku main`
7. Open your app: `heroku open`

## Database Migration Between Platforms

When moving your database:

1. Export your data from the current database:
   ```bash
   pg_dump -Fc --no-acl --no-owner -h <SOURCE_HOST> -U <SOURCE_USER> <SOURCE_DB> > buzzd_backup.dump
   ```

2. Import to the new database:
   ```bash
   pg_restore --verbose --clean --no-acl --no-owner -h <TARGET_HOST> -U <TARGET_USER> -d <TARGET_DB> buzzd_backup.dump
   ```

## Troubleshooting

### Common Database Issues

- **"endpoint is disabled"** error from Neon Postgres: The database has gone to sleep. Use the retry logic implemented in simplified-server.js.
- **Connection timeout**: Check network rules on your deployment platform.
- **Authentication errors**: Verify your DATABASE_URL environment variable.

### Deployment Checks

After deploying, check:

1. The `/api/servercheck` endpoint for system status
2. The `/api/establishments` endpoint to verify database connectivity 
3. User authentication flow