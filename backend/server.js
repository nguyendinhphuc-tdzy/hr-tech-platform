require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const pdfParse = require('pdf-parse'); 
const mammoth = require('mammoth'); // Thư viện đọc Word (Mới)
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// Lưu file vào RAM để tránh lỗi ổ cứng trên Render
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// PHẦN 1: CÁC HÀM HỖ TRỢ AI
// ==========================================

// 1.1 Hàm phân tích CV (Cho tính năng Scan CV)
async function analyzeCV(text) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
        Bạn là HR Manager. Phân tích CV sau và trả về JSON (chỉ JSON):
        {
            "full_name": "Tên ứng viên",
            "email": "Email",
            "skills": ["kỹ năng 1", "kỹ năng 2"],
            "score": số điểm 1-10,
            "summary": "Tóm tắt 2 câu tiếng Việt"
        }
        Nội dung: ${text.substring(0, 15000)}`;
        
        const result = await model.generateContent(prompt);
        const txt = result.response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(txt);
    } catch (e) { return { skills: [], score: 0, summary: "Lỗi AI", full_name: null }; }
}

// 1.2 Hàm chia nhỏ văn bản (Cho tính năng Training)
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

// 1.3 Hàm tạo Vector Embedding (Cho tính năng Training)
async function createEmbedding(text) {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

// ==========================================
// PHẦN 2: CÁC API
// ==========================================

// API 1: Upload & Scan CV (Giữ nguyên cái cũ của bạn)
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        
        let rawText = "";
        try {
            const pdfData = await pdfParse(req.file.buffer);
            rawText = pdfData.text;
        } catch (e) { return res.status(400).json({ error: "Lỗi đọc PDF" }); }

        const aiResult = await analyzeCV(rawText);
        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên";
        
        const result = await pool.query(
            `INSERT INTO candidates (organization_id, full_name, email, role, status, ai_rating, ai_analysis) 
             VALUES (1, $1, $2, 'Ứng viên', 'Screening', $3, $4) RETURNING *`,
            [finalName, aiResult.email, aiResult.score, JSON.stringify(aiResult)]
        );
        res.json({ message: "Thành công!", candidate: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API 2: Lấy danh sách CV
app.get('/api/candidates', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM candidates ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

// API 3: Upload Tài liệu Training (MỚI)
app.post('/api/training/upload', upload.single('doc_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file tài liệu' });
        
        console.log(`📚 Đang học: ${req.file.originalname}`);
        let rawText = "";

        // Đọc PDF hoặc DOCX
        if (req.file.mimetype === 'application/pdf') {
            const pdfData = await pdfParse(req.file.buffer);
            rawText = pdfData.text;
        } else if (req.file.mimetype.includes('wordprocessingml')) { // File Word
            const result = await mammoth.extractRawText({ buffer: req.file.buffer });
            rawText = result.value;
        } else {
            return res.status(400).json({ error: "Chỉ hỗ trợ PDF và DOCX" });
        }

        const chunks = chunkText(rawText);
        for (const chunk of chunks) {
            if (!chunk.trim()) continue;
            const vector = await createEmbedding(chunk);
            
            // Lưu vào bảng documents
            await pool.query(
                `INSERT INTO documents (content, metadata, embedding) VALUES ($1, $2, $3)`,
                [chunk, JSON.stringify({ filename: req.file.originalname }), `[${vector.join(',')}]`]
            );
        }
        res.json({ message: `Đã học xong ${chunks.length} đoạn kiến thức!` });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: "Lỗi Training: " + err.message }); 
    }
});

// API 4: Chat với AI (MỚI)
app.post('/api/training/chat', async (req, res) => {
    try {
        const { query } = req.body;
        const queryVector = await createEmbedding(query);

        // Tìm kiến thức liên quan
        const searchResult = await pool.query(
            `select content from match_documents($1, 0.5, 5)`,
            [`[${queryVector.join(',')}]`]
        );

        const context = searchResult.rows.map(r => r.content).join("\n---\n");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent(`
            Dựa vào tài liệu sau: ${context}
            Hãy trả lời câu hỏi: ${query}
        `);
        
        res.json({ answer: result.response.text() });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server chạy tại cổng ${PORT}`);
});