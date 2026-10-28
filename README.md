# VisiOS — Visual Learning Operating System

VisiOS is an interactive visual learning operating system designed for students and educators to write, sketch, explore 2D and 3D visual concepts, run synchronized physics simulations, ingest lecture notes, and collaborate in real-time.

---

## 🏛️ System Architecture

Built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **tldraw Canvas SDK**, and **Three.js**.

```
visios-board/
├── src/
│   ├── app/
│   │   ├── page.tsx            # Interactive Visual Workspace (Focus / Immersive Mode)
│   │   ├── analytics/          # Learning Analytics & Instructor Dashboard
│   │   ├── collab/             # Real-Time Collaboration Rooms
│   │   ├── paths/              # Adaptive Learning Paths & Concept Dependencies Graph
│   │   ├── subjects/           # Multi-Subject Knowledge Engine & Registry
│   │   ├── authoring/          # Visual Content Authoring Studio & AI Generation
│   │   ├── library/            # Learning Sessions & Saved Experiment Checkpoints
│   │   ├── space/              # 3D Spatial Universe
│   │   └── api/
│   │       ├── health/         # System Readiness & Uptime Health Check
│   │       ├── analytics/      # Assessment Attempts & Cohort Aggregates
│   │       ├── collab/         # Authoritative Collaboration Server & Simulation Sync
│   │       └── ai-authoring/   # AI Topic-to-Module Generator & Verification
│   ├── components/
│   │   ├── 3d/                 # Three.js WebGL Viewers (Anatomical Heart, Orbit Controls)
│   │   ├── analytics/          # KPI Cards, Concept Breakdown, Item Analysis
│   │   ├── collaboration/      # Presence Bar, Discussion Feed, Synced Simulation
│   │   ├── simulation/         # Symplectic Euler Pendulum & Phase Space Portraits
│   │   └── shell/              # Navigation, TopBar, Toolbars
│   ├── features/
│   │   ├── analytics/          # Deterministic Analytics & Recommendation Service
│   │   ├── authoring/          # Visual Graph Editor & 6-Layer Verification
│   │   ├── collaboration/      # Real-Time Synchronized Room Authority Store
│   │   ├── intelligence/       # Context-Aware Explanations & Knowledge Checks
│   │   ├── knowledge/          # Content Manifest & Multi-Subject Registry
│   │   ├── learning-paths/     # Topological Concept Graph & Recommendation Engine
│   │   ├── multimodal/         # PDF, Markdown & Image Ingestion with Traceability
│   │   └── simulation/         # Symplectic Physics Integrator & Phase Trajectories
│   └── tests/                  # End-to-end Automated Verification Suite (54+ tests)
```

---

## 🚀 Key Feature Highlights

1. **Dual Experience Modes**:
   - **Focus Mode**: Distraction-free, minimal slate interface for deep study.
   - **Immersive Mode**: Cyber HUD spatial matrix with glowing telemetry panels.
2. **Interactive 3D Objects**: Three.js WebGL anatomical models living on the canvas with orbit controls and resource disposal.
3. **Symplectic Physics Simulation**: Nonlinear pendulum dynamics ($d^2\theta/dt^2 = -(g/L)\sin\theta - \gamma\omega$) with energy conservation and phase space portraits $(\theta, \omega)$.
4. **Adaptive Learning Paths (`/paths`)**: Directed Acyclic Graph (DAG) concept dependencies with cycle detection and personalized recommendations.
5. **Multi-Subject Registry (`/subjects`)**: Validated content packs across Physics, Mathematics, Computer Science, and Electronics.
6. **Visual Authoring Studio (`/authoring`)**: Visual concept graph editor, draft snapshots, and publication pipelines.
7. **AI-Assisted Content Generation (`/api/ai-authoring`)**: Topic-to-concept generator with a 6-layer deterministic verification engine.
8. **Multimodal Learning Engine**: Ingests lecture notes, textbooks, and equations with source grounding citations.
9. **Real-Time Collaboration (`/collab`)**: Synchronized multi-learner rooms with authoritative physics parameters, board locks, and demonstration mode.
10. **Learning Analytics & Instructor Dashboard (`/analytics`)**: Evidence-grounded mastery metrics, question item analysis, retake policies, and exportable reports.
11. **Production Health & Resilience (`/api/health`)**: Health monitoring, non-root Docker builds, and global ErrorBoundary protection.

---

## 🛠️ Local Development & Testing

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Run automated verification suite (54+ tests)
npm test

# 4. Run Next.js production build
npm run build

# 5. Start production server
npm run start
```

---

## 🐳 Docker Deployment

```bash
# Build production Docker image
docker build -t visios-board:latest .

# Run containerized application
docker run -d -p 3000:3000 --name visios-app visios-board:latest

# Check health
curl -f http://localhost:3000/api/health
```

For complete cloud deployment, rollback runbooks, and cost estimation, see [DEPLOYMENT.md](file:///c:/Users/kuruv/project/board/DEPLOYMENT.md).
