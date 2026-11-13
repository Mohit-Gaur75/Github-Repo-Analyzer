# 📊 GitHub Repo Analyzer

> A high-performance, production-grade intelligence platform for GitHub repositories, developers, and engineering organizations.

![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)
![React](https://img.shields.io/badge/React-19.x-blue.svg)
![Vite](https://img.shields.io/badge/Vite-8.x-purple.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-emerald.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## 🚀 Features Overview

- **🤖 AI-Powered Insights**: Gemini 2.0 Flash commentary, architecture analysis, and tech debt detector.
- **📊 Real-Time Activity Feed**: Live Server-Sent Events (SSE) feed of repo commits, PRs, and issues.
- **🔄 Repository Comparison Mode**: Side-by-side metric comparison and radar charts.
- **👤 Developer & Maintainer Profile Analyzer**: Contributor scores, language dominance, and history.
- **🔐 Deep Vulnerability & CVE Scanner**: Automatic dependency vulnerability audit powered by OSV.dev.
- **📈 Star Growth & Trajectory Engine**: Linear regression forecasting and star growth velocity.
- **🌐 Tech Stack & Architecture Visualizer**: Auto-detects frameworks, databases, and build tooling.
- **🏷️ Release Cadence & Versioning Intelligence**: SemVer bump frequency and release interval analytics.
- **🤝 Contributor Intelligence & Bus Factor**: 65% contribution threshold Bus Factor and Gini index.
- **📑 Executive Audit Report**: One-click printable PDF audit report with executive scoring.
- **🌙 Dark / Light Theme System**: Seamless toggle with persistent preference and GitHub color tokens.
- **🔖 Saved Watchlist**: Pin, bookmark, and track repositories with custom notes.
- **🔍 Trending & Discovery Explorer**: Search top repositories across languages and timeframes.
- **⌨️ Command Palette (⌘K / Ctrl+K)**: Instant keyboard-driven global navigation and actions.
- **🗺️ Code Complexity & Hotspots Map**: Cyclomatic complexity scoring and file churn analysis.
- **📦 Software Bill of Materials (SBOM)**: Exportable SPDX 2.3 and CycloneDX 1.5 JSON with Package URLs (purl).
- **🧾 Dynamic SVG Shields Badges**: Real-time embeddable README SVG badges for quality, health, and bus factor.
- **🧠 Multi-Repo Organization Dashboard**: Portfolio-wide health overview and cross-repo analytics.
- **📅 52-Week Commit Activity Heatmap**: Interactive SVG calendar graph, streak counters, and 24×7 punchcard matrix.
- **🧪 CI/CD & Actions Workflow Health**: Pipeline pass/fail rates, durations, and flakiness tracking.
- **🔌 Public REST API & OpenAPI / Swagger Docs**: Complete OpenAPI 3.0.3 specification, live playground, and sandbox keys.
- **💬 Webhook & Slack / Discord Alerts**: Automated notification delivery for releases, CVEs, and CI failures.

---

## 🐳 Quick Start with Docker & Docker Compose

Run the entire platform (Frontend + Backend + MongoDB) with a single command:

### 1. Clone & Configure Environment
```bash
git clone https://github.com/your-username/Github-Repo-Analyzer.git
cd Github-Repo-Analyzer

# Copy example environment configuration
cp .env.example .env
```

Edit `.env` to add your optional `GITHUB_TOKEN` (for higher rate limits) and `GEMINI_API_KEY` (for AI insights):
```env
GITHUB_TOKEN=ghp_your_personal_access_token
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Start Services
```bash
docker compose up -d --build
```

### 3. Access Services
- **Web Application**: [http://localhost](http://localhost) (or port configured in `.env`)
- **Backend REST API**: [http://localhost:5001/api](http://localhost:5001/api)
- **Interactive Swagger Documentation**: [http://localhost:5001/api/docs](http://localhost:5001/api/docs)
- **API Health Check**: [http://localhost:5001/health](http://localhost:5001/health)

### 4. Stop Services
```bash
docker compose down
```

To stop and remove persistent database volumes:
```bash
docker compose down -v
```

---

## 🛠️ Local Development (Without Docker)

### Prerequisites
- **Node.js**: v20 or higher
- **MongoDB**: v6 or higher running locally or MongoDB Atlas connection string

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
Backend runs at `http://localhost:5001`.

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 🧪 Quality & Linting Verification

Both frontend and backend adhere to strict zero-warning ESLint standards:

```bash
# Verify Backend
cd backend
npm run lint
npm run check

# Verify Frontend
cd frontend
npm run lint
npm run build
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
