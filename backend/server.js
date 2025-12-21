/* FILE: backend/server.js (Bản Full: Auth + AI Recruiter Tiếng Việt + Kanban) */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs'); 
const csv = require('csv-parser');
const mammoth = require('mammoth'); 
const pdf = require('pdf-parse'); 
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');

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

// --- CÁC HÀM HỖ TRỢ ---

function sanitizeFilename(filename) {
    // Chuyển tiếng Việt có dấu thành không dấu, xóa ký tự lạ
    const str = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return str.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
}

function cleanJsonString(text) {
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstOpen = clean.indexOf('{');
    const lastClose = clean.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1) {
        clean = clean.substring(firstOpen, lastClose + 1);
    }
    return clean;
}

async function readPdfBuffer(buffer) {
    try { return (await pdf(buffer)).text; } catch (e) { return ""; }
}

function chunkText(text, chunkSize = 1000) {
    const chunks = []; let cur = ""; 
    text.split(/(?<=[.?!])\s+/).forEach(s => {
        if ((cur + s).length > 1000) { chunks.push(cur); cur = s; } else cur += " " + s;
    });
    if (cur) chunks.push(cur);
    return chunks;
}

async function createEmbedding(text) {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

// ==========================================
// API AUTH: ĐĂNG KÝ & ĐĂNG NHẬP
// ==========================================

// 1. Đăng ký (Sign Up)
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        
        // Kiểm tra email tồn tại
        const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ error: "Email này đã được sử dụng!" });
        }

        // Tạo user mới (Mặc định role Admin Access cho demo)
        const result = await pool.query(
            `INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, 'Admin Access') RETURNING *`,
            [fullName, email, password]
        );

        res.json({ message: "Đăng ký thành công!", user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi Server: " + err.message });
    }
});

// 2. Đăng nhập (Login)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(400).json({ error: "Email không tồn tại!" });

        const user = result.rows[0];
        // So sánh password (Lưu ý: Demo nên so sánh plain text, Production cần dùng bcrypt)
        if (user.password !== password) return res.status(400).json({ error: "Sai mật khẩu!" });

        res.json({ message: "Đăng nhập thành công!", user: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi Server: " + err.message });
    }
});


// ==========================================
// API CV: SCAN & UPLOAD (PROMPT TIẾNG VIỆT)
// ==========================================
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        console.log(`🤖 Đang xử lý: ${req.file.originalname}`);

        // 1. Upload Storage (Tên file an toàn)
        const safeName = sanitizeFilename(req.file.originalname);
        const fileName = `${Date.now()}_${safeName}`;
        
        const { data: uploadData, error: uploadError } = await supabase
            .storage.from('cv_uploads')
            .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

        if (uploadError) console.error("Lỗi Storage:", uploadError);
        const { data: { publicUrl } } = supabase.storage.from('cv_uploads').getPublicUrl(fileName);
        const finalFileUrl = uploadError ? null : publicUrl;

        // 2. Xử lý AI
        const jobId = req.body.job_id;
        let jobCriteria = null;
        if (jobId) {
            const jobRes = await pool.query('SELECT * FROM job_positions WHERE id = $1', [jobId]);
            if (jobRes.rows.length > 0) jobCriteria = jobRes.rows[0];
        }

        const model = genAI.getGenerativeModel({ 
            model: ACTIVE_MODEL_NAME,
            generationConfig: { responseMimeType: "application/json" }
        });
        
        // Context Tiếng Việt
        const roleContext = jobCriteria 
            ? `Vị trí: ${jobCriteria.title}\nKỹ năng yêu cầu: ${JSON.stringify(jobCriteria.requirements)}`
            : `Vị trí: Data Analyst Intern\nKỹ năng cốt lõi: Power BI, Data Cleaning, Visualization, Tiếng Anh, Thái độ chủ động. Ưu tiên kinh nghiệm sản xuất.`;

        let prompt = `
# Vai trò & Bối cảnh
Bạn là một **Chuyên gia Tuyển dụng Kỹ thuật (Technical Recruiter)** hàng đầu. Bạn đang sàng lọc hồ sơ cho vị trí sau:
${roleContext}

# Nhiệm vụ
Phân tích sâu CV đính kèm và thực hiện các bước sau:
1. **Quét Kỹ năng:** Tìm kiếm các kỹ năng cứng và mềm quan trọng.
2. **Đối chiếu Kinh nghiệm:** So sánh kinh nghiệm thực tế với yêu cầu.
3. **Đánh giá:** Chấm điểm độ phù hợp trên thang 10.

# Định dạng Output (JSON Bắt buộc)
Trả về JSON hợp lệ. Trường "match_reason" phải viết bằng **TIẾNG VIỆT**, trình bày gãy gọn.

{
    "full_name": "Họ và tên ứng viên",
    "email": "email@ungvien.com",
    "skills": ["Skill 1", "Skill 2", "Skill 3"],
    "score": 0.0,
    "summary": "Tóm tắt 2-3 câu về mức độ phù hợp (Tiếng Việt).",
    "match_reason": "Trình bày chi tiết theo cấu trúc (Tiếng Việt):\n\n**1. Đánh giá chuyên môn:**\n- [Nhận xét]\n\n**2. Điểm mạnh nổi bật:**\n• [Điểm mạnh]\n\n**3. Điểm cần cải thiện:**\n• [Điểm yếu]\n\n**4. Nhận xét chung:**\n[Lời khuyên]",
    "recommendation": "Phỏng vấn / Cân nhắc / Từ chối",
    "confidence": "Cao / Trung bình / Thấp"
}
`;

        const imageParts = [{
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype,
            },
        }];

        const result = await model.generateContent([prompt, ...imageParts]);
        let aiResult;
        try {
            aiResult = JSON.parse(cleanJsonString(result.response.text()));
        } catch (parseError) {
            aiResult = { full_name: "Lỗi đọc AI", score: 0, summary: "Không thể phân tích.", email: null };
        }

        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên Mới";
        const finalScore = aiResult.score > 10 ? (aiResult.score / 10).toFixed(1) : aiResult.score;

        // 3. Lưu Database
        const dbResult = await pool.query(
            `INSERT INTO candidates (organization_id, job_id, full_name, email, role, status, ai_rating, ai_analysis, cv_file_url) 
             VALUES (1, $1, $2, $3, $4, 'Screening', $5, $6, $7) RETURNING *`,
            [
                jobId || null,
                finalName, 
                aiResult.email, 
                jobCriteria ? jobCriteria.title : 'Ứng viên tự do', 
                finalScore, 
                JSON.stringify(aiResult),
                finalFileUrl
            ]
        );

        res.json({ message: "Thành công!", candidate: dbResult.rows[0] });

    } catch (err) { 
        console.error("🔥 Lỗi Server:", err);
        res.status(500).json({ error: "Lỗi: " + err.message }); 
    }
});

