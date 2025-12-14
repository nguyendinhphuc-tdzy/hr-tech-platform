/* FILE: backend/server.js (Bản nâng cấp Prompt: Expert Recruiter) */
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
// API 1: SCAN CV (VỚI PROMPT EXPERT RECRUITER)
// ==========================================
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        console.log(`🤖 Đang xử lý: ${req.file.originalname}`);

        // --- BƯỚC 1: UPLOAD STORAGE ---
        const safeName = sanitizeFilename(req.file.originalname);
        const fileName = `${Date.now()}_${safeName}`;
        
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('cv_uploads')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (uploadError) console.error("Lỗi Storage:", uploadError);
        
        const { data: { publicUrl } } = supabase.storage.from('cv_uploads').getPublicUrl(fileName);
        const finalFileUrl = uploadError ? null : publicUrl;
        console.log("🌍 File URL:", finalFileUrl);

        // --- BƯỚC 2: XỬ LÝ AI (PROMPT MỚI) ---
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
        
        // --- XÂY DỰNG PROMPT THEO YÊU CẦU ---
        
        // 1. Xác định ngữ cảnh công việc (Nếu có Job ID thì lấy DB, không thì dùng mẫu Innovation Intern)
        const roleContext = jobCriteria 
            ? `Role: ${jobCriteria.title}\nTarget Skills: ${JSON.stringify(jobCriteria.requirements)}`
            : `Role: Innovation Intern\nTarget Skill Set: Microsoft Office Suite (Excel, Word, PPT) | Visual Design (Infographics/Presentations) | Event Organization | Internal Communication | Content Creation | Undergraduate/Student`;

        let prompt = `
# Role & Context
You are an **Expert Recruiter and Talent Acquisition Specialist**. You are currently screening applicants for the following position:
${roleContext}

The business context involves supporting internal operations, specifically focusing on engagement, communication, and visual storytelling. Your goal is to identify candidates who possess the specific "Must-Have" organizational skills and "Nice-to-Have" creative abilities.

# Task
**1. Analyze and Map**
Perform a deep-scan analysis of the attached CV:
* **Skill Extraction:** Identify the presence of key skills (Microsoft Office proficiency, Design capabilities, Event coordination).
* **Experience Mapping:** Map the candidate's past projects directly to the responsibilities. Look for experience in organizing internal events, compiling communication materials, and creating content.
* **Gap Analysis:** Highlight any missing "Must-Have" qualifications.

**2. Apply Critical Thinking**
* **Validate Claims:** Do not just look for keywords; look for context (e.g., "Designed the yearbook layout using Canva" vs. just "Design skills").
* **Assess Confidence:** Rate the candidate's fit based on the evidence found regarding proactivity and written communication.

# Output Format
You must return a strictly valid JSON object with the following structure:
{
    "full_name": "Candidate Name",
    "email": "candidate@email.com",
    "skills": ["Skill 1", "Skill 2", "Skill 3"],
    "score": 0.0, 
    "summary": "A 2-3 sentence overview of the candidate's suitability.",
    "match_reason": "Detailed analysis: Qualifications Match, Responsibilities Match, and Creative & Proactive Fit.",
    "recommendation": "Interview / Hold / Reject",
    "confidence": "High / Medium / Low"
}
*Note: 'score' must be a number from 0 to 10.*
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
            aiResult = { full_name: "Ứng viên (Lỗi đọc)", score: 0, summary: "Lỗi format AI", email: null };
        }

        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên Mới";
        const finalScore = aiResult.score > 10 ? (aiResult.score / 10).toFixed(1) : aiResult.score;

        // --- BƯỚC 3: LƯU DATABASE ---
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

// ... (GIỮ NGUYÊN CÁC API KHÁC) ...
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