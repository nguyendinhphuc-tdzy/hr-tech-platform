/* FILE: backend/server.js (Fix: Sign Up Error Handling) */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');
// ... (Các import khác giữ nguyên: fs, csv, mammoth, pdf) ...
const csv = require('csv-parser');
const mammoth = require('mammoth'); 
const pdf = require('pdf-parse'); 

const app = express();
app.use(cors());
app.use(express.json()); // Quan trọng để đọc JSON body từ Frontend

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

// --- CÁC HÀM HỖ TRỢ (Giữ nguyên: sanitizeFilename, cleanJsonString...) ---
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
async function readPdfBuffer(buffer) { try { return (await pdf(buffer)).text; } catch (e) { return ""; } }
function chunkText(text) { const chunks = []; let cur = ""; text.split(/(?<=[.?!])\s+/).forEach(s => { if ((cur + s).length > 1000) { chunks.push(cur); cur = s; } else cur += " " + s; }); if (cur) chunks.push(cur); return chunks; }
async function createEmbedding(text) { const model = genAI.getGenerativeModel({ model: "text-embedding-004" }); const result = await model.embedContent(text); return result.embedding.values; }

// ==========================================
// 1. API AUTH: ĐĂNG KÝ (SIGN UP) - ĐÃ FIX LỖI
// ==========================================
app.post('/api/auth/signup', async (req, res) => {
    try {
        console.log("📝 Nhận yêu cầu đăng ký:", req.body); // Log để debug
        const { fullName, email, password } = req.body;
        
        // Validate dữ liệu đầu vào
        if (!fullName || !email || !password) {
            return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin!" });
        }

        // 1. Kiểm tra email đã tồn tại chưa
        const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkUser.rows.length > 0) {
            console.log("❌ Email đã tồn tại:", email);
            return res.status(400).json({ error: "Email này đã được sử dụng!" });
        }

        // 2. Tạo user mới
        // Lưu ý: Đảm bảo bảng 'users' đã có cột 'full_name', 'email', 'password', 'role'
        const result = await pool.query(
            `INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, 'Admin Access') RETURNING *`,
            [fullName, email, password]
        );

        console.log("✅ Đăng ký thành công:", result.rows[0].email);
        res.json({ message: "Đăng ký thành công!", user: result.rows[0] });

    } catch (err) {
        console.error("🔥 Lỗi Server (Sign Up):", err);
        // Trả về lỗi chi tiết hơn để Frontend hiển thị
        res.status(500).json({ error: "Lỗi hệ thống: " + err.message });
    }
});

// ==========================================
// 2. API AUTH: ĐĂNG NHẬP (LOGIN)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("🔑 Đăng nhập:", email);

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Email không tồn tại!" });
        }

        const user = result.rows[0];

        // So sánh password (Demo: Plain text)
        if (user.password !== password) {
            return res.status(400).json({ error: "Sai mật khẩu!" });
        }

        res.json({ message: "Đăng nhập thành công!", user: user });

    } catch (err) {
        console.error("🔥 Lỗi Server (Login):", err);
        res.status(500).json({ error: "Lỗi: " + err.message });
    }
});

// ... (GIỮ NGUYÊN CÁC API KHÁC: CV UPLOAD, KANBAN, JOBS, TRAINING...) ...
// (Bạn copy phần còn lại từ file cũ vào đây để đảm bảo không mất tính năng khác)
// ==========================================
// API CV: SCAN & UPLOAD (PROMPT TIẾNG VIỆT)
// ==========================================
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        // ... (Logic cũ giữ nguyên)
        const safeName = sanitizeFilename(req.file.originalname);
        const fileName = `${Date.now()}_${safeName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('cv_uploads').upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
        const { data: { publicUrl } } = supabase.storage.from('cv_uploads').getPublicUrl(fileName);
        const finalFileUrl = uploadError ? null : publicUrl;

        const jobId = req.body.job_id;
        let jobCriteria = null;
        if (jobId) {
            const jobRes = await pool.query('SELECT * FROM job_positions WHERE id = $1', [jobId]);
            if (jobRes.rows.length > 0) jobCriteria = jobRes.rows[0];
        }

        const model = genAI.getGenerativeModel({ model: ACTIVE_MODEL_NAME, generationConfig: { responseMimeType: "application/json" } });
        const roleContext = jobCriteria ? `Vị trí: ${jobCriteria.title}\nKỹ năng: ${JSON.stringify(jobCriteria.requirements)}` : `Vị trí: Data Analyst Intern\nKỹ năng: Power BI, Data Cleaning...`;
        
        let prompt = `Bạn là Chuyên gia Tuyển dụng. Phân tích CV cho vị trí: ${roleContext}. Trả JSON: { "full_name": "...", "email": "...", "score": 0, "match_reason": "Tiếng Việt..." }`;
        
        const imageParts = [{ inlineData: { data: req.file.buffer.toString("base64"), mimeType: req.file.mimetype } }];
        const result = await model.generateContent([prompt, ...imageParts]);
        let aiResult = JSON.parse(cleanJsonString(result.response.text()));
        
        const dbResult = await pool.query(
            `INSERT INTO candidates (organization_id, job_id, full_name, email, role, status, ai_rating, ai_analysis, cv_file_url) VALUES (1, $1, $2, $3, $4, 'Screening', $5, $6, $7) RETURNING *`,
            [jobId || null, req.body.full_name || aiResult.full_name, aiResult.email, jobCriteria ? jobCriteria.title : 'Ứng viên tự do', aiResult.score, JSON.stringify(aiResult), finalFileUrl]
        );
        res.json({ message: "Thành công!", candidate: dbResult.rows[0] });
    } catch (err) { res.status(500).json({ error: "Lỗi: " + err.message }); }
});

// Các API GET/PUT khác giữ nguyên như cũ
app.put('/api/candidates/:id/status', async (req, res) => {
    try { const { status } = req.body; await pool.query(`UPDATE candidates SET status = $1 WHERE id = $2`, [status, req.params.id]); res.json({ message: "Updated" }); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/candidates', async (req, res) => { const r = await pool.query('SELECT * FROM candidates ORDER BY id DESC'); res.json(r.rows); });
app.get('/api/jobs', async (req, res) => { const r = await pool.query('SELECT * FROM job_positions ORDER BY id DESC'); res.json(r.rows); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Server chạy tại cổng ${PORT}`); });