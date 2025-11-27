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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Kết nối AI Gemini (Lấy key từ file .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Hàm phân tích CV bằng AI
async function analyzeCV(text) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
        Bạn là chuyên gia tuyển dụng (HR). Hãy phân tích văn bản CV dưới đây và trích xuất thông tin thành dạng JSON (chỉ trả về JSON, không markdown).
        Các trường cần lấy:
        - full_name (string): Tên ứng viên (nếu tìm thấy)
        - email (string): Email ứng viên
        - skills (array string): Danh sách kỹ năng chuyên môn (ví dụ: React, Node.js...)
        - score (number): Chấm điểm CV trên thang 10 dựa trên độ chi tiết và kinh nghiệm.
        - summary (string): Tóm tắt ngắn gọn 2-3 câu về điểm mạnh/yếu của ứng viên bằng tiếng Việt.
        
        Nội dung CV:
        """
        ${text.substring(0, 10000)}
        """
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Làm sạch JSON (bỏ dấu ```json nếu có)
        const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Lỗi AI:", error);
        // Fallback: Trả về dữ liệu mặc định nếu AI lỗi
        return { 
            skills: ["Không phân tích được"], 
            score: 0, 
            summary: "Lỗi kết nối AI hoặc CV không đọc được.",
            email: null,
            full_name: null
        };
    }
}

// API Upload CV
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        
        console.log(`Đang xử lý file: ${req.file.originalname}`);

        // 1. Đọc file PDF
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdf(dataBuffer);
        
        // 2. Gửi cho AI phân tích
        const aiResult = await analyzeCV(pdfData.text);
        
        // 3. Chuẩn bị dữ liệu lưu DB
        // Ưu tiên tên từ Form nhập, nếu không có thì lấy từ AI, cuối cùng là "Ẩn danh"
        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên Mới";
        const finalEmail = aiResult.email || "";

        // 4. Lưu vào Supabase
        const result = await pool.query(
            `INSERT INTO candidates 
            (organization_id, full_name, email, role, status, ai_rating, ai_analysis) 
             VALUES (1, $1, $2, 'Ứng viên', 'Screening', $3, $4) 
             RETURNING *`,
            [finalName, finalEmail, aiResult.score, JSON.stringify(aiResult)]
        );

        // 5. Dọn dẹp file tạm
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
        res.status(500).send(err.message);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Backend chạy tại cổng ${PORT}`);
});