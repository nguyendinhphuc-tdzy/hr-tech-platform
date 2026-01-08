/* FILE: backend/server.js (Full: Specific Prompts + Strict Rubric + Vietnamese Output) */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');
const mammoth = require('mammoth'); 
// const pdfParse = require('pdf-parse'); // Đã xóa để dùng Gemini Native PDF
const fs = require('fs');
const nodemailer = require('nodemailer'); 
const { Readable } = require('stream'); 

const app = express();
app.use(cors());
app.use(express.json());

// --- CẤU HÌNH ---
let ACTIVE_MODEL_NAME = "gemini-2.5-flash"; 

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- CẤU HÌNH GỬI MAIL ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER || 'hrtech.system.noreply@gmail.com',
        pass: process.env.MAIL_PASS || 'your-app-password' 
    }
});

// ==========================================
// [MIDDLEWARE] XÁC THỰC NGƯỜI DÙNG
// ==========================================
const requireAuth = (req, res, next) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
        console.warn("⚠️ Blocked request missing x-user-email header");
        return res.status(401).json({ error: "Unauthorized: Vui lòng đăng nhập lại để tiếp tục." });
    }
    req.userEmail = userEmail; 
    next();
};

// --- CÁC HÀM HỖ TRỢ (UTILITIES) ---
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

// --- CONSTANT: BAREM CHẤM ĐIỂM (RUBRIC) ---
const STRICT_RUBRIC = `
# CÔNG THỨC CHẤM ĐIỂM (SCORING RUBRIC - TOTAL 10.0):
Hệ thống PHẢI tuân thủ trọng số sau đây, không được chấm theo cảm tính. Output ngôn ngữ phải là TIẾNG VIỆT.

1. **Hard Skills (40% - Max 4.0):** So khớp từ khóa kỹ năng chuyên sâu.
2. **Experience (30% - Max 3.0):** Dự án thực tế, số liệu chứng minh.
3. **Education (10% - Max 1.0):** Đúng chuyên ngành hoặc chứng chỉ liên quan.
4. **Soft Skills & Presentation (20% - Max 2.0):** Cách trình bày, tư duy logic, thái độ.
`;

