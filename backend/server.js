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
// ... (Phần import và setup giữ nguyên) ...

// API Upload (Phiên bản Bất Tử - Soft Fail)
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        
        console.log(`📥 Đang nhận file: ${req.file.originalname} (${req.file.size} bytes)`);

        // 1. Cố gắng đọc PDF
        let rawText = "";
        try {
            const pdfData = await pdfParse(req.file.buffer);
            rawText = pdfData.text;
            if (!rawText || rawText.trim().length === 0) {
                throw new Error("File PDF không có nội dung văn bản (có thể là ảnh scan)");
            }
        } catch (pdfError) {
            console.warn("⚠️ Lỗi đọc PDF (nhưng sẽ vẫn tiếp tục):", pdfError.message);
            // FALLBACK: Nếu không đọc được, hãy tạo một nội dung giả định để AI vẫn chạy được
            rawText = `
                Tên ứng viên: ${req.body.full_name || "Ứng viên"}
                Kỹ năng: Chưa xác định (Không đọc được nội dung file).
                Ghi chú: File PDF tải lên gặp lỗi hoặc là dạng ảnh scan không thể đọc văn bản.
            `;
        }
        
        // 2. Gửi cho AI phân tích (Dù text là thật hay giả)
        console.log("🤖 Đang gửi sang Google Gemini...");
        const aiResult = await analyzeCV(rawText);
        
        // 3. Chuẩn bị dữ liệu (Nếu AI không tìm thấy tên, dùng tên từ form)
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

        console.log("✅ Thành công!");
        res.json({ message: "Thành công!", candidate: result.rows[0] });

    } catch (err) {
        console.error("❌ Lỗi Server:", err);
        res.status(500).json({ error: "Lỗi hệ thống: " + err.message });
    }
});

// ... (Phần còn lại giữ nguyên) ...

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