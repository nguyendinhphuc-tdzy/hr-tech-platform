/* FILE: backend/server.js (FINAL VERSION) */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs'); 
const csv = require('csv-parser');
const mammoth = require('mammoth'); 
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Kiểm tra thư viện PDF (để debug nếu cần)
const pdf = require('pdf-parse');

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình Memory Storage (Lưu file vào RAM)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// 1. CÁC HÀM HỖ TRỢ (HELPERS)
// ==========================================

// Hàm đọc PDF an toàn
async function readPdfBuffer(buffer) {
    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (err) {
        console.error("Lỗi đọc PDF:", err.message);
        throw new Error("Không thể đọc nội dung file PDF.");
    }
}

// Hàm chia nhỏ văn bản
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

// Hàm tạo Vector Embedding
async function createEmbedding(text) {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

// ==========================================
// 2. CÁC API (ENDPOINTS)
// ==========================================

// API 1: SCAN & MATCHING CV (Đã tích hợp So khớp Job)
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        
        // Lấy ID công việc
        const jobId = req.body.job_id;
        let jobCriteria = null;
        if (jobId) {
            const jobResult = await pool.query('SELECT * FROM job_positions WHERE id = $1', [jobId]);
            if (jobResult.rows.length > 0) jobCriteria = jobResult.rows[0];
        }

        // 1. Đọc nội dung PDF
        let rawText = "";
        try {
            rawText = await readPdfBuffer(req.file.buffer);
        } catch (e) { return res.status(400).json({ error: "Lỗi đọc file PDF (File ảnh hoặc lỗi font)" }); }

        // 2. Gửi cho AI Phân tích
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        let prompt = "";
        
        if (jobCriteria) {
            // MATCHING MODE
            const reqs = jobCriteria.requirements;
            prompt = `
            Bạn là HR Manager. Hãy so sánh CV này với JD sau:
            - Vị trí: ${jobCriteria.title}
            - Kỹ năng cần: ${reqs.skills ? reqs.skills.join(', ') : 'Không rõ'}
            - Kinh nghiệm: ${reqs.experience_years} năm
            - Học vấn: ${reqs.education}

            Nhiệm vụ: Trích xuất thông tin và Đánh giá % phù hợp.
            Trả về JSON: { "full_name": "...", "email": "...", "score": 0-100, "match_reason": "...", "skills": [], "missing_skills": [] }
            Nội dung CV: ${rawText.substring(0, 15000)}`;
        } else {
            // SCAN MODE THƯỜNG
            prompt = `Phân tích CV và trả về JSON: { "full_name": "...", "email": "...", "skills": [], "score": 0-100, "match_reason": "Tóm tắt hồ sơ" } \nNội dung: ${rawText.substring(0, 15000)}`;
        }

        const aiResultRaw = await model.generateContent(prompt);
        const txt = aiResultRaw.response.text().replace(/```json|```/g, '').trim();
        const aiResult = JSON.parse(txt);

        // Chuẩn hóa điểm về thang 10
        const finalScore = aiResult.score > 10 ? (aiResult.score / 10).toFixed(1) : aiResult.score;
        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên Mới";

        // 3. Lưu vào Database
        const result = await pool.query(
            `INSERT INTO candidates (organization_id, job_id, full_name, email, role, status, ai_rating, ai_analysis) 
             VALUES (1, $1, $2, $3, $4, 'Screening', $5, $6) RETURNING *`,
            [jobId || null, finalName, aiResult.email, jobCriteria ? jobCriteria.title : 'Ứng viên tự do', finalScore, JSON.stringify(aiResult)]
        );

        res.json({ message: "Thành công!", candidate: result.rows[0] });

    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: "Lỗi Server: " + err.message }); 
    }
});

// API 2: LẤY DANH SÁCH ỨNG VIÊN
app.get('/api/candidates', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM candidates ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

// API 3: TRAINING (UPLOAD TÀI LIỆU RAG)
app.post('/api/training/upload', upload.single('doc_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file' });
        
        let rawText = "";
        if (req.file.mimetype === 'application/pdf') {
            rawText = await readPdfBuffer(req.file.buffer);
        } else if (req.file.mimetype.includes('word') || req.file.originalname.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer: req.file.buffer });
            rawText = result.value;
        } else {
            return res.status(400).json({ error: "Chỉ hỗ trợ PDF/DOCX" });
        }

        const chunks = chunkText(rawText);
        for (const chunk of chunks) {
            if (!chunk.trim()) continue;
            const vector = await createEmbedding(chunk);
            await pool.query(
                `INSERT INTO documents (content, metadata, embedding) VALUES ($1, $2, $3)`,
                [chunk, JSON.stringify({ filename: req.file.originalname }), `[${vector.join(',')}]`]
            );
        }
        res.json({ message: `Đã học xong ${chunks.length} đoạn kiến thức!` });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API 4: CHAT VỚI AI
app.post('/api/training/chat', async (req, res) => {
    try {
        const { query } = req.body;
        const queryVector = await createEmbedding(query);
        const searchResult = await pool.query(
            `select content from match_documents($1, 0.5, 5)`, [`[${queryVector.join(',')}]`]
        );
        const context = searchResult.rows.map(r => r.content).join("\n---\n");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`Dựa vào: ${context} \nTrả lời: ${query}`);
        res.json({ answer: result.response.text() });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API 5: IMPORT JOB TỪ CSV
app.post('/api/jobs/import', upload.single('csv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CSV' });
        
        const results = [];
        const stream = require('stream').Readable.from(req.file.buffer);

        stream.pipe(csv())
            .on('data', (data) => {
                results.push({
                    title: data.Title || 'Vị trí mới',
                    requirements: {
                        skills: data.Skills ? data.Skills.split('|').map(s => s.trim()) : [],
                        experience_years: parseInt(data.Experience) || 0,
                        education: data.Education || '',
                        description: data.Description || ''
                    }
                });
            })
            .on('end', async () => {
                for (const job of results) {
                    await pool.query(
                        `INSERT INTO job_positions (title, requirements, status) VALUES ($1, $2, 'active')`,
                        [job.title, JSON.stringify(job.requirements)]
                    );
                }
                res.json({ message: `Đã nhập ${results.length} vị trí!` });
            });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API 6: LẤY DANH SÁCH JOB
app.get('/api/jobs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM job_positions ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

// --- KHỞI ĐỘNG SERVER (DUY NHẤT 1 LẦN Ở CUỐI) ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Backend đang chạy tại cổng ${PORT}`);
});