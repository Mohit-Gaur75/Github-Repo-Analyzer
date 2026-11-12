const { githubRequestSafe } = require("../utils/githubApi");

/**
 * Known technology signatures mapped to layer, icon, and description
 */
const TECH_SIGNATURES = {
  // ── Frontend Frameworks ───────────────────────────────────────────────────
  react: { name: "React", layer: "frontend", icon: "⚛️", role: "UI Library" },
  "react-dom": { name: "React DOM", layer: "frontend", icon: "⚛️", role: "UI Renderer" },
  vue: { name: "Vue.js", layer: "frontend", icon: "🟢", role: "Progressive Framework" },
  svelte: { name: "Svelte", layer: "frontend", icon: "🔥", role: "Reactive Framework" },
  next: { name: "Next.js", layer: "frontend", icon: "▲", role: "React Meta-Framework (SSR/SSG)" },
  nuxt: { name: "Nuxt", layer: "frontend", icon: "💚", role: "Vue Meta-Framework" },
  "@angular/core": { name: "Angular", layer: "frontend", icon: "🅰️", role: "Enterprise Framework" },
  "solid-js": { name: "SolidJS", layer: "frontend", icon: "🔷", role: "Declarative UI" },
  astro: { name: "Astro", layer: "frontend", icon: "🚀", role: "Content-Driven Framework" },
  gatsby: { name: "Gatsby", layer: "frontend", icon: "💜", role: "Static Site Generator" },
  "@remix-run/react": { name: "Remix", layer: "frontend", icon: "💿", role: "Full-Stack Web Framework" },

  // ── Styling & UI ──────────────────────────────────────────────────────────
  tailwindcss: { name: "Tailwind CSS", layer: "styling", icon: "🎨", role: "Utility-First CSS" },
  bootstrap: { name: "Bootstrap", layer: "styling", icon: "🅱️", role: "Component Library" },
  "@mui/material": { name: "Material-UI", layer: "styling", icon: "Ⓜ️", role: "React UI Components" },
  "@chakra-ui/react": { name: "Chakra UI", layer: "styling", icon: "⚡", role: "Accessible Component Library" },
  "styled-components": { name: "Styled Components", layer: "styling", icon: "💅", role: "CSS-in-JS" },
  sass: { name: "Sass / SCSS", layer: "styling", icon: "🌸", role: "CSS Preprocessor" },

  // ── Backend & APIs ────────────────────────────────────────────────────────
  express: { name: "Express.js", layer: "backend", icon: "🚂", role: "Minimalist Web Framework" },
  fastify: { name: "Fastify", layer: "backend", icon: "⚡", role: "High-Performance Framework" },
  "@nestjs/core": { name: "NestJS", layer: "backend", icon: "🦁", role: "Progressive Node.js Framework" },
  koa: { name: "Koa", layer: "backend", icon: "☕", role: "Next-Gen Node Framework" },
  django: { name: "Django", layer: "backend", icon: "🐍", role: "Python Web Framework" },
  flask: { name: "Flask", layer: "backend", icon: "🌶️", role: "Python Microframework" },
  fastapi: { name: "FastAPI", layer: "backend", icon: "⚡", role: "Modern Async Python API" },
  helmet: { name: "Helmet", layer: "backend", icon: "🛡️", role: "HTTP Header Security" },
  cors: { name: "CORS", layer: "backend", icon: "🌐", role: "Cross-Origin Middleware" },

  // ── Database & ORM ────────────────────────────────────────────────────────
  mongoose: { name: "Mongoose", layer: "database", icon: "🍃", role: "MongoDB ODM" },
  mongodb: { name: "MongoDB Native", layer: "database", icon: "🍃", role: "NoSQL Database" },
  "@prisma/client": { name: "Prisma", layer: "database", icon: "💎", role: "Next-Gen Node/TS ORM" },
  prisma: { name: "Prisma CLI", layer: "database", icon: "💎", role: "Database Schema & Migrations" },
  typeorm: { name: "TypeORM", layer: "database", icon: "🏛️", role: "TypeScript ORM" },
  "drizzle-orm": { name: "Drizzle ORM", layer: "database", icon: "💧", role: "Lightweight TypeScript ORM" },
  pg: { name: "PostgreSQL (pg)", layer: "database", icon: "🐘", role: "Postgres Client" },
  mysql2: { name: "MySQL (mysql2)", layer: "database", icon: "🐬", role: "MySQL Client" },
  redis: { name: "Redis", layer: "database", icon: "🔴", role: "In-Memory Data Store" },
  ioredis: { name: "IORedis", layer: "database", icon: "🔴", role: "Robust Redis Client" },
  sqlite3: { name: "SQLite3", layer: "database", icon: "📁", role: "Embedded SQL Database" },

  // ── State & Data Fetching ─────────────────────────────────────────────────
  redux: { name: "Redux", layer: "state", icon: "🟣", role: "Predictable State Container" },
  "@reduxjs/toolkit": { name: "Redux Toolkit", layer: "state", icon: "🟣", role: "Modern Standard Redux" },
  zustand: { name: "Zustand", layer: "state", icon: "🐻", role: "Bearbones State Management" },
  mobx: { name: "MobX", layer: "state", icon: "🧡", role: "Observable State Management" },
  pinia: { name: "Pinia", layer: "state", icon: "🍍", role: "Vue State Store" },
  "@tanstack/react-query": { name: "TanStack Query", layer: "state", icon: "📡", role: "Async State & Caching" },
  axios: { name: "Axios", layer: "state", icon: "🔄", role: "HTTP Client" },
  graphql: { name: "GraphQL", layer: "state", icon: "📐", role: "API Query Language" },
  "apollo-server": { name: "Apollo Server", layer: "state", icon: "🚀", role: "GraphQL Server" },

  // ── Build Tools & Bundlers ────────────────────────────────────────────────
  vite: { name: "Vite", layer: "build", icon: "⚡", role: "Next-Gen Frontend Tooling" },
  webpack: { name: "Webpack", layer: "build", icon: "📦", role: "Module Bundler" },
  esbuild: { name: "esbuild", layer: "build", icon: "⚡", role: "Ultra-Fast Bundler" },
  rollup: { name: "Rollup", layer: "build", icon: "📜", role: "ES Module Bundler" },
  turbo: { name: "Turborepo", layer: "build", icon: "🏎️", role: "High-Performance Monorepo" },
  babel: { name: "Babel", layer: "build", icon: "🐠", role: "JavaScript Compiler" },
  typescript: { name: "TypeScript", layer: "build", icon: "🔷", role: "Typed JavaScript" },

  // ── Testing & QA ──────────────────────────────────────────────────────────
  jest: { name: "Jest", layer: "testing", icon: "🃏", role: "Testing Framework" },
  vitest: { name: "Vitest", layer: "testing", icon: "⚡", role: "Vite-Native Test Runner" },
  cypress: { name: "Cypress", layer: "testing", icon: "🌲", role: "End-to-End Testing" },
  playwright: { name: "Playwright", layer: "testing", icon: "🎭", role: "Cross-Browser Automation" },
  eslint: { name: "ESLint", layer: "testing", icon: "🔍", role: "Code Quality & Linter" }
};

