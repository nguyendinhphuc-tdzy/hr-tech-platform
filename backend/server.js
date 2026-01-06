/* FILE: backend/server.js (Full Version: Auth Phone + Password Register, User Isolation, AI Features) */
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
const fs = require('fs');
const nodemailer = require('nodemailer'); 

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

// --- CẤU HÌNH GỬI MAIL (Optional - Giữ lại cho tính năng khác nếu cần) ---
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
    // userEmail có thể là SĐT hoặc Email (định danh duy nhất)
    
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
Hệ thống PHẢI tuân thủ trọng số sau đây, không được chấm theo cảm tính:

1. **Hard Skills (40%):** So khớp từ khóa, kỹ năng chuyên sâu.
2. **Experience (30%):** Dự án thực tế, số liệu chứng minh.
3. **Education (10%):** Đúng chuyên ngành/Chứng chỉ.
4. **Soft Skills & Presentation (20%):** Trình bày, tư duy logic.
`;

// --- KHO PROMPT ---
function getSpecificPrompt(jobTitle, jobRequirements) {
    const title = jobTitle?.toLowerCase().trim() || "";
    
    // --- 1. DATA ANALYST INTERN ---
    if (title.includes("data analyst")) {
        return `
# Vai trò: Chuyên gia Tuyển dụng Kỹ thuật.
# Vị trí: Data Analyst Intern
${STRICT_RUBRIC}
# Nhiệm vụ:
1. Tìm kỹ năng: Power BI, SQL, Python, Excel.
2. Tìm kinh nghiệm: Data Cleaning, Dashboarding.
# Output JSON: { "full_name": "...", "email": "...", "skills": [], "score": 0.0, "breakdown": {}, "summary": "...", "match_reason": "...", "confidence": "Cao" }
`;
    }

    // --- 2. MARKETING INTERN ---
    if (title.includes("marketing")) {
        return `
# Vai trò: Chuyên gia Tuyển dụng Marketing.
# Vị trí: Marketing Intern
${STRICT_RUBRIC}
# Nhiệm vụ:
1. Tìm kỹ năng: SEO, Content, Social Media, Design cơ bản.
2. Tìm kinh nghiệm: Quản lý Fanpage, Viết bài, Sự kiện.
# Output JSON: (Như trên)
`;
    }

    // --- FALLBACK (DYNAMIC) ---
    const reqSkills = jobRequirements?.skills ? (Array.isArray(jobRequirements.skills) ? jobRequirements.skills.join(", ") : jobRequirements.skills) : "Kỹ năng chuyên môn liên quan";
    return `