// --- KHO PROMPT ĐẦY ĐỦ CÁC VỊ TRÍ ---
function getSpecificPrompt(jobTitle, jobRequirements) {
    const title = jobTitle?.toLowerCase().trim() || "";
    
    // 1. DATA ANALYST INTERN
    if (title.includes("data analyst")) {
        return `
# Vai trò: Chuyên gia Tuyển dụng Kỹ thuật.
# Vị trí: Data Analyst Intern
# Ngữ cảnh: Môi trường sản xuất, làm sạch và trực quan hóa dữ liệu.
${STRICT_RUBRIC}
# Nhiệm vụ:
1. Tìm kỹ năng: Power BI, SQL, Python, Excel, Data Cleaning.
2. Tìm kinh nghiệm: Xử lý dữ liệu sản xuất/vận hành, tạo Dashboard.
# Output JSON (Tiếng Việt): 
{ 
    "full_name": "...", "email": "...", "skills": ["Skill1", "Skill2"], 
    "score": 0.0, 
    "breakdown": { "hard_skills": 0, "experience": 0, "education": 0, "soft_skills": 0 }, 
    "summary": "Tóm tắt 2-3 câu về mức độ phù hợp (Tiếng Việt).", 
    "match_reason": "Giải thích chi tiết (Tiếng Việt): Tại sao cho điểm Hard Skills? Tại sao cho điểm Experience?...", 
    "recommendation": "Phỏng vấn/Cân nhắc/Loại",
    "confidence": "Cao" 
}
`;
    }

    // 2. INNOVATION INTERN
    if (title.includes("innovation") || title.includes("sáng tạo")) {
        return `
# Vai trò & Ngữ cảnh
Bạn là một **Chuyên gia Tuyển dụng**. Vị trí: **Thực tập sinh Sáng tạo (Innovation Intern)**.
Ngữ cảnh: Hỗ trợ truyền thông nội bộ, thiết kế và tổ chức sự kiện.
Mục tiêu: Tìm người có kỹ năng tổ chức "Bắt buộc" và sáng tạo "Ưu tiên".
**Kỹ năng:** Microsoft Office | Thiết kế (Canva/Adobe) | Tổ chức sự kiện | Truyền thông nội bộ.

${STRICT_RUBRIC}

# Nhiệm vụ:
1. **Phân tích:** Tìm kỹ năng Office, Thiết kế, Tổ chức sự kiện.
2. **Đối chiếu:** Tìm kinh nghiệm tổ chức sự kiện nội bộ, viết content.
3. **Tính điểm:** Theo Rubric.

# Output JSON (Tiếng Việt): (Cấu trúc như trên)
`;
    }

    // 3. MARKETING INTERN
    if (title.includes("marketing")) {
        return `
# Vai trò & Ngữ cảnh
Bạn là một **Chuyên gia Tuyển dụng Marketing**. Vị trí: **Thực tập sinh Marketing**.
Bối cảnh: Digital Native, đa năng (SEO/Content, Social, PR, Event).
**Kỹ năng:** SEO | Content | Social Media (TikTok/Zalo/FB) | Edit Video | Hậu cần sự kiện.

${STRICT_RUBRIC}

# Nhiệm vụ:
1. Phân tích 5 trụ cột: SEO/Content, Social Media, PR, Hậu cần, Cộng đồng.
2. Xác thực bằng chứng thực thi (KPIs, Link bài viết).
3. Tính điểm theo Rubric.

# Output JSON (Tiếng Việt): (Cấu trúc như trên)
`;
    }

    // 4. NETWORK SECURITY INTERN
    if (title.includes("security") || title.includes("bảo mật")) {
        return `
# Vai trò & Ngữ cảnh
Bạn là một **Chuyên gia Tuyển dụng An ninh mạng**. Vị trí: **Network Security Intern**.
Ngữ cảnh: Vận hành Bảo mật (Security Ops) & Hỗ trợ Kỹ thuật (Sales Eng).
**Kỹ năng:** Pentest (Nmap/Burp Suite) | Malware Analysis | Scripting | Incident Response.

${STRICT_RUBRIC}

# Nhiệm vụ:
1. Phân tích 5 trụ cột: Bảo mật mạng, Pentest, Mã độc, IR/SOC, Hỗ trợ kỹ thuật.
2. Tìm kiếm kinh nghiệm thực hành (Labs, CTF, GitHub).
3. Tính điểm theo Rubric.

# Output JSON (Tiếng Việt): (Cấu trúc như trên)
`;
    }

    // 5. AI ENGINEER INTERN
    if (title.includes("ai engineer") || title.includes("trí tuệ nhân tạo")) {
        return `
# Vai trò & Ngữ cảnh
Bạn là **Hệ thống Sàng lọc Tài năng AI**. Vị trí: **AI Engineer Intern (NMT)**.
Ngữ cảnh: Phát triển mô hình Dịch máy thần kinh (NMT), dataset đa ngữ.
**Kỹ năng:** Python | C++ | NLP | TensorFlow/PyTorch | Dataset Building.

${STRICT_RUBRIC}

# Nhiệm vụ:
1. Trích xuất kỹ năng: NMT, NLP, Dataset Engineering, ML/DL.
2. Xác thực kinh nghiệm: Huấn luyện model, tạo dataset.
3. Tính điểm theo Rubric.

# Output JSON (Tiếng Việt): (Cấu trúc như trên)
`;
    }

    // 6. BUSINESS ANALYST INTERN
    if (title.includes("business analyst") || title.includes("ba")) {
        return `
# Vai trò & Ngữ cảnh
Bạn là **Chuyên gia Tuyển dụng Kỹ thuật**. Vị trí: **Business Analyst Intern**.
Ngữ cảnh: Insurtech.
**Kỹ năng:** SDLC | User Stories | SQL | Jira/Figma | Viết tài liệu.

${STRICT_RUBRIC}

# Nhiệm vụ:
1. Trích xuất kỹ năng: Thu thập yêu cầu, Viết User Stories, SQL.
2. Đối chiếu kinh nghiệm dự án học thuật/thực tế.
3. Tính điểm theo Rubric.

# Output JSON (Tiếng Việt): (Cấu trúc như trên)
`;
    }

    // 7. SOFTWARE ENGINEER INTERN
    if (title.includes("software") || title.includes("mobile")) {
        return `
# Vai trò & Ngữ cảnh
Bạn là **Chuyên gia Tuyển dụng Kỹ thuật**. Vị trí: **Software Engineer Intern (Mobile)**.
Ngữ cảnh: Phát triển App Mobile nhanh.
**Kỹ năng:** iOS/Android/Flutter | DSA | Clean Code.

${STRICT_RUBRIC}

# Nhiệm vụ:
1. Trích xuất kỹ năng Mobile Dev, DSA.
2. Đánh giá chất lượng mã nguồn/dự án (thông qua mô tả).
3. Tính điểm theo Rubric.

# Output JSON (Tiếng Việt): (Cấu trúc như trên)
`;
    }

    // 8. RISK ANALYST INTERN
    if (title.includes("risk")) {
        return `
# Vai trò & Ngữ cảnh
Bạn là **Chuyên gia Tuyển dụng Tài chính**. Vị trí: **Risk Analyst Intern**.
Ngữ cảnh: Ngân hàng.
**Kỹ năng:** Phân tích tài chính | Excel | Nghiên cứu thị trường | CFA/ACCA.

${STRICT_RUBRIC}

# Nhiệm vụ:
1. Trích xuất kỹ năng: Phân tích báo cáo, Excel, Thị trường.
2. Đánh giá sự tỉ mỉ và tư duy logic.
3. Tính điểm theo Rubric.

# Output JSON (Tiếng Việt): (Cấu trúc như trên)
`;
    }

    // --- FALLBACK (DYNAMIC) ---
    const reqSkills = jobRequirements?.skills ? (Array.isArray(jobRequirements.skills) ? jobRequirements.skills.join(", ") : jobRequirements.skills) : "Kỹ năng chuyên môn liên quan";
    return `
# Vai trò: Chuyên gia Đánh giá Tài năng.
# Vị trí: "${jobTitle}"
${STRICT_RUBRIC}
# Yêu cầu bổ sung: ${reqSkills}
# Nhiệm vụ: Phân tích CV và chấm điểm dựa trên mức độ phù hợp với yêu cầu trên.
# Output JSON (Tiếng Việt): 
{ 
    "full_name": "...", "email": "...", "skills": [], 
    "score": 0.0, 
    "breakdown": { "hard_skills": 0, "experience": 0, "education": 0, "soft_skills": 0 }, 
    "summary": "...", "match_reason": "...", "recommendation": "...", "confidence": "Cao" 
}
`;
}

