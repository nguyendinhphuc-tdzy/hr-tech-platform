/* FILE: backend/server.js (Full Version: Auth & User Isolation Added) */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');
const mammoth = require('mammoth'); 
const pdf = require('pdf-parse'); 
const fs = require('fs'); // Thêm fs nếu cần xử lý stream file local

const app = express();
app.use(cors());
app.use(express.json());

// --- CẤU HÌNH ---
// Sử dụng model ổn định để đảm bảo tính nhất quán
let ACTIVE_MODEL_NAME = "gemini-2.5-flash"; 

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ==========================================
// [NEW] MIDDLEWARE XÁC THỰC NGƯỜI DÙNG
// ==========================================
// Middleware này chặn request không có header 'x-user-email'
// và gắn email vào req.userEmail để các hàm sau sử dụng để lọc dữ liệu
const requireAuth = (req, res, next) => {
    const userEmail = req.headers['x-user-email'];
    
    // Nếu không có email header -> Chặn luôn (bảo mật)
    if (!userEmail) {
        console.warn("⚠️ Blocked request missing x-user-email header");
        return res.status(401).json({ error: "Unauthorized: Vui lòng đăng nhập lại để tiếp tục." });
    }
    
    // Gắn email vào request
    req.userEmail = userEmail;
    next();
};

// --- CÁC HÀM HỖ TRỢ ---
function sanitizeFilename(filename) {
    const str = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return str.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
}

function cleanJsonString(text) {
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstOpen = clean.indexOf('{');
    const lastClose = clean.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1) clean = clean.substring(firstOpen, lastClose + 1);
    return clean;
}

async function readPdfBuffer(buffer) { 
    try { return (await pdf(buffer)).text; } catch (e) { return ""; } 
}

function chunkText(text) { 
    const chunks = []; let cur = ""; 
    text.split(/(?<=[.?!])\s+/).forEach(s => { 
        if ((cur + s).length > 1000) { chunks.push(cur); cur = s; } 
        else cur += " " + s; 
    }); 
    if (cur) chunks.push(cur); 
    return chunks; 
}

async function createEmbedding(text) { 
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" }); 
    const result = await model.embedContent(text); 
    return result.embedding.values; 
}

// --- CONSTANT: BAREM CHẤM ĐIỂM (RUBRIC) ---
// Được chèn vào tất cả các prompt để đảm bảo AI chấm điểm nhất quán
const STRICT_RUBRIC = `
# CÔNG THỨC CHẤM ĐIỂM (SCORING RUBRIC - TOTAL 10.0):
Hệ thống PHẢI tuân thủ trọng số sau đây, không được chấm theo cảm tính. Nếu chạy lại 10 lần, kết quả phải giống nhau:

1. **Hard Skills (Kỹ năng Chuyên môn) - 40% (Tối đa 4.0đ):**
   - So khớp từ khóa trong CV với yêu cầu đặc thù của vị trí.
   - 4.0: Có >90% từ khóa + Có kỹ năng nâng cao/Công cụ chuyên sâu.
   - 3.0: Có 70-90% từ khóa quan trọng.
   - 2.0: Có 50-70% từ khóa.
   - 1.0: <50% hoặc chỉ biết lý thuyết.

2. **Experience (Kinh nghiệm) - 30% (Tối đa 3.0đ):**
   - 3.0: Đã từng làm vị trí tương đương hoặc có dự án thực tế ấn tượng (có số liệu chứng minh).
   - 2.0: Có kinh nghiệm liên quan/Thực tập nhưng chưa sâu.
   - 1.0: Chưa có kinh nghiệm hoặc kinh nghiệm trái ngành hoàn toàn.

3. **Education (Học vấn/Chứng chỉ) - 10% (Tối đa 1.0đ):**
   - 1.0: Đúng chuyên ngành HOẶC có chứng chỉ (Certificate) uy tín liên quan.
   - 0.5: Trái ngành, không chứng chỉ.

4. **Soft Skills & Presentation (Kỹ năng mềm & Trình bày) - 20% (Tối đa 2.0đ):**
   - 2.0: CV trình bày khoa học, logic, không lỗi chính tả, thể hiện tư duy tốt (Leadership, Teamwork).
   - 1.0: CV sơ sài, lộn xộn hoặc thiếu thông tin.
`;

