# Docker Setup Guide for TMS

This guide covers containerizing the Task Management System (TMS) using Docker, as per Assignment 4 requirements.

## Requirements Met

✅ Containerized Node.js API with Dockerfile
✅ Image size optimized to < 200MB (Alpine Linux base)
✅ Non-root user for security
✅ Multi-stage builds for frontend
✅ Docker Compose orchestration
✅ Environment-based configuration for portability
✅ Health checks for reliability

## Prerequisites

- Docker Engine 20.10+ ([Installation Guide](https://docs.docker.com/engine/install/))
- Docker Compose 2.0+ (included with Docker Desktop)
- At least 2GB free disk space

## Quick Start

### 1. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.docker.example .env
```

Edit `.env` and update the following critical values:
- `JWT_SECRET` - Use a secure random string (at least 32 characters)
- `DB_ROOT_PASSWORD` - Set a strong password
- `DB_PASSWORD` - Set a strong password for the application database user
- `EMAIL_USERNAME` and `EMAIL_PASSWORD` - Configure email credentials

### 2. Build and Start All Services

```bash
# Build images and start all containers
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f server
```

### 3. Initialize Database (First Time Only)

The database will be automatically initialized using `database/init.sql` on first startup.

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080/api
- **Health Check:** http://localhost:8080/api/health

Default admin credentials (set in `database/init.sql`):
- Username: `admin`
- Email: `admin@m.com`

## Docker Commands Reference

### Container Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Restart a specific service
docker-compose restart server

# View running containers
docker-compose ps

# View container logs
docker-compose logs -f [service_name]
```

### Building Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build server

# Build without cache
docker-compose build --no-cache

# Build and start
docker-compose up -d --build
```

### Image Management

```bash
# List images
docker images | grep tms

# Check image size
docker images tms-server
docker images tms-client

# Remove unused images
docker image prune -a

# Tag image for export
docker tag tms-server:latest tms-server:v1.0.0

# Save image to file (for air-gap deployment)
docker save -o tms-server-v1.0.0.tar tms-server:v1.0.0

# Load image from file
docker load -i tms-server-v1.0.0.tar
```

### Database Management

```bash
# Access MySQL shell
docker-compose exec db mysql -u root -p

# Backup database
docker-compose exec db mysqldump -u root -p nodelogin > backup.sql

# Restore database
docker-compose exec -T db mysql -u root -p nodelogin < backup.sql

# View database logs
docker-compose logs db
```

## Image Optimization

The TMS Docker images are optimized to meet the < 200MB requirement:

### Backend Server Image
- **Base Image:** `node:20-alpine` (~170MB total)
- **Optimization Techniques:**
  - Alpine Linux (minimal OS)
  - Production dependencies only (`npm ci --only=production`)
  - Clean npm cache
  - No unnecessary build tools
  - Multi-layer caching

### Frontend Client Image
- **Base Image:** `nginx:alpine` (~40MB total)
- **Optimization Techniques:**
  - Multi-stage build (build artifacts only)
  - Nginx Alpine for serving
  - Gzip compression enabled
  - Static asset optimization

**Check Image Sizes:**
```bash
docker images | grep tms
```

Expected output:
```
tms-server    latest    xxxxx    xxx MB
tms-client    latest    xxxxx    xxx MB  (should be < 50MB)
```

## Security Features

### Non-Root User
Both containers run as non-root users for security:
- **Server:** Runs as user `nodejs` (UID: 1001)
- **Client:** Runs as user `nginx-app` (UID: 1001)

Verify:
```bash
docker-compose exec server whoami
docker-compose exec client whoami
```

### Additional Security
- HTTP-only cookies for JWT tokens
- Bcrypt password hashing
- Parameterized SQL queries
- Environment-based secrets (not hardcoded)
- Health checks for container monitoring
- Network isolation via Docker bridge network

## Air-Gap Deployment

For deploying to environments without internet access:

### 1. Export Images

```bash
# Export all images
docker save -o tms-images.tar \
  tms-server:latest \
  tms-client:latest \
  mysql:8.0

# Or export individually
docker save -o tms-server.tar tms-server:latest
docker save -o tms-client.tar tms-client:latest
```

### 2. Transfer Files

Transfer these files to the target environment:
- `tms-images.tar` (or individual tar files)
- `docker-compose.yml`
- `.env` (with environment-specific configuration)
- `database/init.sql`

### 3. Import and Deploy

```bash
# Load images
docker load -i tms-images.tar

# Update .env with target environment settings
vim .env

# Start services
docker-compose up -d
```

## Environment-Specific Configuration

### Development Environment

```bash
# Use development configuration
docker-compose -f docker-compose.yml up -d

# Enable hot reload (requires volume mounts)
# Modify docker-compose.yml to add volumes:
#   server:
#     volumes:
#       - ./server:/usr/src/app
#       - /usr/src/app/node_modules
```

### Production Environment

```bash
# Use production settings in .env
NODE_ENV=production
BCRYPT_ROUNDS=12
JWT_SECRET=<strong-random-string>

# Rebuild and deploy
docker-compose up -d --build
```

### Different Database Connection

Update `.env` with new database details:
```env
DB_HOST=production-db-host
DB_USER=prod_user
DB_PASSWORD=prod_password
DB_NAME=prod_nodelogin
```

Rebuild only the server:
```bash
docker-compose up -d --build server
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs server

# Check container status
docker-compose ps

# Restart service
docker-compose restart server
```

### Database Connection Issues

```bash
# Verify database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Test connection
docker-compose exec server ping db

# Verify environment variables
docker-compose exec server env | grep DB_
```

### Port Conflicts

If ports 3000, 8080, or 3306 are already in use:

1. Update `.env`:
```env
CLIENT_PORT=3001
SERVER_PORT=8081
DB_PORT=3307
```

2. Restart services:
```bash
docker-compose down
docker-compose up -d
```

### Image Size Too Large

```bash
# Check image size
docker images tms-server

# If > 200MB, rebuild with --no-cache
docker-compose build --no-cache server

# Verify production dependencies only
docker-compose exec server npm ls --depth=0
```

### Permission Issues

If you encounter permission errors:

```bash
# Verify non-root user
docker-compose exec server id

# Check file ownership in container
docker-compose exec server ls -la /usr/src/app
```

## Health Checks

The containers include health checks:

```bash
# View health status
docker-compose ps

# Check server health manually
curl http://localhost:8080/api/health

# View health check logs
docker inspect --format='{{json .State.Health}}' tms-server | jq
```

## Performance Optimization

### Database Connection Pooling

The server uses MySQL connection pooling (configured in `server/src/config/database.js`):
- Connection limits prevent resource exhaustion
- Automatic connection management
- Query timeout handling

### Nginx Caching (Frontend)

The client container includes nginx configuration with:
- Gzip compression
- Static asset caching (1 year)
- Efficient SPA routing

## Monitoring

### Container Stats

```bash
# Real-time resource usage
docker stats

# Specific service stats
docker stats tms-server
```

### Logs

```bash
# Follow all logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100 server

# Logs since timestamp
docker-compose logs --since 2024-01-01T00:00:00 server
```

## Cleanup

```bash
# Stop and remove containers (keeps volumes)
docker-compose down

# Remove containers and volumes (deletes data!)
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a --volumes
```

## References

- [Docker Documentation](https://docs.docker.com/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Assignment 4 Requirements](./sw-foundation-assignment_1_2_3_4-v2.3.pdf)
