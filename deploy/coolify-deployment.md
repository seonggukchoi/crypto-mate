# Coolify Deployment Guide

## Quick Fix for Volume Mount Error

If you're encountering the tsconfig.json mounting error, use one of these solutions:

### Option 1: Use Production Compose File (Recommended)
In Coolify, set the compose file to: `docker-compose.production.yml`

### Option 2: Override the Compose Command
In Coolify's deployment settings, use:
```bash
docker compose -f docker-compose.yml up -d
```
(This excludes the override file with problematic volumes)

### Option 3: Environment-Based Configuration
Add to your `.env` file in Coolify:
```env
COMPOSE_FILE=docker-compose.production.yml
```

## Why This Error Occurs

1. **Development vs Production**: The volume mounts in the original docker-compose.yml are designed for local development with hot-reload
2. **File vs Directory**: Docker creates missing mount points as directories, but tsconfig.json should be a file
3. **Build-time vs Runtime**: tsconfig.json is only needed during build, not at runtime

## Deployment Checklist

- [ ] Use `docker-compose.production.yml` for production deployments
- [ ] Ensure `.env` file exists with production variables
- [ ] Set `NODE_ENV=production` in Coolify environment
- [ ] Remove any development-specific volume mounts
- [ ] Use the `production` target from Dockerfile

## Coolify Configuration

1. **Build Configuration**:
   - Build Mode: `Docker Compose`
   - Compose File: `docker-compose.production.yml`
   - Build Context: `.`

2. **Environment Variables**:
   ```
   NODE_ENV=production
   LOG_LEVEL=info
   # Add your Discord bot token and other secrets
   ```

3. **Health Check** (optional):
   - Enable if you uncomment the health check in Dockerfile

## Troubleshooting

If issues persist:
1. Check Coolify logs: `docker logs <container-name>`
2. Verify file exists: `ls -la /data/coolify/applications/<app-id>/`
3. Clear Docker cache: `docker system prune -a`
4. Rebuild without cache in Coolify settings