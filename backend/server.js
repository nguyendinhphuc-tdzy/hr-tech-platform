require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer'); // Thư viện nhận file
const pdf = require('pdf-parse'); // Thư viện đọc PDF
const fs = require('fs'); // Thư viện quản lý file của hệ thống

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình nơi lưu file tạm thời
const upload = multer({ dest: 'uploads/' });

// Kết nối Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- HÀM "AI" ĐỌC HIỂU CV ---
async function parseCV(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    try {
        const data = await pdf(dataBuffer);
        const text = data.text; // Văn bản thô từ PDF

        // 1. Tìm Email (Regex)
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
        const emails = text.match(emailRegex);
        const extractedEmail = emails ? emails[0] : null;

        // 2. Tìm Kỹ năng (Từ khóa)
        const techKeywords = ['React', 'NodeJS', 'Python', 'Java', 'SQL', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS', 'Excel', 'Figma', 'Javascript', 'HTML', 'CSS'];
        const foundSkills = techKeywords.filter(skill => 
            text.toLowerCase().includes(skill.toLowerCase())
        );

        // 3. Chấm điểm (Giả lập)
        let aiScore = Math.min(10, foundSkills.length * 1.5);
        if (aiScore < 5 && foundSkills.length > 0) aiScore = 5;

        return {
            raw_text: text,
            email: extractedEmail,
            skills: foundSkills,
            score: parseFloat(aiScore.toFixed(1))
        };
    } catch (error) {
        console.error("Lỗi đọc PDF:", error);
        return null;
    }
}

// --- API UPLOAD & SCAN (Cái bạn đang thiếu) ---
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Chưa gửi file' });
        
        const { full_name } = req.body;
        console.log(`Đang xử lý CV của: ${full_name}`);

        // 1. Đọc file
        const scanResult = await parseCV(req.file.path);

        // 2. Xử lý kết quả
        let status = 'Failed';
        let aiRating = 0;
        let aiAnalysis = {};
        let emailToSave = '';

        if (scanResult) {
            status = 'Screening';
            aiRating = scanResult.score;
            emailToSave = scanResult.email || '';
            aiAnalysis = { skills: scanResult.skills };
        }

        // 3. Lưu vào Database
        const result = await pool.query(
            `INSERT INTO candidates (organization_id, full_name, email, role, status, ai_rating, ai_analysis) 
             VALUES (1, $1, $2, $3, $4, $5, $6) RETURNING *`,
            [full_name, emailToSave, 'Ứng viên mới', status, aiRating, JSON.stringify(aiAnalysis)]
        );

        // 4. Xóa file tạm
        fs.unlinkSync(req.file.path);

        res.json({ message: "Thành công!", candidate: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi Server: " + err.message);
    }
});

// API Lấy danh sách (Cũ)
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