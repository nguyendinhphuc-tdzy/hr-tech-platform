/* FILE: backend/server.js (Phiên bản Tự động chọn Model) */
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
const axios = require('axios'); // Dùng để check model

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình Memory Storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- BIẾN TOÀN CỤC LƯU MODEL ĐANG KÍCH HOẠT ---
let ACTIVE_MODEL_NAME = "gemini-1.5-flash"; // Giá trị mặc định ban đầu

// --- HÀM TỰ ĐỘNG DÒ TÌM MODEL ---
async function detectBestModel() {
    try {
        console.log("🔍 Đang kiểm tra các Model khả dụng...");
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
        const response = await axios.get(url);
        
        const models = response.data.models || [];
        const availableNames = models.map(m => m.name.replace('models/', ''));
        
        // Danh sách ưu tiên (Xịn -> Vừa -> Cơ bản)
        const priorityList = [
            "gemini-1.5-pro",
            "gemini-1.5-flash",
            "gemini-1.0-pro",
            "gemini-pro"
        ];

        // Tìm model xịn nhất mà tài khoản này có quyền dùng
        for (const preferred of priorityList) {
            if (availableNames.some(name => name === preferred || name.includes(preferred))) {
                ACTIVE_MODEL_NAME = preferred;
                console.log(`✅ Đã chọn Model tốt nhất: ${ACTIVE_MODEL_NAME}`);
                return;
            }
        }
        
        console.log(`⚠️ Không tìm thấy model ưu tiên, dùng mặc định: ${ACTIVE_MODEL_NAME}`);
    } catch (error) {
        console.error("⚠️ Lỗi khi dò tìm model (Sẽ dùng mặc định):", error.message);
    }
}

// Chạy dò tìm ngay khi server khởi động
detectBestModel();

// ==========================================
// CÁC HÀM HỖ TRỢ
// ==========================================

async function readPdfBuffer(buffer) {
    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (err) { return ""; }
}

function chunkText(text, chunkSize = 1000) {
    const chunks = [];
    let currentChunk = "";
    const sentences = text.split(/(?<=[.?!])\s+/);
    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > chunkSize) {
            chunks.push(currentChunk);
            currentChunk = sentence;
        } else { currentChunk += " " + sentence; }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
}

async function createEmbedding(text) {
    // Lưu ý: Model embedding thường cố định là text-embedding-004
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

// ==========================================
// API 1: SCAN CV (DÙNG MODEL ĐÃ TỰ CHỌN)
// ==========================================
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        
        console.log(`🤖 Đang xử lý CV với ${ACTIVE_MODEL_NAME}...`);

        const jobId = req.body.job_id;
        let jobCriteria = null;
        if (jobId) {
            const jobRes = await pool.query('SELECT * FROM job_positions WHERE id = $1', [jobId]);
            if (jobRes.rows.length > 0) jobCriteria = jobRes.rows[0];
        }

        // Dùng model đã được chọn tự động
        const model = genAI.getGenerativeModel({ model: ACTIVE_MODEL_NAME });
        
        let prompt = `Bạn là chuyên gia HR. Hãy đọc tài liệu đính kèm và trích xuất thông tin.`;
        if (jobCriteria) {
            const reqs = jobCriteria.requirements;
            prompt += ` So sánh với JD: ${jobCriteria.title}, Kỹ năng: ${reqs.skills}, Kinh nghiệm: ${reqs.experience_years} năm. Đánh giá % phù hợp.`;
        }

        prompt += ` Trả về JSON duy nhất: { "full_name": "Tên", "email": "Email", "skills": [], "score": 0-100, "match_reason": "Lý do", "summary": "Tóm tắt" }`;

        const imageParts = [{
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype,
            },
        }];

        const result = await model.generateContent([prompt, ...imageParts]);
        const responseText = result.response.text().replace(/```json|```/g, '').trim();
        const aiResult = JSON.parse(responseText);

        const finalScore = aiResult.score > 10 ? (aiResult.score / 10).toFixed(1) : aiResult.score;
        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên Mới";

        const dbResult = await pool.query(
            `INSERT INTO candidates (organization_id, job_id, full_name, email, role, status, ai_rating, ai_analysis) 
             VALUES (1, $1, $2, $3, $4, 'Screening', $5, $6) RETURNING *`,
            [jobId || null, finalName, aiResult.email, jobCriteria ? jobCriteria.title : 'Ứng viên tự do', finalScore, JSON.stringify(aiResult)]
        );

        res.json({ message: "Thành công!", candidate: dbResult.rows[0] });

    } catch (err) { 
        console.error("Lỗi AI:", err);
        // Nếu lỗi model, thử tự động dò lại cho lần sau
        detectBestModel();
        res.status(500).json({ error: "Lỗi AI: " + err.message + ". Đang tự động chuyển model, hãy thử lại sau 30s." }); 
    }
});

// API Debug (Để bạn kiểm tra xem nó chọn model nào)
app.get('/api/debug/model', (req, res) => {
    res.json({ current_model: ACTIVE_MODEL_NAME });
});

// ... (Giữ nguyên các API danh sách, training, chat, import job cũ) ...
// API 2: LẤY DANH SÁCH
app.get('/api/candidates', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM candidates ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

// API 3: TRAINING
app.post('/api/training/upload', upload.single('doc_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file' });
        let rawText = "";
        if (req.file.mimetype === 'application/pdf') rawText = await readPdfBuffer(req.file.buffer);
        else if (req.file.mimetype.includes('word')) { const r = await mammoth.extractRawText({ buffer: req.file.buffer }); rawText = r.value; }
        
        const chunks = chunkText(rawText);
        for (const chunk of chunks) {
            if(!chunk.trim()) continue;
            const vector = await createEmbedding(chunk);
            await pool.query(`INSERT INTO documents (content, metadata, embedding) VALUES ($1, $2, $3)`, [chunk, JSON.stringify({ filename: req.file.originalname }), `[${vector.join(',')}]`]);
        }
        res.json({ message: "Training thành công!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API 4: CHAT
app.post('/api/training/chat', async (req, res) => {
    try {
        const { query } = req.body;
        const queryVector = await createEmbedding(query);
        const searchResult = await pool.query(`select content from match_documents($1, 0.5, 5)`, [`[${queryVector.join(',')}]`]);
        const context = searchResult.rows.map(r => r.content).join("\n---\n");
        const model = genAI.getGenerativeModel({ model: ACTIVE_MODEL_NAME });
        const result = await model.generateContent(`Dựa vào: ${context} \nTrả lời: ${query}`);
        res.json({ answer: result.response.text() });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API 5: IMPORT JOB
app.post('/api/jobs/import', upload.single('csv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu CSV' });
        const results = [];
        const stream = require('stream').Readable.from(req.file.buffer);
        stream.pipe(csv()).on('data', (data) => results.push({
            title: data.Title || 'Job mới',
            requirements: { skills: data.Skills ? data.Skills.split('|') : [], experience: data.Experience || 0 },
            status: 'active'
        })).on('end', async () => {
            for (const job of results) await pool.query(`INSERT INTO job_positions (title, requirements, status) VALUES ($1, $2, 'active')`, [job.title, JSON.stringify(job.requirements)]);
            res.json({ message: "Import xong!" });
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API 6: LIST JOB
app.get('/api/jobs', async (req, res) => {
    const result = await pool.query('SELECT * FROM job_positions ORDER BY id DESC');
    res.json(result.rows);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server chạy tại cổng ${PORT}`);
});