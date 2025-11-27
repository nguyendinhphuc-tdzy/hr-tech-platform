require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const pdfParse = require('pdf-parse'); 
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// --- CẤU HÌNH QUAN TRỌNG: LƯU FILE TRONG RAM ---
// (Khắc phục lỗi không đọc được file trên Render)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Kết nối Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Kết nối AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Hàm phân tích CV
async function analyzeCV(text) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
        Bạn là chuyên gia tuyển dụng. Hãy phân tích CV và trả về JSON (chỉ JSON):
        {
            "full_name": "Tên ứng viên (nếu có)",
            "email": "Email (nếu có)",
            "skills": ["kỹ năng 1", "kỹ năng 2"],
            "score": số điểm 1-10,
            "summary": "Tóm tắt 2 câu tiếng Việt"
        }
        Nội dung CV: ${text.substring(0, 10000)}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Lỗi Gemini:", error);
        return { 
            skills: ["Lỗi phân tích AI"], 
            score: 0, 
            summary: "Không thể phân tích CV này.",
            full_name: null
        };
    }
}

// API Upload (Đã tối ưu)
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        
        console.log(`Đang xử lý file (Memory): ${req.file.originalname}`);

        // 1. Đọc PDF trực tiếp từ Buffer (RAM) -> Không cần fs.readFileSync
        let pdfData;
        try {
            pdfData = await pdfParse(req.file.buffer);
        } catch (pdfError) {
            console.error("Lỗi đọc PDF:", pdfError);
            return res.status(400).json({ error: "File PDF bị lỗi hoặc có mật khẩu. Hãy thử file khác." });
        }
        
        // 2. Gọi AI phân tích
        const aiResult = await analyzeCV(pdfData.text);
        
        // 3. Chuẩn bị dữ liệu
        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên Mới";
        const finalEmail = aiResult.email || "";

        // 4. Lưu vào Database
        const result = await pool.query(
            `INSERT INTO candidates 
            (organization_id, full_name, email, role, status, ai_rating, ai_analysis) 
             VALUES (1, $1, $2, 'Ứng viên', 'Screening', $3, $4) 
             RETURNING *`,
            [finalName, finalEmail, aiResult.score, JSON.stringify(aiResult)]
        );

        // Không cần xóa file vì nó nằm trong RAM và tự giải phóng
        
        res.json({ message: "Thành công!", candidate: result.rows[0] });

    } catch (err) {
        console.error(err);
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