/**
 * File-based signatures (e.g. Dockerfile, tsconfig.json)
 */
const FILE_SIGNATURES = [
  { file: "dockerfile", name: "Docker", layer: "devops", icon: "🐳", role: "Containerization" },
  { file: "docker-compose.yml", name: "Docker Compose", layer: "devops", icon: "🐙", role: "Multi-Container Orchestration" },
  { file: "tsconfig.json", name: "TypeScript", layer: "languages", icon: "🔷", role: "Typed Language" },
  { file: "tailwind.config.js", name: "Tailwind CSS", layer: "styling", icon: "🎨", role: "Utility-First CSS" },
  { file: "vite.config.js", name: "Vite", layer: "build", icon: "⚡", role: "Vite Build Setup" },
  { file: "next.config.js", name: "Next.js", layer: "frontend", icon: "▲", role: "React Meta-Framework" },
  { file: ".github", name: "GitHub Actions", layer: "devops", icon: "🔄", role: "CI/CD Automation" }
];

/**
 * Inspect a repository and produce a categorized architectural tech stack
 */
const detectTechStack = async (owner, repo) => {
  try {
    const [contents, languagesData, pkgRaw, reqRaw] = await Promise.all([
      githubRequestSafe(`/repos/${owner}/${repo}/contents`),
      githubRequestSafe(`/repos/${owner}/${repo}/languages`),
      githubRequestSafe(`/repos/${owner}/${repo}/contents/package.json`, {
        headers: { Accept: "application/vnd.github.v3.raw" }
      }),
      githubRequestSafe(`/repos/${owner}/${repo}/contents/requirements.txt`, {
        headers: { Accept: "application/vnd.github.v3.raw" }
      })
    ]);

    const files = (contents || []).map((f) => f.name.toLowerCase());
    const detectedMap = new Map();

    const addTech = (sig, source) => {
      if (!detectedMap.has(sig.name)) {
        detectedMap.set(sig.name, { ...sig, source });
      }
    };

    // 1. Scan package.json
    if (pkgRaw) {
      try {
        const pkg = typeof pkgRaw === "string" ? JSON.parse(pkgRaw) : pkgRaw;
        const allDeps = {
          ...(pkg.dependencies || {}),
          ...(pkg.devDependencies || {})
        };

        for (const dep of Object.keys(allDeps)) {
          const lower = dep.toLowerCase();
          if (TECH_SIGNATURES[lower]) {
            addTech(TECH_SIGNATURES[lower], "package.json");
          }
        }
      } catch {
        // ignore parse error
      }
    }

    // 2. Scan requirements.txt
    if (reqRaw && typeof reqRaw === "string") {
      const lines = reqRaw.split("\n");
      for (const line of lines) {
        const dep = line.split(/[=><~]/)[0].trim().toLowerCase();
        if (TECH_SIGNATURES[dep]) {
          addTech(TECH_SIGNATURES[dep], "requirements.txt");
        }
      }
    }

    // 3. Scan Files (Dockerfile, Docker Compose, etc.)
    for (const fileSig of FILE_SIGNATURES) {
      if (files.some((f) => f === fileSig.file || f.startsWith(fileSig.file))) {
        addTech(fileSig, fileSig.file);
      }
    }

    // 4. Add Languages from GitHub
    const langMap = languagesData || {};
    const topLanguages = Object.keys(langMap).slice(0, 4);
    topLanguages.forEach((lang) => {
      addTech({
        name: lang,
        layer: "languages",
        icon: "💻",
        role: "Primary Programming Language"
      }, "GitHub Repository Languages");
    });

    // Organize into categorized layers
    const allDetected = Array.from(detectedMap.values());
    const layers = {
      frontend: allDetected.filter((t) => t.layer === "frontend"),
      backend: allDetected.filter((t) => t.layer === "backend"),
      database: allDetected.filter((t) => t.layer === "database"),
      state: allDetected.filter((t) => t.layer === "state"),
      styling: allDetected.filter((t) => t.layer === "styling"),
      build: allDetected.filter((t) => t.layer === "build"),
      testing: allDetected.filter((t) => t.layer === "testing"),
      devops: allDetected.filter((t) => t.layer === "devops"),
      languages: allDetected.filter((t) => t.layer === "languages")
    };

    // Compute primary architecture summary
    const hasFront = layers.frontend.length > 0;
    const hasBack = layers.backend.length > 0;
    const hasDB = layers.database.length > 0;

    let archType = "Full-Stack Application";
    if (hasFront && hasBack && hasDB) {
      archType = "Full-Stack Application (Frontend, Backend & DB)";
    } else if (hasFront && !hasBack) {
      archType = "Frontend Client / Web Application";
    } else if (!hasFront && hasBack) {
      archType = "Backend API & Microservice";
    } else if (!hasFront && !hasBack && layers.languages.length > 0) {
      archType = `${layers.languages[0].name} Library / Tooling`;
    }

    const mainHighlights = [
      ...layers.frontend.slice(0, 2).map((t) => t.name),
      ...layers.backend.slice(0, 1).map((t) => t.name),
      ...layers.database.slice(0, 1).map((t) => t.name)
    ];

    const summary = mainHighlights.length > 0
      ? `${archType} (${mainHighlights.join(" + ")})`
      : archType;

    // Generate Markdown README Badges
    const badges = allDetected.slice(0, 8).map((t) => {
      const cleanName = encodeURIComponent(t.name);
      return {
        name: t.name,
        markdown: `![${t.name}](https://img.shields.io/badge/${cleanName}-informational?style=flat-square&logo=${cleanName.toLowerCase()})`
      };
    });

    return {
      repo: `${owner}/${repo}`,
      summary,
      archType,
      totalDetected: allDetected.length,
      layers,
      allDetected,
      badges,
      detectedAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to detect tech stack: ${error.message}`);
  }
};

module.exports = { detectTechStack };
