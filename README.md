<div align="center">

# 🚀 DevOps Node.js API Assignment

**A production-ready REST API with complete DevOps pipeline**

[![CI](https://github.com/imlinkk/DevOps_ASM/actions/workflows/ci.yml/badge.svg)](https://github.com/imlinkk/DevOps_ASM/actions/workflows/ci.yml)
[![CD](https://github.com/imlinkk/DevOps_ASM/actions/workflows/cd.yml/badge.svg)](https://github.com/imlinkk/DevOps_ASM/actions/workflows/cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-24-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docs.docker.com/compose/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Docker Setup](#docker-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring](#monitoring)
- [GitHub Secrets](#github-secrets-required)
- [Rollback](#rollback)

---

## Overview

A **Product Management REST API** built with Node.js/Express demonstrating a full DevOps lifecycle:

- **Application**: Express.js REST API with MongoDB (Mongoose)
- **Containerization**: Multi-stage Docker build + Docker Compose
- **CI**: Automated lint, security scan, and unit/integration tests via GitHub Actions
- **CD**: Auto-build Docker image → push to Docker Hub → deploy to Render
- **Monitoring**: Prometheus metrics + Grafana dashboards
- **Logging**: Centralized Winston logging with file and console transports

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 24 (Alpine) |
| Framework | Express.js 5 |
| Database | MongoDB 7 + Mongoose 9 |
| Logging | Winston + Morgan |
| Monitoring | Prometheus (`prom-client`) + Grafana |
| Testing | Jest + Supertest + `mongodb-memory-server` |
| Linting | ESLint (flat config) |
| Container | Docker (multi-stage) + Docker Compose |
| CI/CD | GitHub Actions |
| Deployment | Render.com |
| Security | Helmet, `npm audit`, Trivy |

---

## Project Structure

```
DevOps_ASM/
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI: lint → audit → test
│       └── cd.yml          # CD: build → push → deploy
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml  # Prometheus scrape config
│   └── grafana/
│       └── provisioning/
│           └── datasources/
│               └── datasource.yml
├── scripts/
│   └── rollback.sh         # Manual rollback script
├── src/
│   ├── config/
│   │   ├── database.js     # MongoDB connection
│   │   ├── env.js          # Environment variables
│   │   └── logger.js       # Winston logger
│   ├── controllers/
│   │   └── productController.js  # CRUD logic
│   ├── middlewares/
│   │   ├── errorHandler.js       # Centralized error handling
│   │   └── metricsMiddleware.js  # Prometheus middleware
│   ├── models/
│   │   └── productModel.js       # Mongoose schema
│   ├── routes/
│   │   ├── healthRoutes.js       # /health endpoints
│   │   ├── metricsRoutes.js      # /metrics endpoint
│   │   └── productRoutes.js      # /api/v1/products
│   ├── app.js              # Express app setup
│   └── server.js           # Server entrypoint
├── tests/
│   ├── integration/
│   │   ├── health.test.js  # Health & metrics tests
│   │   └── product.test.js # Product CRUD tests
│   └── setup.js            # MongoDB in-memory setup
├── .dockerignore
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── eslint.config.js
└── package.json
```

---

## Quick Start

### Prerequisites
- Node.js 20+, npm, Docker, Docker Compose

### 1. Local Development (without Docker)

```bash
# Clone the repo
git clone https://github.com/imlinkk/DevOps_ASM.git
cd DevOps_ASM

# Copy and configure environment
cp .env.example .env
# Edit .env with your MongoDB URI

# Install dependencies
npm install

# Start development server (nodemon)
npm run dev
```

### 2. Run with Docker Compose (Recommended)

```bash
# Copy and configure environment
cp .env.example .env

# Build and start all services
docker compose up --build

# Run in detached mode
docker compose up --build


# Stop all services
docker compose down
```

This starts:
| Service | Port | Description |
|---|---|---|
| Node.js API | `5000` | REST API |
| MongoDB | `27017` | Database |
| Prometheus | `9090` | Metrics scraper |
| Grafana | `3000` | Dashboard UI |

---

## API Endpoints

Base URL: `http://localhost:5000`

### System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Welcome + endpoint index |
| `GET` | `/health` | Full health check (DB + memory) |
| `GET` | `/health/live` | Liveness probe |
| `GET` | `/health/ready` | Readiness probe |
| `GET` | `/metrics` | Prometheus metrics |

### Products `/api/v1/products`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/products` | Create a new product |
| `GET` | `/api/v1/products` | Get all products (pagination + filter + search) |
| `GET` | `/api/v1/products/:id` | Get product by ID |
| `PUT` | `/api/v1/products/:id` | Update product by ID |
| `DELETE` | `/api/v1/products/:id` | Delete product by ID |

### Query Parameters (GET all)

| Parameter | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10, max: 100) |
| `category` | string | Filter by category |
| `search` | string | Fuzzy search by name |
| `sort` | string | Sort field (default: `-createdAt`) |

### Example Requests

```bash
# Create product
curl -X POST http://localhost:5000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","description":"High performance laptop","price":999.99,"category":"Electronics","stock":50}'

# Get all products
curl http://localhost:5000/api/v1/products?category=Electronics&page=1&limit=5

# Update product
curl -X PUT http://localhost:5000/api/v1/products/<id> \
  -H "Content-Type: application/json" \
  -d '{"price":899.99,"stock":30}'

# Delete product
curl -X DELETE http://localhost:5000/api/v1/products/<id>
```

---

## Docker Setup

### Dockerfile (Multi-Stage)

The `Dockerfile` uses a **two-stage build**:
1. **Builder stage** (`node:20-alpine`): installs all dependencies, runs build steps
2. **Production stage** (`node:20-alpine`): copies only production artifacts, runs as non-root user `nodeapp`

Benefits:
- Final image excludes dev dependencies
- Non-root user for security
- `dumb-init` for proper PID 1 signal handling
- Built-in Docker `HEALTHCHECK`

```bash
# Build image manually
docker build -t devops-node-api:latest .

# Run container
docker run -p 5000:5000 --env-file .env devops-node-api:latest
```

---

## CI/CD Pipeline

### CI (`ci.yml`) — Triggers on every push and PR

```
push / PR → Lint (ESLint) → Security Audit (npm audit + Trivy) → Tests (Jest + coverage)
```

| Step | Tool | Description |
|---|---|---|
| Lint | ESLint | Code quality check |
| Security | `npm audit` + Trivy | Vulnerability scanning |
| Test | Jest + Supertest | Unit & integration tests |
| Coverage | actions/upload-artifact | Upload HTML coverage report |

### CD (`cd.yml`) — Triggers only on push to `main`

```
push to main → CI Gate → Docker Build & Push → Trivy Scan → Deploy to Render → Health Check
```

| Step | Description |
|---|---|
| CI Gate | Re-runs CI before any deploy |
| Build & Push | Builds multi-stage Docker image, pushes to Docker Hub |
| Image Scan | Trivy scans the built image for HIGH/CRITICAL CVEs |
| Deploy | Triggers Render deploy hook |
| Health Check | Polls `/health/ready` until app is up or retries exhausted |

---

## Monitoring

### Prometheus
- Scrapes `/metrics` every 10s
- Tracks: `http_requests_total`, `http_request_duration_seconds`, Node.js default metrics
- UI: [http://localhost:9090](http://localhost:9090)

### Grafana
- Pre-configured Prometheus datasource
- UI: [http://localhost:3000](http://localhost:3000)
- Default credentials: `admin` / `admin`

---

## GitHub Secrets Required

Configure these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret Name | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (not your password) |
| `RENDER_DEPLOY_HOOK_URL` | Render deploy hook URL |
| `RENDER_APP_URL` | Your Render app URL (for health check) |

---

## Running Tests Locally

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

Tests use `mongodb-memory-server` — no external MongoDB needed.

---

## Rollback

If a deployment fails, roll back to a previous Docker image:

```bash
# Set environment variables
export DOCKERHUB_USERNAME=your-username
export RENDER_DEPLOY_HOOK_URL=https://api.render.com/deploy/...
export RENDER_APP_URL=https://your-app.onrender.com

# Rollback to a previous git SHA tag
./scripts/rollback.sh sha-abc1234
```

The script will:
1. Verify the image exists on Docker Hub
2. Re-tag it as `latest` and push
3. Trigger the Render deploy hook
4. Poll `/health/ready` until healthy

---

## License

MIT © 2024 DevOps Assignment
