# Security & Risk Assessment

> **Document Version**: 1.0 | **Risk Assessment Date**: May 2026
> **Classification**: Internal Use Only

---

## 1. Security Risk Matrix

| Risk ID | Category | Severity | Likelihood | Risk Score | Status |
|---------|----------|----------|------------|------------|--------|
| SEC-001 | Plain Text Passwords | CRITICAL | High | 15 | Mitigating |
| SEC-002 | Weak Authentication | HIGH | High | 12 | Mitigating |
| SEC-003 | Hardcoded Secrets | HIGH | Medium | 10 | Open |
| SEC-004 | No Rate Limiting | MEDIUM | Medium | 6 | Open |
| SEC-005 | File Upload Vulnerabilities | MEDIUM | Low | 4 | Mitigating |
| SEC-006 | No Input Sanitization | MEDIUM | Medium | 6 | Open |
| SEC-007 | CV Data Privacy | HIGH | Medium | 9 | Mitigating |
| SEC-008 | No HTTPS Enforcement | MEDIUM | Low | 3 | Closed |

---

## 2. Critical Risks (Immediate Action Required)

### 2.1 SEC-001: Plain Text Password Storage

**Location**: `backend/server.js`
- Lines 308: `VALUES ($1, $2, NULL, $3, 'User')` where `$3` is plain password
- Lines 313, 327: `user.password !== password` comparison

**Impact**: If database is compromised, all user credentials are exposed in plain text.

**Current State**:
```javascript
// INSECURE - Do not use in production
await pool.query(
  `INSERT INTO users (full_name, phone_number, email, password, role) VALUES ($1, $2, NULL, $3, 'User')`,
  [full_name, phone, password]  // password stored as-is
);
```

**Mitigation Required**:
```javascript
// SECURE - Use bcrypt
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// Hash on registration
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
await pool.query('INSERT INTO users ...', [hashedPassword]);

// Verify on login
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

**Effort**: 2-3 hours

---

### 2.2 SEC-002: Header-Based Authentication

**Location**: `backend/server.js` lines 108-116

**Current Implementation**:
```javascript
const requireAuth = (req, res, next) => {
  const userEmail = req.headers['x-user-email'];
  if (!userEmail) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userEmail = userEmail;
  next();
};
```

**Vulnerabilities**:
- No signature verification
- Token can be replayed
- No expiration
- Anyone who knows an email can impersonate users

**Impact**: Unauthorized access to all candidate data, ability to modify records.

**Mitigation Path**:

**Option A: JWT (Recommended for Supabase)**
```javascript
// Using Supabase Auth JWT
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Missing token" });
  }
  
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: "Invalid token" });
  }
  
  req.user = user;
  req.userEmail = user.email;
  next();
};
```

**Option B: Session Cookies**
```javascript
const session = require('express-session');
const RedisStore = require('connect-redis');

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

**Effort**: 4-6 hours

---

### 2.3 SEC-003: Hardcoded Values

**Locations**:

| File | Line | Issue |
|------|------|-------|
| `CandidateModal.jsx` | 55 | `'x-user-email': 'admin'` |
| `config.js` | 4 | `hr-api-server.onrender.com` |

**Impact**: Security through obscurity, not secure.

**Fix**:
```javascript
// config.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : '');

// CandidateModal.jsx - Remove hardcoded
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
// Use token-based auth instead of email header
```

**Effort**: 1 hour

---

## 3. Medium Risks (Address in Sprint)

### 3.1 SEC-004: No Rate Limiting

**Issue**: No protection against brute force or API abuse.

**Current Attack Surface**:
- `/api/auth/phone-login` - No attempt limiting
- `/api/cv/upload` - Unlimited CV uploads
- `/api/ai/chat-cv` - Unlimited AI queries

**Impact**: DoS attacks, credential stuffing, API cost exhaustion.