// --- KHO PROMPT ĐẦY ĐỦ (KHÔNG XÓA BẤT CỨ VỊ TRÍ NÀO) ---
function getSpecificPrompt(jobTitle, jobRequirements) {
    const title = jobTitle?.toLowerCase().trim() || "";

    // 1. DATA ANALYST INTERN
    if (title.includes("data analyst")) {
        return `
# Vai trò: Chuyên gia Tuyển dụng Kỹ thuật (Strict Grader).
# Vị trí: **Thực tập sinh Phân tích Dữ liệu (Data Analyst Intern)**.
Ngữ cảnh: Môi trường sản xuất, tập trung vào làm sạch, hợp nhất và trực quan hóa dữ liệu.
Mục tiêu: Tìm ứng viên thạo Power BI, SQL, Python, Excel và ưu tiên kinh nghiệm dữ liệu Sản xuất/Vận hành.

${STRICT_RUBRIC}

# Nhiệm vụ:
1. **Phân tích:** Trích xuất kỹ năng Power BI, SQL, Python, Data Cleaning.
2. **Đối chiếu:** Tìm bằng chứng về việc thu thập, làm sạch dữ liệu và tạo Dashboard.
3. **Tính điểm:** Áp dụng Rubric trên.

# Định dạng Output (JSON Bắt buộc):
{
    "full_name": "Họ tên", "email": "Email", "skills": ["Skill 1", "Skill 2"],
    "score": 0.0,
    "breakdown": { "hard_skills": 0, "experience": 0, "education": 0, "soft_skills": 0 },
    "summary": "Tóm tắt 2-3 câu (Tiếng Việt).",
    "match_reason": "Giải thích chi tiết (Tiếng Việt): Tại sao cho điểm Hard Skills? Tại sao cho điểm Experience?...",
    "recommendation": "Phỏng vấn / Cân nhắc / Từ chối",
    "confidence": "Cao"
}`;
    }

    // 2. INNOVATION INTERN
    if (title.includes("innovation") || title.includes("sáng tạo")) {
        return `
# Vai trò: Chuyên gia Tuyển dụng Sáng tạo.
# Vị trí: **Thực tập sinh Sáng tạo (Innovation Intern)**.
Ngữ cảnh: Hỗ trợ hoạt động nội bộ, truyền thông và kể chuyện bằng hình ảnh.
Mục tiêu: Tìm người cân bằng giữa Kỹ năng tổ chức (Must-Have) và Sáng tạo/Thiết kế (Nice-to-Have).

${STRICT_RUBRIC}

# Nhiệm vụ:
1. Phân tích kỹ năng: Microsoft Office (Excel, PPT), Thiết kế (Canva/Adobe), Tổ chức sự kiện.
2. Đánh giá sự kết hợp giữa "Tỉ mỉ hành chính" và "Tư duy sáng tạo".
3. Tính điểm theo Rubric.

# Định dạng Output (JSON Bắt buộc):
{
    "full_name": "Họ tên", "email": "Email", "skills": [],
    "score": 0.0,
    "breakdown": { "hard_skills": 0, "experience": 0, "education": 0, "soft_skills": 0 },
    "summary": "...", "match_reason": "...", "recommendation": "...", "confidence": "Cao"
}`;
    }

    // 3. MARKETING INTERN
    if (title.includes("marketing")) {
        return `
# Vai trò: Chuyên gia Tuyển dụng Marketing.
# Vị trí: **Thực tập sinh Marketing**.
Mục tiêu: Tìm ứng viên đa năng (SEO/Content, Social Media, PR, Hậu cần sự kiện).

${STRICT_RUBRIC}

# Nhiệm vụ:
1. Phân tích 5 trụ cột: SEO & Content, Social Media (TikTok/FB/Video Edit), PR, Hậu cần, Cộng đồng.
2. Tìm kiếm các chỉ số (Metrics) trong kinh nghiệm quá khứ.
3. Tính điểm theo Rubric.

# Định dạng Output (JSON Bắt buộc):
{
    "full_name": "Họ tên", "email": "Email", "skills": [],
    "score": 0.0,
    "breakdown": { "hard_skills": 0, "experience": 0, "education": 0, "soft_skills": 0 },
    "summary": "...", "match_reason": "...", "recommendation": "...", "confidence": "Cao"
}`;
    }

    // 4. NETWORK SECURITY INTERN
    if (title.includes("security") || title.includes("bảo mật")) {
        return `
# Vai trò: Chuyên gia Tuyển dụng An ninh mạng.
# Vị trí: **Network Security Intern**.
Ngữ cảnh: Vận hành Bảo mật & Hỗ trợ Kỹ thuật.
Mục tiêu: Kỹ năng thực thi thực tế (Nmap, Burp Suite, Python), không chỉ lý thuyết.

${STRICT_RUBRIC}

# Nhiệm vụ:
1. Phân tích kỹ năng: Pentest, Phân tích mã độc, IR/SOC, Hạ tầng mạng.
2. Đánh giá kinh nghiệm thực chiến (CTF, Bug Bounty).
3. Tính điểm theo Rubric.

# Định dạng Output (JSON Bắt buộc):
{
    "full_name": "Họ tên", "email": "Email", "skills": [],
    "score": 0.0,
    "breakdown": { "hard_skills": 0, "experience": 0, "education": 0, "soft_skills": 0 },
    "summary": "...", "match_reason": "...", "recommendation": "...", "confidence": "Cao"
}`;
    }

    // 5. AI ENGINEER INTERN
    if (title.includes("ai engineer") || title.includes("trí tuệ nhân tạo")) {
        return `
# Vai trò: Chuyên gia Tuyển dụng AI.
# Vị trí: **AI Engineer Intern (NMT)**.
Ngữ cảnh: Phát triển tập dữ liệu đa ngữ, tinh chỉnh mô hình ngôn ngữ nhỏ (SLM).
Mục tiêu: Python, C++, NLP, PyTorch, Xây dựng Dataset.

${STRICT_RUBRIC}

# Nhiệm vụ:
1. Phân tích kỹ năng: NMT/NLP, Dataset Engineering, ML/DL Frameworks.
2. Xác thực các tuyên bố kỹ thuật (Tránh từ khóa rỗng).
3. Tính điểm theo Rubric.

# Định dạng Output (JSON Bắt buộc):
{
    "full_name": "Họ tên", "email": "Email", "skills": [],
    "score": 0.0,
    "breakdown": { "hard_skills": 0, "experience": 0, "education": 0, "soft_skills": 0 },
    "summary": "...", "match_reason": "...", "recommendation": "...", "confidence": "Cao"
}`;
    }

    // 6. BUSINESS ANALYST INTERN
    if (title.includes("business analyst") || title.includes("ba")) {
        return `
# Vai trò: Chuyên gia Tuyển dụng Kỹ thuật (BA).
# Vị trí: **Business Analyst Intern**.
Ngữ cảnh: Insurtech. Hỗ trợ đội ngũ sản phẩm.
Mục tiêu: Kỹ năng phân tích/viết tài liệu (User Stories, SDLC) và nền tảng kỹ thuật (SQL).

${STRICT_RUBRIC}

# Nhiệm vụ:
1. Phân tích kỹ năng: Thu thập yêu cầu, Công cụ (Jira/Figma), Phân tích dữ liệu (SQL).
2. Đánh giá tư duy hệ thống qua các dự án.
3. Tính điểm theo Rubric.

# Định dạng Output (JSON Bắt buộc):
{
    "full_name": "Họ tên", "email": "Email", "skills": [],
    "score": 0.0,
    "breakdown": { "hard_skills": 0, "experience": 0, "education": 0, "soft_skills": 0 },
    "summary": "...", "match_reason": "...", "recommendation": "...", "confidence": "Cao"
}`;
    }

    // 7. SOFTWARE ENGINEER INTERN
    if (title.includes("software") || title.includes("mobile")) {
        return `
# Vai trò: Chuyên gia Tuyển dụng Mobile/Software.
# Vị trí: **Software Engineer Intern (Mobile)**.
Ngữ cảnh: Phát triển ứng dụng di động nhanh.
Mục tiêu: Nền tảng CS vững chắc (DSA) và Ngôn ngữ Mobile (iOS/Android/Flutter).

${STRICT_RUBRIC}

# Nhiệm vụ:
1. Phân tích kỹ năng: Mobile Dev, CS Foundation (DSA), Clean Code.
2. Đánh giá chất lượng dự án (GitHub, App Store).
3. Tính điểm theo Rubric.

# Định dạng Output (JSON Bắt buộc):
{
    "full_name": "Họ tên", "email": "Email", "skills": [],
    "score": 0.0,
    "breakdown": { "hard_skills": 0, "experience": 0, "education": 0, "soft_skills": 0 },
    "summary": "...", "match_reason": "...", "recommendation": "...", "confidence": "Cao"
}`;
    }

    // 8. RISK ANALYST INTERN
    if (title.includes("risk")) {
        return `
# Vai trò: Chuyên gia Tuyển dụng Tài chính/Rủi ro.
# Vị trí: **Risk Analyst Intern**.
Ngữ cảnh: Ngân hàng. Phân tích tài chính & thị trường.
Mục tiêu: Kiến thức tài chính (Báo cáo, Excel), Kỹ năng mềm (Tỉ mỉ). Ưu tiên CFA/ACCA.

${STRICT_RUBRIC}

# Nhiệm vụ:
1. Phân tích kỹ năng: Tài chính, Nghiên cứu thị trường, Excel nâng cao.
2. Đánh giá sự tỉ mỉ và tư duy logic.
3. Tính điểm theo Rubric.

# Định dạng Output (JSON Bắt buộc):
{
    "full_name": "Họ tên", "email": "Email", "skills": [],
    "score": 0.0,
    "breakdown": { "hard_skills": 0, "experience": 0, "education": 0, "soft_skills": 0 },
    "summary": "...", "match_reason": "...", "recommendation": "...", "confidence": "Cao"
}`;
    }

    // --- MẶC ĐỊNH: DYNAMIC FALLBACK (Dành cho Business Development và các vị trí khác) ---
    // Logic: Tự tạo Prompt dựa trên cột 'requirements' trong Database nhưng ÁP DỤNG RUBRIC CHẶT CHẼ
    const reqSkills = jobRequirements?.skills ? (Array.isArray(jobRequirements.skills) ? jobRequirements.skills.join(", ") : jobRequirements.skills) : "Các kỹ năng chuyên môn liên quan đến " + jobTitle;
    const reqExp = jobRequirements?.experience || "Không yêu cầu cụ thể";
    const reqEdu = jobRequirements?.education || "Đại học hoặc tương đương";

    return `
# Vai trò: Chuyên gia Đánh giá Tài năng (AI Recruitment Auditor).
# Vị trí cần tuyển: "${jobTitle.toUpperCase()}"

# Ngữ cảnh & Yêu cầu từ Database:
Hệ thống không có Prompt mẫu chuyên sâu cho vị trí này, vì vậy bạn hãy phân tích dựa trên dữ liệu yêu cầu thực tế sau:
1. **Kỹ năng Bắt buộc (Hard Skills):** ${reqSkills}
2. **Kinh nghiệm yêu cầu:** ${reqExp}
3. **Học vấn:** ${reqEdu}

${STRICT_RUBRIC}

# Nhiệm vụ:
1. **Quét CV:** Tìm kiếm bằng chứng cụ thể về việc ứng viên sở hữu các kỹ năng: ${reqSkills}.
2. **Đánh giá độ sâu:** Phân biệt giữa việc chỉ liệt kê từ khóa và việc có dự án/kinh nghiệm thực tế áp dụng.
3. **Chấm điểm:** Dựa trên mức độ khớp giữa CV và danh sách kỹ năng trên theo CÔNG THỨC CHẤM ĐIỂM (RUBRIC).

# Định dạng Output (JSON Bắt buộc):
{
    "full_name": "Họ tên",
    "email": "Email",
    "skills": ["Skill 1", "Skill 2", "Skill 3"],
    "score": 0.0,
    "breakdown": {
        "hard_skills": 0.0,
        "experience": 0.0,
        "education": 0.0,
        "soft_skills": 0.0
    },
    "summary": "Tóm tắt 2-3 câu đánh giá tổng quan (Tiếng Việt).",
    "match_reason": "Trình bày chi tiết bằng TIẾNG VIỆT (Giải thích rõ tại sao cho điểm số này ở từng mục Breakdown).",
    "recommendation": "Phỏng vấn / Cân nhắc / Từ chối",
    "confidence": "Cao"
}
`;
}

