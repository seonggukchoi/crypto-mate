# Coolify Deployment Guide

## 🔴 CRITICAL: NPM Build Error Fix (Exit Code 127)

If you're still encountering the "npm run build" error, try these solutions IN ORDER:

### Solution 1: Force Dockerfile Build Mode
In Coolify's deployment settings:
1. Set **Build Pack** to: `Dockerfile`
2. Set **Dockerfile Path** to: `./Dockerfile.simple` (use the simplified version)
3. Disable **Auto-generate Dockerfile**
4. Enable **No Cache** for the first build

### Solution 2: Use Simple Dockerfile
If the multi-stage build fails, use the simplified version:

```bash
# In Coolify, set dockerfile to:
Dockerfile.simple
```

### Solution 3: Override Build Command
In Coolify's **Build Command** field, enter:

```bash
docker build -f Dockerfile.simple -t myapp . --no-cache
```

### Solution 4: Use Docker Compose Override
Set compose file to: `docker-compose.production.yml` and ensure:

```env
# In Coolify environment variables
COMPOSE_FILE=docker-compose.production.yml
NODE_ENV=production
DOCKER_BUILDKIT=1
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