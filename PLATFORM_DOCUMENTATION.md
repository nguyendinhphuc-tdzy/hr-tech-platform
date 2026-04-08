# Intelligent HR Tech Platform - Technical Manifesto

This document provides a comprehensive overview of the **Intelligent HR Tech Platform**, designed to assist AI agents and developers in understanding the system's architecture, logic, and current state.

---

## 1. Vision & Concept
Transforming traditional CV scanning into an enterprise-grade HR management ecosystem. The platform leverages **Hybrid AI** (Cloud + Local) to ensure data privacy (Local AI) while maintaining high-performance document processing (Cloud AI).

## 2. Technology Stack

### Frontend
- **Framework:** React (Vite)
- **Styling:** Vanilla CSS with custom "Glassmorphism" variables in `index.css`.
- **State Management:** React Hooks (`useState`, `useEffect`).
- **Charts:** `recharts` for dashboard analytics.
- **Client:** `axios` for API calls, `supabase-js` for Auth/Storage.

### Backend
- **Runtime:** Node.js (Express)
- **Architecture:** Monolithic (primary logic in `server.js`).
- **Database:** PostgreSQL (hosted on Supabase).
- **Storage:** Supabase Storage (Bucket: `cv_uploads`).
- **Email:** `nodemailer` for notifications.

### AI Architecture (Hybrid)
- **Engine A (Cloud):** Google Gemini (`gemini-2.5-flash`). Used for "heavy lifting" like PDF parsing, initial CV scoring, and JSON extraction.
- **Engine B (Local):** Ollama (`qwen2.5:7b`). Primary engine for the **CV Chatbot** to ensure candidate data privacy.
- **Routing:** Handled by `aiRouter()` in `server.js`.
  - Logic: **Local (Ollama) -> Fallback (Gemini)**.
  - Tunneling: Uses `ngrok` to bridge local Ollama to the Render server.

---

## 3. Core Modules & Features

### [Dashboard]
- Top-level metrics (Total candidates, Open positions, Hired count, Conversion rate).
- Trend charts for candidate flow.
- "Job Cards" showing pipeline status for each open role.

### [AI Recruitment (ATS 2.0)]
- **CV Scanning:** Gemini reads PDFs and maps them against specific Job Descriptions (JD).
- **Candidate Modal:**
  - **Match Score (0-10):** Based on a strict rubric (Hard Skills 40%, Exp 30%, Edu 10%, Soft Skills 20%).
  - **Salary Insight:** AI estimates market benchmark salaries in Vietnam (VND).
  - **Cross-Matching:** Automated alerts suggesting candidates for other roles if they match >85% but fail the current JD.
  - **Interactive Chatbot:** A "Robot Bubble" popup allowing HR to ask specific questions about the CV (e.g., "Does this candidate have experience with React Native?").

### [Core HR (In-progress)]
- Placeholder for Employee records, Time-off management, and Performance reviews.

---

## 4. API Structure & Authentication

### Authentication
- Uses **Supabase Auth**.
- **Security Note:** Requests to the backend include an `x-user-email` header. 
- **⚠️ Current Issue:** Authorization follows a simple header check without JWT verification. This is a prioritized security upgrade.

### Key Endpoints
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/cv/upload` | POST | Uploads PDF, triggers Gemini Scan, saves to DB. |
| `/api/ai/chat-cv`| POST | Triggers `aiRouter` for interactive CV chat. |
| `/api/jobs` | GET | Fetches all open job positions. |
| `/api/candidates`| GET | Fetches candidate list with pipeline statuses. |
| `/api/ai/status`| GET | Checks if Local AI (Ollama) is online. |

---

## 5. Directory Mapping

- `frontend/src/App.jsx`: Master layout, routing, and Auth state.
- `frontend/src/index.css`: The "Soul" of the UI - handles the Green Glassmorphism theme.
- `frontend/src/components/CandidateModal.jsx`: The most complex UI component containing the Analysis and Chatbot logic.
- `backend/server.js`: The "Engine" - contains AI Prompts, DB queries, and the Hybrid Router.
- `backend/.env`: Critical configuration for DB, API Keys, and Ollama URLs.

---

## 6. Known Issues & Roadmap

### Issues (To be fixed)
1. **DB Password:** Currently stored in plain text (needs `bcrypt`).
2. **Auth:** Header-based auth needs to transition to full JWT.
3. **Session:** Cold starts on Render can cause 30s delays for the first API call.

### Roadmap (Next Steps)
- Implementation of the **Employee Directory** (Core HR).
- Automated email notifications for candidates passing the "Offer" stage.
- Mobile-responsive optimization for the Dashboard.

---

## Instructions for AI Agents
When working on this project:
1. **Prompts:** Always ensure AI outputs are in **Vietnamese** for end-users but keep logs in English.
2. **Style:** Respect the **Glassmorphism** design. Use `var(--accent-color)` for primary actions.
3. **Privacy:** Priority should always be given to `OLLAMA` for chatting to keep CV data local.
4. **Backend:** Be careful with `server.js` as it is a large file; use precise line edits.

---
*Created on: April 07, 2026*