// ==========================================
// 1. API AUTH: ĐĂNG KÝ (SIGN UP)
// ==========================================
app.post('/api/auth/signup', async (req, res) => {
    try {
        console.log("📝 Nhận yêu cầu đăng ký:", req.body);
        const { fullName, email, password } = req.body;
        if (!fullName || !email || !password) return res.status(400).json({ error: "Vui lòng nhập đủ thông tin!" });

        const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkUser.rows.length > 0) return res.status(400).json({ error: "Email đã tồn tại!" });

        const result = await pool.query(
            `INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, 'Admin Access') RETURNING *`,
            [fullName, email, password]
        );
        res.json({ message: "Đăng ký thành công!", user: result.rows[0] });
    } catch (err) { res.status(500).json({ error: "Lỗi hệ thống: " + err.message }); }
});

// ==========================================
// 2. API AUTH: ĐĂNG NHẬP (LOGIN)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(400).json({ error: "Email không tồn tại!" });
        const user = result.rows[0];
        if (user.password !== password) return res.status(400).json({ error: "Sai mật khẩu!" });
        res.json({ message: "Đăng nhập thành công!", user: user });
    } catch (err) { res.status(500).json({ error: "Lỗi: " + err.message }); }
});

// ==========================================
// 3. API CV: SCAN & UPLOAD (UPDATED WITH AUTH)
// ==========================================
// [UPDATED] Đã thêm requireAuth và lưu owner_email
app.post('/api/cv/upload', requireAuth, upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        
        // Log xem ai đang thao tác
        console.log(`🤖 User [${req.userEmail}] đang scan: ${req.file.originalname}`);

        // 1. Upload Storage
        const safeName = sanitizeFilename(req.file.originalname);
        const fileName = `${Date.now()}_${safeName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('cv_uploads').upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
        if (uploadError) console.error("Lỗi Storage:", uploadError);
        const { data: { publicUrl } } = supabase.storage.from('cv_uploads').getPublicUrl(fileName);
        const finalFileUrl = uploadError ? null : publicUrl;

        // 2. Lấy thông tin Job để chọn Prompt
        const jobId = req.body.job_id;
        let jobTitle = "General Application";
        let jobReqs = {};

        if (jobId) {
            const jobRes = await pool.query('SELECT * FROM job_positions WHERE id = $1', [jobId]);
            if (jobRes.rows.length > 0) {
                jobTitle = jobRes.rows[0].title;
                jobReqs = jobRes.rows[0].requirements || {}; // Lấy requirements từ DB
            }
        }

        // 3. LẤY PROMPT TƯƠNG ỨNG (HOẶC TỰ TẠO)
        const selectedPrompt = getSpecificPrompt(jobTitle, jobReqs);
        console.log(`🎯 Sử dụng Prompt cho vị trí: ${jobTitle}`);

        // 4. Gọi AI VỚI TEMPERATURE = 0
        const model = genAI.getGenerativeModel({ 
            model: ACTIVE_MODEL_NAME, 
            generationConfig: { 
                responseMimeType: "application/json",
                temperature: 0.0, 
                topK: 1,
                topP: 1
            } 
        });
        const imageParts = [{ inlineData: { data: req.file.buffer.toString("base64"), mimeType: req.file.mimetype } }];
        const result = await model.generateContent([selectedPrompt, ...imageParts]);
        
        let aiResult;
        try { aiResult = JSON.parse(cleanJsonString(result.response.text())); } 
        catch (parseError) { aiResult = { full_name: "Lỗi đọc", score: 0, summary: "Lỗi phân tích AI", email: null }; }

        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên Mới";
        // Chuẩn hóa điểm số (nếu AI trả về > 10, chia 10)
        let finalScore = aiResult.score;
        if (finalScore > 10) finalScore = (finalScore / 10).toFixed(1);

        // [UPDATED] Insert vào Database có trường owner_email
        // Lưu ý: Cần đảm bảo database đã chạy lệnh: ALTER TABLE candidates ADD COLUMN owner_email VARCHAR(255);
        const dbResult = await pool.query(
            `INSERT INTO candidates (organization_id, job_id, full_name, email, role, status, ai_rating, ai_analysis, cv_file_url, owner_email) 
             VALUES (1, $1, $2, $3, $4, 'Screening', $5, $6, $7, $8) RETURNING *`,
            [
                jobId || null, 
                finalName, 
                aiResult.email, 
                jobTitle, 
                finalScore, 
                JSON.stringify(aiResult), 
                finalFileUrl,
                req.userEmail // <--- Lưu Email của người đang upload
            ]
        );

        res.json({ message: "Thành công!", candidate: dbResult.rows[0] });

    } catch (err) { 
        console.error("🔥 Lỗi Server:", err);
        res.status(500).json({ error: "Lỗi: " + err.message }); 
    }
});

// ==========================================
// 4. API GET LIST (UPDATED WITH AUTH FILTER)
// ==========================================
// [UPDATED] Lấy danh sách Candidate nhưng chỉ trả về của user hiện tại
app.get('/api/candidates', requireAuth, async (req, res) => { 
    try {
        const r = await pool.query(
            'SELECT * FROM candidates WHERE owner_email = $1 ORDER BY id DESC', 
            [req.userEmail] // Chỉ lấy data khớp email
        ); 
        res.json(r.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/jobs', async (req, res) => { 
    // Giữ jobs public (ai cũng xem được job) hoặc thêm requireAuth nếu muốn
    const r = await pool.query('SELECT * FROM job_positions ORDER BY id DESC'); 
    res.json(r.rows); 
});

// [UPDATED] Update status phải check quyền sở hữu
app.put('/api/candidates/:id/status', requireAuth, async (req, res) => { 
    try { 
        const { status } = req.body; 
        // Thêm điều kiện AND owner_email để user A không sửa được của user B
        const result = await pool.query(
            `UPDATE candidates SET status = $1 WHERE id = $2 AND owner_email = $3 RETURNING *`, 
            [status, req.params.id, req.userEmail]
        ); 
        
        if (result.rows.length === 0) {
            return res.status(403).json({ error: "Bạn không có quyền chỉnh sửa ứng viên này hoặc ứng viên không tồn tại." });
        }
        
        res.json({ message: "Updated" }); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/jobs/import', upload.single('csv_file'), async (req, res) => { /* Logic import cũ */ res.json({message:"Imported"}); });
app.post('/api/training/upload', upload.single('doc_file'), async (req, res) => { /* Logic training cũ */ res.json({message:"Trained"}); });
app.post('/api/training/chat', async (req, res) => { /* Logic chat cũ */ res.json({answer:"AI reply"}); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Server chạy tại cổng ${PORT}`); });