**Mitigation**:
```javascript
const rateLimit = require('express-rate-limit');

// General API limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests'
});

// Auth endpoints - stricter
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  message: 'Too many login attempts'
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

**Effort**: 1 hour

---

### 3.2 SEC-005: File Upload Vulnerabilities

**Current State**:
```javascript
const upload = multer({ storage: storage }); // No limits!
```

**Issues**:
- No file size limit
- No MIME type validation beyond browser-supplied
- No content scanning
- Filename sanitization good but not comprehensive

**Recommended Fix**:
```javascript
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1 // One file at a time
  },
  fileFilter: (req, file, cb) => {
    // Strict MIME type check
    const allowedMimes = ['application/pdf'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Only PDF files allowed'));
    }
    
    // Magic number validation (PDF = %PDF)
    // Add content-type sniffing here
    
    cb(null, true);
  }
});
```

**Effort**: 2 hours

---

### 3.3 SEC-006: No Input Sanitization

**Issue**: User inputs directly inserted into prompts and database.

**Examples**:
- Job title passed directly to AI prompts
- Full name stored without sanitization
- Email not validated properly

**Impact**: Prompt injection, XSS, SQL injection (though mitigated by pg parameterized queries).

**Mitigation**:
```javascript
const validator = require('validator');

// Sanitize inputs
const sanitizeJobTitle = (title) => {
  return validator.escape(validator.trim(title));
};

const validateEmail = (email) => {
  return validator.isEmail(email);
};

// AI Prompt - Sanitize before sending
const safeJobTitle = sanitizeJobTitle(jobTitle);
const prompt = `Analyze CV for position: ${safeJobTitle}`;
```

**Effort**: 2 hours

---

### 3.4 SEC-007: CV Data Privacy

**Current Architecture**:

```
User uploads CV → Stored in Supabase Storage (Cloud)
                    ↓
              Gemini API scans → CV data processed on Google servers
                    ↓
              AI Analysis → Results stored in database
```

**Privacy Concerns**:
- CVs (containing PII) stored on third-party cloud
- Processed by Google Gemini API
- No data retention policy

**Mitigation Options**:

**Option A: Local Ollama for All Processing** (Current partial implementation)
- Chat uses Ollama (local)
- CV Scanning uses Gemini (cloud)

**Option B: Privacy-First Architecture**
```
CV uploaded → Encrypted immediately (AES-256)
           → Stored encrypted
           → Decrypted only in memory during Ollama processing
           → No cloud AI API calls
```

**Trade-offs**:
| Approach | Privacy | Accuracy | Cost | Speed |
|----------|---------|----------|------|-------|
| Ollama Only | High | Medium | Free | Slow |
| Gemini Only | Low | High | $ | Fast |
| Hybrid (Current) | Medium | High | $ | Fast |

**Recommendation**: Add privacy mode toggle for sensitive candidates.

**Effort**: 8-12 hours

---

## 4. Low Risks (Technical Debt)

### 4.1 SEC-008: No CSRF Protection

**Status**: Mitigated by using JWT in Authorization header instead of cookies.

### 4.2 SEC-009: No Content Security Policy

**Recommendation**: Add CSP headers
```javascript
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://*.supabase.co https://*.googleapis.com;"
  );
  next();
});
```

---

## 5. Operational Risks

### 5.1 OR-001: Cold Start Delays

**Issue**: Render free tier sleeps after 15 minutes, causing 30-second delays.

**Impact**: Poor user experience, timeouts on CV scans.

**Mitigation**:
1. Upgrade to Render Starter ($7/month)
2. Implement keep-alive ping
3. Add loading states with timeout handling

**Effort**: 1 hour

---

### 5.2 OR-002: API Key Exposure Risk

**Issue**: If `.env` accidentally committed to GitHub.

**Current Protection**: `.gitignore` includes `.env`

**Additional Safeguards**:
```bash
# Use .env.example instead
cp .env .env.example
# Remove actual values from .env.example
echo "GEMINI_API_KEY=your_key_here" > .env.example
```

**Recommended**: Use secrets manager (GitHub Secrets, Vercel Env Vars)

---

### 5.3 OR-003: AI Hallucination

**Issue**: Gemini may generate plausible but incorrect information.

**Current Mitigations**:
- Strict JSON schema
- Rubric-based scoring
- Prompt instructing "only answer from provided data"

**Additional Safeguards**:
```javascript
// Add confidence threshold
const CONFIDENCE_THRESHOLD = 0.7;
if (result.confidence < CONFIDENCE_THRESHOLD) {
  return { 
    ...result, 
    warning: "AI confidence low, manual review recommended" 
  };
}

