# HR Tech Platform - Technical Architecture

> **Document Version**: 1.0 | **Last Updated**: May 2026
> **Status**: Production-ready (with security hardening required)

---

## 1. System Overview

### 1.1 Purpose
An intelligent HR recruitment platform that uses hybrid AI (cloud + local) to:
- Parse and analyze CVs automatically
- Score candidates against job requirements
- Provide interactive AI chat for HR queries
- Manage recruitment pipeline via Kanban workflow

### 1.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    React Frontend (Vite)                              │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐     │   │
│  │  │  Dashboard  │  │  CV Scanner  │  │  Candidate Modal + Chat │     │   │
│  │  └─────────────┘  └──────────────┘  └─────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                 Node.js/Express Server (Render)                      │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐     │   │
│  │  │ Auth Layer  │  │  Job Import   │  │    CV Agent Service     │     │   │
│  │  │ (Header)    │  │  (CSV/PDF)    │  │  (Gemini + Ollama)      │     │   │
│  │  └─────────────┘  └──────────────┘  └─────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────────┐    ┌─────────────────────────┐
│  Supabase   │      │  Supabase DB    │    │    AI Engines           │
│  Storage    │      │  (PostgreSQL)   │    │  ┌─────────┬─────────┐  │
│  (CV PDFs)  │      │  Candidates     │    │  │ Gemini  │ Ollama  │  │
│             │      │  Jobs           │    │  │ (Cloud) │ (Local) │  │
│             │      │  Users          │    │  └─────────┴─────────┘  │
└─────────────┘      └─────────────────┘    └─────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Framework | React | 19.x | UI Library |
| Build Tool | Vite | 7.x | Fast HMR & Build |
| Routing | React Router | 7.x | SPA Navigation |
| State | React Hooks | - | Local State Management |
| HTTP Client | Axios | 1.x | API Communication |
| Auth Client | Supabase JS | 2.x | Authentication |
| Charts | Recharts | 3.x | Dashboard Analytics |
| Drag & Drop | @hello-pangea/dnd | 18.x | Kanban Pipeline |
| Hosting | Vercel | - | Edge Deployment |

### 2.2 Backend
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Runtime | Node.js | 20.x | Server Runtime |
| Framework | Express | 5.x | REST API |
| Database | PostgreSQL | 15+ | Data Storage |
| DB Client | pg | 8.x | PostgreSQL Driver |
| File Upload | Multer | 2.x | Multipart Handling |
| AI SDK | @google/generative-ai | 0.24.x | Gemini Integration |
| Supabase | @supabase/supabase-js | 2.x | Storage & Auth |
| CSV Parse | csv-parser | 3.x | JD Import |
| Doc Parse | mammoth | 1.x | DOCX Support |
| Email | nodemailer | 7.x | Notifications |
| Hosting | Render | - | Backend Deployment |

### 2.3 AI Engines
| Engine | Model | Deployment | Use Case |
|--------|-------|------------|----------|
| Google Gemini | 2.0-flash | Cloud (API) | CV Scanning, PDF Parsing |
| Ollama | qwen2.5:7b | Local (ngrok tunnel) | Interactive Chat (Privacy) |

---

## 3. Data Flow Architecture

### 3.1 CV Upload & Analysis Flow

```
User uploads CV
       │
       ▼
┌──────────────────┐
│  Frontend Form   │
│  (Select Job)    │
└────────┬─────────┘
         │ FormData (PDF + job_id)
         ▼
┌──────────────────┐
│  POST /api/cv/upload  │
│  requireAuth      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Multer Upload   │
│  → Supabase      │
│  Storage         │
└────────┬─────────┘
         │ publicUrl
         ▼
┌──────────────────┐
│  runCVAgent()     │
│  cvAgent.js      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Gemini Flash    │
│  Native PDF      │
│  Reading         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Parse JSON      │
│  + Validate      │
│  + Score Calc    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Insert to DB    │
│  candidates table│
└────────┬─────────┘
         │
         ▼
    Return Result
```

### 3.2 AI Chat Flow (Hybrid Router)

```
HR asks question about CV
          │
          ▼
┌─────────────────────────┐
│ POST /api/ai/chat-cv    │
│ requireAuth              │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ aiRouter()              │
│ preferLocal = true      │
└────────────┬────────────┘
             │
    ┌────────┴────────┐
    │                │
    ▼                ▼
┌─────────┐    ┌──────────────┐
│ Ollama  │───▶│ Fallback?   │
│ Local   │    │ (on error)  │
└────┬────┘    └──────┬───────┘
     │ success        │ failure
     │                ▼
     │         ┌──────────────┐
     │         │ Gemini Cloud │
     │         │ (API)        │
     │         └──────┬───────┘
     │                │
     └───────┬────────┘
             │
             ▼
      Return Answer
      + Engine Used
```

