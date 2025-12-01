/* FILE: backend/server.js */
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

const app = express();
app.use(cors());
app.use(express.json());

// --- CẤU HÌNH QUAN TRỌNG ---
// 1. Chọn Model AI (Đổi sang PRO cho ổn định)
const MODEL_NAME = "gemini-1.5-pro"; 

// 2. Cấu hình file
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 3. Kết nối DB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 4. Kết nối AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// API DEBUG: KIỂM TRA MODEL (MỚI)
// Giúp bạn biết chính xác mình dùng được model nào
// ==========================================
app.get('/api/debug/models', async (req, res) => {
    try {
        // Lấy danh sách model mà API Key này được phép dùng
        const modelList = await genAI.getGenerativeModel({ model: MODEL_NAME }).game_model_list || "Chức năng list chưa hỗ trợ trong bản SDK này";
        // Cách lấy list model thủ công qua SDK mới
        // (Do SDK nodejs thay đổi liên tục, ta thử gọi model bất kỳ để xem lỗi gợi ý hoặc response)
        
        res.json({ 
            message: "Đang sử dụng Model: " + MODEL_NAME,
            status: "Server vẫn sống",
            key_preview: process.env.GEMINI_API_KEY ? "OK (Có Key)" : "MISSING (Thiếu Key)"
        });
    } catch (error) {
        res.status(500).json({ error: error.message, hint: "Hãy kiểm tra lại API Key trong Render" });
    }
});

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
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

// ==========================================
// API CHÍNH
// ==========================================

// API 1: SCAN CV (DÙNG GEMINI PRO VISION)
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        
        console.log(`🤖 Đang xử lý CV với Model ${MODEL_NAME}: ${req.file.originalname}`);

        const jobId = req.body.job_id;
        let jobCriteria = null;
        if (jobId) {
            const jobRes = await pool.query('SELECT * FROM job_positions WHERE id = $1', [jobId]);
            if (jobRes.rows.length > 0) jobCriteria = jobRes.rows[0];
        }

        // --- GỌI AI ---
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        
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
        
        // Parse JSON an toàn
        let aiResult;
        try {
            aiResult = JSON.parse(responseText);
        } catch (e) {
            console.error("Lỗi Parse JSON:", responseText);
            throw new Error("AI trả về định dạng không đúng. Hãy thử lại.");
        }

        const finalScore = aiResult.score > 10 ? (aiResult.score / 10).toFixed(1) : aiResult.score;
        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên Mới";

        const dbResult = await pool.query(
            `INSERT INTO candidates (organization_id, job_id, full_name, email, role, status, ai_rating, ai_analysis) 
             VALUES (1, $1, $2, $3, $4, 'Screening', $5, $6) RETURNING *`,
            [jobId || null, finalName, aiResult.email, jobCriteria ? jobCriteria.title : 'Ứng viên tự do', finalScore, JSON.stringify(aiResult)]
        );

        res.json({ message: "Thành công!", candidate: dbResult.rows[0] });

    } catch (err) { 
        console.error("Lỗi Server:", err);
        // Trả lỗi chi tiết để dễ debug
        res.status(500).json({ error: "Lỗi AI: " + err.message }); 
    }
});

// API 2: TRAINING (Dùng MODEL_NAME luôn cho đồng bộ)
app.post('/api/training/chat', async (req, res) => {
    try {
        const { query } = req.body;
        const queryVector = await createEmbedding(query);
        const searchResult = await pool.query(
            `select content from match_documents($1, 0.5, 5)`, [`[${queryVector.join(',')}]`]
        );
        const context = searchResult.rows.map(r => r.content).join("\n---\n");
        
        const model = genAI.getGenerativeModel({ model: MODEL_NAME }); // Dùng Pro
        const result = await model.generateContent(`Dựa vào: ${context} \nTrả lời: ${query}`);
        res.json({ answer: result.response.text() });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ... (Giữ nguyên các API import, list candidates, upload training cũ) ...
// API Import CSV
app.post('/api/jobs/import', upload.single('csv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CSV' });
        const results = [];
        const stream = require('stream').Readable.from(req.file.buffer);
        stream.pipe(csv()).on('data', (data) => {
                results.push({
                    title: data.Title || 'Vị trí mới',
                    requirements: {
                        skills: data.Skills ? data.Skills.split('|') : [],
                        experience_years: parseInt(data.Experience) || 0,
                        education: data.Education || '',
                        description: data.Description || ''
                    }
                });
            })
            .on('end', async () => {
                for (const job of results) {
                    await pool.query(`INSERT INTO job_positions (title, requirements, status) VALUES ($1, $2, 'active')`, [job.title, JSON.stringify(job.requirements)]);
                }
                res.json({ message: `Đã nhập ${results.length} vị trí!` });
            });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API Lấy danh sách
app.get('/api/candidates', async (req, res) => {
    const result = await pool.query('SELECT * FROM candidates ORDER BY id DESC');
    res.json(result.rows);
});
app.get('/api/jobs', async (req, res) => {
    const result = await pool.query('SELECT * FROM job_positions ORDER BY id DESC');
    res.json(result.rows);
});
// API Upload Training Docs
app.post('/api/training/upload', upload.single('doc_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file' });
        let rawText = "";
        if (req.file.mimetype === 'application/pdf') { rawText = await readPdfBuffer(req.file.buffer); } 
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server chạy tại cổng ${PORT}`);
});