// ==========================================
// API KHÁC: UPDATE STATUS, JOBS, TRAINING
// ==========================================

// Cập nhật trạng thái (Cho Kanban Board)
app.put('/api/candidates/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await pool.query(`UPDATE candidates SET status = $1 WHERE id = $2 RETURNING *`, [status, id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Không tìm thấy" });
        res.json({ message: "Updated", candidate: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/candidates', async (req, res) => {
    const result = await pool.query('SELECT * FROM candidates ORDER BY id DESC');
    res.json(result.rows);
});

app.get('/api/jobs', async (req, res) => {
    const result = await pool.query('SELECT * FROM job_positions ORDER BY id DESC');
    res.json(result.rows);
});

app.post('/api/jobs/import', upload.single('csv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu CSV' });
        const results = [];
        const stream = require('stream').Readable.from(req.file.buffer);
        stream.pipe(csv()).on('data', (data) => results.push({
            title: data.Title, requirements: { skills: data.Skills?.split('|'), experience: data.Experience }, status: 'active'
        })).on('end', async () => {
            for (const job of results) await pool.query(`INSERT INTO job_positions (title, requirements, status) VALUES ($1, $2, 'active')`, [job.title, JSON.stringify(job.requirements)]);
            res.json({ message: "Import xong!" });
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/training/upload', upload.single('doc_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file' });
        let rawText = "";
        if (req.file.mimetype === 'application/pdf') rawText = await readPdfBuffer(req.file.buffer);
        else if (req.file.mimetype.includes('word')) { const r = await mammoth.extractRawText({ buffer: req.file.buffer }); rawText = r.value; }
        const chunks = chunkText(rawText);
        for (const chunk of chunks) {
            const vector = await createEmbedding(chunk);
            await pool.query(`INSERT INTO documents (content, metadata, embedding) VALUES ($1, $2, $3)`, [chunk, JSON.stringify({ filename: req.file.originalname }), `[${vector.join(',')}]`]);
        }
        res.json({ message: "Training xong!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/training/chat', async (req, res) => {
    try {
        const { query } = req.body;
        const queryVector = await createEmbedding(query);
        const searchResult = await pool.query(`select content from match_documents($1, 0.5, 5)`, [`[${queryVector.join(',')}]`]);
        const context = searchResult.rows.map(r => r.content).join("\n---\n");
        const model = genAI.getGenerativeModel({ model: ACTIVE_MODEL_NAME });
        const result = await model.generateContent(`Context: ${context} \nAnswer: ${query}`);
        res.json({ answer: result.response.text() });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server chạy tại cổng ${PORT}`);
});