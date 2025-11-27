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

// --- CẤU HÌNH QUAN TRỌNG: LƯU FILE VÀO RAM (MemoryStorage) ---
// Giúp tránh lỗi không đọc được file trên Render
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Kết nối Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Kết nối AI Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Hàm phân tích CV (Nhận đầu vào là Buffer từ RAM)
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
            "summary": "Tóm tắt 2 câu tiếng Việt về điểm mạnh yếu"
        }
        Nội dung CV: ${text.substring(0, 15000)}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Lỗi Gemini:", error);
        // Trả về dữ liệu mặc định nếu AI lỗi để không sập app
        return { 
            skills: ["Chưa phân tích được"], 
            score: 0, 
            summary: "Lỗi kết nối AI, nhưng hồ sơ đã được lưu.",
            full_name: null
        };
    }
}

// API Upload (Đã tối ưu cho RAM)
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        
        console.log(`📥 Đang xử lý file: ${req.file.originalname}`);

        // 1. Đọc PDF trực tiếp từ RAM (Buffer)
        let pdfData;
        let rawText = "";
        
        try {
            pdfData = await pdfParse(req.file.buffer);
            rawText = pdfData.text;
            
            // Kiểm tra nếu file PDF rỗng hoặc là ảnh scan (không có chữ)
            if (!rawText || rawText.trim().length < 10) {
                console.warn("⚠️ Cảnh báo: File PDF không có nội dung text (có thể là ảnh scan).");
                rawText = "Nội dung CV không đọc được (Dạng ảnh hoặc lỗi Font).";
            }
        } catch (pdfError) {
            console.error("❌ Lỗi thư viện PDF:", pdfError.message);
            // Vẫn cho qua, không báo lỗi 500, nhưng ghi chú lại
            rawText = "Lỗi khi đọc file PDF.";
        }
        
        // 2. Gọi AI phân tích
        console.log("🤖 Đang gửi sang AI...");
        const aiResult = await analyzeCV(rawText);
        
        // 3. Chuẩn bị dữ liệu (Ưu tiên tên từ Form nếu AI không tìm thấy)
        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên Mới";
        const finalEmail = aiResult.email || "chua_co_email@example.com";

        // 4. Lưu vào Database
        const result = await pool.query(
            `INSERT INTO candidates 
            (organization_id, full_name, email, role, status, ai_rating, ai_analysis) 
             VALUES (1, $1, $2, 'Ứng viên', 'Screening', $3, $4) 
             RETURNING *`,
            [finalName, finalEmail, aiResult.score, JSON.stringify(aiResult)]
        );

        console.log("✅ Thành công:", finalName);
        res.json({ message: "Thành công!", candidate: result.rows[0] });

    } catch (err) {
        console.error("🔥 Lỗi Server:", err);
        res.status(500).json({ error: "Lỗi hệ thống: " + err.message });
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