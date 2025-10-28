# CI/CD Documentation

## Overview

This repository uses GitHub Actions for continuous integration and deployment with three main workflows:

- **CI** (`ci.yml`) - Runs on PRs and main branch pushes
- **Preview Deploy** (`preview.yml`) - Creates preview environments for PRs
- **Release** (`release.yml`) - Builds and publishes Docker images on main branch

## Secrets Configuration

### Required Secrets (Optional)

Add these secrets in **Settings > Secrets and variables > Actions**:

- `RAZORPAY_KEY_ID` - Your Razorpay test/live key ID
- `RAZORPAY_KEY_SECRET` - Your Razorpay test/live key secret

**Note**: If these secrets are not configured, the application will use stub implementations for development.

### Getting Razorpay Keys

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings > API Keys**
3. Generate test keys for development
4. Add the keys to your repository secrets

## Workflows

### CI Workflow

Runs on every PR and push to main:

1. **Setup & Checks** - Linting, type checking, building
2. **API Tests** - Runs API test suite (if present)
3. **E2E Smoke Tests** - Playwright tests (if present)

### Preview Deploy Workflow

Creates preview environments for PRs:

- Builds Docker images for API and Web
- Spins up the full stack (postgres + api + web)
- Publishes preview URLs as artifacts
- Comments on PR with access instructions

**Limitation**: Preview URLs are only accessible within the GitHub runner environment.

### Release Workflow

Publishes Docker images to GitHub Container Registry on main branch pushes:

- `ghcr.io/your-org/your-repo/api:latest`
- `ghcr.io/your-org/your-repo/web:latest`

## Preview Artifacts

Preview deployment URLs are available as artifacts:

1. Go to **Actions** tab
2. Click on the preview workflow run
3. Download the `preview-urls` artifact
4. Contains API and Web URLs (accessible only within CI)

## Public Preview Deployment

To enable public preview URLs, integrate with a platform like:

### Render

Replace the preview deploy steps with:

```yaml
- name: Deploy to Render
  run: |
    curl -X POST "https://api.render.com/v1/services/$SERVICE_ID/deploys" \
      -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
      -H "Content-Type: application/json"
```

### Railway

```yaml
- name: Deploy to Railway
  run: |
    npx @railway/cli deploy --service api
    npx @railway/cli deploy --service web
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Fly.io

```yaml
- name: Deploy to Fly
  run: |
    flyctl deploy --config apps/api/fly.toml
    flyctl deploy --config apps/web/fly.toml
  env:
    FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

## Local Development

The CI environment mirrors local development:

```bash
# Start local development
cp .env.example .env
npm install
docker compose up -d postgres mailhog
cd apps/api && npx prisma migrate dev && npx prisma db seed
npm run dev
```

## Troubleshooting

### CI Failures

1. **Database Connection**: Ensure Postgres service is healthy
2. **Missing Dependencies**: Check if all npm packages are installed
3. **Build Failures**: Verify TypeScript compilation passes locally
4. **Test Failures**: Run tests locally first

### Preview Deploy Issues

1. **Docker Build Failures**: Check Dockerfile syntax and build context
2. **Service Startup**: Verify environment variables are set correctly
3. **Port Conflicts**: Ensure ports 3000/4000 are available

### Missing Tests

The CI workflow uses `--if-present` flags, so it won't fail if test scripts don't exist yet. Add test scripts to package.json as needed:

```json
{
  "scripts": {
    "test": "jest",
    "test:e2e": "playwright test"
  }
}
```