// ==========================================
// API AUTH: LOGIN HOẶC REGISTER
// ==========================================
app.post('/api/auth/phone-login', async (req, res) => {
    try {
        const { phone, full_name, password, is_register } = req.body; 
        
        if (!phone || phone.length < 9) return res.status(400).json({ error: "Số điện thoại không hợp lệ" });
        if (!password || password.length < 6) return res.status(400).json({ error: "Mật khẩu phải từ 6 ký tự" });

        const userResult = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone]);
        let user = userResult.rows[0];

        if (is_register) {
            if (user) return res.status(400).json({ error: "Số điện thoại đã tồn tại." });
            if (!full_name) return res.status(400).json({ error: "Thiếu họ tên." });

            const newUser = await pool.query(
                `INSERT INTO users (full_name, phone_number, email, password, role) 
                 VALUES ($1, $2, NULL, $3, 'User') RETURNING *`,
                [full_name, phone, password]
            );
            return res.json({ message: "Đăng ký thành công!", user: newUser.rows[0] });
        } else {
            if (!user) return res.status(404).json({ error: "Tài khoản không tồn tại." });
            if (user.password !== password) return res.status(401).json({ error: "Sai mật khẩu!" });
            return res.json({ message: "Đăng nhập thành công!", user: user });
        }
    } catch (err) {
        res.status(500).json({ error: "Lỗi Server: " + err.message });
    }
});

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

