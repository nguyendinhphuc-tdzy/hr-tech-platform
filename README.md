# Intelligent HR Tech Platform

> AI-Powered Recruitment System with Hybrid Cloud + Local AI Architecture

<p align="center">
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Gemini-2.0%20Flash-4285F4?style=flat-square&logo=google" alt="Gemini">
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/Deployment-Vercel-000000?style=flat-square&logo=vercel" alt="Vercel">
</p>

---

## Demo Video

> [Watch Demo on Loom](#) *(Coming soon)*

---

## 1. What This Project Does

**HR Tech** is an intelligent recruitment platform that transforms the traditional CV screening process into an automated, AI-powered workflow.

### Core Features

| Feature | Description |
|---------|-------------|
| **AI CV Scanner** | Upload PDF CVs and get instant candidate scoring using Gemini AI |
| **Smart Matching** | Automatic candidate-to-job matching with 4-dimension rubric scoring |
| **Interactive Chat** | Ask AI questions about any candidate's CV in real-time |
| **Pipeline Kanban** | Drag-and-drop recruitment pipeline management |
| **Batch Upload** | Process multiple CVs simultaneously |
| **Market Insights** | AI-estimated salary benchmarks for Vietnam market |

---

## 2. Business Value

### For HR Teams

| Metric | Traditional | With HR Tech |
|--------|-------------|--------------|
| CV Screening Time | 10-15 min/cv | 30-60 sec/cv |
| Candidate Evaluation | Subjective | Consistent rubric-based |
| Data Organization | Spreadsheets | Centralized database |
| Search & Filter | Manual | Instant AI-powered |

### Impact

- **10x faster CV screening** through automated parsing and scoring
- **Reduced hiring bias** with standardized 4-dimension rubric
- **Better candidate experience** with instant application processing
- **Cost savings** of ~$500/month in recruiter man-hours (estimated)

---

## 3. Technical Highlights

### 3.1 Hybrid AI Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Processing Strategy                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   CV SCANNING ──────► Google Gemini (Cloud)                 │
│   • PDF Native Reading                                       │
│   • High accuracy parsing                                    │
│   • Fast processing (~3s per CV)                            │
│                                                             │
│   CV CHAT ─────────► Ollama Local (Privacy-First)           │
│   • Candidate data stays local                               │
│   • No cloud API calls for chat                             │
│   • Automatic fallback to Gemini if Ollama offline          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Scoring Rubric

The AI evaluates candidates using a standardized rubric:

| Dimension | Weight | Focus Area |
|-----------|--------|------------|
| Hard Skills | 40% | Technology, tools, programming languages |
| Experience | 30% | Real projects with measurable results |
| Education | 10% | Degrees, certifications |
| Soft Skills | 20% | Presentation, logical thinking |

**Output**: A 0-10 match score with detailed breakdown and recommendations.

### 3.3 Tech Stack

| Layer | Technology | Choice Rationale |
|-------|-----------|------------------|
| Frontend | React 19 + Vite | Fast dev experience, modern hooks |
| Backend | Node.js + Express | JavaScript everywhere, easy deployment |
| Database | Supabase PostgreSQL | Managed DB, built-in auth, storage |
| AI (Cloud) | Google Gemini Flash | Best price/performance for PDF parsing |
| AI (Local) | Ollama + Qwen 2.5 | Privacy-first chat without API costs |
| Hosting | Vercel + Render | Free tier friendly, easy scaling |

---

## 4. Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                           CLIENT                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  React SPA ─ Dashboard ─ CV Scanner ─ Pipeline ─ Chat     │   │
│  └────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
                                   │
                              HTTPS REST API
                                   │
┌────────────────────────────────────────────────────────────────────┐
│                           SERVER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Auth Middleware│  │ Job Import    │  │ CV Agent Service     │   │
│  │ (JWT/Header)  │  │ (CSV + PDF)   │  │ (Gemini + Ollama)   │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
                    │              │              │
          ┌─────────┴───┐   ┌──────┴──────┐   ┌───┴────┐
          │  Supabase   │   │  Supabase   │   │   AI   │
          │  Storage    │   │  Database   │   │ Engines│
          │  (CV PDFs)  │   │  (Jobs,     │   │        │
          │             │   │   Candidates)│   │        │
          └─────────────┘   └─────────────┘   └────────┘
```

---

## 5. Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- (Optional) Ollama for local AI chat

### Environment Setup

```bash
# Clone repository
git clone https://github.com/yourusername/hr-tech-platform.git
cd hr-tech-platform

# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Create environment files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

### Configure Environment

**frontend/.env.local**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

**backend/.env**
```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-key
GEMINI_API_KEY=your-gemini-key
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:7b
PORT=5000
```

### Run Development Server

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Access at `http://localhost:5173`

---

## 6. API Reference

### Authentication

```bash
# Login with email
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password" }

# Login with phone
POST /api/auth/phone-login
Body: { "phone": "0912345678", "password": "password", "is_register": false }
```

### Jobs

```bash
# List all jobs
GET /api/jobs

# Import jobs from CSV/PDF
POST /api/jobs/import
FormData: { "jd_file": <file> }
```

### Candidates

```bash
# List candidates (requires auth)
GET /api/candidates
Headers: { "x-user-email": "user@example.com" }
Query: ?job_id=1

# Upload CV for scanning
POST /api/cv/upload
Headers: { "x-user-email": "user@example.com" }
FormData: { "cv_file": <pdf>, "job_id": 1 }

# Update candidate status
PUT /api/candidates/:id/status
Body: { "status": "Interview" }
```

### AI

```bash
# Chat about a candidate
POST /api/ai/chat-cv
Body: { "question": "Does this candidate have React experience?", "cvContext": "..." }

# Check AI status
GET /api/ai/status
```

---

## 7. Cost Analysis

### Monthly Operating Cost (Free Tier)

| Service | Tier | Cost |
|---------|------|------|
| Frontend (Vercel) | Hobby | $0 |
| Backend (Render) | Free | $0 |
| Database (Supabase) | Free (500MB) | $0 |
| Storage (Supabase) | 1GB | ~$0.05 |
| Gemini API | 1M tokens/mo | ~$0.125 |
| **Total** | | **~$0.18/month** |

### Per-CV Processing

| Action | Cost |
|--------|------|
| Single CV scan | ~$0.001 |
| Batch 100 CVs | ~$0.10 |
| AI chat (Ollama) | Free |
| AI chat (Gemini fallback) | ~$0.0001 |

---

## 8. Scalability Path

### Current (Free Tier)
- ~10 concurrent users
- 500 CVs storage
- Sequential batch processing

### Next Steps

```
Phase 1: Optimize
├── Add Redis caching
├── Implement batch parallelization
└── Enable Supabase RLS policies

Phase 2: Scale
├── Render Pro ($7/mo) for better performance
├── Supabase Pro for more storage
└── Add CDN for static assets

Phase 3: Enterprise
├── Self-hosted Ollama on GPU
├── Dedicated AI infrastructure
└── Multi-tenant architecture
```

---

## 9. Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| Cold start on Render | 30s delay for first request | Upgrade to paid tier |
| Plain text passwords | Security risk | Implement bcrypt (see SECURITY.md) |
| Header-based auth | Replay attacks possible | Switch to JWT |
| Sequential batch upload | Slow for 100+ CVs | Implement parallel processing |

---

## 10. License

MIT License - Free for personal and commercial use.

---

## 11. Acknowledgments

- [Google Gemini](https://ai.google.dev/) - AI text and vision capabilities
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Ollama](https://ollama.com/) - Local AI inference
- [20in20 Partners](https://20in20.vn/) - Project inspiration and mentorship

---

<p align="center">
  Built with passion for HR innovation
</p>