### 3.3 Job Import Flow

```
User uploads JD (CSV or PDF)
          │
          ▼
┌─────────────────────────┐
│ POST /api/jobs/import  │
│ multer.single('file')  │
└────────────┬────────────┘
             │
    ┌────────┴────────┐
    │                │
    ▼                ▼
┌─────────┐    ┌──────────────┐
│  CSV    │    │  PDF        │
│ Parser  │    │  Gemini     │
└────┬────┘    │  Native     │
     │         └──────┬───────┘
     │                │
     ▼                ▼
┌─────────────────────────┐
│ Parse → JSON → Insert   │
│ job_positions table     │
└─────────────────────────┘
```

---

## 4. Database Schema

### 4.1 Tables

```sql
-- Users table (simplified auth)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255),
    phone_number VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255), -- Plain text (SECURITY ISSUE - see risks)
    role VARCHAR(50) DEFAULT 'User',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Job Positions
CREATE TABLE job_positions (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    requirements JSONB, -- {skills, experience, education, description}
    created_at TIMESTAMP DEFAULT NOW()
);

-- Candidates
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER DEFAULT 1,
    job_id INTEGER REFERENCES job_positions(id),
    full_name VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(255), -- Applied position
    status VARCHAR(50) DEFAULT 'Screening',
    ai_rating DECIMAL(3,1), -- 0.0 - 10.0
    ai_analysis JSONB, -- Full AI analysis
    cv_file_url TEXT,
    owner_email VARCHAR(255), -- HR who uploaded
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 Relationships

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users     │       │  job_positions   │       │  candidates  │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)          │       │ id (PK)      │
│ email        │       │ title            │◄──────│ job_id (FK)  │
│ password     │       │ requirements     │       │ full_name    │
│ role         │       │ organization_id  │       │ email        │
└──────────────┘       └──────────────────┘       │ role         │
                                                     │ status       │
                                                     │ ai_rating    │
                                                     │ ai_analysis  │
                                                     │ owner_email  │
                                                     └──────────────┘
```

---

## 5. API Endpoints

### 5.1 Authentication

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/login` | POST | None | Email/password login |
| `/api/auth/phone-login` | POST | None | Phone + password login/register |
| `/api/account/profile` | PUT | Header | Update user profile |

### 5.2 Jobs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/jobs` | GET | None | List all job positions |
| `/api/jobs/import` | POST | None | Import JD (CSV/PDF) |

### 5.3 Candidates

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/candidates` | GET | Header | List candidates (filter by job_id) |
| `/api/cv/upload` | POST | Header | Upload + scan CV |
| `/api/candidates/:id/status` | PUT | Header | Update candidate status |

### 5.4 AI

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/ai/chat-cv` | POST | Header | AI chat about CV |
| `/api/ai/status` | GET | None | Check Ollama status |

### 5.5 Dashboard

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/dashboard/stats` | GET | Header | Job stats + pipeline counts |

---

## 6. AI Processing Details

### 6.1 Scoring Rubric

| Dimension | Weight | Max Points | Criteria |
|-----------|--------|------------|----------|
| Hard Skills | 40% | 4.0 | Technology match, tools proficiency |
| Experience | 30% | 3.0 | Real projects, measurable results |
| Education | 10% | 1.0 | Degree, certifications |
| Soft Skills | 20% | 2.0 | Presentation, logical thinking |

**Total Maximum: 10.0 points**

### 6.2 CV Agent Prompt Structure

```javascript
// Prompt sent to Gemini for CV analysis
{
  role: "Tech Recruiter Expert",
  jobTitle: "[Position Name]",
  jobRequirements: "[Extracted skills from JD]",
  instructions: [
    "Extract: name, email, skills array",
    "Score according to rubric (0-10)",
    "Provide breakdown: hard_skills, experience, education, soft_skills",
    "Generate: match_reason, strengths[], weaknesses[], usp, missing_skills[]",
    "Estimate market salary for Vietnam"
  ],
  outputFormat: "JSON (Tiếng Việt)"
}
```

### 6.3 AI Router Logic

```javascript
async function aiRouter({ prompt, preferLocal = false }) {
  if (preferLocal && USE_LOCAL_AI === "true") {
    // Try Ollama first
    try {
      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        body: { model: OLLAMA_MODEL, messages: [{ role: "user", content: prompt }] },
        signal: AbortSignal.timeout(15000) // 15s timeout
      });
      return { text, engine: "ollama", model: OLLAMA_MODEL };
    } catch (ollamaError) {
      // Fallback to Gemini
      console.warn("Ollama failed, using Gemini fallback");
    }
  }
  // Gemini Cloud fallback
  return await gemini.generateContent(prompt);
}
```

---

## 7. File Storage

### 7.1 Supabase Storage Structure

```
Bucket: cv_uploads
├── [timestamp]_[sanitized_filename].pdf
├── [timestamp]_[sanitized_filename].pdf
└── ...
```

### 7.2 File Naming Convention

```javascript
function sanitizeFilename(filename) {
  // Remove Vietnamese diacritics
  const str = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Replace special chars with underscore
  return str.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
}

