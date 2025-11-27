require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Kết nối Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Kết nối AI (Cần có GEMINI_API_KEY trong .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Hàm gọi AI phân tích
async function analyzeCVWithGemini(text) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
        Bạn là chuyên gia tuyển dụng. Hãy phân tích CV này và trả về JSON (chỉ JSON, không markdown):
        {
            "skills": ["kỹ năng 1", "kỹ năng 2"],
            "score": số điểm từ 1-10,
            "summary": "Tóm tắt ngắn gọn 2 câu về ứng viên",
            "experience_years": số năm kinh nghiệm (số),
            "email": "email tìm thấy hoặc null"
        }
        Nội dung CV: ${text.substring(0, 8000)}`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();
        // Làm sạch JSON
        const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Lỗi AI:", error);
        return { skills: ["Lỗi AI"], score: 5, summary: "Không thể phân tích." };
    }
}

// API Upload
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Chưa gửi file' });
        
        console.log(`Đang xử lý CV: ${req.body.full_name}`);
        
        // 1. Đọc PDF
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdf(dataBuffer);
        
        // 2. Gọi AI
        const aiResult = await analyzeCVWithGemini(pdfData.text);
        
        // 3. Lưu vào DB
        const emailToSave = aiResult.email || 'no-email@provided.com';
        const result = await pool.query(
            `INSERT INTO candidates (organization_id, full_name, email, role, status, ai_rating, ai_analysis) 
             VALUES (1, $1, $2, $3, 'Screening', $4, $5) RETURNING *`,
            [req.body.full_name, emailToSave, 'Ứng viên mới', aiResult.score, JSON.stringify(aiResult)]
        );

        // 4. Dọn dẹp
        fs.unlinkSync(req.file.path);
        
        res.json({ message: "Thành công!", candidate: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi Server: " + err.message);
    }
});

// API Lấy danh sách
app.get('/api/candidates', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM candidates ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send('Lỗi Server');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server chạy tại cổng ${PORT}`);
});