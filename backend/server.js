/* FILE: backend/server.js (Bản fix lỗi tên file - Giữ nguyên Model AI) */
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
// GIỮ NGUYÊN MODEL BẠN ĐANG DÙNG
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

// 1. HÀM MỚI: LÀM SẠCH TÊN FILE (Để fix lỗi Storage)
function sanitizeFilename(filename) {
    // Chuyển tiếng Việt có dấu thành không dấu
    const str = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Thay thế tất cả ký tự không phải chữ/số/dấu chấm bằng gạch dưới
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
// API 1: SCAN CV & UPLOAD FILE
// ==========================================
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        console.log(`🤖 Đang xử lý: ${req.file.originalname}`);

        // --- PHẦN 1: UPLOAD FILE LÊN SUPABASE (ĐÃ SỬA TÊN FILE) ---
        
        // Dùng hàm sanitize để tạo tên file an toàn
        const safeName = sanitizeFilename(req.file.originalname);
        const fileName = `${Date.now()}_${safeName}`;
        
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('cv_uploads')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (uploadError) {
            console.error("Lỗi Storage:", uploadError);
        }

        const { data: { publicUrl } } = supabase.storage.from('cv_uploads').getPublicUrl(fileName);
        const finalFileUrl = uploadError ? null : publicUrl;
        console.log("🌍 File URL:", finalFileUrl);


        // --- PHẦN 2: XỬ LÝ AI (GIỮ NGUYÊN LOGIC CŨ) ---
        const jobId = req.body.job_id;
        let jobCriteria = null;
        if (jobId) {
            const jobRes = await pool.query('SELECT * FROM job_positions WHERE id = $1', [jobId]);
            if (jobRes.rows.length > 0) jobCriteria = jobRes.rows[0];
        }

        const model = genAI.getGenerativeModel({ 
            model: ACTIVE_MODEL_NAME, // Giữ nguyên gemini-2.5-flash
            generationConfig: { responseMimeType: "application/json" }
        });
        
        let prompt = `Bạn là chuyên gia HR. Trích xuất thông tin từ CV đính kèm.`;
        if (jobCriteria) {
            prompt += ` So sánh với JD: ${jobCriteria.title}, Kỹ năng: ${JSON.stringify(jobCriteria.requirements)}.`;
        }

        prompt += `
        Output JSON format:
        {
            "full_name": "Tên",
            "email": "Email",
            "skills": ["Skill1", "Skill2"],
            "score": 8.5,
            "summary": "Tóm tắt",
            "match_reason": "Lý do điểm số"
        }
        `;

        const imageParts = [{
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype,
            },
        }];

        const result = await model.generateContent([prompt, ...imageParts]);
        const responseText = result.response.text();
        
        let aiResult;
        try {
            aiResult = JSON.parse(cleanJsonString(responseText));
        } catch (parseError) {
            aiResult = { full_name: "Ứng viên", score: 0, summary: "Lỗi đọc AI", email: null };
        }

        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên Mới";
        const finalScore = aiResult.score > 10 ? (aiResult.score / 10).toFixed(1) : aiResult.score;

        // --- PHẦN 3: LƯU DATABASE ---
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

// ... (CÁC API KHÁC GIỮ NGUYÊN Y HỆT BẢN CŨ CỦA BẠN) ...
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
            title: data.Title || 'Job mới',
            requirements: { skills: data.Skills ? data.Skills.split('|') : [], experience: data.Experience || 0 },
            status: 'active'
        })).on('end', async () => {
            for (const job of results) await pool.query(`INSERT INTO job_positions (title, requirements, status) VALUES ($1, $2, 'active')`, [job.title, JSON.stringify(job.requirements)]);
            res.json({ message: "Import Done" });
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
        res.json({ message: "Training Done" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/training/chat', async (req, res) => {
    try {
        const { query } = req.body;
        const queryVector = await createEmbedding(query);
        const searchResult = await pool.query(`select content from match_documents($1, 0.5, 5)`, [`[${queryVector.join(',')}]`]);
        const context = searchResult.rows.map(r => r.content).join("\n---\n");
        // GIỮ NGUYÊN MODEL CỨNG Ở ĐÂY NHƯ BẠN YÊU CẦU (KHÔNG DÙNG BIẾN TOÀN CỤC)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(`Context: ${context} \nAnswer: ${query}`);
        res.json({ answer: result.response.text() });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server chạy tại cổng ${PORT}`);
});