// Usage: ${Date.now()}_${sanitizeFilename(originalName)}
// Example: 1712345678900_cv_nguyen_van_a.pdf
```

---

## 8. Environment Configuration

### 8.1 Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI
GEMINI_API_KEY=AIza...
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:7b
OLLAMA_TIMEOUT_MS=15000
USE_LOCAL_AI=true

# Mail
MAIL_USER=hrtech.system.noreply@gmail.com
MAIL_PASS=xxxx xxxx xxxx xxxx

# Server
PORT=5000
```

### 8.2 Frontend (.env.local)

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 9. Deployment Architecture

### 9.1 Current Production Setup

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL (CDN)                              │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ Frontend: https://hr-tech-platform.vercel.app            │   │
│  │ - Edge deployment                                        │   │
│  │ - Auto-scaling                                           │   │
│  │ - Free tier: 100GB bandwidth/month                       │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        RENDER (Backend)                          │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ API Server: https://hr-api-server.onrender.com            │   │
│  │ - Free tier: 512MB RAM, 0.5 CPU                           │   │
│  │ - Sleep after 15min inactivity                            │   │
│  │ - Cold start: ~30 seconds                                 │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   SUPABASE      │  │   SUPABASE      │  │   OLLAMA        │
│   PostgreSQL    │  │   Storage       │  │   (Local)       │
│   - Candidates  │  │   - CV PDFs     │  │   via ngrok     │
│   - Jobs        │  │                 │  │                 │
│   - Users       │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 9.2 Cost Estimation (Monthly)

| Service | Tier | Estimated Cost |
|---------|------|----------------|
| Vercel Frontend | Free | $0 |
| Render Backend | Free | $0 |
| Supabase DB | Free (500MB) | $0 |
| Supabase Storage | 1GB | ~$0.05/GB |
| Gemini API | 1M tokens | ~$0.125 |
| **Total** | | **~$0.20/month** |

### 9.3 Per-Execution Cost

| Action | AI Calls | Est. Cost |
|--------|----------|-----------|
| Single CV Scan | 1x Gemini PDF | ~$0.001 |
| AI Chat | 1x Ollama/Gemini | ~$0.0001 |
| JD Import (PDF) | 1x Gemini | ~$0.0005 |
| Batch 100 CVs | 100x Gemini | ~$0.10 |

---

## 10. Scalability Considerations

### 10.1 Current Limitations

| Area | Current | Limitation |
|------|---------|------------|
| Batch Upload | Sequential | 100 CVs = ~5-10 min |
| Cold Start | 30s Render | First request delayed |
| Concurrent Users | ~10 | Render free tier |
| Storage | 1GB free | Upload limit ~500 PDFs |

### 10.2 Scaling Path

```
Current (Free Tier)
        │
        ▼
┌───────────────────┐
│ Scale Up          │
│ - Render Pro $7   │ → Better CPU/RAM
│ - Supabase Pro    │ → More storage/bandwidth
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Scale Out         │
│ - Vercel Pro      │ → Unlimited bandwidth
│ - Railway/Render  │ → Better cold start
│ - Redis Cache     │ → Session & prompt cache
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Enterprise        │
│ - GCP/AWS Vertex  │ → Private AI deployment
│ - Dedicated GPU   │ → Local Ollama (no ngrok)
│ - CDN + WAF       │ → Security layer
└───────────────────┘
```

---

## 11. Observability

### 11.1 Current Logging

```javascript
// Console logs for debugging
console.log("🤖 Scan:", filename);
console.log("🟢 [AI Router] Ollama phản hồi thành công");
console.warn("⚠️ [AI Router] Ollama thất bại, chuyển Fallback");
console.error("❌ [CV Agent] Gemini Flash 2.0 thất bại:", err);
```

### 11.2 Recommended Observability Stack

| Tool | Purpose | Free Tier |
|------|---------|-----------|
| Sentry | Error tracking | 5k events/mo |
| LogRocket | Session replay | 1k sessions/mo |
| Datadog | APM | 1 host free |
| Better Uptime | Monitoring | 1 endpoint free |

---

*Document authored for 20in20 Partners AI Automation Intern Portfolio*
