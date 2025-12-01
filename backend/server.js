/* FILE: backend/server.js (Phiên bản JSON Mode - Chống lỗi cú pháp) */
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
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// --- CẤU HÌNH MẶC ĐỊNH ---
let ACTIVE_MODEL_NAME = "gemini-1.5-flash"; 

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- TỰ ĐỘNG CHỌN MODEL (GIỮ LẠI VÌ NÓ ĐANG CHẠY TỐT) ---
async function checkAvailableModels() {
    try {
        console.log("🔍 Đang kiểm tra Model...");
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
        const response = await axios.get(url);
        const models = response.data.models || [];
        
        // Danh sách ưu tiên (Mới -> Cũ)
        const priority = ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"];
        
        const availableNames = models.map(m => m.name.replace('models/', ''));
        
        for (const p of priority) {
            if (availableNames.some(n => n.includes(p))) {
                ACTIVE_MODEL_NAME = p;
                // Fix cho trường hợp 1.5 flash cần version cụ thể
                if(p === "gemini-1.5-flash") ACTIVE_MODEL_NAME = "gemini-1.5-flash-001";
                break;
            }
        }
        console.log(`✅ Đã chọn Model: ${ACTIVE_MODEL_NAME}`);
    } catch (e) {
        console.log(`⚠️ Lỗi check model, dùng mặc định: ${ACTIVE_MODEL_NAME}`);
    }
}
checkAvailableModels();

// --- HÀM LÀM SẠCH JSON (PHÒNG HỜ) ---
function cleanJsonString(text) {
    // Xóa markdown ```json ... ```
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    // Tìm điểm bắt đầu { và kết thúc }
    const firstOpen = clean.indexOf('{');
    const lastClose = clean.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1) {
        clean = clean.substring(firstOpen, lastClose + 1);
    }
    return clean;
}

// ==========================================
// CÁC HÀM HỖ TRỢ
// ==========================================
async function readPdfBuffer(buffer) {
    try { return (await pdf(buffer)).text; } catch (e) { return ""; }
}

function chunkText(text) {
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
// API 1: SCAN CV (FIX LỖI JSON PARSE)
// ==========================================
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        console.log(`🤖 Processing CV with ${ACTIVE_MODEL_NAME}`);

        const jobId = req.body.job_id;
        let jobCriteria = null;
        if (jobId) {
            const jobRes = await pool.query('SELECT * FROM job_positions WHERE id = $1', [jobId]);
            if (jobRes.rows.length > 0) jobCriteria = jobRes.rows[0];
        }

        // --- CẤU HÌNH JSON MODE (CHÌA KHÓA SỬA LỖI) ---
        const model = genAI.getGenerativeModel({ 
            model: ACTIVE_MODEL_NAME,
            generationConfig: { responseMimeType: "application/json" } // <--- DÒNG QUAN TRỌNG NHẤT
        });
        
        let prompt = `Bạn là chuyên gia HR. Trích xuất thông tin từ CV đính kèm.`;
        if (jobCriteria) {
            prompt += ` So sánh với JD: ${jobCriteria.title}, Kỹ năng: ${JSON.stringify(jobCriteria.requirements)}.`;
        }

        // Yêu cầu output cực kỳ đơn giản để tránh lỗi cú pháp
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
        
        console.log("📦 AI Raw Response:", responseText.substring(0, 100)); // Log để debug

        // Parse an toàn
        let aiResult;
        try {
            aiResult = JSON.parse(cleanJsonString(responseText));
        } catch (parseError) {
            console.error("❌ Lỗi Parse JSON:", parseError);
            // Fallback thủ công nếu vẫn lỗi
            aiResult = { 
                full_name: "Ứng viên (Lỗi đọc)", 
                score: 0, 
                summary: "AI trả về dữ liệu không đúng định dạng JSON.",
                email: null
            };
        }

        // Lưu DB
        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên Mới";
        const finalScore = aiResult.score > 10 ? (aiResult.score / 10).toFixed(1) : aiResult.score;

        const dbResult = await pool.query(
            `INSERT INTO candidates (organization_id, job_id, full_name, email, role, status, ai_rating, ai_analysis) 
             VALUES (1, $1, $2, $3, $4, 'Screening', $5, $6) RETURNING *`,
            [
                jobId || null,
                finalName, 
                aiResult.email, 
                jobCriteria ? jobCriteria.title : 'Ứng viên tự do', 
                finalScore, 
                JSON.stringify(aiResult)
            ]
        );

        res.json({ message: "Thành công!", candidate: dbResult.rows[0] });

    } catch (err) { 
        console.error("🔥 Lỗi Server:", err);
        res.status(500).json({ error: "AI Error: " + err.message }); 
    }
});

// ... (Giữ nguyên các API khác y hệt cũ) ...
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
        if (!req.file) return res.status(400).json({ error: 'Thiếu file' });
        const results = [];
        const stream = require('stream').Readable.from(req.file.buffer);
        stream.pipe(csv()).on('data', (data) => results.push({
            title: data.Title || 'Job mới',
            requirements: { skills: data.Skills ? data.Skills.split('|') : [], experience: data.Experience || 0 },
            status: 'active'
        })).on('end', async () => {
            for (const job of results) await pool.query(`INSERT INTO job_positions (title, requirements, status) VALUES ($1, $2, 'active')`, [job.title, JSON.stringify(job.requirements)]);
            res.json({ message: "Done" });
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
            if(!chunk.trim()) continue;
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
        const model = genAI.getGenerativeModel({ model: ACTIVE_MODEL_NAME });
        const result = await model.generateContent(`Dựa vào: ${context} \nTrả lời: ${query}`);
        res.json({ answer: result.response.text() });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server chạy tại cổng ${PORT}`);
});