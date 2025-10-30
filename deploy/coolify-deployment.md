# Coolify Deployment Guide

## Quick Fix for NPM Build Error (Exit Code 127)

If you're encountering the "npm run build" error with exit code 127, follow these steps:

### Option 1: Use Production Compose File (REQUIRED)
In Coolify, set the compose file to: `docker-compose.production.yml`

### Option 2: Clear Docker Cache
In Coolify's deployment settings, enable "No Cache" option or run:
```bash
docker system prune -a
docker compose -f docker-compose.production.yml build --no-cache
```

### Option 3: Environment Configuration
Ensure your `.env` file in Coolify contains:
```env
COMPOSE_FILE=docker-compose.production.yml
NODE_ENV=production
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

## Troubleshooting NPM Build Errors

### Exit Code 127 (Command Not Found)
If you see this error during `npm run build`:
1. **Check .dockerignore**: Ensure `*.js` files are NOT excluded if you have JS config files
2. **Verify Compose File**: Must use `docker-compose.production.yml` not `docker-compose.yml`
3. **Clear Build Cache**: Enable "No Cache" in Coolify or add `--no-cache` flag
4. **Check Build Context**: Ensure all TypeScript source files in `src/` are present

### General Troubleshooting
1. Check Coolify logs: `docker logs <container-name>`
2. Verify files in build context: `ls -la /data/coolify/applications/<app-id>/`
3. Clear Docker cache completely: `docker system prune -af --volumes`
4. Rebuild without cache in Coolify settings
5. Check Dockerfile line numbers match (if not, Coolify may be modifying the Dockerfile)