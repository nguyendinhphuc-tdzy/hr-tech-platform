/* FILE: backend/server.js */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Thư viện AI mới

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Kết nối Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Kết nối Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- HÀM AI PHÂN TÍCH CV (VERSION XỊN) ---
async function analyzeCVWithGemini(text) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Câu lệnh ra lệnh cho AI (Prompt engineering)
        const prompt = `
        Bạn là một chuyên gia tuyển dụng nhân sự (HR Expert) với 20 năm kinh nghiệm.
        Nhiệm vụ: Phân tích nội dung CV dưới đây và trích xuất thông tin quan trọng.
        
        Yêu cầu trả về: Chỉ trả về một JSON object duy nhất (không markdown, không giải thích thêm) theo cấu trúc sau:
        {
            "email": "string hoặc null",
            "full_name": "string hoặc null",
            "skills": ["skill1", "skill2", ...],
            "score": number (thang 10, dựa trên chất lượng CV),
            "summary": "Tóm tắt ngắn gọn 2 câu về ứng viên",
            "experience_years": number (số năm kinh nghiệm ước tính)
        }

        Nội dung CV:
        """
        ${text.substring(0, 10000)} 
        """
        `;
        // (Cắt ngắn text để tránh quá tải token nếu CV quá dài)

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let textResponse = response.text();

        // Làm sạch JSON (đôi khi AI trả về dính dấu ```json)
        textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(textResponse);

    } catch (error) {
        console.error("Lỗi Gemini AI:", error);
        // Fallback: Nếu AI lỗi thì trả về dữ liệu rỗng để không sập app
        return {
            email: null,
            skills: ["Lỗi phân tích AI"],
            score: 5,
            summary: "Không thể phân tích chi tiết lúc này.",
            experience_years: 0
        };
    }
}

// --- API UPLOAD ---
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Chưa gửi file' });
        
        const { full_name } = req.body; // Tên do người dùng nhập (ưu tiên hơn tên trong CV)
        console.log(`🤖 Đang đọc CV của: ${full_name}...`);

        // 1. Đọc text từ PDF
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdf(dataBuffer);
        const rawText = pdfData.text;

        // 2. Gửi cho AI phân tích
        console.log("... Đang gửi sang Google Gemini...");
        const aiResult = await analyzeCVWithGemini(rawText);
        console.log("✅ AI Phân tích xong:", aiResult.summary);

        // 3. Chuẩn bị dữ liệu lưu
        // Nếu AI tìm thấy email mà user chưa nhập thì lấy của AI
        const emailToSave = aiResult.email || 'no-email@provided.com';
        
        // Dữ liệu phân tích chi tiết
        const aiAnalysisData = {
            skills: aiResult.skills,
            summary: aiResult.summary,
            experience_years: aiResult.experience_years,
            raw_text_snippet: rawText.substring(0, 200) // Lưu 1 đoạn ngắn để preview
        };

        // 4. Lưu vào Database
        const result = await pool.query(
            `INSERT INTO candidates (organization_id, full_name, email, role, status, ai_rating, ai_analysis) 
             VALUES (1, $1, $2, $3, $4, $5, $6) RETURNING *`,
            [
                full_name, // Dùng tên người dùng nhập
                emailToSave, 
                aiResult.skills[0] || 'Ứng viên tiềm năng', // Lấy kỹ năng đầu tiên làm Role tạm
                'Screening', 
                aiResult.score, 
                JSON.stringify(aiAnalysisData)
            ]
        );

        // 5. Xóa file tạm
        fs.unlinkSync(req.file.path);

        res.json({ message: "Thành công!", candidate: result.rows[0] });

    } catch (err) {
        console.error(err);
        // Xóa file nếu lỗi
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).send("Lỗi Server: " + err.message);
    }
});

// API Lấy danh sách (Giữ nguyên)
app.get('/api/candidates', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM candidates ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi Server');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Backend đang chạy tại cổng ${PORT}`);
});