# Vai trò: Chuyên gia Tuyển dụng.
# Vị trí: "${jobTitle}"
${STRICT_RUBRIC}
# Yêu cầu: ${reqSkills}
# Nhiệm vụ: Phân tích CV và chấm điểm dựa trên mức độ phù hợp với yêu cầu trên.
# Output JSON: { "full_name": "...", "email": "...", "skills": [], "score": 0.0, "breakdown": {}, "summary": "...", "match_reason": "...", "confidence": "Cao" }
`;
}

/* FILE: backend/server.js - Cập nhật logic Login/Register chặt chẽ hơn */

// ==========================================
// API AUTH: LOGIN HOẶC REGISTER (TƯỜNG MINH)
// ==========================================
app.post('/api/auth/phone-login', async (req, res) => {
    try {
        // Nhận thêm cờ 'is_register' từ Frontend để biết user muốn làm gì
        const { phone, full_name, password, is_register } = req.body; 
        
        // 1. Validate cơ bản
        if (!phone || phone.length < 9) return res.status(400).json({ error: "Số điện thoại không hợp lệ" });
        if (!password || password.length < 6) return res.status(400).json({ error: "Mật khẩu phải từ 6 ký tự" });

        // 2. Tìm User trong DB
        const userResult = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone]);
        let user = userResult.rows[0];

        // ==============================
        // TRƯỜNG HỢP 1: ĐĂNG KÝ (REGISTER)
        // ==============================
        if (is_register) {
            // Nếu user đã tồn tại -> Báo lỗi
            if (user) {
                return res.status(400).json({ error: "Số điện thoại này đã được đăng ký. Vui lòng đăng nhập." });
            }
            
            // Validate tên
            if (!full_name || full_name.trim().length < 2) {
                return res.status(400).json({ error: "Vui lòng nhập họ và tên đầy đủ." });
            }

            // Tạo tài khoản mới
            const newUser = await pool.query(
                `INSERT INTO users (full_name, phone_number, email, password, role) 
                 VALUES ($1, $2, NULL, $3, 'User') RETURNING *`,
                [full_name, phone, password]
            );
            
            return res.json({ 
                message: "Đăng ký thành công!", 
                user: { ...newUser.rows[0], email: newUser.rows[0].email || phone }
            });
        }

        // ==============================
        // TRƯỜNG HỢP 2: ĐĂNG NHẬP (LOGIN)
        // ==============================
        else {
            // Nếu user không tồn tại -> Báo lỗi
            if (!user) {
                return res.status(404).json({ error: "Tài khoản không tồn tại. Vui lòng đăng ký trước." });
            }

            // Kiểm tra mật khẩu (So sánh password)
            // Lưu ý: Thực tế nên hash, ở đây so sánh raw theo code hiện tại
            if (user.password !== password) {
                return res.status(401).json({ error: "Sai mật khẩu! Vui lòng thử lại." });
            }

            return res.json({ 
                message: "Đăng nhập thành công!", 
                user: { ...user, email: user.email || user.phone_number }
            });
        }

    } catch (err) {
        console.error("Auth Error:", err);
        res.status(500).json({ error: "Lỗi Server: " + err.message });
    }
});

// Giữ lại API Google Login cũ để hỗ trợ song song
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

// [UPDATED] Cập nhật Profile (Hỗ trợ cả Phone và Email identifier)
app.put('/api/account/profile', requireAuth, async (req, res) => {
    try {
        const { full_name } = req.body;
        if (!full_name || full_name.trim().length < 2) {
            return res.status(400).json({ error: "Tên hiển thị quá ngắn." });
        }
        
        // Kiểm tra identifier là Phone hay Email
        const isPhone = /^\d+$/.test(req.userEmail); 

        let query = '';
        let params = [];

        if (isPhone) {
            query = 'UPDATE users SET full_name = $1 WHERE phone_number = $2 RETURNING full_name, email, phone_number, role';
            params = [full_name, req.userEmail];
        } else {
            query = 'UPDATE users SET full_name = $1 WHERE email = $2 RETURNING full_name, email, phone_number, role';
            params = [full_name, req.userEmail];
        }
        
        const result = await pool.query(query, params);
        
        if (result.rowCount === 0) return res.status(404).json({ error: "User not found" });

        res.json({ message: "Cập nhật tên thành công!", user: result.rows[0] });
    } catch (err) {
        console.error("Profile Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. API CV: SCAN & UPLOAD (CORE FEATURE)
// ==========================================
app.post('/api/cv/upload', requireAuth, upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        console.log(`🤖 User [${req.userEmail}] đang scan: ${req.file.originalname}`);

        // 1. Upload Storage (Supabase)
        const safeName = sanitizeFilename(req.file.originalname);
        const fileName = `${Date.now()}_${safeName}`;
        
        const { error: uploadError } = await supabase.storage.from('cv_uploads').upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
        
        if (uploadError) {
            console.error("❌ Lỗi Storage:", uploadError);
            return res.status(500).json({ error: "Lỗi khi upload file lên Storage." });
        }

        const { data: { publicUrl } } = supabase.storage.from('cv_uploads').getPublicUrl(fileName);

        // 2. AI Processing
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

        // 3. Save DB (Isolated by owner_email)
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
                publicUrl, 
                req.userEmail // <--- Lưu định danh user (Email hoặc Phone)
            ]
        );

        res.json({ message: "Thành công!", candidate: dbResult.rows[0] });

    } catch (err) { 
        console.error("🔥 Lỗi Server:", err);
        res.status(500).json({ error: "Lỗi: " + err.message }); 
    }
});

// ==========================================
// 3. API GET DATA (ISOLATED)
// ==========================================
app.get('/api/candidates', requireAuth, async (req, res) => { 
    try {
        const r = await pool.query(
            'SELECT * FROM candidates WHERE owner_email = $1 ORDER BY id DESC', 
            [req.userEmail]
        ); 
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
        const result = await pool.query(
            `UPDATE candidates SET status = $1 WHERE id = $2 AND owner_email = $3 RETURNING *`, 
            [status, req.params.id, req.userEmail]
        ); 
        if (result.rows.length === 0) return res.status(403).json({ error: "Không có quyền sửa." });
        res.json({ message: "Updated" }); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Các API phụ khác
app.post('/api/jobs/import', upload.single('csv_file'), async (req, res) => { res.json({message:"Imported"}); });
app.post('/api/training/upload', upload.single('doc_file'), async (req, res) => { res.json({message:"Trained"}); });
app.post('/api/training/chat', async (req, res) => { res.json({answer:"AI reply"}); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Server chạy tại cổng ${PORT}`); });