// Include factuality prompts
const hallucinationPreventionPrompt = `
IMPORTANT: Only extract information explicitly stated in the CV.
Do not infer or assume skills, experience, or education not mentioned.
If information is not found, explicitly state "Không tìm thấy thông tin."
`;
```

---

### 5.4 OR-004: Data Loss

**Issue**: No automated backups of Supabase database.

**Mitigation**:
```javascript
// Supabase provides daily backups on free tier
// For critical data, implement:

// 1. Export to JSON weekly
const backupDatabase = async () => {
  const candidates = await pool.query('SELECT * FROM candidates');
  const jobs = await pool.query('SELECT * FROM job_positions');
  
  const backup = {
    timestamp: new Date().toISOString(),
    candidates: candidates.rows,
    jobs: jobs.rows
  };
  
  fs.writeFileSync(
    `./backups/backup-${Date.now()}.json`,
    JSON.stringify(backup, null, 2)
  );
};

// 2. Schedule via cron (weekly)
```

---

## 6. Compliance Considerations

### 6.1 Data Protection (Vietnam PDPL 2023)

As of July 2025, Vietnam's Personal Data Protection Decree applies:

| Requirement | Current State | Action |
|-------------|---------------|--------|
| Consent for data collection | Implicit via signup | Add explicit consent checkbox |
| Purpose limitation | CVs used for recruitment only | Add data usage policy |
| Data minimization | All CV data stored | Consider redacting unnecessary fields |
| Retention policy | Indefinite | Implement auto-delete after 1 year |
| Right to erasure | Not implemented | Add delete endpoint |

**Effort**: 4-6 hours

---

### 6.2 GDPR (if EU users)

| Requirement | Current State | Action |
|-------------|---------------|--------|
| Cookie consent | Not implemented | Add cookie banner |
| Data portability | Not implemented | Add export endpoint |
| Right to be forgotten | Not implemented | Add delete endpoint |

---

## 7. Risk Remediation Roadmap

### Phase 1: Critical (Week 1)
- [x] SEC-001: Implement bcrypt password hashing
- [x] SEC-002: Upgrade to JWT authentication
- [ ] SEC-003: Remove hardcoded values

### Phase 2: High Priority (Week 2-3)
- [x] SEC-004: Add rate limiting
- [x] SEC-005: Enhance file upload validation
- [ ] SEC-006: Add input sanitization

### Phase 3: Medium Priority (Week 4-6)
- [ ] SEC-007: Implement privacy mode for sensitive CVs
- [ ] OR-001: Fix cold start issues
- [ ] Add automated backups

### Phase 4: Future (Post-Launch)
- [ ] CSP headers implementation
- [ ] Vietnam PDPL compliance
- [ ] SOC 2 readiness (if enterprise customers)

---

## 8. Security Checklist

### Pre-Production
- [ ] Password hashing with bcrypt (SEC-001)
- [ ] JWT authentication (SEC-002)
- [ ] Remove all hardcoded secrets (SEC-003)
- [ ] Rate limiting configured (SEC-004)
- [ ] File upload limits enforced (SEC-005)
- [ ] Input sanitization added (SEC-006)
- [ ] .env not in git history
- [ ] Supabase RLS policies enabled
- [ ] HTTPS enforced on all endpoints

### Post-Launch Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
- [ ] Define incident response plan

---

*Document for internal security review only*