app.put('/api/account/profile', requireAuth, async (req, res) => {
    try {
        const { full_name } = req.body;
        const isPhone = /^\d+$/.test(req.userEmail); 
        const query = isPhone ? 'UPDATE users SET full_name = $1 WHERE phone_number = $2 RETURNING *' : 'UPDATE users SET full_name = $1 WHERE email = $2 RETURNING *';
        const result = await pool.query(query, [full_name, req.userEmail]);
        if (result.rowCount === 0) return res.status(404).json({ error: "User not found" });
        res.json({ message: "Cập nhật thành công!", user: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// API JOB IMPORT (NEW LOGIC: GEMINI NATIVE PDF READ)
// ==========================================
app.post('/api/jobs/import', upload.single('jd_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Thiếu file JD" });
        console.log(`📂 Đang xử lý JD: ${req.file.originalname} (${req.file.mimetype})`);

        // --- TRƯỜNG HỢP 1: FILE CSV ---
        if (req.file.mimetype === 'text/csv' || req.file.mimetype === 'application/vnd.ms-excel') {
            const results = [];
            const stream = Readable.from(req.file.buffer);
            
            stream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    for (const row of results) {
                        if (row.Title) {
                            const reqs = {
                                skills: row.Skills || "",
                                experience: row.Experiences || "",
                                education: row.Level || "", 
                                description: row.Description || ""
                            };
                            await pool.query(
                                `INSERT INTO job_positions (title, requirements) VALUES ($1, $2)`,
                                [row.Title, JSON.stringify(reqs)]
                            );
                        }
                    }
                    res.json({ message: `Đã import ${results.length} vị trí từ CSV.` });
                });
            return;
        }

        // --- TRƯỜNG HỢP 2: FILE PDF (SỬ DỤNG GEMINI ĐỌC TRỰC TIẾP) ---
        if (req.file.mimetype === 'application/pdf') {
            const model = genAI.getGenerativeModel({ model: ACTIVE_MODEL_NAME });
            
            const prompt = `
            # NHIỆM VỤ:
            Bạn là một trợ lý AI chuyên phân tích Job Description (JD).
            Hãy đọc file PDF đính kèm và trích xuất thông tin thành JSON chuẩn.

            # YÊU CẦU OUTPUT JSON:
            {
                "title": "Tên vị trí công việc",
                "requirements": {
                    "skills": "Liệt kê kỹ năng chuyên môn (ngăn cách bằng dấu |)",
                    "experience": "Yêu cầu kinh nghiệm",
                    "education": "Yêu cầu bằng cấp",
                    "description": "Tóm tắt mô tả công việc"
                }
            }
            `;

            const pdfPart = {
                inlineData: {
                    data: req.file.buffer.toString("base64"),
                    mimeType: "application/pdf"
                }
            };

            const result = await model.generateContent([prompt, pdfPart]);
            const aiJson = JSON.parse(cleanJsonString(result.response.text()));

            const dbRes = await pool.query(
                `INSERT INTO job_positions (title, requirements) VALUES ($1, $2) RETURNING *`,
                [aiJson.title || "Vị trí Mới (Từ PDF)", JSON.stringify(aiJson.requirements)]
            );

            return res.json({ 
                message: "Đã import JD từ PDF thành công (Sử dụng Gemini)!", 
                job: dbRes.rows[0] 
            });
        }

        return res.status(400).json({ error: "Chỉ chấp nhận file .csv hoặc .pdf" });

    } catch (err) {
        console.error("Import Error:", err);
        res.status(500).json({ error: "Lỗi xử lý: " + err.message });
    }
});

// ==========================================
// API CV: SCAN & UPLOAD (CORE FEATURE)
// ==========================================
app.post('/api/cv/upload', requireAuth, upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        console.log(`🤖 Scan: ${req.file.originalname}`);

        const safeName = sanitizeFilename(req.file.originalname);
        const fileName = `${Date.now()}_${safeName}`;
        
        const { error: uploadError } = await supabase.storage.from('cv_uploads').upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
        if (uploadError) return res.status(500).json({ error: "Lỗi upload Storage." });

        const { data: { publicUrl } } = supabase.storage.from('cv_uploads').getPublicUrl(fileName);

        const jobId = req.body.job_id;
        let jobTitle = "General Application";
        let jobReqs = {};

        if (jobId) {
            const jobRes = await pool.query('SELECT * FROM job_positions WHERE id = $1', [jobId]);
            if (jobRes.rows.length > 0) {
                jobTitle = jobRes.rows[0].title;
                jobReqs = jobRes.rows[0].requirements || {};
            }
        }

        const selectedPrompt = getSpecificPrompt(jobTitle, jobReqs);
        // QUAN TRỌNG: Temperature = 0.0 để kết quả nhất quán
        const model = genAI.getGenerativeModel({ 
            model: ACTIVE_MODEL_NAME, 
            generationConfig: { responseMimeType: "application/json", temperature: 0.0 } 
        });
        
        const imageParts = [{ inlineData: { data: req.file.buffer.toString("base64"), mimeType: req.file.mimetype } }];
        const result = await model.generateContent([selectedPrompt, ...imageParts]);
        
        let aiResult;
        try { aiResult = JSON.parse(cleanJsonString(result.response.text())); } 
        catch (e) { aiResult = { full_name: "Lỗi đọc", score: 0, summary: "Lỗi AI phân tích", email: null }; }

        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên Mới";
        let finalScore = aiResult.score > 10 ? (aiResult.score / 10).toFixed(1) : aiResult.score;

        const dbResult = await pool.query(
            `INSERT INTO candidates (organization_id, job_id, full_name, email, role, status, ai_rating, ai_analysis, cv_file_url, owner_email) 
             VALUES (1, $1, $2, $3, $4, 'Screening', $5, $6, $7, $8) RETURNING *`,
            [jobId || null, finalName, aiResult.email, jobTitle, finalScore, JSON.stringify(aiResult), publicUrl, req.userEmail]
        );

        res.json({ message: "Thành công!", candidate: dbResult.rows[0] });

    } catch (err) { 
        console.error("🔥 Lỗi Server:", err);
        res.status(500).json({ error: "Lỗi: " + err.message }); 
    }
});

app.get('/api/candidates', requireAuth, async (req, res) => { 
    try {
        const r = await pool.query('SELECT * FROM candidates WHERE owner_email = $1 ORDER BY id DESC', [req.userEmail]); 
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/jobs', async (req, res) => { 
    const r = await pool.query('SELECT * FROM job_positions ORDER BY id DESC'); 
    res.json(r.rows); 
});

app.put('/api/candidates/:id/status', requireAuth, async (req, res) => { 
    try { 
        const { status } = req.body; 
        const result = await pool.query(`UPDATE candidates SET status = $1 WHERE id = $2 AND owner_email = $3 RETURNING *`, [status, req.params.id, req.userEmail]); 
        if (result.rows.length === 0) return res.status(403).json({ error: "Không có quyền sửa." });
        res.json({ message: "Updated" }); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/training/upload', upload.single('doc_file'), async (req, res) => { res.json({message:"Trained"}); });
app.post('/api/training/chat', async (req, res) => { res.json({answer:"AI reply"}); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Server chạy tại cổng ${PORT}`); });