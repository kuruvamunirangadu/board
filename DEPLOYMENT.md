# VisiOS Deployment, Cloud Infrastructure & Release Engineering Runbook

## 1. Minimal Recommended Deployment Architecture

VisiOS is structured as a high-performance **Next.js 14 App Router** application combining client-side spatial canvases (tldraw & Three.js), local persistence (LocalStorage/IndexedDB), and server-authoritative routes for analytics, real-time collaboration, multimodal ingestion, and health monitoring.

```
                  ┌─────────────────────────────────┐
                  │          End Users              │
                  │   (Focus Mode / Immersive HUD)  │
                  └───────────────┬─────────────────┘
                                  │ HTTPS (TLS 1.3)
                                  ▼
                  ┌─────────────────────────────────┐
                  │      Edge CDN & Security        │
                  │  (Headers, Compression, Caching)│
                  └───────────────┬─────────────────┘
                                  │
                                  ▼
                  ┌─────────────────────────────────┐
                  │    Next.js 14 Application Node  │
                  │   - /app UI Canvas Routes       │
                  │   - /api/health (Readiness/Live)│
                  │   - /api/analytics (Assessment) │
                  │   - /api/collab (Authoritative) │
                  │   - /api/ai-authoring (Verifier)│
                  └───────────────┬─────────────────┘
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
      ┌─────────────────────┐           ┌─────────────────────┐
      │ Client Persistence  │           │   External Cloud    │
      │ (IndexedDB / Local) │           │    AI Provider      │
      └─────────────────────┘           └─────────────────────┘
```

### Hosting Options & Cost Estimates

| Hosting Option | Target Tier | Estimated Monthly Cost | Recommended Use |
| :--- | :--- | :--- | :--- |
| **Vercel** | Hobby / Pro | **\$0 - \$20/mo** | Zero-config Next.js 14 edge deployment |
| **Google Cloud Run** | Serverless Container | **\$0 - \$5/mo** (free tier covers 2M reqs) | Docker container with CPU-throttled scaling |
| **Render / Railway** | Starter Container | **\$5 - \$7/mo** | Simple containerized Node.js runtime |
| **Self-Hosted VPS** | Ubuntu 22.04 + Docker | **\$4 - \$6/mo** (Hetzner / Linode) | Complete private institutional hosting |

---

## 2. Environment Variables & Secret Configuration

Copy `.env.example` to `.env.local` for local development or configure environment variables in your deployment dashboard:

```bash
# Production Application Configuration
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_APP_URL=https://your-domain.com

# AI Pipeline Key (Server-side only)
AI_PROVIDER_API_KEY=your_gemini_or_openai_key

# Security
COLLAB_SYNC_INTERVAL_MS=1200
MAX_UPLOAD_SIZE_MB=10
```

> **Security Rule**: Never prefix internal server secrets with `NEXT_PUBLIC_`. Keep API credentials strictly server-side.

---

## 3. Container Deployment (Docker)

### Build the Production Image
```bash
docker build -t visios-board:latest .
```

### Run the Container
```bash
docker run -d \
  --name visios-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e HOSTNAME=0.0.0.0 \
  --restart unless-stopped \
  visios-board:latest
```

### Verify Container Health
```bash
curl -f http://localhost:3000/api/health
```

---

## 4. Health Checks & Monitoring

The production health endpoint `/api/health` returns operational status across all core subsystems:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptimeSeconds": 1420,
  "memory": {
    "rssMB": 84.5,
    "heapUsedMB": 42.1,
    "heapTotalMB": 58.0
  },
  "subsystems": {
    "contentRegistry": { "status": "operational", "subjectsCount": 4 },
    "collaborationServer": { "status": "operational", "activeRoomsCount": 1 },
    "multimodalDocumentStore": { "status": "operational", "ingestedDocumentsCount": 2 },
    "analyticsEngine": { "status": "operational", "persistedAttemptsCount": 9 },
    "aiAuthoringPipeline": { "status": "operational" }
  }
}
```

---

## 5. Rollback & Disaster Recovery Runbook

If a deployment anomaly occurs in production:

1. **Immediate Traffic Rollback**:
   - On Vercel: Click **Deployments** → Select Previous Deployment → **Rollback**.
   - On Docker: Run `docker stop visios-app && docker run -d --name visios-app -p 3000:3000 visios-board:<previous_tag>`.
2. **Client Data Integrity**:
   - VisiOS stores user learning boards and experiment checkpoints client-side in LocalStorage and IndexedDB.
   - Deploying updates never deletes or overwrites client-persisted workspaces.
3. **Session Secret Rotation**:
   - If an API key or secret is compromised, generate a new secret: `openssl rand -base64 32`
   - Update the environment variable and trigger a rolling restart.

