require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const pdfParse = require('pdf-parse'); // Đổi tên biến thành pdfParse cho an toàn
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

// Kết nối AI Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Hàm phân tích CV bằng AI
async function analyzeCV(text) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
        Bạn là chuyên gia tuyển dụng (HR). Hãy phân tích văn bản CV dưới đây và trích xuất thông tin thành dạng JSON (chỉ trả về JSON, không markdown):
        {
            "skills": ["kỹ năng 1", "kỹ năng 2"],
            "score": số điểm từ 1-10,
            "summary": "Tóm tắt ngắn gọn 2 câu về ứng viên",
            "experience_years": số năm kinh nghiệm (số),
            "email": "email tìm thấy hoặc null",
            "full_name": "tên tìm thấy hoặc null"
        }
        Nội dung CV:
        """
        ${text.substring(0, 10000)}
        """
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Lỗi AI:", error);
        return { 
            skills: ["Lỗi phân tích"], 
            score: 0, 
            summary: "Không thể phân tích CV này.",
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

        // 1. Đọc file PDF (Đoạn này đã sửa để dùng biến pdfParse)
        const dataBuffer = fs.readFileSync(req.file.path);
        
        let pdfData;
        try {
            pdfData = await pdfParse(dataBuffer); // Gọi hàm pdfParse
        } catch (pdfError) {
            console.error("Lỗi thư viện PDF:", pdfError);
            throw new Error("Không đọc được file PDF. Hãy thử file khác.");
        }
        
        // 2. Gửi cho AI phân tích
        const aiResult = await analyzeCV(pdfData.text);
        
        // 3. Chuẩn bị dữ liệu
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

        // 5. Dọn dẹp
        fs.unlinkSync(req.file.path);

        res.json({ message: "Thành công!", candidate: result.rows[0] });

    } catch (err) {
        console.error(err);
        // Dọn dẹp file nếu lỗi
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: "Lỗi Server: " + err.message });
    }
});

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
    console.log(`Server chạy tại cổng ${PORT}`);
});