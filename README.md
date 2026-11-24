# Learn X - AI-Powered Interactive Classroom Platform

Learn X is a modern full-stack educational platform connecting students and professors with real-time interactive classrooms, multimodal AI assistance (Text, Speech, and Live Vision), assignments management, automated learning analytics, and a high-performance **Java Backend Service & Code Execution Sandbox**.

---

## 🏛️ System Architecture

Learn X follows an intelligent polyglot architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 15 Frontend                       │
│  - Interactive Classrooms & Assignment Portals             │
│  - Multimodal AI Assistant (Text / Speech / Live Camera)    │
│  - Interactive Java Code Sandbox & Terminal                 │
└────────────────┬────────────────────────────┬───────────────┘
                 │ (Internal Next.js API)     │ (Proxy to /api/java/*)
                 ▼                            ▼
┌──────────────────────────────┐  ┌───────────────────────────────┐
│     Next.js API Routes       │  │   Java 21+ Backend Service    │
│  - Gemini Multimodal Tunnel  │  │   (Virtual Threads / 8080)    │
│  - MongoDB / Memory Fallback │  │  - Classroom & Roster Engine  │
└──────────────────────────────┘  │  - Learning Analytics Engine  │
                                  │  - Java Code Runner Sandbox   │
                                  │  - Zero External Dependencies │
                                  └───────────────────────────────┘
```

---

## ✨ Features

- 🎓 **Student Experience**: Join classrooms, participate in real-time discussions, submit assignments, and get 24/7 personalized AI tutoring.
- 👨‍🏫 **Professor Dashboard**: Create classrooms, manage assignments, review submissions, and view Gemini-powered class analytics and weak concept breakdowns.
- ☕ **High-Performance Java Backend & Code Sandbox**:
  - **REST API on Port 8080**: Built with Java's native high-concurrency `HttpServer` and Virtual Threads (`Executors.newVirtualThreadPerTaskExecutor()`).
  - **Learning Analytics Engine**: Computes mastery indices, weak concept distributions, and executive summaries.
  - **Interactive Java Code Runner**: Students and professors can write and execute Java code directly in the browser with live stdout/stderr execution outputs.
  - **Zero-Dependency Native Architecture**: Runs directly on any modern JDK without external dependencies or heavy frameworks.
- 🤖 **Multimodal AI Assistant**:
  - **Chat**: Intelligent context-aware answers tailored for students (study guidance) and professors (classroom management).
  - **Voice Assistant**: Live speech-to-text recognition and text-to-speech audio feedback.
  - **Live Camera Vision**: Scan whiteboard diagrams, formulas, and handwritten notes for instant explanations.
  - **Java Code Playground**: Test algorithms, data structures, and classroom assignments in real time.

---

## 🚀 Getting Started

### 1. Environment Variables

Create a `.env.local` file (see `.env.example`):

```bash
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: MongoDB Connection String (in-memory store fallback is included)
MONGODB_URI=""

# Java Backend Service URL
JAVA_BACKEND_URL=http://127.0.0.1:8080
```

### 2. Run the Java Backend Service

You can start the Java backend using the provided launcher script:

```bash
# Directly with npm
npm run server:java

# Or via shell script directly
bash run-java-backend.sh
```

The Java service will boot on `http://127.0.0.1:8080`.

### 3. Run the Next.js Frontend

In another terminal:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☕ Java Backend Endpoints

The Java backend exposes the following REST endpoints (also accessible via Next.js proxy at `/api/java/*`):

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck and Java runtime info |
| `GET` | `/api/classroom/list` | List all classrooms |
| `POST` | `/api/classroom/create` | Create a new classroom |
| `GET` | `/api/classroom/{id}` | Get classroom details and roster |
| `POST` | `/api/classroom/join` | Join a classroom via code |
| `GET` | `/api/assignment/list` | List assignments for a classroom |
| `POST` | `/api/assignment/create` | Create a new assignment |
| `POST` | `/api/assignment/submit` | Submit an assignment |
| `POST` | `/api/analyze` | Ingest student activity for concept analysis |
| `GET` | `/api/analytics/classroom/summary` | Generate executive analytics report |
| `POST` | `/api/code/run` | Compile & execute Java code safely in sandbox |

---

## 🐳 Containerized Deployment (Docker & Docker Compose)

You can launch both the Next.js application and the Java backend with Docker Compose:

```bash
docker compose up --build
```

- Next.js frontend: `http://localhost:3000` (or `7860`)
- Java backend service: `http://localhost:8080`
# javaproject
